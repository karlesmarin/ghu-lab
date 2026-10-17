import assert from 'node:assert/strict';
import {GMR_DEFAULTS,gmrParameters,gmrReference,gmrValidate,gmrModel,gmrValidateSelection} from './src/modules/matched_profiles.mjs';
let passed=0;
function check(name,fn){fn();passed++;console.log('ok '+name);}
const ref=gmrReference(GMR_DEFAULTS);
check('archived certified separation',()=>assert.equal(ref.status,'separated_conditional'));
check('second archived query',()=>assert.equal(gmrReference({...GMR_DEFAULTS,t:'0.5'}).status,'separated_conditional'));
check('canonical decimals',()=>assert.deepEqual(gmrParameters({width:'0.125',alpha:'0.05',t:'0.25',degree:3}),GMR_DEFAULTS));
check('new width withdraws reference',()=>assert.equal(gmrReference({...GMR_DEFAULTS,width:'1/16'}),null));
for(const edit of [
 r=>r.parameters.width='1/16',
 r=>r.model.source='different',
 r=>r.model.mass_uses_layer_weight=true,
 r=>r.profiles.reverse(),
 r=>r.comparison.difference_a_minus_b=['0.00028','0.00028'],
 r=>r.comparison.direction='a_below_b',
 r=>r.profiles[0].matching.kappa=['-1','1'],
 r=>r.profiles[0].report.inverse_response=['-1','1'],
 r=>r.profiles[0].report.status='matched_pole',
 r=>delete r.provenance.sources_sha256['ghu_matched_response.py']
])check('reject altered context or decision',()=>{const r=structuredClone(ref);edit(r);assert.throws(()=>gmrValidate(r,GMR_DEFAULTS));});
for(const p of [{...GMR_DEFAULTS,width:'0'},{...GMR_DEFAULTS,alpha:0.05},{...GMR_DEFAULTS,t:'1e100'},{...GMR_DEFAULTS,degree:true}])
 check('reject unsupported parameters',()=>assert.throws(()=>gmrParameters(p)));
check('overlap cannot be called equality',()=>{
 const r=structuredClone(ref);r.profiles[1]={...structuredClone(r.profiles[0]),profile:'triangular'};
 r.comparison={status:'inconclusive_overlap',direction:'overlap',difference_a_minus_b:['-1','1']};r.status='inconclusive_overlap';
 assert.equal(gmrValidate(r,GMR_DEFAULTS).status,'inconclusive_overlap');
 r.status='separated_conditional';assert.throws(()=>gmrValidate(r,GMR_DEFAULTS));
});
check('caller cannot mutate archived reference',()=>{ref.profiles[0].report.response[0]='0';assert.notEqual(gmrReference(GMR_DEFAULTS).profiles[0].report.response[0],'0');});
check('shared model selection maps to certified second query',()=>assert.equal(gmrModel({probe:1}).parameters.t,'1/2'));
check('selection rejects uncertified query',()=>assert.throws(()=>gmrValidateSelection({probe:2})));
check('model carries certificate and scope',()=>assert.equal(gmrModel().certificate.kind,'written-proof-and-independent-computational-certificate'));
console.log(passed+' passed, 0 failed (profile adapter context and interval decisions)');
