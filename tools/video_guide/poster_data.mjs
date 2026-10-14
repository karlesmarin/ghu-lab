/* The social/video cover is an actual H185 calculation, not illustrative invented data. */
import {ggAt,ggIntegrals,ggMasses} from '../../src/modules/gravitygauge.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=resolve(process.argv[2]);
const ts=Array.from({length:91},(_,i)=>.1+.9*i/90),etas=Array.from({length:81},(_,i)=>-.9+4.9*i/80);
const surface=etas.map(eta=>ts.map(t=>ggAt(ggIntegrals(1.1,eta),t).staticResponse));
const checks=JSON.parse(readFileSync(resolve(root,'data/h185_reference.json'),'utf8')).families.filter(x=>x.p===1.1);
for(const c of checks){const got=ggAt(ggIntegrals(c.p,c.eta),.5).staticResponse;if(Math.abs(got-c.response_over_g4_squared_ell_squared_at_half)>1e-10)throw Error('Reference mismatch');}
const source='src/modules/gravitygauge.mjs';
const data={schema:'ghu-video-poster-v1',p:1.1,a:.1,ts,etas,surface,masses:ggMasses(1.1),checks:checks.length,source,sourceSha256:createHash('sha256').update(readFileSync(resolve(root,source))).digest('hex'),scope:'Fixed-canonical-potential H185 family. Tensor NN / paired vector DD masses. Static response normalized by g4^2 ell^2; fixed g4, g5 recalibrated with eta. Model calculation, not measured data.'};
const target=resolve(out,'poster-data.json');
if(process.argv.includes('--check')){if(JSON.stringify(JSON.parse(readFileSync(target,'utf8')))!==JSON.stringify(data))throw Error('Poster data changed');}
else{mkdirSync(out,{recursive:true});writeFileSync(target,JSON.stringify(data,null,2)+'\n');}
console.log('Poster: '+checks.length+' reference checks; 91 × 81 calculated response samples and three paired masses.');
