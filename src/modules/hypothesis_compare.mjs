/* Archived GHU reconstruction and observed CMS data remain separate scientific contexts. */
import { HCX_REFERENCE } from './hypothesis_reference.mjs';
import { TT_CMS } from './tt_cms_reference.mjs';
export const hcxDefaults=()=>({case:6,region:0,bin:0,other:1});
export function hcxValidate(p){
 for(const [key,lo,hi] of [['case',1,9],['region',0,1],['bin',0,14],['other',0,14]])
  if(!Number.isInteger(p?.[key])||p[key]<lo||p[key]>hi)throw Error(`Invalid ${key}: integer ${lo}–${hi} required`);
 return p;
}
export function hcxModel(p=hcxDefaults()){
 hcxValidate(p);const parameters={...p},rows=HCX_REFERENCE.rows,selected=rows[p.case-1],reference=rows[0],curve=HCX_REFERENCE.potential[p.region?'global':'local'];
 const cms=TT_CMS.abs,sigma=cms.value.map((_,i)=>Math.sqrt(cms.covariance[i][i]));
 const correlation=cms.covariance.map((row,i)=>row.map((v,j)=>i===j?1:v/(sigma[i]*sigma[j])));
 const ys=curve.delta[p.case-1];let k=0;for(let i=1;i<ys.length;i++)if(Math.abs(ys[i])>Math.abs(ys[k]))k=i;
 return {schema:'ghu-hypothesis-comparison-v1',parameters,selected,reference,rows,curve,cms,sigma,correlation,certificates:HCX_REFERENCE.certificates,
  changes:{cf:100*(selected.cf/reference.cf-1),mv:100*(selected.mv/reference.mv-1),lambda3:100*(selected.l3/reference.l3-1),lambda4:100*(selected.l4/reference.l4-1)},
  maxDifference:{absolute:Math.abs(ys[k]),theta:curve.theta[k],sampled:true},
  selectedMeasurement:{lo:cms.bin_low_GeV[p.bin],hi:cms.bin_high_GeV[p.bin],value:cms.value[p.bin],sigma:sigma[p.bin],relativeErrorPercent:100*sigma[p.bin]/cms.value[p.bin],correlation:correlation[p.bin][p.other]},
  provenance:{theory:HCX_REFERENCE.provenance,cms:{paper:TT_CMS.paper,doi:cms.doi,covarianceDOI:cms.covariance_doi,raw_sha256:cms.raw_sha256}},
  observedFitReady:false,scope:'Archived dominant-tower GHU reconstruction, thetaH=0.1 and mH=125.1 GeV fixed, bottom omitted. Physical uncertainty unquantified. CMS is a separate observed spectrum; no prediction connecting these nine cases to this observable and no observed likelihood are supplied.'};
}
export function hcxRead(r,language='en'){
 const es=language==='es',n=(v,d=3)=>v.toLocaleString(es?'es-ES':'en-US',{maximumFractionDigits:d}),c=r.changes,m=r.selectedMeasurement,p=r.parameters;
 const theory=p.case===1?(es?'La referencia se compara consigo misma: su diferencia de potencial es cero. Elige otro caso para explorar qué cambia.':'The reference is compared with itself: its potential difference is zero. Select another case to explore changes.'):
 es?`El caso ${p.case} cambia cF un ${n(c.cf,2)} % y mV un ${n(c.mv,2)} % respecto al caso 1. Tras recalibrar, λ₃ cambia ${n(c.lambda3)} % y λ₄ ${n(c.lambda4)} %. La mayor diferencia absoluta muestreada de potencial, dividida por mH²fH², es ${r.maxDifference.absolute.toExponential(2)} en θ=${n(r.maxDifference.theta)}. ${p.region?'Se explora θ de 0 a π.':'Se explora θ de 0,06 a 0,14, cerca del vacío.'} La masa del Higgs y θH permanecen fijadas: son casos recalibrados, no el efecto aislado de un parámetro. Su semejanza calculada todavía no establece si un experimento podría distinguirlos.`:
 `Case ${p.case} changes cF by ${n(c.cf,2)}% and mV by ${n(c.mv,2)}% relative to case 1. After recalibration, λ₃ changes by ${n(c.lambda3)}% and λ₄ by ${n(c.lambda4)}%. The largest sampled absolute potential difference, divided by mH²fH², is ${r.maxDifference.absolute.toExponential(2)} at θ=${n(r.maxDifference.theta)}. ${p.region?'The field interval is 0 to π.':'The field interval is 0.06 to 0.14, near the vacuum.'} The Higgs mass and θH remain fixed: these are recalibrated cases, not an isolated one-parameter effect. Numerical similarity does not yet determine experimental distinguishability.`;
 const meaning=p.bin===p.other?(es?'Es el mismo intervalo: ρ=1 por definición.':'This is the same interval: ρ=1 by definition.'):
 m.correlation>0?(es?'La correlación positiva indica errores que tienden a variar en el mismo sentido.':'Positive correlation means errors tend to vary in the same direction.'):
 m.correlation<0?(es?'La correlación negativa indica errores que tienden a variar en sentidos opuestos.':'Negative correlation means errors tend to vary in opposite directions.'):
 (es?'La correlación lineal de estos errores es nula.':'These errors have zero linear correlation.');
 const data=es?`CMS mide ${n(m.value,8)} ± ${n(m.sigma,8)} pb/GeV en ${m.lo}–${m.hi} GeV, con incertidumbre marginal total del ${n(m.relativeErrorPercent,1)} %. Las barras horizontales muestran la anchura del intervalo; las verticales, su incertidumbre. ρ(${p.bin+1},${p.other+1})=${n(m.correlation,4)}. ${meaning} Para combinar intervalos se necesita la matriz completa. Contrastar las hipótesis requiere una predicción compatible y validada.`:
 `CMS measures ${n(m.value,8)} ± ${n(m.sigma,8)} pb/GeV in ${m.lo}–${m.hi} GeV, with a total marginal uncertainty of ${n(m.relativeErrorPercent,1)}%. Horizontal bars show bin widths; vertical bars show uncertainty. ρ(${p.bin+1},${p.other+1})=${n(m.correlation,4)}. ${meaning} Combining bins requires the full matrix. Testing the hypotheses requires a compatible, validated prediction.`;
 return {theory,data};
}
export function hcxImportSelection(raw){
 if(!raw||raw.schema!=='ghu-lab-experiment-v1'||raw.experiment!=='hypothesiscompare')throw Error('Expected a saved hypothesis-comparison selection');
 const p=Object.fromEntries(Object.keys(hcxDefaults()).map(k=>[k,raw.parameters?.[k]]));hcxValidate(p);return p;
}
export function hcxCSV(r){return ['low_GeV,high_GeV,CMS_pb_per_GeV,sigma_total_pb_per_GeV',...r.cms.value.map((v,i)=>[r.cms.bin_low_GeV[i],r.cms.bin_high_GeV[i],v,r.sigma[i]].join(','))].join('\n');}
