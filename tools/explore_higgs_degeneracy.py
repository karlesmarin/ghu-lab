"""Use the pinned HiggsTools engine to expose coupling/width degeneracies.

Run inside the scientific image, with this checkout mounted at /work.
This is a CP-even scalar benchmark, not a complete SU(7) theory fit.
"""
from pathlib import Path
import argparse,json,math
import numpy as np
from scipy.optimize import minimize_scalar,brentq
import Higgs.bounds as HB,Higgs.signals as HS
from higgstools_run import particle,rates,limit,dataset_info,DEFAULTS

def explore(destination):
    out=Path(destination);out.mkdir(parents=True,exist_ok=True)
    bounds=HB.Bounds('/datasets/hb');signals=HS.Signals('/datasets/hs')
    sm,h,_=particle(DEFAULTS);sm_rates=rates(h);width_mev=h.totalWidth()*1000;sm_chi=float(signals(sm));cache={}
    def evaluate(k,width):
        key=(round(float(k),12),round(float(width),12))
        if key in cache:return cache[key]
        parameters={p:float(k) for p in DEFAULTS if p!='invWidthMeV'};parameters['invWidthMeV']=float(width)
        pred,scalar,_=particle(parameters);r=bounds(pred);chi=float(signals(pred));rr=rates(scalar)
        mu=k**4*width_mev/(k*k*width_mev+width)
        measured_mu=rr['crossSectionsPb']['LHC13']['ggH']/sm_rates['crossSectionsPb']['LHC13']['ggH']*rr['branching']['gamgam']/sm_rates['branching']['gamgam']
        assert abs(measured_mu-mu)<1e-10
        row=dict(kappa=float(k),invisibleWidthMeV=float(width),invisibleBR=rr['branching']['directInv'],visibleMu=float(mu),chisq=chi,deltaChisqSM=chi-sm_chi,
          HBallowed=bool(r.allowed),selectedLimits={name:limit(l) for name,l in r.selectedLimits.items()})
        cache[key]=row;return row
    flat=[]
    for k in np.linspace(1,1.45,46):
        row=evaluate(k,width_mev*(k**4-k*k));assert abs(row['visibleMu']-1)<1e-12;flat.append(row)
    fixed=[evaluate(1,w) for w in np.linspace(0,3,61)]
    result=minimize_scalar(lambda k:evaluate(k,0)['chisq'],bounds=(.8,1.3),method='bounded',options={'xatol':1e-9})
    best=evaluate(result.x,0);best_mu=best['visibleMu']
    # Profile over a common kappa for each chosen invisible width. Only chi-square
    # differences are reported; this degenerate two-parameter surface is not a CL.
    profile=[]
    for width in np.linspace(0,10,51):
        fit=minimize_scalar(lambda k:evaluate(k,width)['chisq'],bounds=(.8,1.5),method='bounded',options={'xatol':1e-8})
        row=evaluate(fit.x,width);row={**row,'deltaChisqBest':row['chisq']-best['chisq']};profile.append(row)
    grid=[]
    for k in np.linspace(.85,1.45,31):
        for width in np.linspace(0,10,41):grid.append(evaluate(k,width))
    fixed_delta4=brentq(lambda w:evaluate(1,w)['chisq']-sm_chi-4,0,3)
    hb_change=[]
    for a,b in zip(flat,flat[1:]):
        if a['HBallowed']!=b['HBallowed']:hb_change.append([a['kappa'],b['kappa']])
    for row in flat+fixed+grid:row['deltaChisqBest']=row['chisq']-best['chisq']
    record=dict(schema='ghu-higgs-degeneracy-study-v1',SM=dict(chisq=sm_chi,widthMeV=width_mev,observables=int(signals.observableCount())),
      backend=json.loads(Path('/opt/ghu-tool-versions.json').read_text()),datasets=dict(HiggsBounds=dataset_info('/datasets/hb'),HiggsSignals=dataset_info('/datasets/hs')),
      bestCommonKappaAtZeroInvisibleWidth=best,bestVisibleMu=best_mu,fixedKappa1DeltaChi4WidthMeV=fixed_delta4,
      compensatedLine=flat,fixedCouplingScan=fixed,profileOverCommonKappa=profile,grid=grid,
      diagnostics=dict(evaluatedPoints=len(cache),maxCompensatedDeltaChi=max(abs(r['deltaChisqSM']) for r in flat),HBtransitionKappaBrackets=hb_change),
      identity='Uniform kappa rescales every production cross section and visible partial width by kappa^2. Gamma_inv=Gamma_SM*(kappa^4-kappa^2) leaves every visible signal strength at one.',
      scope='Explicit one-scalar benchmark at 125.2 GeV; universal positive kappa, independent invisible width. No GHU matching is assumed. HiggsSignals chi-square and HiggsBounds selected-limit verdicts are kept separate. No global p-value or confidence contour is assigned to the degenerate fit.',
      sources=['https://higgsbounds.gitlab.io/higgstools/HiggsSignalsAPI.html','https://arxiv.org/abs/1403.1582'])
    (out/'higgs_degeneracy.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
    print(json.dumps({k:record[k] for k in ['SM','bestCommonKappaAtZeroInvisibleWidth','fixedKappa1DeltaChi4WidthMeV','diagnostics']},indent=2),flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('destination');a=p.parse_args();explore(a.destination)
