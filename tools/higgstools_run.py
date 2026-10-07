"""Run a complete, explicit CP-even kappa scenario against pinned HB/HS data.
No collider exclusion is derived from an isolated ggH ratio. This adapter sets
all SM couplings and widths, includes optional invisible width and reports the
HiggsBounds selected limits, HiggsSignals chi-square and their data versions.
"""
import json,math,hashlib,argparse,subprocess
from pathlib import Path
import Higgs.predictions as HP,Higgs.bounds as HB,Higgs.signals as HS
DECAYS=['uu','dd','ss','cc','bb','tt','ee','mumu','tautau','WW','ZZ','Zgam','gamgam','gg','directInv']
PRODUCTION=['ggH','bbH','vbfH','HW','qqHZ','ggHZ','bbHZ','Htt','tchanHt','schanHt','HtW']
DEFAULTS=dict(kV=1,kF=1,kg=1,kGamma=1,kZGamma=1,invWidthMeV=0)
def particle(parameters):
    p={**DEFAULTS,**parameters}
    for key,val in p.items():
        if key not in DEFAULTS or not isinstance(val,(float,int)) or not math.isfinite(val):raise ValueError('Unexpected/nonfinite input '+key)
        if not (0<=val<=(10 if key=='invWidthMeV' else 3)):raise ValueError('Input outside laboratory domain: '+key)
    pred=HP.Predictions();h=pred.addParticle(HP.BsmParticle('h','neutral','even'));h.setMass(125.2)
    couplings={key:p['kF'] for key in DECAYS[:9]}
    couplings.update(WW=p['kV'],ZZ=p['kV'],gg=p['kg'],gamgam=p['kGamma'],Zgam=p['kZGamma'])
    HP.effectiveCouplingInput(h,HP.NeutralEffectiveCouplings(**couplings),HP.ReferenceModel.SMHiggsInterp,False,False)
    h.setDecayWidth('directInv',p['invWidthMeV']/1000)
    if h.totalWidth()<=0:raise ValueError('Total width must be positive')
    return pred,h,p
def rates(h):
    return dict(massGeV=h.mass(),widthGeV=h.totalWidth(),branching={d:h.br(d) for d in DECAYS},
        partialWidthsGeV={d:h.br(d)*h.totalWidth() for d in DECAYS},
        crossSectionsPb={c:{p:h.cxn(c,p) for p in PRODUCTION} for c in ['LHC8','LHC13','LHC13p6','LHC14']})
def dataset_info(path):
    path=Path(path);h=hashlib.sha256();count=0
    for f in sorted(path.rglob('*')):
        if f.is_file() and '.git' not in f.parts and f.name!='.ghu-commit':
            h.update(f.relative_to(path).as_posix().encode());h.update(b'\0');h.update(f.read_bytes());count+=1
    git=path/'.git'
    if (path/'.ghu-commit').exists():commit=(path/'.ghu-commit').read_text().strip()
    else:
        head=(git/'HEAD').read_text().strip();commit=(git/head[5:]).read_text().strip() if head.startswith('ref: ') else head
    return dict(commit=commit,treeSha256=h.hexdigest(),files=count)
def limit(l):
    def get(obj,key):
        v=getattr(obj,key);return v() if callable(v) else v
    lim=get(l,'limit')
    return dict(id=get(lim,'id'),reference=str(get(lim,'reference')),experiment=str(get(lim,'experiment')),collider=str(get(lim,'collider')),description=str(get(lim,'processDesc')),
                obsRatio=get(l,'obsRatio'),expRatio=get(l,'expRatio'),particles=list(get(l,'contributingParticles')))
def run(parameters,output,hb='work/hbdataset',hs='work/hsdataset'):
    pred,h,p=particle(parameters);sm,smh,_=particle(DEFAULTS)
    bounds=HB.Bounds(hb);signals=HS.Signals(hs);res=bounds(pred)
    chisq=signals(pred);smchisq=signals(sm)
    result=dict(schema='ghu-external-result-v1',experiment='higgstools',parameters=p,
      backend=json.loads(Path('/opt/ghu-tool-versions.json').read_text()),datasets=dict(HiggsBounds=dataset_info(hb),HiggsSignals=dataset_info(hs)),
      predictions=rates(h),SM=rates(smh),bounds=dict(allowed=res.allowed,selected={k:limit(l) for k,l in res.selectedLimits.items()},applied=[limit(l) for l in res.appliedLimits]),
      signals=dict(chisq=chisq,SMchisq=smchisq,deltaChisq=chisq-smchisq,observableCount=signals.observableCount()),
      scope='One CP-even 125.2 GeV scalar; universal real fermion kappa, common W/Z kappa, independent effective gg/gamma/Zgamma amplitudes, optional invisible width. No extra Higgs states, no di-Higgs prediction. Couplings are explicit scenario assumptions, not a complete GHU fit. Delta chi-square is relative to the same SM reference, not a confidence level.')
    Path(output).write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps(dict(width=result['predictions']['widthGeV'],allowed=res.allowed,signals=result['signals'],datasets=result['datasets'])))
    return result
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('input');parser.add_argument('output');parser.add_argument('--hb',default='work/hbdataset');parser.add_argument('--hs',default='work/hsdataset');a=parser.parse_args()
    obj=json.loads(Path(a.input).read_text());run(obj.get('parameters',obj),a.output,a.hb,a.hs)
