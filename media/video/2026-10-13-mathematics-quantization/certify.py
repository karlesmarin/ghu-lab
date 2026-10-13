"""Exact rational certificates and independent numerical cross-checks.
These are executable certificates with explicit analytic justification, not Lean proofs.
"""
from pathlib import Path
from fractions import Fraction as F
from math import factorial, floor, pi
import itertools
import json
import sys
import numpy as np
from scipy.integrate import quad
from scipy.optimize import brentq

ROOT=Path(__file__).resolve().parent
if not __debug__:
    raise RuntimeError('Run without -O: certificate assertions must remain enabled.')
reference=json.loads((ROOT/'lab-reference.json').read_text())
checks=[]
def ck(name,passed):
    assert bool(passed),name
    checks.append({'name':name,'passed':True})
def add(a,b):return a[0]+b[0],a[1]+b[1]
def neg(a):return -a[1],-a[0]
def sub(a,b):return add(a,neg(b))
def mul(a,b):
    p=[x*y for x in a for y in b]
    return min(p),max(p)
def scale(n,a):return mul((F(n),F(n)),a)
def inv(a):
    assert a[0]>0
    return 1/a[1],1/a[0]
def point(x):return F(x),F(x)
def pack(a):return {'lower':str(a[0]),'upper':str(a[1]),'display':[float(a[0]),float(a[1])]}
def atan_bounds(x,n=60):
    p=sum(((-1)**j*x**(2*j+1)/F(2*j+1) for j in range(n)),F(0))
    tail=(-1)**n*x**(2*n+1)/F(2*n+1)
    return min(p,p+tail),max(p,p+tail)
PI=sub(scale(16,atan_bounds(F(1,5))),scale(4,atan_bounds(F(1,239))))
ck('Machin alternating-series enclosure of pi has width below 1e-80',PI[1]-PI[0]<F(1,10**80))
def trig(x,sine):
    # Taylor remainder: derivatives are bounded by one on the real axis.
    n=24;offset=1 if sine else 0
    p=sum((F((-1)**j)*x**(2*j+offset)/factorial(2*j+offset) for j in range(n+1)),F(0))
    degree=2*n+offset+2
    err=abs(x)**degree/factorial(degree)
    return p-err,p+err
def residual(x,a):return sub(scale(x,trig(x,True)),scale(a,trig(x,False)))
roots=[]
for row in reference['roots']:
    a=F(str(row['a']))
    if not a:
        ck('Uncoupled first root is exactly zero',row['roots'][0]['x']==0)
        continue
    x=brentq(lambda x:x*np.sin(x)-float(a)*np.cos(x),0,pi/2,xtol=5e-15)
    mid=F(floor(x*10**12),10**12);lo=mid-F(2,10**12);hi=mid+F(3,10**12)
    flo=residual(lo,a);fhi=residual(hi,a)
    ck(f'a={a}: rational bracket stays inside first monotone branch',0<lo<hi<PI[0]/2)
    ck(f'a={a}: exact Taylor bounds certify opposite residual signs',flo[1]<0<fhi[0])
    ck(f'a={a}: laboratory root lies inside certified bracket',lo<F(str(row['roots'][0]['x']))<hi)
    roots.append({'a':str(a),'x':pack((lo,hi)),'kR':pack(mul((lo,hi),inv(PI))),
                  'leftResidual':pack(flo),'rightResidual':pack(fhi)})

def exp_bounds(x,n=44):
    assert 0<=x<=2
    p=sum((x**j/F(factorial(j)) for j in range(n+1)),F(0))
    first=x**(n+1)/F(factorial(n+1));ratio=x/F(n+2)
    return p,p+first/(1-ratio)
E=exp_bounds(F(1));E2=exp_bounds(F(2));Em=inv(E);Em2=inv(E2)
A=sub(E2,point(1));C=sub(point(1),Em2)
b=mul(sub(E,point(1)),sub(E,point(1)))
d=mul(sub(point(1),Em),sub(E,point(1)))
D1=A;D2=sub(mul(A,A),scale(2,mul(b,b)))
D3=sub(sub(mul(mul(A,A),C),scale(2,mul(A,mul(d,d)))),scale(2,mul(C,mul(b,b))))
for i,D in enumerate([D1,D2,D3],1):ck(f'M=1 Gram leading principal minor {i} is rigorously positive',D[0]>0)
trace=add(scale(2,A),C)
lambda_lower=4*D3[0]/trace[1]**2
ck('A rigorous positive lower bound on the smallest Gram eigenvalue exceeds 0.1',lambda_lower>F(1,10))
angles=[0,pi/2,pi]
for row in reference['gram']:
    M=row['mass']
    G=np.array([[complex(1+np.cos(b-a),np.sin(b-a))*quad(lambda y:np.exp(M*(np.cos(a)+np.cos(b))*y),0,1,epsabs=1e-13)[0]*quad(lambda z:np.exp(M*(np.sin(a)+np.sin(b))*z),0,1,epsabs=1e-13)[0] for b in angles]for a in angles])
    eig=np.linalg.eigvalsh(G)
    ck(f'M={M}: independent quadrature/eigensolver agrees with laboratory',np.max(np.abs(eig-row['values']))<1e-11)
    if M==1:ck('Reported smallest eigenvalue respects certified lower bound',eig[0]>float(lambda_lower))

weights=[s for s in itertools.product([-1,1],repeat=10) if np.prod(s)==1]
ck('Positive half-spin representation has 512 weights',len(weights)==512)
coeff={}
for i in range(10):
    for j in range(i,10):
        c=F(sum(s[0]*s[1]*s[i]*s[j] for s in weights)*(1 if i==j else 2),4)
        ck(f'Exact degree-two polynomial coefficient ({i+1},{j+1})',c==(256 if (i,j)==(0,1) else 0))
        if c:coeff[f'h{i+1} h{j+1}']=str(c)
for row in reference['trace']:
    ck(f'Exact polynomial agrees with source probe {row["u"]},{row["v"]}',F(row['value']['n'],row['value']['d'])==256*row['u']*row['v'])
for s in [-1,1]:
    for n in range(3):ck(f's={s}, residue class n={n}: mod-six condition iff n=0 mod3',(n*(3+s)%6==0)==(n%3==0))
    ck(f's={s}: adding three families preserves the residue',3*(3+s)%6==0)
ck('Mixed assignments give a two-family counterexample to identical-assignment inference',(3-1)+(3+1)==6)
rates=[F(-2),F(-1),F(1),F(2)]
vandermonde=F(1)
for i in range(4):
    for j in range(i+1,4):vandermonde*=rates[j]-rates[i]
ck('Four-profile restriction has exact nonzero Vandermonde determinant 72',vandermonde==72)
certificate={'schema':'ghu-mathematical-video-certificates-v1','passed':True,'checkCount':len(checks),'checks':checks,
 'proofAssistantFormalization':False,
 'method':'Exact Fraction arithmetic; alternating arctangent series; Taylor derivative/remainder bounds; Sylvester criterion. Analytic implications are stated in proof notes, not mechanically formalized.',
 'pi':pack(PI),'rootCertificates':roots,'fourProfileVandermonde':str(vandermonde),
 'gram':{'M':1,'leadingPrincipalMinors':[pack(x) for x in [D1,D2,D3]],'lambdaMinLowerBound':str(lambda_lower),'lambdaMinLowerBoundDisplay':float(lambda_lower)},
 'trace':{'representation':'positive half-spin of Spin(20)','insertion':'s1 s2','degree':2,'nonzeroCoefficients':coeff,'all55CoefficientsChecked':True},
 'scope':'Certificates concern the specified examples. They do not certify admissibility of a full field-theory domain, global anomaly cancellation, a selected Higgs vacuum or Standard Model phenomenology.'}
if '--check' in sys.argv:
    saved=json.loads((ROOT/'certificates.json').read_text(encoding='utf-8'))
    if saved!=certificate:
        raise RuntimeError('Recomputed certificate differs from certificates.json')
else:
    (ROOT/'certificates.json').write_text(json.dumps(certificate,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':True,'checks':len(checks),'certifiedGramLambdaMinLowerBound':float(lambda_lower),'rootBrackets':len(roots)},indent=2))
