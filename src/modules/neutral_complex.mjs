/* Presentation of the exact finite-complex certificate maintained in Excovery. */
import {NCX_REFERENCE} from './neutral_complex_reference.mjs';
export function ncxModel(branch=0){
 if(![0,1].includes(branch))throw new RangeError('Choose an exact neutral stratum');
 const r=NCX_REFERENCE;
 if(r.receipt.status!=='VERIFIED')throw new Error('Neutral certificate is not admitted');
 return {schema:'ghu-neutral-complex-selection-v1',branch,
  ...structuredClone(r.certificate.cases[branch]),
  certificateSha256:r.sha256,scope:r.certificate.scope};
}
