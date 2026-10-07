/* Integrated transition history in an explicit bag-background cosmology.
 * Sources: arXiv:2305.02357 §§4–6; arXiv:2309.05474 eqs. (10–15),(28–30).
 * No extrapolation of the bounce action; wall speed and efficiency are inputs.
 */
import {thCoefficients,thValue,thMinima} from './thermal_ghu.mjs';
export const TH_PLANCK_REDUCED=2.435e18;
export function thHistoryDefaults(){return {gStar:106.75,wallSpeed:.95,efficiency:.5,vacuumBackground:1};}
export function thHistoryValidate(input={}){
  const p={...thHistoryDefaults(),...input};
  for(const [key,lo,hi] of [['gStar',10,500],['wallSpeed',.05,1],['efficiency',0,1],['vacuumBackground',0,1]])
    if(!Number.isFinite(p[key])||p[key]<lo||p[key]>hi)throw new RangeError(`${key} outside ${lo}…${hi}`);
  if(![0,1].includes(p.vacuumBackground))throw new RangeError('Background must be radiation or radiation plus vacuum');
  return p;
}
export function thHubble(T,gStar,vacuumGeV4=0){return Math.sqrt((Math.PI**2/30*gStar*T**4+vacuumGeV4)/(3*TH_PLANCK_REDUCED**2));}

/* Piecewise linear interpolation in log T, staying inside the supplied action table. */
export function thActionAt(samples,T){
  if(T<samples[0].T||T>samples.at(-1).T)throw new RangeError('Action extrapolation is forbidden');
  let lo=0,hi=samples.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(samples[m].T>T)hi=m;else lo=m;}
  const a=samples[lo],b=samples[hi];if(a.T===b.T)return a.S;
  return a.S+(b.S-a.S)*Math.log(T/a.T)/Math.log(b.T/a.T);
}
export function thIntegrateHistory(samples,settings={},steps=1200){
  const p=thHistoryValidate(settings),vacuum=settings.vacuumGeV4??0;
  if(!Number.isFinite(vacuum)||vacuum<0||!Number.isInteger(steps)||steps<20||steps>5000)throw new RangeError('Invalid integration domain');
  if(samples.length<4||samples.some((s,i)=>!Number.isFinite(s.T)||!Number.isFinite(s.S)||s.T<=0||s.S<=0||(i>0&&s.T<=samples[i-1].T)))throw new RangeError('Actions require at least four distinct increasing positive temperatures');
  const hi=samples.at(-1).T,lo=samples[0].T,dy=Math.log(hi/lo)/steps;
  const rows=[],times=[],weight=[];
  let conformal=0,N=0,densityIntegral=0;
  for(let i=0;i<=steps;i++){
    const y=i*dy,T=i===steps?lo:hi*Math.exp(-y),S=thActionAt(samples,T),H=thHubble(T,p.gStar,vacuum);
    const logRate=4*Math.log(T)+1.5*Math.log(S/(2*Math.PI))-S;
    const gammaH4=Math.exp(logRate-4*Math.log(H));
    const w=Math.exp(logRate-3*Math.log(T)-Math.log(H)); // Gamma/(T^3 H), integrated in d ln(T_hi/T)
    if(i){const prev=rows[i-1];conformal+=dy/2*(T/H+prev.T/prev.H);N+=dy/2*(gammaH4+prev.gammaH4);}
    times.push(conformal);weight.push(w);
    let I=0,derivative=0;
    for(let j=0;j<i;j++){
      const left=conformal-times[j],right=conformal-times[j+1];
      I+=dy/2*(weight[j]*left**3+weight[j+1]*right**3);
      derivative+=dy/2*(weight[j]*left**2+weight[j+1]*right**2);
    }
    I*=4*Math.PI/3*p.wallSpeed**3;
    const dIdy=4*Math.PI*p.wallSpeed**3*T/H*derivative,P=Math.exp(-I);
    if(i)densityIntegral+=dy/2*(w*P+weight[i-1]*rows[i-1].falseFraction);
    const density=T**3*densityIntegral;
    rows.push({T,S,H,gammaH4,logGammaOverH4:Math.log(gammaH4||Number.MIN_VALUE),N,I,falseFraction:P,
      shrinking:3-dIdy<0,physicalFalseVolumeSlope:3-dIdy,bubbleDensityGeV3:density,
      separationGeVInverse:density>0?density**(-1/3):null});
    if(I>25)break; // completed well beyond P=0.01; no late-time extrapolation is needed
  }
  const crossing=(key,threshold)=>{
    const at=rows.findIndex(r=>r[key]>=threshold);if(at<1)return null;
    const a=rows[at-1],b=rows[at];
    const f=a[key]>0?Math.log(threshold/a[key])/Math.log(b[key]/a[key]):(threshold-a[key])/(b[key]-a[key]);
    const lerp=k=>a[k]+f*(b[k]-a[k]);
    const T=Math.exp(Math.log(a.T)+f*Math.log(b.T/a.T));
    const density=lerp('bubbleDensityGeV3'),H=thHubble(T,p.gStar,vacuum);
    return {temperatureGeV:T,S3overT:thActionAt(samples,T),falseFraction:key==='I'?Math.exp(-threshold):lerp('falseFraction'),
      physicalFalseVolumeSlope:lerp('physicalFalseVolumeSlope'),shrinking:lerp('physicalFalseVolumeSlope')<0,
      separationGeVInverse:density>0?density**(-1/3):null,HGeV:H,bracketGeV:[b.T,a.T]};
  };
  const topNegligible=rows[0].gammaH4<1e-8;
  return {nucleation:crossing('N',1),percolation:crossing('I',.34),completion:crossing('I',-Math.log(.01)),
    rows,topNegligible,upperBoundaryGammaOverH4:rows[0].gammaH4,steps,settings:{...p,vacuumGeV4:vacuum},
    criteria:{nucleation:'Integral Gamma/H^4 dT/T = 1 (without false-volume weighting)',percolation:'I=0.34, P_false=exp(-0.34); additionally require d ln(a^3 P_false)/d ln a < 0',completion:'P_false=0.01 and decreasing physical false-vacuum volume'}};
}

export function thThermodynamics(model,RT,mult,gStar){
  const c=thCoefficients(model,RT,model.windings*mult,model.thermalTerms*mult),m=thMinima(c)[0];
  if(!m||m.a<=0||m.v>=0)return null;
  const dt=RT*1e-4,C=3*model.invRGeV**4/(64*Math.PI**6);
  const valueAt=t=>thValue(thCoefficients(model,t,model.windings*mult,model.thermalTerms*mult),m.a);
  const dv=(valueAt(RT+dt)-valueAt(RT-dt))/(2*dt),rho=Math.PI**2/30*gStar*(RT*model.invRGeV)**4;
  return {alpha:m.a,traceStrength:C*(-m.v+RT*dv/4)/rho,releasedEnergyGeV4:C*(-m.v+RT*dv),radiationGeV4:rho};
}
export function thSoundSpectrum(point,strength,settings){
  const p=thHistoryValidate(settings),R=point.separationGeVInverse,H=point.HGeV,T=point.temperatureGeV;
  if(!(strength>=0&&R>0&&H>0&&point.shrinking))return null;
  const K=p.efficiency*strength/(1+strength),cs=1/Math.sqrt(3),U=Math.sqrt(3*K/4);
  const tauH=U>0?H*R/U:null,Y=tauH===null?1:1-1/Math.sqrt(1+2*tauH);
  // Instantaneous bag-model reheating. H includes the selected background energy.
  const Treh=(90*TH_PLANCK_REDUCED**2*H**2/(Math.PI**2*p.gStar))**.25;
  const redshift=2.7255*8.617333262e-14/Treh*(3.909/p.gStar)**(1/3);
  const h100GeV=3.240779289e-18/1.519267447e24;
  const Romega=redshift**4*(H/h100GeV)**2;
  const fPeakHz=1.58*redshift*1.519267447e24/R;
  const amplitude=.053*Romega*K*K*(H*R/cs)*Y;
  const points=Array.from({length:161},(_,i)=>{const x=10**(-3+6*i/160);return {frequencyHz:fPeakHz*x,omegaH2:amplitude*x**3*(7/(4+3*x*x))**3.5};});
  return {fPeakHz,peakOmegaH2:amplitude,K,fluidRMS:U,soundLifetimeH:tauH,lifetimeSuppression:Y,
    meanSeparationH:H*R,reheatTemperatureGeV:Treh,points,
    scope:'Conditional acoustic lattice fit; bag approximation K=kappa*alpha/(1+alpha), chosen wall speed and efficiency, instantaneous reheating, no turbulence/collision contribution or detector significance.'};
}

let thHistoryCacheKey='',thHistoryCache=null;
export function thHistoryModel(external,model,settings={}){
  const p=thHistoryValidate(settings);
  const pending={parameters:p,thermalParameters:model,status:'pending',scope:'A matching refined PhaseTracer action table is required. Use the thermal panel to import the refined result.'};
  if(!external?.historySamples)return pending;
  if(Object.keys(model).some(k=>external.parameters?.[k]!==model[k]))return {...pending,scope:'The action table belongs to different thermal inputs.'};
  const key=JSON.stringify([model,p,external.historySamples,external.historyPrecision]);
  if(key===thHistoryCacheKey)return thHistoryCache;
  const input=external.historySamples;
  const mainKey=input.every(s=>Number.isFinite(s.eightfoldS3overT))?'eightfoldS3overT':'fineS3overT';
  const otherKey=mainKey==='eightfoldS3overT'?'fourfoldS3overT':'S3overT',mult=mainKey==='eightfoldS3overT'?8:2;
  const samples=k=>input.map(s=>({T:s.RT*model.invRGeV,S:s[k]}));
  if(input.some(s=>!Number.isFinite(s[mainKey])||!Number.isFinite(s[otherKey])))return {...pending,scope:'Refined action table is incomplete.'};
  const zero=thMinima(thCoefficients(model,0,model.windings*mult,model.thermalTerms*mult))[0];
  const vacuum=Math.max(0,-zero.v)*3*model.invRGeV**4/(64*Math.PI**6)*p.vacuumBackground;
  const options={...p,vacuumGeV4:vacuum};
  const primary=samples(mainKey),sparse=primary.filter((_,i)=>i%2===0||i===primary.length-1);
  const history=thIntegrateHistory(primary,options),quadrature=thIntegrateHistory(primary,options,600),coarser=thIntegrateHistory(samples(otherKey),options),sampling=thIntegrateHistory(sparse,options);
  const point=history.percolation,thermo=point?thThermodynamics(model,point.temperatureGeV/model.invRGeV,mult,p.gStar):null;
  const complete=history.topNegligible&&point?.shrinking&&history.completion?.shrinking;
  const vJ=thermo?(Math.sqrt(thermo.traceStrength**2+2*thermo.traceStrength/3)+1/Math.sqrt(3))/(1+thermo.traceStrength):null;
  const acousticDomain=complete&&thermo&&p.wallSpeed>vJ&&thermo.traceStrength<=1;
  const spectrum=acousticDomain?thSoundSpectrum(point,thermo.traceStrength,p):null;
  const shift=(a,b)=>a&&b?(b.temperatureGeV-a.temperatureGeV)/a.temperatureGeV:null;
  const result={parameters:p,thermalParameters:model,status:complete?'conditional-completion':'not-established',history,thermodynamics:thermo,spectrum,
    actionProvenance:{backend:external.backend,precision:external.historyPrecision,samples:input},
    acousticDomain:{evaluated:!!acousticDomain,bagJouguetSpeed:vJ,reason:acousticDomain?'Assumed supersonic detonation and alpha <= 1; efficiency remains supplied.':'Acoustic estimate requires completion, vw above the bag Jouguet speed and alpha <= 1. Slow-wall reheating and strong-transition fits are not implemented.'},
    convergence:{percolationCutoffRelativeShift:shift(point,coarser.percolation),percolationQuadratureRelativeShift:shift(point,quadrature.percolation),
      primarySpatialCutoff:model.windings*mult,primaryThermalCutoff:model.thermalTerms*mult,comparisonMultiplier:mult/2,
      primaryMultiplier:mult,actionRelativeShift:Math.max(...input.map(s=>Math.abs(s[otherKey]/s[mainKey]-1))),
      percolationSamplingRelativeShift:shift(point,sampling.percolation),
      separationSamplingRelativeShift:point&&sampling.percolation?sampling.percolation.separationGeVInverse/point.separationGeVInverse-1:null,
      separationCutoffRelativeShift:point&&coarser.percolation?coarser.percolation.separationGeVInverse/point.separationGeVInverse-1:null,
      separationQuadratureRelativeShift:point&&quadrature.percolation?quadrature.percolation.separationGeVInverse/point.separationGeVInverse-1:null,
      note:'Cutoff and quadrature comparisons are numerical diagnostics. Action interpolation and shooting errors are not rigorous bounds.'},
    scope:'Adiabatic cooling, constant g*=g*s, Gamma=T^4(S3/(2piT))^(3/2) exp(-S3/T), constant chosen wall speed. Radiation plus optional constant false-vacuum energy, fixed by setting the T=0 true-vacuum energy to zero. Thermal reheating during growth and O(4) tunnelling are omitted.',
    sources:['https://arxiv.org/html/2305.02357v3','https://arxiv.org/html/2309.05474v2']};
  thHistoryCacheKey=key;thHistoryCache=result;return result;
}
