/* Cross-check the browser functions against Python/SciPy, including failure cases. */
import { readFileSync } from 'node:fs';
import { ggIntegrals, ggAt, ggFirstNN, ggMasses, ggInput } from './src/modules/gravitygauge.mjs';
let pass=0;
const ok=(condition,name)=>{if(!condition)throw new Error(name);pass++;};
const near=(a,b,tol=2e-10)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));
const ref=JSON.parse(readFileSync(new URL('./data/h185_reference.json',import.meta.url),'utf8'));
for(const row of ref.families){
  const c=ggIntegrals(row.p,row.eta), at=ggAt(c,.5);
  for(const [actual,expected] of [[c.W,row.W_over_ell],[c.J,row.J_over_ell],[c.f,row.g4_ell_f_theta],
    [at.residueRatio,row.residue_ratio_at_half],[at.staticResponse,row.response_over_g4_squared_ell_squared_at_half]])
    ok(near(actual,expected),`exact moments p${row.p} eta${row.eta}: ${actual} vs ${expected}`);
  const nn=ggFirstNN(row.p,row.eta);
  ok(near(nn,row.gauge_NN_first_x,2e-6),`live NN ODE ${nn} vs ${row.gauge_NN_first_x}`);
  ok(near(ggMasses(row.p)[0],row.tensor_and_DD_first_x), 'paired first mass');
  ok(c.W*c.J>=.9**2,'Cauchy bound');
}
for(const args of [[1.1,-1],[1.1,-2],[1.1,NaN],[1.2,0],[1,Infinity]]){
  let fired=false;try{ggIntegrals(...args);}catch{fired=true;}ok(fired,'out-of-domain refused');
}
for(const p of [1,1.1])for(const eta of [-.985,-.73,-.25,.45,2.2]){
  const coarse=ggFirstNN(p,eta,500),fine=ggFirstNN(p,eta,1000);
  ok(near(coarse,fine,4e-6),'NN numerical convergence off benchmark');
}
for(const t of [.1,.2,.5,1])ok(near(ggAt(ggIntegrals(1,-.99),t).Z,1),'minimal RS member');
const input=ggInput(1.1,-.9,.8);
ok(input.group==='warped-gauge-gravity'&&input.eta===-.9&&input.source_t===.8,'own model export');
ok(input.conventions.m_W===null&&input.conventions.g4.includes('fixed'),'no unrelated SM defaults');
const page=readFileSync(new URL('./app/index.html',import.meta.url),'utf8');
const start=page.indexOf('/* ---- gravitygauge.mjs ---- */'),end=page.indexOf('/* ----',start+10);
ok(start>0&&end>start,'module in actual built app');
const built=new Function(page.slice(start,end)+';return {ggIntegrals,ggFirstNN};')();
ok(near(built.ggIntegrals(1.1,-.9).f,ggIntegrals(1.1,-.9).f),'built calculation agrees');
ok(page.includes('...GRAVITYGAUGE_SECTION'),'registered in the rail');
console.log(`${pass} ok, 0 failed`);
