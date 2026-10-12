import {writeFileSync} from 'node:fs';
import {brxRobinRoots,brxProfileGram,brxTwistedMoment,brxFamilyCondition} from '../../src/modules/boundary_research.mjs';
const data={
 roots:[0,.02,.1,.5,1,2,4,8,16,32,100].map(a=>({a,roots:brxRobinRoots(a,3)})),
 gram:[0,.25,.5,.75,1].map(M=>brxProfileGram(M)),
 trace:[[-2,-1],[-1,0],[0,2],[1,2],[2,-2]].map(([u,v])=>({u,v,value:brxTwistedMoment(10,3,2,[u,v,0,0,0,0,0,0,0,0])})),
 families:Array.from({length:10},(_,n)=>brxFamilyCondition(n,-1))
};
writeFileSync(new URL('./lab-reference.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log('Exported source-engine reference values for every quantitative scene.');
