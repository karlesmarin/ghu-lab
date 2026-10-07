"""Independent full-Fourier checks of candidate contents; never a universal bound.

NumPy/SciPy numerical root isolation is checked at two winding cutoffs. Tail
bounds are analytic for each finite content. This is not interval root isolation.
"""
from pathlib import Path
import json, math
import numpy as np
from scipy.optimize import brentq
ROOT=Path(__file__).resolve().parents[1]

def check_content(data,bulk,N):
    terms=[list(t) for t in data['gauge_seeds']['candidate']['gauge']]
    for b in bulk:
        key='('+','.join('+' if s>0 else '-' for s in b['parities'])+')'
        terms += [[m*b['multiplicity'],s,c] for m,s,c in data['reps'][b['rep']][key]]
    grouped={}
    for m,s,c in terms:grouped[(s,c)]=grouped.get((s,c),0)+m
    n=np.arange(1,N+1,dtype=float)
    freq=np.concatenate([np.pi*c*n for s,c in grouped])
    weights=np.concatenate([m*(np.ones(N) if s==1 else (-1.)**n)/n**5 for (s,c),m in grouped.items()])
    def f(a,d=0):
        angle=freq*a
        return float(np.sum(weights*(-2*np.sin(angle/2)**2 if d==0 else -freq*np.sin(angle) if d==1 else -freq**2*np.cos(angle))))
    grid=np.unique(np.r_[np.geomspace(1e-8,.001,101),np.linspace(.001,1-1e-8,3001)])
    roots=[];prev=grid[0];dp=f(prev,1)
    for a in grid[1:]:
        da=f(a,1)
        if dp<0<da:roots.append(brentq(lambda x:f(x,1),prev,a,xtol=1e-14))
        prev,dp=a,da
    candidates=[dict(alpha=a,deltaF=f(a),curvature=f(a,2)) for a in [0.,*roots,1.]]
    best=min(candidates,key=lambda m:m['deltaF'])
    local=next((m for m in candidates if 0<m['alpha']<.1 and m['curvature']>0),None)
    small=local is not None
    mw=80.4;g4=.63
    mass=lambda m:2*mw*math.sqrt(3/(16*math.pi**6))*g4*math.sqrt(m['curvature'])/m['alpha'] if m and m['alpha']>0 and m['curvature']>0 else None
    A4=sum(m*c**4 for (s,c),m in grouped.items() if s==1)
    D8=sum(m*c*c*(8 if s==1 else -6) for (s,c),m in grouped.items())
    tail=sum(abs(m) for m in grouped.values())/(4*N**4)
    curvature_tail=sum(abs(m)*c*c for (s,c),m in grouped.items())*math.pi**2/(2*N**2)
    return dict(windings=N,A4=A4,k8D=D8,globalMinimum=best,localSmallAngle=local,
        globalSmallAngle=small and abs(best['alpha']-local['alpha'])<1e-7,
        higgsMassGeV=mass(local),compactificationGeV=2*mw/local['alpha'] if small else None,
        allLocatedMinima=candidates,potentialTailBound=tail,deltaPotentialTailBound=2*tail,curvatureTailBound=curvature_tail)

def run():
    data=json.loads((ROOT/'data/su7_km25.json').read_text());ref=data['inverse']['candidate']
    slots=[(rep,key) for rep in data['reps'] for key in data['reps'][rep]]
    def bulk(n):return [dict(rep=rep,parities=[1 if key[1]=='+' else -1,1 if key[3]=='+' else -1],multiplicity=int(m)) for m,(rep,key) in zip(n,slots) if m]
    cases=[('measured-mass archived witness',ref['pdg']['lo_content'])]
    cases += [(f"rung {r['k8D']} archived upper small-angle witness",bulk(r['hi_content'])) for r in ref['ladder']]
    cases += [(f"rung {r['k8D']} stationary upper witness",r['top_content']) for r in ref['bands']]
    cases += [('zero rung: nine 28(+,-)',[dict(rep='28',parities=[1,-1],multiplicity=9)])]
    results=[]
    for name,b in cases:
        coarse=check_content(data,b,1024);fine=check_content(data,b,2048)
        results.append(dict(name=name,bulk=b,coarse=coarse,fine=fine,
            higgsMassShiftGeV=fine['higgsMassGeV']-coarse['higgsMassGeV'] if fine['higgsMassGeV'] is not None and coarse['higgsMassGeV'] is not None else None))
        print(name,json.dumps(fine),flush=True)
    output=dict(schema='ghu-candidate-vacuum-check-v1',conventions=dict(mWGeV=80.4,g4=.63),cases=results,
        status='Independent numerical checks of specified contents; no exhaustive full-potential ceiling',
        scope='Grid-isolated stationary points at 1024/2048 Fourier terms, followed by Brent refinement. Analytic tail bounds are included. Anomaly completion, flavour, Higgs rates and likelihood matching remain unspecified; no global GHU fit is defined.')
    (ROOT/'data/candidate_vacua.json').write_text(json.dumps(output,indent=2)+'\n')
    return output
if __name__=='__main__':run()
