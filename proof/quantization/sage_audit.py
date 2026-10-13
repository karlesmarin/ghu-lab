from sage.all import QQ, ZZ, PolynomialRing, matrix, vector
import json, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
checks=[]
def ck(name,ok):
    assert ok,name
    checks.append(dict(name=name,passed=True))
R=PolynomialRing(QQ,names='m,n,u,v');m,n,u,v=R.gens()
w=-m-n-u-v
A=m*n;B=u*v+u*w+v*w;C=(m+n)**2
mon=[m*m,m*n,m*u,m*v,n*n,n*u,n*v,u*u,u*v,v*v]
coef=lambda f: vector(QQ,[f.monomial_coefficient(z) for z in mon])
actions=[{m:n,n:m},{u:v,v:u},{v:w}]
constraints=matrix(QQ,[list(coef(z.subs(action)-z)) for action in actions for z in mon])
# Each block above lists basis images by ROW. Transpose each block to act on coefficients.
M=matrix(QQ,30,10)
for j,action in enumerate(actions):
    block=matrix(QQ,[list(coef(z.subs(action)-z)) for z in mon]).transpose()
    M[10*j:10*(j+1),:]=block
basis=matrix(QQ,[coef(A),coef(B),coef(C)]).transpose()
ck('Weyl invariant quadratic space has dimension three',M.rank()==7)
ck('A B and Y squared span precisely that invariant space',basis.rank()==3 and M*basis==0)
samples=[{m:1,n:-1,u:0,v:0},{m:0,n:0,u:1,v:-1},{m:1,n:0,u:-1,v:0}]
E=matrix(QQ,[[f.subs(s) for f in [A,B,C]] for s in samples])
ck('Three cocharacters detect all integral coefficients',E==matrix(QQ,[[-1,0,0],[0,-1,0],[0,0,1]]) and abs(E.det())==1)
P=PolynomialRing(QQ,names='aa,bb,cc,alpha,beta,gamma,lam,p,q,r,s,t')
aa,bb,cc,alpha,beta,gamma,lam,p,q,r,s,t=P.gens()
ck('Traceless expression becomes a joint integral-basis expression',
   alpha*(aa-cc/4)+beta*(bb-cc/3)+gamma*cc==alpha*aa+beta*bb+(gamma-alpha/4-beta/3)*cc)
ck('Fractional factor contributions admit the genuine class A+B',
   (alpha*(aa-cc/4)+beta*(bb-cc/3)+gamma*cc).subs({alpha:1,beta:1,gamma:QQ(7)/12})==aa+bb)
N=matrix(QQ,[[-2,0],[0,-2],[1,1]]);L=vector(QQ,[1,1,2])
ck('Parent image has exactly one linear obstruction',N.rank()==2 and L*N==vector(QQ,[0,0]))
K=vector(P,[QQ(8)/3-p/2,-q/2,-r/2])
ck('Arbitrary integral tensor pairings retain a thirds obstruction',
   6*(L*K)==16-3*p-3*q-6*r and ZZ(16)%3==1)
ck('Formal fractional pairing would solve only by violating the integer assumption',
   (L*K).subs({p:QQ(16)/3,q:0,r:0})==0 and QQ(16)/3 not in ZZ)
out=dict(passed=True,count=len(checks),checks=checks,
  scope='Exact invariant-space and conditional obstruction calculations; not an orbifold classification')
if sys.argv[1:]==['--check']: assert json.loads((HERE/'sage_checks.json').read_text())==out
elif not sys.argv[1:]: (HERE/'sage_checks.json').write_text(json.dumps(out,indent=2)+'\n')
else: raise SystemExit('Use --check or no arguments')
print(json.dumps(dict(passed=True,checks=len(checks))))
