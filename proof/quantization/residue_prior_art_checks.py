from sage.all import QQ, ZZ, CyclotomicField, matrix, vector, gcd
import json
# Published Eq C.1-C.5, hep-th/0612212v2. Exact finite checks, not a universal proof.
cases=0
for n in range(2,33):
    K=CyclotomicField(2*n)
    z=K.gen()
    for j in range(n):
        result=sum(2*z**((2*j+1)*k)/(z**k-z**(-k)) for k in range(1,n))
        assert result==n-2*j-1,(n,j,result)
        cases+=1
# Translate inherited isolated SU(2) coefficients into Eq 2.36, Lee-Tachikawa.
bcoeff=[-QQ(16)/3,QQ(10)/3]
ns=[12*x for x in bcoeff]
assert ns==[-64,40] and sum(ns)==-24
mods=[ZZ(x)%12 for x in ns]
assert mods==[8,4] and all(12//gcd(x,12)==3 for x in mods)
R=matrix(QQ,[[-2,0],[0,-2],[1,1]])
ell=vector(QQ,[1,1,2])
assert ell*R==vector(QQ,[0,0]) and R.rank()==2
v=vector(QQ,[QQ(8)/3,0,0])
phi=2*ell.dot_product(v)
assert phi-phi.floor()==QQ(1)/3
print(json.dumps(dict(passed=True,sage_exact_cyclotomic_cases=cases,n_values=[int(x) for x in ns],residues_mod12=[int(x) for x in mods],parent_annihilator_checked=True,projected_class='1/3 mod Z',scope='Exact finite validation of published identity and model-to-literature arithmetic; no novelty or physical-completion certification')))
