const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/science.js');
const E=require('../app/src/main/assets/engine.js');
const get=id=>C.foods.find(f=>f.id===id);
const rule=(s,id,prep,status)=>{s.rules[id]||={};s.rules[id][prep]={status,note:'Test',date:'2026-10-27'};return s;};
test('catalog IDs, sources, references and aliases are internally consistent',()=>{
 const ids=C.foods.map(f=>f.id);assert.equal(new Set(ids).size,ids.length);assert(C.foods.length>=160);
 for(const f of C.foods){assert(C.groups[f.group]);for(const id of f.sources)assert(C.sources[id]);for(const id of f.ingredients||[])assert(get(id));assert(!/[<>]/.test(f.name));}
});
test('fresh defaults contain no conversation-derived restrictions',()=>{
 const s=E.blank();assert.deepEqual(s.profile.groups,[]);assert(!('pepper' in s.profile));assert.equal(E.assessment(get('brokkoli'),'cooked',s,C).source,'science');
});
test('pepper is limited-evidence caution, not a preset ban',()=>{
 const s=E.blank();assert.equal(E.assessment(get('pfeffer'),'cooked',s,C).level,'caution');assert.equal(E.assessment(get('pfeffer'),'cooked',s,C).source,'science');assert.equal(E.assessment(get('reis'),'cooked',s,C).level,'unknown');
});
test('personal medical ban has precedence but does not change science',()=>{
 const s=rule(E.blank(),'pfeffer','all','avoid-medical');rule(s,'pfeffer','cooked','tolerated');assert.equal(E.assessment(get('pfeffer'),'cooked',s,C).level,'avoid');assert.equal(E.scientificAssessment(get('pfeffer')).level,'caution');
});
test('explicit recorded clinician suitability applies only to chosen preparation',()=>{
 const s=rule(E.blank(),'apfel','cooked','allow-medical');assert.equal(E.assessment(get('apfel'),'cooked',s,C).level,'medical');assert.equal(E.assessment(get('apfel'),'raw',s,C).level,'unknown');
});
test('medical all-preparations prohibition has precedence',()=>{
 const s=rule(E.blank(),'reis','all','avoid-medical');rule(s,'reis','cooked','allow-medical');assert.equal(E.assessment(get('reis'),'cooked',s,C).level,'avoid');
});
test('cooked tolerance never transfers to raw',()=>{
 const s=rule(E.blank(),'reis','cooked','tolerated');assert.equal(E.assessment(get('reis'),'cooked',s,C).level,'tolerated');assert.equal(E.assessment(get('reis'),'raw',s,C).level,'unknown');
});
test('no default food is automatically labelled as safe or tolerated',()=>{
 for(const f of C.foods)for(const p of E.prepKeys)assert(!['tolerated','medical'].includes(E.assessment(f,p,E.blank(),C).level));
});
test('dish recipe is hypothetical, not a confirmed ingredient verdict',()=>{
 const s=E.blank();assert.equal(E.assessment(get('nuggets'),'cooked',s,C).level,'caution');assert.equal(E.assessment(get('haehnchen'),'cooked',s,C).level,'unknown');
});
test('wide food search handles dish names, aliases, transliterations and typo',()=>{
 for(const q of ['Chicken Nuggets','haehnchennuggets','Hühnchennuggets','Nuggets'])assert.equal(E.search(C.foods,q)[0].id,'nuggets');
 assert.equal(E.search(C.foods,'moehre')[0].id,'karotte');assert(E.search(C.foods,'Selleriesalz').some(f=>f.id==='sellerie'));assert(E.search(C.foods,'Nuggetts').some(f=>f.id==='nuggets'));
});
test('ingredient check identifies pepper and explains own rule conflict',()=>{
 const r=E.scanLabel('Hähnchenfleisch 60%, Weizenmehl, Wasser, schwarzer Pfeffer, Salz',C,rule(E.blank(),'pfeffer','all','avoid-medical'),'cooked',true);
 assert.equal(r.level,'avoid');assert(r.blocked.some(x=>x.id==='pfeffer'));assert(!r.blocked.some(x=>x.id==='haehnchen'||x.id==='weizen'));
});
test('vague spices create caution even without an explicit pepper match',()=>{
 const r=E.scanLabel('Hähnchenfleisch, Weizenmehl, Gewürze, Salz',C,E.blank(),'cooked',true);assert.equal(r.level,'caution');assert(r.vague.length);assert(!r.contains.some(x=>x.id==='pfeffer'));
});
test('peppermint and pepperoni are not accidentally black pepper',()=>{
 for(const word of ['Pfefferminze','Pfefferminztee','Pfefferoni','Chilipulver'])assert(!E.scanLabel(word,C,E.blank()).contains.some(x=>x.id==='pfeffer'));
});
test('negated ingredients do not become confirmed ingredients',()=>{
 const r=E.scanLabel('Hähnchen, Salz, ohne Pfeffer.',C,E.blank(),'cooked',true);assert(!r.contains.some(x=>x.id==='pfeffer'));assert(r.negated.some(x=>x.id==='pfeffer'));assert.equal(r.level,'unknown');
});
test('spice mixtures with celery and mustard are explicitly detected',()=>{
 const state=rule(rule(E.blank(),'sellerie','all','avoid-medical'),'senf','all','avoid-medical');const r=E.scanLabel('Gewürze (SELLERIE, SENF), Salz',C,state,'cooked',true);assert(r.blocked.some(x=>x.id==='sellerie'));assert(r.blocked.some(x=>x.id==='senf'));assert(r.vague.length);
});
test('traces are distinct from confirmed ingredients',()=>{
 const r=E.scanLabel('Hähnchen, Salz. Kann Spuren von Senf und Sellerie enthalten.',C,E.blank(),'cooked',true);assert(!r.blocked.length);assert.equal(r.traces.length,2);assert.equal(r.level,'caution');
});
test('a real ingredient before traces is never downgraded to a trace',()=>{
 const r=E.scanLabel('Hähnchen, Senf. Kann Spuren von Sellerie enthalten.',C,rule(E.blank(),'senf','all','avoid-medical'),'cooked',true);assert(r.blocked.some(x=>x.id==='senf'));assert(r.traces.some(x=>x.id==='sellerie'));
});
test('contains-style precautionary labels remain traces without the word Spuren',()=>{
 const r=E.scanLabel('Reis, Salz. Kann Milch, Senf und Sellerie enthalten.',C,E.blank(),'cooked',true);assert(!r.blocked.length);assert(r.traces.some(x=>x.id==='senf'));assert.equal(r.level,'caution');
});
test('longer trace alias cannot hide a confirmed shorter ingredient',()=>{
 const r=E.scanLabel('Pfeffer. Kann Spuren von schwarzem Pfeffer enthalten.',C,rule(E.blank(),'pfeffer','all','avoid-medical'),'cooked',true);assert(r.blocked.some(x=>x.id==='pfeffer'));
});
test('hyphenated pepper extracts and vague seasoning salts are flagged',()=>{
 assert(E.scanLabel('Pfeffer-Extrakt',C,rule(E.blank(),'pfeffer','all','avoid-medical'),'cooked',true).blocked.some(x=>x.id==='pfeffer'));
 for(const s of ['Gewürzsalz','Kräutersalz','Gewürzaroma'])assert(E.scanLabel(s,C,E.blank(),'cooked',true).vague.length);
});
test('zero matches and missing data never produce an unbedenklich verdict',()=>{
 for(const text of ['','unbekannte Zutat','Wasser, Reis']){const r=E.scanLabel(text,C,E.blank(),'cooked',true);assert.equal(r.level,'unknown');assert(!/unbedenklich|sicher geeignet/i.test(r.label));}
 assert.equal(E.scanLabel('Reis',C,E.blank()).label,'Zutatenangaben unvollständig');
});
test('label scan finds own added ingredient and personal avoid rule',()=>{
 const s=E.blank(),f=E.customFood({name:'Eigene Spezialzutat',group:'staples',aliases:['Testzutat']});s.custom.push(f);rule(s,f.id,'cooked','avoid');const r=E.scanLabel('Reis, Testzutat',C,s,'cooked',true);assert.equal(r.level,'avoid');
});
test('excluded seed derivatives do not become safe by changing category',()=>{
 assert.equal(E.assessment(get('sonnenblumenoel'),'cooked',rule(E.blank(),'sonnenblume','all','avoid-medical'),C).level,'caution');
});
test('custom product tolerance cannot bypass a known forbidden ingredient',()=>{
 const s=E.blank(),f=E.customFood({name:'Gewürztes Hähnchenprodukt',group:'prepared',label:'Hähnchen, Pfeffer, Salz'});s.custom.push(f);rule(s,'pfeffer','all','avoid-medical');rule(s,f.id,'cooked','tolerated');assert.equal(E.assessment(f,'cooked',s,C).level,'avoid');
});
test('self-referencing custom recipe does not cause recursive evaluation',()=>{
 const s=E.blank(),f=E.customFood({name:'Mein Produkt',group:'prepared',label:'Mein Produkt, Reis'});s.custom.push(f);assert.doesNotThrow(()=>E.assessment(f,'cooked',s,C));assert.doesNotThrow(()=>E.scanLabel('Mein Produkt',C,s));
});
test('complete valid backup round trip preserves custom entries, notes and rules',()=>{
 const s=E.blank();const f=E.customFood({name:'Eigenes Produkt',group:'prepared',label:'Reis, Salz'});s.custom.push(f);rule(s,f.id,'cooked','tolerated');s.favorites.push(f.id);const out=E.validateBackup(E.serialize(s),C);assert.equal(out.custom[0].name,f.name);assert.equal(out.rules[f.id].cooked.status,'tolerated');assert.deepEqual(out.favorites,s.favorites);
});
test('backup rejects corrupt JSON, unsupported versions and prototype IDs',()=>{
 for(const json of ['{','{}',JSON.stringify({format:'beifusskompass-backup',version:99,state:E.blank()})])assert.throws(()=>E.validateBackup(json,C));
 const s=E.blank();s.custom=[{id:'__proto__',name:'Bad',group:'prepared'}];assert.throws(()=>E.validateBackup(E.serialize(s),C));
});
test('import rejects tolerance for all preparations and arbitrary statuses',()=>{
 const s=rule(E.blank(),'reis','all','tolerated');assert.throws(()=>E.validateBackup(E.serialize(s),C));s.rules.reis={cooked:{status:'safe'}};assert.throws(()=>E.validateBackup(E.serialize(s),C));
});
test('import rejects own ID collisions and unknown groups',()=>{
 const s=E.blank();const f=E.customFood({name:'Eigenes Produkt',group:'prepared'});s.custom=[f,f];assert.throws(()=>E.validateBackup(E.serialize(s),C));s.custom=[{...f,group:'nonexistent'}];assert.throws(()=>E.validateBackup(E.serialize(s),C));
});
test('all core subjects have cautious heat descriptions',()=>{
 for(const id of ['sellerie','karotte','pfeffer','senf','pfirsich'])for(const p of ['cooked','roasted','dried'])assert(!/darf|allergenfrei|unbedenklich/.test(E.heatInfo(get(id),p)));
});
test('scientific default never imposes a universal food prohibition',()=>{
 for(const f of C.foods)for(const p of E.prepKeys)assert.notEqual(E.assessment(f,p,E.blank(),C).level,'avoid',f.id+' '+p);
});
test('medical default sources are studies, reviews or clinical guidelines',()=>{
 assert.equal(C.policy,'mugwort-atopic-dermatitis-science-v2');
 for(const f of C.foods.filter(f=>f.kind!=='dish'))for(const id of f.sources)assert(['study','review','guideline'].includes(C.sources[id].kind),f.id+' '+id);
});
test('evidence types and cross-reactivity are not extrapolated to all groups',()=>{
 assert.equal(get('pfeffer').evidence.kind,'laboratory');assert.equal(get('sellerie').evidence.kind,'clinical');assert.equal(get('sonnenblume').evidence.kind,'case');assert.equal(get('pfirsich').evidence.kind,'regional');
 for(const id of ['brokkoli','apfel','hafer','reis','milch','haselnuss','leinsamen'])assert.equal(E.scientificAssessment(get(id)).level,'unknown');
});
test('v1 profile prefills are removed while real personal records survive upgrade',()=>{
 const old={schema:1,profile:{groups:[...E.restrictive],pepper:true,theme:'dark',ack:true},custom:[],rules:{reis:{cooked:{status:'tolerated',note:'Bisher vertragen',date:'2026-10-26'}},pfeffer:{raw:{status:'avoid-medical',note:'Persönlich erfasst',date:'2026-10-26'}}},favorites:['reis'],journal:[{id:'old-note',food:'Reis',prep:'cooked',date:'2026-10-26',note:'Erhalten'}]};
 const migrated=E.validateBackup(JSON.stringify({format:'beifusskompass-backup',version:1,state:old}),C);
 assert.equal(migrated.schema,2);assert.deepEqual(migrated.profile.groups,[]);assert(!('pepper' in migrated.profile));assert.equal(migrated.profile.theme,'dark');assert(migrated.migration.removedPrefills);assert.equal(migrated.migration.previousPepper,true);
 assert.equal(migrated.rules.reis.cooked.status,'tolerated');assert.equal(migrated.rules.pfeffer.raw.status,'avoid-medical');assert.equal(migrated.journal[0].note,'Erhalten');assert.deepEqual(migrated.favorites,['reis']);
 assert.equal(E.assessment(get('pfeffer'),'cooked',migrated,C).level,'caution');assert.equal(E.assessment(get('pfeffer'),'raw',migrated,C).level,'avoid');
});
test('v2 backup retains intentionally added personal group rules',()=>{
 const s=E.blank();s.profile.groups=['spices'];const r=E.validateBackup(E.serialize(s),C);assert.deepEqual(r.profile.groups,['spices']);assert.equal(E.assessment(get('pfeffer'),'cooked',r,C).source,'personal-group');assert.equal(E.scientificAssessment(get('pfeffer')).source,'science');
});
test('runtime default texts contain no inherited conversation prohibitions',()=>{
 const texts=C.foods.map(f=>f.note).concat(C.guides.map(g=>g.body)).join(' ');assert(!/laut Schilderung|berichtete[nr]? (?:Vorgabe|Verbot|Gruppen)|Pfeffer bleibt ausdrücklich/.test(texts));
});
