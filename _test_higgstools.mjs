import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {htModel,htValidate,rxMatchExternal} from './src/modules/higgstools_adapter.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};
for(const file of ['higgstools_sm_reference.json','higgstools_validation.json']){
 const r=JSON.parse(readFileSync(new URL('./data/'+file,import.meta.url))),m=htModel(r.parameters);
 check('width matches actual HP',Math.abs(m.widthGeV/r.predictions.widthGeV-1)<1e-10);
 for(const d in m.branching)check('branching matches actual HP '+d,Math.abs(m.branching[d]-r.predictions.branching[d])<1e-10);
 for(const c in m.crossSectionsPb)for(const p in m.crossSectionsPb[c])check('cross section vs HP '+c+' '+p,Math.abs(m.crossSectionsPb[c][p]-r.predictions.crossSectionsPb[c][p])<1e-8);
 check('branching closure',Math.abs(Object.values(m.branching).reduce((a,b)=>a+b,0)-1)<1e-12);
 check('accept matching complete external result',rxMatchExternal('higgstools',m.parameters,r));
 check('reject stale result',!rxMatchExternal('higgstools',{...m.parameters,kV:.77},r));
 const bad=structuredClone(r);bad.predictions.widthGeV*=1.01;check('reject mismatched widths',!rxMatchExternal('higgstools',m.parameters,bad));
}
const inv=htModel({invWidthMeV:1});check('invisible width reduces visible signal',inv.signalStrengths.find(s=>s.mode==='ggH'&&s.decay==='ZZ').mu<1);
for(const p of [{kg:NaN},{kF:-1},{invWidthMeV:11}]){assert.throws(()=>htValidate(p));passed++;}
console.log(`${passed} passed, 0 failed (HiggsTools live-reference widths, all rates, coupling interference and stale import rejection)`);
