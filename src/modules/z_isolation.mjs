/* Presentation of an admitted continuous neutral-block certificate. */
import {ZIS_REFERENCE} from './z_isolation_reference.mjs';
export function zisModel(point=1){
 if(!Number.isInteger(point)||point<0||point>2)throw new RangeError('Choose a certified neutral angle');
 const ref=ZIS_REFERENCE;
 if(ref.receipt.status!=='VERIFIED'||ref.certificate.schema!=='ghu-z-isolation-v1')throw new Error('Neutral isolation certificate is not admitted');
 return {schema:'ghu-z-isolation-selection-v1',point,...structuredClone(ref.certificate.cases[point]),
  model:structuredClone(ref.certificate.model),scope:ref.certificate.scope,certificateSha256:ref.sha256};
}
