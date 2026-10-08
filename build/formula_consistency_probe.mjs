/* Live implementation values checked independently by Sage. */
import {writeFileSync} from 'node:fs';
import {sun5dBlocks,sun5dTerms,sun5dV,sun5dMinimum} from '../src/modules/sun5d.mjs';
const b=sun5dBlocks({nPP:1,nPM:0,nMP:0,nMM:2});
const t=sun5dTerms(b,{gauge:true,bulk:[{rep:'fund',eta:1,kind:'dirac',multiplicity:1}]});
const out={normalization:{direct_V_over_C:sun5dV(t,[0],600),grid_reported:sun5dMinimum(t,1,{windings:600}).V}};
writeFileSync(new URL('../data/formula_consistency_probe.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log('Live normalization probe written.');
