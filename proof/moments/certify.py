"""Arb enclosures for approximation error and an exact equal-moment witness.

Run: sage -python proof/moments/certify.py [output directory]
Sources: the model of Komori–Maru; expansions of Haba–Takenaga–Yamashita
and Sakamoto–Takenaga; SU(7) coordinates in Carles Marin's Part VII.
No claim of priority is made for these verification artifacts.
"""
import hashlib
import json
import sys
from fractions import Fraction
from functools import lru_cache
from pathlib import Path
import mpmath as mp
from sage.all import QQ, RealBallField, RealIntervalField
from sage.version import version

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'results/moment_diagnostics'
OUT.mkdir(parents=True,exist_ok=True)
REF=ROOT/'data/su7_certification'
B=RealBallField(192); I=RealIntervalField(192); P=B.pi(); Z3=B(3).zeta()
mp.mp.dps=65
checks=[]

def check(name,ok):
    checks.append({'name':name,'passed':bool(ok)})
    if not ok:raise AssertionError(name)

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def enc(a):return [str(QQ(I(a).lower())),str(QQ(I(a).upper()))]
def ball(interval):return B(I(QQ(interval[0]),QQ(interval[1])))
def exact(a):return str(QQ(a))
def rational(a):return QQ(str(Fraction(str(a))))
def combine(ts):
    d={}
    for m,s,c in ts:d[s,c]=d.get((s,c),QQ(0))+rational(m)
    return tuple((m,s,c) for (s,c),m in sorted(d.items()) if m)
def serial(ts):return [[str(m),s,c] for m,s,c in ts]
def coords(ts):
    a=k=u=v=w=QQ(0)
    for m,s,c in ts:
        k+=m*c*c*(8 if s==1 else -6)
        if s==1:
            a+=m*c**4
            if c==2:u+=32*m
            if c==3:v+=81*m
        else:u+=2*m*c**4
        if c%2:w-=2*s*m
    return [2*a,k,u,v,w]
def moment(ts):
    a,k,u,v,w=coords(ts)
    return B(k)/8,B(a)/2,B(a)*QQ(25)/24-B(u)*B(2).log()/2-B(v)*B(3).log()

@lru_cache(maxsize=40000)
def channel(a,c,s,j,nmax):
    a=B(a);z=B(0)
    for n in range(1,nmax+1):
        x=P*c*n*a
        trig=x.cos() if j==0 else -x.sin() if j==1 else -x.cos()
        z+=s**n*trig/B(n)**(5-j)
    return z*(P*c)**j

def evaluate(ts,a,j=0,nmax=2048):
    val=sum((B(m)*channel(QQ(a),c,s,j,nmax) for m,s,c in ts),B(0))
    tail=sum((B(abs(m))*(P*c)**j for m,s,c in ts),B(0))/((4-j)*B(nmax)**(4-j))
    return val.add_error(tail.upper())

def third(ts):return sum((B(abs(m))*(P*c)**3 for m,s,c in ts),B(0))*P**2/6
def second(ts):return sum((B(abs(m))*(P*c)**2 for m,s,c in ts),B(0))*B(QQ(5)/4)
def full_curvature(ts,iv):
    lo,hi=map(QQ,iv);c=(lo+hi)/2
    return evaluate(ts,c,2).add_error((third(ts)*B((hi-lo)/2)).upper())
def energy_interval(ts,iv):
    lo,hi=map(QQ,iv);c=(lo+hi)/2;h=B((hi-lo)/2)
    return evaluate(ts,c).add_error((abs(evaluate(ts,c,1))*h+second(ts)*h*h/2).upper())
def app(ts,a,j):
    D,A,G=moment(ts);x=P*B(a)
    if j==0:return -Z3*D*x*x/2+x**4*(G-A*x.log())/24
    if j==1:return P*(-Z3*D*x+x**3*(4*G-A*(4*x.log()+1))/24)
    return P**2*(-Z3*D+x*x*(12*G-A*(12*x.log()+7))/24)

def mp_moments(ts):
    a,k,u,v,w=coords(ts)
    conv=lambda q:mp.mpf(str(q.numerator()))/int(q.denominator())
    return conv(k)/8,conv(a)/2,conv(a)*25/24-conv(u)*mp.log(2)/2-conv(v)*mp.log(3)

def approximate_bracket(ts,label):
    D,A,G=mp_moments(ts)
    check(label+': Lambert minimum signs',D>0 and A>0)
    d=12*mp.zeta(3)*D/A;b=(4*G-A)/(2*A)
    check(label+': two real Lambert branches',b-1-mp.log(d)>0)
    al=mp.sqrt(-d/mp.lambertw(-d*mp.exp(-b),-1))/mp.pi
    c=rational(mp.nstr(al,55));h=QQ(1)/10**12
    lo,hi=c-h,c+h
    check(label+': approximate root bracket',app(ts,lo,1).upper()<0<app(ts,hi,1).lower())
    curvature=app(ts,B(I(lo,hi)),2)
    check(label+': positive approximate curvature',curvature.lower()>0)
    return [str(lo),str(hi)],mp.nstr(al,35)

def mp_full_derivative(ts,al):
    return sum(-mp.mpf(str(m.numerator()))/int(m.denominator())*mp.pi*c*mp.im(mp.polylog(4,s*mp.exp(1j*mp.pi*c*al))) for m,s,c in ts)

def local_bracket(ts,guess,label):
    root=mp.findroot(lambda a:mp_full_derivative(ts,a),(mp.mpf(guess)*mp.mpf('.97'),mp.mpf(guess)*mp.mpf('1.03')))
    check(label+': local root near approximation',0<root<1 and abs(root-mp.mpf(guess))<mp.mpf('.03'))
    c=rational(mp.nstr(root,50));h=QQ(1)/10**6;iv=[str(c-h),str(c+h)]
    check(label+': full derivative sign bracket',evaluate(ts,c-h,1).upper()<0<evaluate(ts,c+h,1).lower())
    check(label+': full local curvature',full_curvature(ts,iv).lower()>0)
    return iv,mp.nstr(root,35)

def quantities(ts,iv,approximate):
    a=ball(iv)
    if approximate:
        D,A,G=moment(ts)
        curvature=P**2*(2*Z3*D-A*(P*a)**2/6)
    else:curvature=full_curvature(ts,iv)
    check('positive mass curvature',curvature.lower()>0)
    k=B(3).sqrt()*B('80.4')*B('.63')/(2*P**3)
    return {'alpha':iv,'higgsGeV':enc(k*curvature.sqrt()/a),'compactificationGeV':enc(2*B('80.4')/a),'curvature':enc(curvature)}

def errors(approx,full):
    out={}
    for key in ['alpha','higgsGeV','compactificationGeV']:
        aa,ff=ball(approx[key]),ball(full[key])
        out[key]={'fullMinusApproximate':enc(ff-aa),'absolute':enc(abs(ff-aa)),
                  'relativePercent':enc(100*abs(aa/ff-1))}
    return out

def compare(ts,root,label):
    ai,num=approximate_bracket(ts,label)
    approx=quantities(ts,ai,True);full=quantities(ts,root,False)
    # Mean-value theorem: at the exact approximate root F_app'=0.
    # The full derivative on its enclosing interval bounds the residual.
    alo,ahi=map(QQ,ai);center=(alo+ahi)/2;h=B((ahi-alo)/2)
    residual=evaluate(ts,center,1).add_error((second(ts)*h).upper())
    lo=min(alo,QQ(root[0]));hi=max(ahi,QQ(root[1]))
    covers=[];floors=[]
    for j in range(16):
        l=lo+(hi-lo)*j/16;u=lo+(hi-lo)*(j+1)/16
        curv=full_curvature(ts,[l,u]);floors.append(QQ(I(curv).lower()))
        covers.append({'interval':[str(l),str(u)],'curvature':enc(curv)})
    floor=min(floors)
    check(label+': full potential convex between the roots',floor>0)
    residual_bound=QQ(I(abs(residual)).upper())
    bound=residual_bound/floor
    return {'approximate':approx,'full':full,'errors':errors(approx,full),'numericalApproximateAlpha':num,
            'residualProof':{'derivativeAtApproximateRoot':enc(residual),'epsilon':str(residual_bound),'curvatureFloor':str(floor),
                             'absoluteAlphaErrorUpper':str(bound),'convexCover':covers,
                             'claim':'The mean-value theorem bounds |alpha_full-alpha_approx| by epsilon/curvatureFloor on the certified convex interval. Globality is a separate claim.'}}

def main():
    data=json.loads((ROOT/'data/su7_km25.json').read_text())
    recon=json.loads((REF/'reconstruction.json').read_text())
    glob=json.loads((REF/'global_certificates.json').read_text())
    sage=json.loads((REF/'sage_verification.json').read_text())
    for name in ['reconstruction.json','global_certificates.json']:
        check('existing Arb certificate input '+name,sage['inputs'][name]==sha(REF/name))
    rows=[]
    for cert in glob['rows']:
        source=next(r for r in recon['rows'] if r['row']==cert['row'])
        tt=list(source['terms'])
        if cert['seed']=='candidate':tt += [[str(-QQ(m)),s,c] for m,s,c in recon['printed_gauge']]+recon['candidate_gauge']
        ts=combine(tt);label=cert['row']+' '+cert['seed']
        lo,hi=map(QQ,cert['root_interval'])
        check(label+': inherited global certificate',cert['certified'])
        check(label+': independently replayed full root bracket',evaluate(ts,lo,1).upper()<0<evaluate(ts,hi,1).lower())
        result=compare(ts,cert['root_interval'],label)
        bulk=next(r['bulk'] for r in data['published_rows'] if r['label']==cert['row'])
        rows.append({'row':cert['row'],'seed':'published' if cert['seed']=='printed' else 'candidate','bulk':bulk,
                     'terms':serial(ts),'coordinates':[str(x) for x in coords(ts)],'globality':'inherited-certified-global-minimum',**result})
        print(label+': approximation error enclosed',flush=True)
    # A compact exact witness found by integer linear algebra; minimality is not claimed.
    slots=[(rep,key,tt) for rep,keys in data['reps'].items() for key,tt in keys.items()]
    counts={'A':[0,1,1,0,0,0,1,0],'B':[1,0,0,6,3,1,0,0]}
    pair=[]
    for name,cs in counts.items():
        bulk=[];tt=list(data['gauge'])
        for n,(rep,key,terms) in zip(cs,slots):
            if n:
                bulk.append({'rep':rep,'parities':[1,1 if key=='(+,+)' else -1],'multiplicity':n})
                tt.extend([[rational(m)*n,s,c] for m,s,c in terms])
        ts=combine(tt);ai,an=approximate_bracket(ts,'witness '+name)
        iv,num=local_bracket(ts,an,'witness '+name)
        gap=evaluate(ts,QQ(1))-energy_interval(ts,iv)
        co=coords(ts)
        pair.append({'name':name,'bulk':bulk,'terms':serial(ts),'coordinates':[str(x) for x in co],
                     'localRoot':iv,'numericalLocalAlpha':num,'approximateRoot':ai,'endpointMinusLocalEnergy':enc(gap),
                     'endpointOrdering':enc(B(QQ(31)/32)*B(5).zeta()*co[4]),
                     'localMinimumCertified':True,'lowerEndpointCertified':gap.upper()<0})
    check('witness: exact equality of four local coordinates',pair[0]['coordinates'][:4]==pair[1]['coordinates'][:4])
    check('witness: exact endpoint difference',QQ(pair[0]['coordinates'][4])-QQ(pair[1]['coordinates'][4])==32)
    check('witness: opposite endpoint ordering',QQ(pair[0]['coordinates'][4])>0>QQ(pair[1]['coordinates'][4]))
    check('witness B: endpoint below the certified local minimum',pair[1]['lowerEndpointCertified'])
    result={'schema':'ghu-moment-diagnostics-v1','date':'2026-10-08','arithmetic':'SageMath '+version+' / Arb 192 bits',
            'conventions':{'mWGeV':80.4,'g4':0.63},'benchmarks':rows,
            'momentWitness':{'seed':'published','coordinateOrder':['2A4','8D','2U','V','2W'],'contents':pair,
                             'claim':'The two contents have identical D,A4,G exactly, different full potentials and opposite endpoint ordering. Content B has a certified local minimum with a strictly lower competitor at alpha=1.',
                             'scope':'One-loop mathematical witness; perturbative and phenomenological viability are not assessed. Global minima of the pair are not certified here.'},
            'sources':[{'url':'https://arxiv.org/abs/2503.04090','role':'Model: Yuzuho Komori and Nobuhito Maru.'},
                       {'url':'https://arxiv.org/abs/hep-ph/0411250','role':'Kernel expansions: Naoyuki Haba, Kazunori Takenaga and Toshifumi Yamashita.'},
                       {'url':'https://arxiv.org/abs/hep-th/0609067','role':'Three-coefficient potential: Makoto Sakamoto and Kazunori Takenaga.'},
                       {'url':'https://github.com/karlesmarin/su7-compactification-bound','role':'SU(7) moment coordinates and interpretation: Carles Marin, Part VII.'}],
            'inputs':{f:sha(REF/f) for f in ['reconstruction.json','global_certificates.json','sage_verification.json']},
            'modelSHA256':sha(ROOT/'data/su7_km25.json'),'scriptSHA256':sha(Path(__file__)),
            'checks':checks,'passed':len(checks),'scope':'Conditional on the declared one-loop potentials and fixed mass inputs. Computer-assisted interval proofs, not Lean formalization or a claim of scientific originality.'}
    (OUT/'moment_diagnostics.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'passed':len(checks),'benchmarks':len(rows),'witness_verified':True}),flush=True)

if __name__=='__main__':main()
