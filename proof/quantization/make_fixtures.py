from sage.all import QQ
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent
weights=[[1,-1,0,0,0],[0,0,1,-1,0],[1,0,-1,0,0],[2,-1,1,-3,1],[-2,3,1,-1,-1]]
def period(alpha,beta,gamma,root):
    m,n,u,v,w=map(QQ,root)
    su2=-(m-n)**2/4
    su3=-(u*u+v*v+w*w-(u+v+w)**2/3)/2
    return alpha*su2+beta*su3+gamma*(u+v+w)**2
cases=[]
for a in [-1,0,1]:
 for b in [-1,0,1]:
  for c in [-1,0,1]:
   for change in [QQ(0),QQ(1)/36,QQ(1)/2]:
    aa=QQ(a);bb=QQ(b);gg=QQ(c)+aa/4+bb/3+change
    vals=[period(aa,bb,gg,root) for root in weights]
    cases.append(dict(coefficients=dict(alpha=str(aa),beta=str(bb),gamma=str(gg)),
      status='passes' if all(z.denominator()==1 for z in vals[:3]) else 'fails',
      periods=[str(z) for z in vals]))
out=dict(method='Direct centered root traces, independent of JS change-of-basis implementation',weights=weights,cases=cases)
(HERE/'sage_fixtures.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(cases=len(cases),passes=sum(c['status']=='passes' for c in cases))))
