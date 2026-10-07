"""Interval certificates for each SU(7) candidate rung in the small-angle model.

These bound the moment relaxation, not the full Fourier potential or its global vacuum.
The tail is excluded analytically by a concave decreasing gap, never by a finite scan.
Only the explicitly listed rungs are certified; no monotonicity in k is presumed.
"""
from fractions import Fraction as Q
from pathlib import Path
from math import comb, floor, ceil, nextafter, inf
from decimal import Decimal, localcontext
import hashlib, json
import mpmath as mp

ROOT=Path(__file__).resolve().parents[1]
mp.mp.dps=70
mp.iv.dps=60
iv=mp.iv
def interval(q):
    q=Q(q);return iv.mpf(q.numerator)/q.denominator
def endpoints(x):
    def rational(t):
        sign,mantissa,exponent,_=t
        return Q((-1)**sign*mantissa)*Q(2)**exponent
    scale=10**45
    with localcontext() as ctx:
        ctx.prec=90
        return [str(Decimal(floor(rational(x._mpi_[0])*scale))/Decimal(scale)),
                str(Decimal(ceil(rational(x._mpi_[1])*scale))/Decimal(scale))]
def lower(x):return mp.mpf(x._mpi_[0])
def upper(x):return mp.mpf(x._mpi_[1])
def coords(terms):
    a=u=v=k=Q(0)
    for m,s,c in terms:
        m=Q(str(m));c=Q(c)
        k+=(8 if s==1 else -6)*m*c*c
        if s==1:
            a+=m*c**4
            if c==2:u+=16*m
            if c==3:v+=81*m
        else:u+=m*c**4
    return a,k,u,v
def G(c):
    a,k,u,v=c
    return interval(a)*interval(Q(25,12))-interval(u)*iv.ln(2)-interval(v)*iv.ln(3)

def build():
    path=ROOT/'data/su7_km25.json';data=json.loads(path.read_text())
    # Apery's convergent alternating identity gives an exact rational enclosure.
    partial=sum(((-1)**(n-1)*Q(1,n**3*comb(2*n,n)) for n in range(1,81)),Q(0))*Q(5,2)
    next_term=Q(5,2*81**3*comb(162,81))
    zeta=iv.mpf([interval(partial).a,interval(partial+next_term).b])
    mw,g4,mlo,mhi=map(interval,['80.4','0.63','123','127'])
    mu_lo=4*iv.pi**2*mlo**2/(3*mw**2*g4**2)
    mu_hi=4*iv.pi**2*mhi**2/(3*mw**2*g4**2)
    duals=[tuple(Q(x) for x in row) for row in data['inverse']['dual_vertices']['lower']]
    generators=[coords(t) for r in data['reps'].values() for t in r.values()]
    checks=[]
    for j,(lam,nu) in enumerate(duals):
        slacks=[interval(0) if c[2]==c[3]==0 and c[0]*Q(25,12)-lam*c[0]-nu*c[1]==0
                else G(c)-interval(lam*c[0]+nu*c[1]) for c in generators]
        assert all(lower(s)>=0 for s in slacks),('invalid dual',j,[endpoints(s) for s in slacks])
        checks.append(dict(name=f'dual {j}: eight exact generator inequalities',passed=True,slacks=[endpoints(s) for s in slacks]))
    records={}
    for seed in ['published','candidate']:
        base=coords(data['gauge_seeds'][seed]['gauge']);a0,k0,_,_=base;g0=G(base)
        denominator=interval(a0)+6*mu_lo
        assert lower(denominator)>0
        rows=[]
        for k in (range(1,22,2) if seed=='published' else range(2,22,2)):
            numerator=interval(Q(3*k,2))*zeta
            def gap(t,j):
                t=interval(t);lam,nu=map(interval,duals[j]);den=6*mu_hi+t
                rhs=t*(iv.ln(numerator/den)/2+interval(Q(3,4)))+3*mu_hi
                bound=g0+lam*(t-interval(a0))+nu*(k-interval(k0))
                deriv=iv.ln(numerator/den)/2+interval(Q(3,4))-t/(2*den)-lam
                return rhs-bound,deriv
            # Legal A4 values have spacing 3. Start at a nonnegative point in this coset.
            first=Q(k-3,2)
            while first<0:first+=3
            def excluded(n):return any(upper(gap(first+3*n,j)[0])<0 and upper(gap(first+3*n,j)[1])<0 for j in range(len(duals)))
            hi=1
            while not excluded(hi):hi*=2
            lo=0
            assert not excluded(lo)
            while hi-lo>1:
                mid=(lo+hi)//2
                if excluded(mid):hi=mid
                else:lo=mid
            cap=first+3*lo;rejected=cap+3
            j=next(j for j in range(len(duals)) if upper(gap(rejected,j)[0])<0 and upper(gap(rejected,j)[1])<0)
            f,df=gap(rejected,j)
            bound=2*iv.pi*mw*iv.sqrt((6*mu_hi+interval(cap))/numerator)
            rows.append(dict(k8D=k,A4cap=float(cap),upperGeV=nextafter(float(upper(bound)),inf),massIntervalGeV=endpoints(bound),
                firstExcludedA4=str(rejected),dual=[str(x) for x in duals[j]],gapInterval=endpoints(f),derivativeInterval=endpoints(df),
                allLargerA4Excluded=True,attainmentEstablished=False,fullPotentialBound=False))
        records[seed]=dict(base=dict(A4=str(a0),k8D=str(k0)),denominatorLowerInterval=endpoints(denominator),rows=rows)
    # Independent archived controls, including the candidate's first two rungs.
    for seed,k,cap in [('published',1,215),('published',3,336),('candidate',2,272.5),('candidate',4,375.5)]:
        actual=next(r['A4cap'] for r in records[seed]['rows'] if r['k8D']==k)
        assert actual==cap,(seed,k,actual,cap)
        checks.append(dict(name=f'{seed} rung {k}: archived cap {cap}',passed=True))
    result=dict(schema='ghu-small-angle-bound-v1',conventions=dict(mWGeV=80.4,g4=.63,mhWindowGeV=[123,127]),
        inputSHA256=hashlib.sha256(path.read_bytes()).hexdigest(),seeds=records,checks=checks,
        proof=dict(zeta3=endpoints(zeta),precisionDigits=60,
            tail='For one feasible dual, f=G_required-G_lower has f<0 and df/dA4<0 at the first excluded lattice point. Its second derivative is -1/(2*(6*mu+A4))-3*mu/(6*mu+A4)^2<0. Hence every larger A4 is excluded.',
            massWindow='dG_required/dmu=18*mu/(6*mu+A4)>0; using mh=127 bounds the whole [123,127] GeV window.',
            zeroRung='6*mu+A4 >= 6*mu_min+A4_gauge >0. Identity II therefore forbids k<=0 at any finite nonzero x in this mass window, within the small-angle model.',
            missing='No remainder enclosure relating identities I/II to the full Fourier potential; no global-vacuum, anomaly, or collider certificate. No bound for unlisted rungs.'),
        sources=['https://arxiv.org/abs/2503.04090','Part VII identities I/II and the archived exact rational moment-cone duals'])
    return result

if __name__=='__main__':
    result=build()
    (ROOT/'data/candidate_bounds.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    (ROOT/'src/modules/candidate_bounds_reference.mjs').write_text('/* Generated by tools/candidate_bounds.py; conditional moment bounds only. */\nexport const CANDIDATE_BOUNDS='+json.dumps(result,indent=2)+';\n',encoding='utf-8')
    print(json.dumps({'checks':len(result['checks']),'candidate':[(r['k8D'],r['upperGeV']) for r in result['seeds']['candidate']['rows']]}))
