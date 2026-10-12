"""Independent SciPy/NumPy/Fraction controls for boundary_research.mjs.
Run from the laboratory root: python tools/boundary_research_reference.py
"""
from pathlib import Path
from itertools import product
from fractions import Fraction
import json,math
import numpy as np
from scipy.optimize import brentq
from scipy.integrate import quad
ROOT=Path(__file__).resolve().parents[1]
robin=[]
for a in [0,.001,1,10,100]:
    roots=[]
    for j in range(6):
        x=j*math.pi if a==0 else brentq(lambda x:x*math.sin(x)-a*math.cos(x),j*math.pi,(j+.5)*math.pi,xtol=1e-14)
        roots.append(x)
    robin.append(dict(strength=a,x=roots))
grams=[]
angles=[0,math.pi/2,math.pi]
for mass in [0,.3,1,2]:
    matrix=np.empty((3,3),dtype=complex)
    for i,a in enumerate(angles):
        for j,b in enumerate(angles):
            v=quad(lambda y:math.exp(mass*(math.cos(a)+math.cos(b))*y),0,1)[0]*quad(lambda y:math.exp(mass*(math.sin(a)+math.sin(b))*y),0,1)[0]
            matrix[i,j]=(1+np.exp(1j*(b-a)))*v
    grams.append(dict(mass=mass,values=np.linalg.eigvalsh(matrix).tolist()))
moments=[]
for rank in [4,6,10]:
    cartan=[(i*3%7)-3 for i in range(rank)]
    for mask in [0,3,(1<<rank)-1]:
        for half in [-1,1]:
            values=[]
            for d in range(5):
                total=Fraction(0)
                for signs in product([-1,1],repeat=rank):
                    if math.prod(signs)!=half:continue
                    ins=math.prod(signs[i] for i in range(rank) if mask&(1<<i))
                    total+=ins*Fraction(sum(a*b for a,b in zip(signs,cartan)),2)**d
                values.append([total.numerator,total.denominator])
            moments.append(dict(rank=rank,mask=mask,halfSpin=half,cartan=cartan,values=values))
data=dict(schema='ghu-boundary-reference-v1',method='SciPy brentq; quadrature of profiles and NumPy eigvalsh; exact Fraction sums over product weights',robin=robin,grams=grams,moments=moments)
(ROOT/'data/boundary_research_reference.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
print('Saved independent Robin, Gram and twisted-character references')
