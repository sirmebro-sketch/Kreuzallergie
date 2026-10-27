const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/catalog.js');
const E=require('../app/src/main/assets/engine.js');
const get=id=>C.foods.find(f=>f.id===id);
const rule=(s,id,prep,status)=>{s.rules[id]||={};s.rules[id][prep]={status,note:'Test',date:'2026-10-27'};return s;};
test('catalog IDs, sources, references and aliases are internally consistent',()=>{
 const ids=C.foods.map(f=>f.id);assert.equal(new Set(ids).size,ids.length);assert(C.foods.length>=160);
 for(const f of C.foods){assert(C.groups[f.group]);for(const id of f.sources)assert(C.sources[id]);for(const id of f.ingredients||[])assert(get(id));assert(!/[<>]/.test(f.name));}
});
test('reported group restriction is kept separate from medical evidence',()=>{
 const s=E.blank();assert.equal(E.assessment(get('brokkoli'),'cooked',s,C).source,'reported');assert.equal(get('brokkoli').association,'none');
});
test('reported pepper prohibition survives group rule removal',()=>{
 const s=E.blank();s.profile.groups=[];assert.equal(E.assessment(get('pfeffer'),'cooked',s,C).level,'avoid');assert.equal(E.assessment(get('reis'),'cooked',s,C).level,'unknown');
});
test('tolerated does not override reported prohibition',()=>{
 const s=rule(E.blank(),'pfeffer','cooked','tolerated');assert.equal(E.assessment(get('pfeffer'),'cooked',s,C).level,'avoid');
});
test('explicit recorded clinician suitability applies only to chosen preparation',()=>{
 const s=rule(E.blank(),'apfel','cooked','allow-medical');assert.equal(E.assessment(get('apfel'),'cooked',s,C).level,'medical');assert.equal(E.assessment(get('apfel'),'raw',s,C).level,'avoid');
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
 const r=E.scanLabel('Hähnchenfleisch 60%, Weizenmehl, Wasser, schwarzer Pfeffer, Salz',C,E.blank(),'cooked',true);
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
 const r=E.scanLabel('Gewürze (SELLERIE, SENF), Salz',C,E.blank(),'cooked',true);assert(r.blocked.some(x=>x.id==='sellerie'));assert(r.blocked.some(x=>x.id==='senf'));assert(r.vague.length);
});
test('traces are distinct from confirmed ingredients',()=>{
 const r=E.scanLabel('Hähnchen, Salz. Kann Spuren von Senf und Sellerie enthalten.',C,E.blank(),'cooked',true);assert(!r.blocked.length);assert.equal(r.traces.length,2);assert.equal(r.level,'caution');
});
test('a real ingredient before traces is never downgraded to a trace',()=>{
 const r=E.scanLabel('Hähnchen, Senf. Kann Spuren von Sellerie enthalten.',C,E.blank(),'cooked',true);assert(r.blocked.some(x=>x.id==='senf'));assert(r.traces.some(x=>x.id==='sellerie'));
});
test('zero matches and missing data never produce an unbedenklich verdict',()=>{
 for(const text of ['','unbekannte Zutat','Wasser, Reis']){const r=E.scanLabel(text,C,E.blank(),'cooked',true);assert.equal(r.level,'unknown');assert(!/unbedenklich|sicher geeignet/i.test(r.label));}
 assert.equal(E.scanLabel('Reis',C,E.blank()).label,'Zutatenangaben unvollständig');
});
test('label scan finds own added ingredient and personal avoid rule',()=>{
 const s=E.blank(),f=E.customFood({name:'Eigene Spezialzutat',group:'staples',aliases:['Testzutat']});s.custom.push(f);rule(s,f.id,'cooked','avoid');const r=E.scanLabel('Reis, Testzutat',C,s,'cooked',true);assert.equal(r.level,'avoid');
});
test('excluded seed derivatives do not become safe by changing category',()=>{
 assert.equal(E.assessment(get('sonnenblumenoel'),'cooked',E.blank(),C).level,'caution');
});
test('complete valid backup round trip preserves custom entries, notes and rules',()=>{
 const s=E.blank();const f=E.customFood({name:'Eigenes Produkt',group:'prepared',label:'Reis, Salz'});s.custom.push(f);rule(s,f.id,'cooked','tolerated');s.favorites.push(f.id);const out=E.validateBackup(E.serialize(s),C);assert.equal(out.custom[0].name,f.name);assert.equal(out.rules[f.id].cooked.status,'tolerated');assert.deepEqual(out.favorites,s.favorites);
});
test('backup rejects corrupt JSON, unsupported versions and prototype IDs',()=>{
 for(const json of ['{','{}',JSON.stringify({format:'beifusskompass-backup',version:2,state:E.blank()})])assert.throws(()=>E.validateBackup(json,C));
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
