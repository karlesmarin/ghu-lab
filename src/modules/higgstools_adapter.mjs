import {HT_REFERENCE} from './higgstools_reference.mjs';
export function htValidate(input={}){
 const p={kV:1,kF:1,kg:1,kGamma:1,kZGamma:1,invWidthMeV:0,...input};
 for(const [k,v] of Object.entries(p))if(!['kV','kF','kg','kGamma','kZGamma','invWidthMeV'].includes(k)||typeof v!=='number'||!Number.isFinite(v)||v<0||v>(k==='invWidthMeV'?10:3))throw new RangeError('Invalid Higgs scenario parameter '+k);
 if(Object.values(p).every(x=>x===0))throw new RangeError('A positive total width is required');return p;
}
export function htModel(input={}){
 const p=htValidate(input),ref=HT_REFERENCE.SM,partialWidthsGeV={};
 for(const [d,w] of Object.entries(ref.partialWidthsGeV)){
  const k=['WW','ZZ'].includes(d)?p.kV:d==='gg'?p.kg:d==='gamgam'?p.kGamma:d==='Zgam'?p.kZGamma:p.kF;
  partialWidthsGeV[d]=d==='directInv'?p.invWidthMeV/1000:w*k*k;
 }
 const widthGeV=Object.values(partialWidthsGeV).reduce((a,b)=>a+b,0);
 if(!(widthGeV>0))throw new RangeError('A positive total width is required');
 const branching=Object.fromEntries(Object.entries(partialWidthsGeV).map(([d,w])=>[d,w/widthGeV]));
 const crossSectionsPb=Object.fromEntries(Object.entries(HT_REFERENCE.productionPolynomial).map(([c,modes])=>[c,Object.fromEntries(Object.entries(modes).map(([mode,[v,f,vf,g]])=>[mode,Math.max(0,v*p.kV**2+f*p.kF**2+vf*p.kV*p.kF+g*p.kg**2)]))]));
 const signalStrengths=Object.entries(crossSectionsPb.LHC13).flatMap(([mode,x])=>Object.entries(branching).filter(([d])=>ref.branching[d]>0&&ref.crossSectionsPb.LHC13[mode]>0).map(([decay,br])=>({mode,decay,mu:x/ref.crossSectionsPb.LHC13[mode]*br/ref.branching[decay]})));
 return {parameters:p,massGeV:125.2,widthGeV,partialWidthsGeV,branching,crossSectionsPb,signalStrengths,reference:HT_REFERENCE,
  scope:HT_REFERENCE.scope,experimentalResult:null};
}
export function rxMatchExternal(id,p,data){
 if(!data||data.schema!=='ghu-external-result-v1'||data.experiment!==id||!data.backend||!data.parameters)return false;
 const keys=Object.keys(p);if(Object.keys(data.parameters).length!==keys.length||!keys.every(k=>typeof data.parameters[k]==='number'&&data.parameters[k]===p[k]))return false;
 if(id==='higgstools'){
  if(!data.datasets?.HiggsBounds?.commit||!data.datasets?.HiggsSignals?.commit||typeof data.bounds?.allowed!=='boolean'||!Number.isFinite(data.signals?.chisq)||!Number.isFinite(data.signals?.SMchisq))return false;
  if(!data.bounds.selected||typeof data.bounds.selected!=='object'||!Object.values(data.bounds.selected).every(l=>l&&Number.isFinite(l.obsRatio)&&Number.isFinite(l.expRatio)&&typeof l.reference==='string'&&typeof l.description==='string')||!Number.isFinite(data.signals.deltaChisq)||!Number.isFinite(data.signals.observableCount))return false;
  const model=htModel(p),r=data.predictions;
  if(!r||Math.abs(r.widthGeV/model.widthGeV-1)>1e-7)return false;
  for(const [d,b] of Object.entries(model.branching))if(!Number.isFinite(r.branching?.[d])||Math.abs(r.branching[d]-b)>1e-7)return false;
  for(const [c,modes] of Object.entries(model.crossSectionsPb))for(const [m,x] of Object.entries(modes))if(!Number.isFinite(r.crossSectionsPb?.[c]?.[m])||Math.abs(r.crossSectionsPb[c][m]-x)>1e-6*Math.max(1,x))return false;
  return true;
 }
 if(id==='thermal')return Array.isArray(data.samples)&&data.samples.every(s=>Number.isFinite(s.RT)&&s.RT>0&&Number.isFinite(s.S3overT)&&s.S3overT>0)&&(!data.nucleation||['RT','temperatureGeV','S3overT','relativeActionShift','betaOverH','traceAnomalyStrength'].every(k=>Number.isFinite(data.nucleation[k])));
 return false;
}
