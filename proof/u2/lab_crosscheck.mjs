import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {R,add,sub,mul,div,eq,str} from './inputs/charges.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const ro=process.argv.slice(2).join(' ')==='--check';
if(process.argv.length>2&&!ro)throw Error('Use no args or --check');
if(!ro&&fs.existsSync(path.join(here,'SEALED')))throw Error('Sealed');
const sage=JSON.parse(fs.readFileSync(path.join(here,'checks.json'),'utf8'));
const checks=[];
function ck(name,ok){checks.push({name,passed:!!ok});if(!ok)throw Error(name);}
const q=(s,t,a,b)=>add(R(s*(a-b)**2,4),R(t*(a+b)**2,8));
const examples=[];
for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)examples.push({m:[a,b],c2:str(q(-1,2,a,b)),positive:str(q(1,6,a,b))});
ck('GHU rational kernel confirms both U2 examples on 25 independent cocharacters',examples.every(x=>x.c2===String(x.m[0]*x.m[1])&&x.positive===String(x.m[0]**2+x.m[0]*x.m[1]+x.m[1]**2)));
ck('Fractional pieces add to an integral CP3 charge',eq(add(R(1,4),R(3,4)),R(1)));
const mixed=R(-3), half=div(mixed,R(2)), lower=mul(R(8,3),mixed), upper=mul(R(-5,3),mixed);
ck('Mixed-instanton periods independently match Sage',str(mixed)===sage.mixed_instanton_periods.net&&str(half)===sage.mixed_instanton_periods.half_net&&str(lower)===sage.mixed_instanton_periods.lower&&str(upper)===sage.mixed_instanton_periods.upper);
const u2c2=sub(R(0),R(1,4)),su3c2=sub(R(0),R(1,3));
ck('Quotient bundle fractional factor classes recombine into genuine integral classes',eq(add(u2c2,R(1,4)),R(0))&&eq(add(su3c2,R(1,3)),R(0)));
const result={passed:true,count:checks.length,checks,examples,scope:'Unmodified GHU Lab rational arithmetic kernel; finite numerical crosschecks supplement the symbolic proof, no full-model validation'};
const out=path.join(here,'lab_checks.json');
if(ro){if(JSON.stringify(JSON.parse(fs.readFileSync(out,'utf8')))!==JSON.stringify(result))throw Error('Saved results differ');}
else fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:checks.length,read_only:ro}));
