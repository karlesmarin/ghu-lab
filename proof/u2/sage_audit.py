"""Exact tests of full-subgroup matching and a source's U(2) example."""
from sage.all import QQ,ZZ,PolynomialRing,matrix,vector,prod
from sage.env import SAGE_VERSION
from pathlib import Path
import json,sys,hashlib
HERE=Path(__file__).resolve().parent
RO=sys.argv[1:]==['--check']; checks=[]
if sys.argv[1:] not in ([],['--check']): raise SystemExit('Use no args or --check')
if (HERE/'SEALED').exists() and not RO: raise SystemExit('Sealed')
def ck(name,ok):
    checks.append(dict(name=name,passed=bool(ok)))
    if not ok: raise AssertionError(name)
R=PolynomialRing(QQ,names='A,B,Y,D,lam,n,x1,x2,x3,x4,x5,u,v,p1,m1,m2,b0,b1')
A,B,Y,D,lam,n,x1,x2,x3,x4,x5,u,v,p1,m1,m2,b0,b1=R.gens()
P=A*(2*Y**2-A-3*B-lam); bA=A*(A+lam)/2
IL=QQ(8)/3*P-8*A*D; IU=-QQ(5)/3*P+8*A*D
arch=json.loads((HERE/'inputs/characters.json').read_text())
polys={k:R(z.replace('**','^')) for k,z in arch['polynomials'].items()}
roots={A:x1*x2,B:x3*x4+x3*x5+x4*x5,Y:-(x1+x2),D:-(u*u+v*v)}
su5={x5:-(x1+x2+x3+x4),p1:2*lam}
ck('Reconstruct full lower, upper and net from archived roots',all((polys[k]-f.subs(roots)).subs(su5)==0 for k,f in [('bulk_lower',IL),('total_upper',IU),('net',P)]))
# Genuine virtual H_SM representation. L=det(E3), det(E2)=L^-1.
rootY=-(x1+x2)
plus=[R(0),rootY]+[z-rootY for z in [x3,x4,x5]]+[x3,x4,x5]
minus=[x1+rootY,x2+rootY]+[a+z for a in [x1,x2] for z in [x3,x4,x5]]
moment=lambda k:sum(z**k for z in plus)-sum(z**k for z in minus)
F=(moment(4)/24-lam*moment(2)/24).subs(su5)
ck('One-family virtual bundle has rank zero and no degree-two Chern character',len(plus)==len(minus)==8 and moment(1).subs(su5)==0)
ck('Index density of a genuine SM virtual bundle equals P/3',F==P.subs(roots).subs(su5)/3)
ck('P splits into a universal shifted square and integral mixed products',P==-2*bA-3*A*B+2*A*Y**2)
# Spin eight-manifold S4 x S4; generators a,b in H4 have squares zero.
S=PolynomialRing(QQ,names='aa,bb');aa,bb=S.gens(); S8=S.quotient(S.ideal([aa**2,bb**2]));a8,b8=S8.gens()
rho=R.hom([a8,b8,0,0,0,0]+[0]*12,S8)
period=lambda f:QQ(rho(f).lift().monomial_coefficient(aa*bb))
ck('Mixed instanton spin background has odd net period',period(P)==-3 and period(P/2)==-QQ(3)/2 and period(bA)==0)
ck('Local periods are integer on this genuine SM background',period(IL)==-8 and period(IU)==5 and period(P/3)==-1)
TL=n*bA; TU=(2-n)*bA+3*A*B-2*A*Y**2
K=-IL-TL
ck('Asymmetric tensor allocation cancels both full-subgroup local polynomials',IL+K+TL==0 and IU-K+TU==0)
ck('Transfer is an integer sum of an index density and integral tensor classes',K==-8*(P/3)+8*A*D-n*bA)
ck('Equal half-net is different from the n=1 admissible-response allocation',(-P/2-bA)==QQ(3)/2*A*B-A*Y**2)
ck('All mixed terms survive in the n=0 transfer',K.subs({n:0})==QQ(16)/3*bA+8*A*B-QQ(16)/3*A*Y**2+8*A*D)
# Original hyperbolic candidate satisfies structural, not supergravity-spectrum, conditions.
U=matrix(ZZ,[[0,1],[1,0]]); grav=vector(ZZ,[0,2]); X=vector(R,[A,A+3*B+lam-2*Y**2])
ck('Hyperbolic net response and characteristic gravitational vector are compatible',
   (X*U*X)/2==-P and U.det()==-1 and all((U*grav)[i]%2==U[i,i]%2 for i in range(2)) and grav*U*grav==0)
# Parent mixed gravity polynomials, with hidden curvature zero.
M=matrix(QQ,[[-2,0],[0,-2],[1,1]]) # columns S_D6,S_D4 in basis A,B,Y^2
witness=vector(QQ,[1,1,2]); target=vector(QQ,[1,0,0])
ck('A is outside the restricted parent quadratic-invariant span',M.rank()==2 and M.augment(target.column()).rank()==3 and witness*M==vector(QQ,[0,0]) and witness*target==1)
ck('Whole displayed integer-allocation family fails this parent mixed-gravity gate',K.derivative(lam)==(QQ(8)/3-n/2)*A and QQ(16)/3 not in ZZ)
# SM cocharacters in the integral basis e_i-e_5, versus product-cover cocharacters.
L=matrix(ZZ,[[1,0,0,-3],[-1,0,0,-3],[0,1,0,2],[0,-1,1,2]])
smith,_,_=L.smith_form(); mu=vector(ZZ,[1,0,-1,0]); lift=L.solve_right(mu)
ck('SM product-cover cocharacters have index six in the quotient torus',abs(L.det())==6 and list(smith.diagonal())==[1,1,1,6])
ck('Explicit quotient cocharacter has no product lift',lift[-1]==-QQ(1)/6 and any(z.denominator()!=1 for z in lift))
mu5=list(mu)+[-sum(mu)]; AY=mu5[0]*mu5[1]; BY=sum(mu5[i]*mu5[j] for i,j in [(2,3),(2,4),(3,4)]); YY=sum(mu5[2:])
ck('Separate traceless Chern forms are fractional on the constructed quotient bundle',AY-QQ(YY**2)/4==-QQ(1)/4 and BY-QQ(YY**2)/3==-QQ(1)/3)
# U(2): eigenvalue cocharacters (m1,m2). Source's normalization is kept.
Q=b0*(m1-m2)**2/4+b1*(m1+m2)**2/8
diag=(2*b0+b1)/8; cross=(-2*b0+b1)/4
ck('U2 cocharacter condition depends on the combined quadratic form',Q==diag*(m1*m1+m2*m2)+cross*m1*m2)
ck('U2 fundamental c2 is a counterexample to separate factor divisibilities',Q.subs({b0:-1,b1:2})==m1*m2)
ck('Positive U2 example also passes the combined criterion',Q.subs({b0:1,b1:6})==m1*m1+m1*m2+m2*m2)
u2_b=matrix(ZZ,[[2,1],[1,2]])
ck('Positive U2 example has an even integral bilinear form on the full cocharacter lattice',u2_b.det()==3 and all(z in ZZ for z in u2_b.list()) and all(z%2==0 for z in u2_b.diagonal()))
ck('Separate source conditions reject that combined-integral example',1%4!=0 and 6%8!=0 and (2*1+6)%8==0)
result=dict(passed=True,count=len(checks),checks=checks,sage_version=SAGE_VERSION,
 full_polynomials=dict(net=str(P),lower=str(IL),upper=str(IU),bA=str(bA),tensor_lower=str(TL),tensor_upper=str(TU),transfer=str(K)),
 virtual_representation='1 + L + E3*L^-1 + E3 - E2*L - E2*E3; L=det(E3)',
 mixed_instanton_periods={k:str(period(f)) for k,f in [('net',P),('half_net',P/2),('lower',IL),('upper',IU),('one_family_index',P/3),('n0_transfer',K.subs({n:0}))]},
 parent_gate=dict(matrix=[list(map(str,row)) for row in M.rows()],left_annihilator=[1,1,2],scope='Displayed n*bA allocation family and ordinary parent-invariant Chern-Simons, not all possible tensor/WZ completions'),
 quotient=dict(index=6,nonlift_cocharacter=[1,0,-1,0,0],product_coordinates=list(map(str,lift))),
 u2_audit=dict(source_equations=['1711.04777v3 (3.31)','(3.32)','(3.34)'],combined_condition='b0 integral; b1+2*b0 divisible by 8 (scalar normalization); lattice-valued analogue componentwise',positive_example=[1,6],quadratic_form='m1^2+m1*m2+m2^2',c2_example=[-1,2],status='Explicit non-equivalence of the displayed factorwise conditions and the global combined criterion; not an anomaly-free supergravity spectrum'),
 scope='Full SM x USp4 polynomial matching and necessary quantization gates; no global orbifold action or bordism computation',
 input_sha256={row['local']:row['sha256'] for row in json.loads((HERE/'inputs.json').read_text())})
out=HERE/'checks.json'
if RO: assert json.loads(out.read_text())==result,'Saved results differ'
else: out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(passed=True,checks=len(checks),sage=SAGE_VERSION,read_only=RO)))
