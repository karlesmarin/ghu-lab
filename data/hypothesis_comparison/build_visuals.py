"""Regenerate the integrated plot data; --check compares without overwriting. No prototype dependencies."""
from pathlib import Path
import json, hashlib, html
import numpy as np
import ghu_potential as g
import sys
HERE=Path(__file__).resolve().parent
raw=json.loads((HERE/'ghu_potential_results.json').read_text(encoding='utf-8'))
rows=[dict(id=i+1,nf=r['nf'],nv=r['nv'],cv=r['cv'],cf=r['recalibrated_parameters'][0],mv=r['recalibrated_parameters'][1],l3=r['recalibrated']['lambda3'],l4=r['recalibrated']['lambda4'],p3=r['published_couplings'][0],p4=r['published_couplings'][1]) for i,r in enumerate(raw['rows'])]
payload=dict(schema='ghu-linked-view-v1',origin='theoretical_reconstruction',reference_case=1,rows=rows,source_sha256=hashlib.sha256((HERE/'ghu_potential_results.json').read_bytes()).hexdigest())
q,w=g.grid(96)
curves={}
for scope,theta in [('local',np.linspace(.06,.14,161)),('global',np.linspace(0,np.pi,241))]:
    values=[]
    for r in raw['rows']:
        coeff=g.coefficients(q,r['nf'],r['nv'],r['cv'],*r['recalibrated_parameters'])
        v=[sum(mult*np.dot(w*q**3,np.log1p(Q*np.cos(n*t))-np.log1p(Q*np.cos(n*g.THETA))) for mult,n,Q in coeff)*g.PREF/(g.MH**2*g.FH**2) for t in theta]
        values.append(v)
    curves[scope]=dict(theta=theta.tolist(),delta=[(np.array(v)-values[0]).tolist() for v in values])
payload['potential']=curves
payload['potential_convention']='[(Vi(theta)-Vi(thetaH))-(V1(theta)-V1(thetaH))]/(mH^2 fH^2); same ghu_potential.py, 96-node segment quadrature; no interpolation between cases'
payload['potential_engine_sha256']=hashlib.sha256((HERE/'ghu_potential.py').read_bytes()).hexdigest()
checks=[]
def check(name,condition,witness=None):
    checks.append(dict(name=name,passed=bool(condition),witness=witness))
    assert condition,name
legacy=np.loadtxt(HERE/'potential_curves.csv',delimiter=',',skiprows=1)
check('Shared angular grid matches archived calculation',np.allclose(legacy[::5,0],curves['global']['theta'][::4],rtol=0,atol=1e-14))
for scope,c in curves.items():
    check(scope+' finite curves',np.isfinite(c['delta']).all())
    check(scope+' reference zero',np.count_nonzero(c['delta'][0])==0)
for i in range(9):
    expected=(legacy[::5,i+1]-legacy[::5,1])/(g.MH**2*g.FH**2)
    error=float(np.max(np.abs(np.array(curves['global']['delta'][i])[::4]-expected)))
    check('Case '+str(i+1)+' matches archived potential differences',error<1e-8,error)
check('All local curves vanish at the fixed vacuum',np.max(np.abs(np.array(curves['local']['delta'])[:,80]))<1e-12)
validation=dict(passed=True,count=len(checks),checks=checks,scope='Plot data consistency with archived numerical calculations; not independent physical validation.')
for name,value in [('visual_data_validation.json',validation),('visual_data.json',payload)]:
    if '--check' in sys.argv:
        assert json.loads((HERE/name).read_text(encoding='utf-8'))==value,name+' differs from replay'
    else:
        (HERE/name).write_text(json.dumps(value,indent=2),encoding='utf-8')
print(json.dumps(dict(passed=True,rows=len(rows),checks=len(checks),check_only='--check' in sys.argv)))
