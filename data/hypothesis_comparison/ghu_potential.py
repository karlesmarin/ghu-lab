"""Independent dominant-tower reconstruction of arXiv:2002.09262v3.

HTML 3.4-3.23 and Appendix B. Landau gauge; bottom and light fermions
omitted explicitly. Rounded Table 2 inputs, not a full model validation.
No downloaded code is executed. All masses below are in GeV.
"""
from pathlib import Path
import json, math
import numpy as np
from scipy.special import iv, kv
from scipy.optimize import root
from numpy.polynomial.legendre import leggauss

HERE=Path(__file__).resolve().parent
ZL=1e10;THETA=.1;K=3.84e13;CT=-.227;GW=.653;MH=125.1
FH=2*K/(GW*np.sqrt(np.log(ZL)*(ZL*ZL-1)))
PREF=(K/ZL)**4/(4*np.pi)**2
SIN2=.1140+.1186*np.cos(THETA)-.0014*np.cos(2*THETA)

def grid(n=64,end=35):
    a,b=leggauss(n);edges=[1e-7,1e-5,.001,.01,.1,1,5,15,end]
    return (np.concatenate([(l+r)/2+(r-l)/2*a for l,r in zip(edges[:-1],edges[1:])]),
            np.concatenate([(r-l)/2*b for l,r in zip(edges[:-1],edges[1:])]))

def ff(a,b,q):
    # All orders here differ by an integer: the analytic-continuation phase is real.
    phase=(-1.)**int(round(a-b));u=q/ZL
    return iv(a,u)*kv(b,q)-phase*kv(a,u)*iv(b,q)

def fermion(q,c):
    if c<0:
        cl,cr,sl,sr=fermion(q,-c)
        return cr,cl,-sr,-sl
    scale=q/np.sqrt(ZL)
    return (scale*ff(c+.5,c-.5,q),scale*ff(c-.5,c+.5,q),
            scale*ff(c+.5,c+.5,q),-scale*ff(c-.5,c-.5,q))

def coefficients(q,nf,nv,cv,cf,mv,include_bottom=False):
    cp=q*q/ZL*ff(0,0,q);s=q/ZL*ff(1,1,q);den=4*ZL/q*cp*s
    weak=1/(1-SIN2)
    top=fermion(q,CT);dark=fermion(q,cf)
    p=fermion(q,cv+mv);m=fermion(q,cv-mv)
    b0=p[0]*m[1]+m[0]*p[1]-p[2]*m[3]-m[2]*p[3]
    terms=[(6,2,-1/(den+1)),(3,2,-weak/(den+weak)),
      (-12,1,-1/(1-2*top[2]*top[3])),(-12*nf,1,1/(1-2*dark[2]*dark[3])),
      (-8*nv,2,-2/b0)]
    if include_bottom:
        # Diagnostic only: Table 2 cDb/mub and Appendix A mDtilde=1.
        p=fermion(q,1.04+1);m=fermion(q,1.04-1)
        slsr=-p[2]*m[3]-m[2]*p[3]+p[0]*m[1]+m[0]*p[1]-2
        clsl=p[0]*m[2]+m[0]*p[2]  # imaginary part
        den=(1-2*top[2]*top[3])*slsr-2*.104**2*top[1]*top[3]*clsl+1
        terms.append((-12,1,-slsr/den))
    return terms

def log_derivatives(qcoef,harmonic,t):
    n=harmonic;Q=qcoef
    D=1+Q*np.cos(n*t)
    if np.any(D<=0):raise ValueError('Nonpositive spectral determinant')
    a=-n*Q*np.sin(n*t)/D;b=-n*n*Q*np.cos(n*t)/D
    c=n**3*Q*np.sin(n*t)/D;d=n**4*Q*np.cos(n*t)/D
    return np.array([a,b-a*a,c-3*a*b+2*a**3,d-4*a*c-3*b*b+12*a*a*b-6*a**4])

def evaluate(nf,nv,cv,cf,mv,n=64,end=35,t=THETA,include_bottom=False):
    q,w=grid(n,end);co=coefficients(q,nf,nv,cv,cf,mv,include_bottom)
    der=sum(mult*(log_derivatives(Q,h,t)@(w*q**3)) for mult,h,Q in co)*PREF
    return dict(derivatives=der.tolist(),stationarity_scaled=float(der[0]/(MH*MH*FH*FH)),
      mass_squared=float(der[1]/FH**2),lambda3=float(der[2]/(6*FH**3)),lambda4=float(der[3]/(24*FH**4)))

def solve(nf,nv,cv,cf,mv,n=64,include_bottom=False):
    def residual(x):
        r=evaluate(nf,nv,cv,*x,n=n,include_bottom=include_bottom)
        return [r['stationarity_scaled'],r['mass_squared']/MH**2-1]
    r=root(residual,[cf,mv],tol=1e-9)
    if not r.success or np.max(abs(np.array(residual(r.x))))>1e-7:raise ValueError(r.message)
    return r.x,evaluate(nf,nv,cv,*r.x,n=n,include_bottom=include_bottom)

if __name__=='__main__':
    table=json.loads((HERE/'ghu_paper_benchmark.json').read_text(encoding='utf-8'))['rows']
    output=[]
    for nf,nv,cv,cf,mv,l3,l4 in table:
        fixed=evaluate(nf,nv,cv,cf,mv)
        x,recalibrated=solve(nf,nv,cv,cf,mv)
        output.append(dict(nf=nf,nv=nv,cv=cv,published_parameters=[cf,mv],published_couplings=[l3,l4],
          fixed_rounded_inputs=fixed,recalibrated_parameters=x.tolist(),recalibrated=recalibrated))
    result=dict(status='exploratory_dominant_tower_reconstruction',source='https://arxiv.org/html/2002.09262v3',
      assumptions=dict(zL=ZL,thetaH=THETA,k_GeV=K,ct=CT,gW=GW,fH_GeV=float(FH),mH_GeV=MH,
        omitted=['bottom','light fermions'],gauge_xi=0,gW_status='Declared approximate input; not independently matched to paper electroweak convention.'),rows=output)
    (HERE/'ghu_potential_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps([dict(cv=r['cv'],nf=r['nf'],nv=r['nv'],fixed_mass2=r['fixed_rounded_inputs']['mass_squared'],parameters=r['recalibrated_parameters'],l3=r['recalibrated']['lambda3'],l4=r['recalibrated']['lambda4']) for r in output]))
