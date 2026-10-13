from fractions import Fraction as F
from pathlib import Path
import json,sys
HERE=Path(__file__).resolve().parent
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(dict(name=name,passed=True))
# All fermions written left handed. Y has conventional Q=T3+Y normalization.
fields=[('Q',6,F(1,6),F(1,3)),('uc',3,F(-2,3),F(-1,3)),
        ('dc',3,F(1,3),F(-1,3)),('L',2,F(-1,2),F(-1)),
        ('ec',1,F(1),F(1)),('nuc',1,F(0),F(1))]
rows=[dict(name=n,multiplicity=m,Y=str(y),B_minus_L=str(b),X=int(5*b-4*y)) for n,m,y,b in fields]
check('X=5(B-L)-4Y is integral for each left-handed SM-plus-neutrino multiplet',
      all((5*b-4*y).denominator==1 for _,_,y,b in fields))
check('Every listed left-handed Weyl component has X=1 modulo 4',all(r['X']%4==1 for r in rows))
def sums(rs):return dict(weyl=sum(r['multiplicity'] for r in rs),
                        linear=sum(r['multiplicity']*r['X'] for r in rs),
                        cubic=sum(r['multiplicity']*r['X']**3 for r in rs))
sm=sums(rows[:-1]); extended=sums(rows)
check('SM without nuc: 15 Weyls, sum X=-5, sum X^3=-125',sm==dict(weyl=15,linear=-5,cubic=-125))
check('Adding nuc: 16 Weyls and zero linear/cubic X sums',extended==dict(weyl=16,linear=0,cubic=0))
check('Majorana bilinear nuc nuc breaks this Z4 charge assignment',2*rows[-1]['X']%4==2)
# Section 5.1: exact Dynkin indices and the spin U(2) charge-isospin condition.
ucount=0
for dim in range(1,13):
    T=F(dim*(dim*dim-1),6)
    for charge in range(-11,12):
        if charge%2!=(dim-1)%2:continue
        cub=dim*charge**3; mix=T*charge; grav=dim*charge
        coordinates=[F(cub-4*grav+6*mix,48),mix,F(grav,2)]
        assert all(c.denominator==1 for c in coordinates)
        assert int(mix)%2==int(dim%4==2)
        ucount+=1
check('U(2) anomaly-basis coordinates and SU(2) pullback parity on representation sample',ucount>0)
# Compare Eq. 7.19 with the sentence after Eq. 7.22 in arXiv v3.
def mu19(k,r,s):return 2*(k*k+k+2)*r+F(k*k-4,12)*s
check('Eq7.19 specializes to coefficient 44, not 22, at k=4',mu19(4,1,0)==44)
witnesses=[]
for charge in [1,3,5,-1]:
    r=F(charge**3-charge,24);assert r.denominator==1
    direct=F(22*charge**3-10*charge,12)
    general=mu19(4,r,charge)
    printed=22*r+charge
    assert direct==general and general.denominator==1
    expected=1 if charge%4==1 else 15
    assert general%16==expected
    witnesses.append(dict(charge=charge,r=int(r),eq719_mod16=int(general%16),printed22_mod16=int(printed%16),expected_mod16=expected))
check('Q=3: general formula gives 15 mod16; printed 22r+s gives 9',witnesses[1]['eq719_mod16']==15 and witnesses[1]['printed22_mod16']==9)
check('Q=1 and Q=5 agree under the general formula but not the printed specialization',
      witnesses[0]['eq719_mod16']==witnesses[2]['eq719_mod16'] and witnesses[0]['printed22_mod16']!=witnesses[2]['printed22_mod16'])
# For canonical representatives +-1, r=0 and the final counting condition is unaffected.
check('The printed and general specializations agree for canonical representatives +-1',
      all(w['eq719_mod16']==w['printed22_mod16'] for w in [witnesses[0],witnesses[3]]))
result=dict(passed=True,count=len(checks),checks=checks,u2_representation_cases=ucount,
            neutrino_charge_rows=rows,without_neutrino=sm,with_neutrino=extended,
            specialization_witnesses=witnesses,
            scope='Exact rational arithmetic; does not prove bordism groups, eta invariants, physical applicability or scientific novelty',
            source='https://arxiv.org/abs/2011.10102v3',source_pages=[22,23,37,38],
            published_version_status='Publisher direct access denied; no published-version confirmation for the discrepancy')
out=HERE/'literature_checks.json'
if sys.argv[1:]==['--check']:assert json.loads(out.read_text())==result
elif not sys.argv[1:]:out.write_text(json.dumps(result,indent=2)+'\n')
else:raise SystemExit('Use no arguments or --check')
print(json.dumps(dict(passed=True,checks=len(checks),u2_cases=ucount)))
