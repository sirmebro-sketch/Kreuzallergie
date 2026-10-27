(function(root){
 'use strict';
 const restrictive=['fruits','vegetables','nuts','seeds','herbs','spices'];
 const statuses=['unknown','tolerated','avoid','avoid-medical','allow-medical'];
 const prepKeys=['raw','cooked','baked','roasted','dried','fermented'];
 const STORE='beifusskompass.v1';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function normal(s){return String(s||'').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
 function blank(){return {schema:2,profile:{groups:[],ruleOrigin:'personal',ack:false,theme:'system'},custom:[],rules:{},favorites:[],journal:[]};}
 function allFoods(catalog,state){return [...catalog.foods,...state.custom];}
 function observation(state,id,prep){return state.rules[id]?.[prep]||null;}
 function assessment(food,prep,state,catalog,seen=new Set()){
  if(!food)return {level:'unknown',label:'Nicht bekannt',reason:'Keine belastbaren Angaben vorhanden.'};
  const exact=observation(state,food.id,prep),global=observation(state,food.id,'all');
  const medicalBlock=[exact,global].find(x=>x?.status==='avoid-medical');
  if(medicalBlock)return {level:'avoid',label:'Ärztlich zu meiden',reason:medicalBlock.note||'Als ärztliches Verbot erfasst.',source:'personal'};
  if([exact,global].some(x=>x?.status==='avoid'))return {level:'avoid',label:'Als unverträglich erfasst',reason:exact?.note||global?.note||'Eigene Unverträglichkeit dokumentiert.',source:'personal'};
  const medicalAllow=exact?.status==='allow-medical';
  const groupBlocked=state.profile.groups.includes(food.group);
  if(groupBlocked&&!medicalAllow)return {level:'avoid',label:'Persönlich hinterlegte Gruppenregel',reason:'In deinem Profil ist '+catalog.groups[food.group]+' zusätzlich ausgeschlossen. Das ist keine wissenschaftliche Standardbewertung.'+(exact?.status==='tolerated'?' Eine Verträglichkeitsbeobachtung hebt diese persönliche Regel nicht auf.':''),source:'personal-group'};
  if(medicalAllow)return {level:'medical',label:'Als ärztlich geeignet erfasst',reason:'Gilt nur für die gewählte Zubereitung und den dokumentierten Einzelfall. '+(exact.note||''),source:'personal'};
  if(food.custom&&food.label&&!seen.has(food.id)){
   const next=new Set(seen);next.add(food.id);const scan=scanLabel(food.label,catalog,state,prep,false,next);
   if(scan.blocked.length)return {level:'avoid',label:'Eigene Rezeptur enthält zu meidende Zutaten',reason:scan.blocked.map(x=>x.name).join(', ')+'. Eine bisherige Verträglichkeit hebt diese Zutatenkonflikte nicht auf.',source:'personal-label'};
   if(scan.level==='caution')return {level:'caution',label:'Eigene Rezeptur: offene Zutatenfragen',reason:'Sammelbegriffe, mögliche Spuren oder Kreuzreaktionen sind im Zutatencheck näher erläutert.',source:'personal-label'};
  }
  if(exact?.status==='tolerated')return {level:'tolerated',label:'Bisher vertragen',reason:'Persönliche Beobachtung für diese Zubereitung; keine allgemeine Sicherheitsgarantie. '+(exact.note||''),source:'personal'};
  if(food.derivedFrom&&!seen.has(food.id)){
   const next=new Set(seen);next.add(food.id);const base=allFoods(catalog,state).find(x=>x.id===food.derivedFrom);
   const baseResult=assessment(base,prep,state,catalog,next);
   if(baseResult.level==='avoid')return {level:'caution',label:'Ausgangsprodukt ausgeschlossen',reason:'Verarbeitung und Restproteinmenge individuell klären. Keine automatische Freigabe für Öl oder andere Derivate.'};
  }
  if(food.kind==='dish')return {level:'caution',label:'Rezeptur prüfen',reason:'Beispielgericht mit möglichen Zutaten. Ohne aktuelle konkrete Zutatenliste keine verlässliche Produktbewertung.'};
  if(food.custom&&food.label)return {level:'unknown',label:'Eigener Eintrag – Zutaten prüfen',reason:'Gespeicherte persönliche Rezeptur. Zutatencheck öffnen; Angaben sind nicht extern validiert.'};
  return scientificAssessment(food);
 }
 function scientificAssessment(food){
  if(!food)return {level:'unknown',label:'Daten fehlen',reason:'Keine wissenschaftliche Einordnung vorhanden.',source:'science'};
  if(food.custom)return {level:'unknown',label:'Eigener Inhalt – keine Studienzuordnung',reason:'Persönliche Produktangaben sind keine wissenschaftlich geprüfte Lebensmittelbewertung. Zutaten gesondert prüfen.',source:'science'};
  if(food.kind==='dish')return {level:'caution',label:'Rezeptur prüfen',reason:'Der Gerichtname belegt keine konkrete Zutatenliste.',source:'science'};
  if(food.evidence)return {level:'caution',label:food.evidence.kind==='clinical'?'Beifuß-Assoziation klinisch beschrieben':food.evidence.kind==='laboratory'?'Begrenzte Evidenz: Sensibilisierung':food.evidence.kind==='case'?'Beifuß-Bezug in Einzelfällen':food.evidence.kind==='regional'?'Beifuß-Bezug: regionale Kohorte':'Beifuß-Bezug in Fachübersicht',reason:food.evidence.summary+' '+food.evidence.limit+' Kein pauschales Meidegebot allein daraus.',source:'science'};
  return {level:'unknown',label:'Kein pauschaler Verzicht begründet',reason:'Aus Beifuß-Kreuzallergie oder Neurodermitis allein lässt sich für dieses Lebensmittel kein generelles Meiden ableiten. Eine individuelle Verträglichkeit ist damit nicht bewiesen.',source:'science'};
 }
 function heatInfo(food,prep){
  if(prep==='raw')return 'Die Studienlage belegt keine allgemeine Rohkost-Sperre bei Beifuß-Kreuzallergie oder Neurodermitis. Bei klinisch bestätigter Allergie ist die individuell auslösende Form zu meiden.';
  if(food.evidence?.processing)return food.evidence.processing;
  if(food.heat==='birch')return 'Bessere Verträglichkeit durch Erhitzen ist vor allem bei manchen Birken-/PR-10-Reaktionen beschrieben. Daraus folgt keine Empfehlung für Beifuß-Kreuzallergie. Persönliche Verarbeitungstoleranz bleibt individuell.';
  return 'Für diese Verarbeitung liegt hier kein spezifischer klinischer Beifuß-Nachweis vor. Weder ein allgemeines Verbot noch eine sichere Verträglichkeit lässt sich daraus ableiten. Bei bestätigter Lebensmittelallergie ist Erhitzen kein pauschaler Schutz.';
 }
 function distance(a,b){let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const row=[i+1];for(let j=0;j<b.length;j++)row.push(Math.min(row[j]+1,prev[j+1]+1,prev[j]+(a[i]===b[j]?0:1)));prev=row;}return prev[b.length];}
 function search(foods,query){
  const q=normal(query);if(!q)return foods;
  const terms=q.split(' ');
  return foods.map(f=>{const names=[f.name,...(f.aliases||[])].map(normal);const text=normal([f.name,...(f.aliases||[]),f.brand||'',f.label||''].join(' '));
   let score=names.includes(q)?100:names.some(n=>n.startsWith(q))?85:text.includes(q)?70:terms.every(t=>text.includes(t))?55:0;
   if(!score&&terms.every(t=>t.length>=5&&text.split(' ').some(w=>Math.abs(w.length-t.length)<=1&&distance(t,w)<=1)))score=25;
   return {f,score};}).filter(x=>x.score).sort((a,b)=>b.score-a.score||a.f.name.localeCompare(b.f.name,'de')).map(x=>x.f);
 }
 const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 function scanLabel(text,catalog,state,prep='cooked',complete=false,seen=new Set()){
  text=String(text||'').slice(0,30000);const norm=normal(text);const normalizedOriginal=String(text).toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[-‐‑–]/g,' ');
  const foods=allFoods(catalog,state).filter(f=>f.kind!=='dish'&&!seen.has(f.id));const found=[],negated=[];
  for(const food of foods){
   const terms=[food.name,food.name.split(/[/:]/)[0].trim(),...(food.aliases||[])].map(normal).filter(Boolean).sort((a,b)=>b.length-a.length);let hit;
   for(const term of [...new Set(terms)]){
    const re=new RegExp('(^|[^a-z0-9])('+escaped(term).replace(/ /g,'\\s+')+')(?=$|[^a-z0-9])','g');let m;
    while((m=re.exec(normalizedOriginal))){
     const pos=m.index+m[1].length,prefix=normalizedOriginal.slice(Math.max(0,pos-60),pos);
     if(/(?:ohne|frei von|kein|keine|keinen)\s*$/.test(prefix)||/frei\b/.test(normalizedOriginal.slice(pos+term.length,pos+term.length+4))){negated.push({id:food.id,name:food.name,term});continue;}
     const segment=normalizedOriginal.slice(0,pos).split(/[.\n;]/).pop();
     const trace=/(?:\bkann\b|may contain|spuren von|traces of)/.test(segment);
     const candidate={id:food.id,name:food.name,term,trace,...assessment(food,prep,state,catalog,seen)};
     if(!hit || !trace)hit=candidate;
     if(!trace)break;
    }if(hit&&!hit.trace)break;
   }if(hit)found.push(hit);
  }
  const vague=[];
  for(const [re,label]of [[/\bgewuerz(?:e|mischung|mischungen|extrakt|extrakte|zubereitung|zubereitungen|salz|aroma|aromen)?\b/,'Gewürze / Gewürzextrakte'],[/\bkraeuter(?:mischung|extrakt|salz)?\b/,'Kräuter / Kräutermischung'],[/\baroma(?:s|stoffe)?\b/,'Aroma – genaue Zusammensetzung offen'],[/\bwuerze\b/,'Würze – Zusammensetzung prüfen']])if(re.test(norm))vague.push(label);
  const contains=found.filter(x=>!x.trace),traces=found.filter(x=>x.trace),blocked=contains.filter(x=>x.level==='avoid');
  const allergyTraces=traces.filter(x=>['avoid','caution'].includes(x.level));
  let level='unknown',label='Keine erfassten Konflikte gefunden';
  if(blocked.length){level='avoid';label='Enthält zu meidende Zutaten';}
  else if(vague.length||contains.some(x=>x.level==='caution')||allergyTraces.length){level='caution';label='Vorsicht – offene Fragen';}
  else if(!complete)label='Zutatenangaben unvollständig';
  if(!text.trim())label='Noch keine Zutaten eingegeben';
  return {level,label,contains,traces,blocked,vague,negated,complete,reason:level==='avoid'?'Erkannte Zutaten stehen im Widerspruch zu den aktuell erfassten Vorgaben.':!complete?'Ohne vollständige aktuelle Zutatenliste bleibt die Bewertung offen.':'Auch ohne Treffer keine Freigabe: unbekannte Zutaten, Spuren, zusätzliche Allergien und Lesefehler sind möglich.'};
 }
 function customFood(input){
  if(typeof input.name!=='string'||input.name.trim().length<2||input.name.length>100)throw Error('Bitte einen Namen mit 2–100 Zeichen eingeben.');
  if(!/^[a-z][a-z0-9-]{1,30}$/.test(input.group||''))throw Error('Ungültige Lebensmittelgruppe.');
  return {id:input.id||'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:input.name.trim(),group:input.group,aliases:(input.aliases||[]).filter(x=>typeof x==='string').slice(0,20).map(x=>x.trim().slice(0,80)).filter(Boolean),kind:'food',custom:true,association:'none',heat:'unclear',sources:[],note:String(input.note||'').slice(0,2000),label:String(input.label||'').slice(0,12000),brand:String(input.brand||'').slice(0,100),alternatives:[],createdAt:new Date().toISOString()};
 }
 function serialize(state){return JSON.stringify({format:'beifusskompass-backup',version:2,exportedAt:new Date().toISOString(),state},null,2);}
 function validateBackup(json,catalog){
  if(typeof json!=='string'||new TextEncoder().encode(json).length>2*1024*1024)throw Error('Datei zu groß oder ungültig.');
  const b=JSON.parse(json);if(b.format!=='beifusskompass-backup'||![1,2].includes(b.version)||!b.state)throw Error('Keine unterstützte BeifußKompass-Sicherung.');
  const s=b.state,out=blank();
  if(![1,2].includes(s.schema)||s.schema!==b.version||!Array.isArray(s.custom)||s.custom.length>500||!s.profile||!Array.isArray(s.profile.groups)||(s.schema===1&&typeof s.profile.pepper!=='boolean'))throw Error('Ungültiges Datenformat.');
  if(s.profile.groups.some(g=>!restrictive.includes(g)))throw Error('Unbekannte Gruppenregel.');
  out.profile={groups:s.schema===1?[]:[...new Set(s.profile.groups)],ruleOrigin:'personal',ack:s.profile.ack===true,theme:['system','light','dark'].includes(s.profile.theme)?s.profile.theme:'system'};
  // v1 mixed conversation-seeded profile defaults with actual personal records.
  // Archive those legacy profile flags without applying them; retain real per-food records.
  if(s.schema===1)out.migration={fromSchema:1,removedPrefills:true,previousGroups:[...s.profile.groups],previousPepper:s.profile.pepper};
  else if(s.migration?.fromSchema===1)out.migration={fromSchema:1,removedPrefills:true,previousGroups:Array.isArray(s.migration.previousGroups)?s.migration.previousGroups.filter(g=>restrictive.includes(g)):[],previousPepper:s.migration.previousPepper===true};
  const ids=new Set(catalog.foods.map(f=>f.id));
  for(const f of s.custom){if(!/^custom-[a-z0-9-]{4,80}$/.test(f.id)||ids.has(f.id)||!own(catalog.groups,f.group))throw Error('Ungültiger oder doppelter eigener Eintrag.');const clean=customFood(f);clean.id=f.id;ids.add(f.id);out.custom.push(clean);}
  if(!s.rules||typeof s.rules!=='object'||Array.isArray(s.rules)||Object.keys(s.rules).length>2000)throw Error('Ungültige Markierungen.');
  for(const [id,records]of Object.entries(s.rules)){
   if(!ids.has(id)||!records||typeof records!=='object'||Array.isArray(records))throw Error('Unbekanntes Lebensmittel in Markierungen.');out.rules[id]={};
   for(const [prep,r]of Object.entries(records)){
    if(![...prepKeys,'all'].includes(prep)||!r||!statuses.includes(r.status)||(prep==='all'&&!['avoid','avoid-medical','unknown'].includes(r.status)))throw Error('Ungültige Zubereitungsmarkierung.');
    out.rules[id][prep]={status:r.status,note:String(r.note||'').slice(0,2000),date:String(r.date||'').slice(0,40)};
   }
  }
  if(!Array.isArray(s.favorites)||!Array.isArray(s.journal)||s.journal.length>2000)throw Error('Ungültige Listen.');
  out.favorites=[...new Set(s.favorites.filter(id=>ids.has(id)))];
  out.journal=s.journal.map(j=>({id:String(j.id||'').slice(0,80),food:String(j.food||'').slice(0,150),prep:prepKeys.includes(j.prep)?j.prep:'cooked',date:String(j.date||'').slice(0,40),note:String(j.note||'').slice(0,2000)}));
  return out;
 }
 const api={STORE,restrictive,statuses,prepKeys,blank,normal,allFoods,assessment,scientificAssessment,observation,heatInfo,search,scanLabel,customFood,serialize,validateBackup};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FoodEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
