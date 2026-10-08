"""Independent NumPy/SciPy potential plus real PhaseTracer O(3) bounce.
Run in the pinned Docker image; accepts a laboratory JSON export and output path.
Uses the fixed S3/T=140 radiation-era proxy, not a percolation calculation.
"""
import argparse, json, math, hashlib, subprocess, tempfile
from pathlib import Path
import numpy as np
from scipy.optimize import brentq
DEFAULTS=dict(nfPlus=3,nfMinus=0,adjPlus=0,adjMinus=0,scalarPlus=0,scalarMinus=0,invRGeV=1000,g4=3,RT=.093,windings=100,thermalTerms=120)
KEYS=list(DEFAULTS)
def coefficients(p,t,mult=1):
    n=np.arange(1,int(p['windings'])*mult+1,dtype=float)
    wb=n**-5;wf=wb.copy()
    if t>0:
        ell=np.arange(1,int(p['thermalTerms'])*mult+1)
        s=(n[:,None]**2+(ell[None,:]/(2*np.pi*t))**2)**-2.5
        wb=wb+2*s.sum(axis=1);wf=wf+2*(s*(-1.)**ell).sum(axis=1)
    parity=(-1.)**n
    return n,(-6-2*p['scalarPlus']-2*p['scalarMinus']*parity)*wb+(4*p['nfPlus']+8*p['adjPlus']+(4*p['nfMinus']+8*p['adjMinus'])*parity)*wf,-3*wb+(4*p['adjPlus']+4*p['adjMinus']*parity)*wf
def value(c,a,d=0):
    n,c1,c2=c;w=np.pi*n
    if d==0:return float(np.sum(-2*c1*np.sin(w*a/2)**2-2*c2*np.sin(w*a)**2))
    if d==1:return float(np.sum(-w*c1*np.sin(w*a)-2*w*c2*np.sin(2*w*a)))
    return float(np.sum(-w*w*c1*np.cos(w*a)-4*w*w*c2*np.cos(2*w*a)))
def minima(c):
    roots=[a for a in [0.,1.] if value(c,a,2)>0]
    grid=np.linspace(1e-8,1-1e-8,501);der=[value(c,a,1) for a in grid]
    for a,b,da,db in zip(grid[:-1],grid[1:],der[:-1],der[1:]):
        if da<0<db:roots.append(brentq(lambda x:value(c,x,1),a,b,xtol=1e-13))
    return sorted([dict(a=a,v=value(c,a),curvature=value(c,a,2)) for a in roots],key=lambda m:m['v'])
def run(p,out):
    if set(p)!=set(KEYS):raise ValueError('Unexpected or missing thermal parameter')
    for key in KEYS:
        if key not in p or not math.isfinite(p[key]):raise ValueError('Missing/nonfinite '+key)
    if not (20<=p['windings']<=300 and 20<=p['thermalTerms']<=400 and .3<=p['g4']<=6 and 100<=p['invRGeV']<=1e6):raise ValueError('Controls outside laboratory domain')
    if not(0<=p['RT']<=.6) or any(p[k]!=int(p[k]) for k in ['windings','thermalTerms']):raise ValueError('Invalid temperature or non-integer cutoff')
    for k in KEYS[:6]:
        if not(0<=p[k]<=20 and p[k]==int(p[k])):raise ValueError('Invalid matter multiplicity')
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    samples=[];cache={}
    with tempfile.TemporaryDirectory() as tmp:
        def action(rt,mult=1,tol=1e-4,profile=None):
            key=(round(rt,13),mult,tol)
            if key in cache and profile is None:return cache[key]
            c=coefficients(p,rt,mult);mins=minima(c);broken=[m for m in mins if m['a']>1e-6 and m['v']<0]
            if not broken or value(c,0,2)<=0:raise ValueError('No metastable origin / lower broken minimum')
            path=Path(tmp)/'coeff.txt';path.write_text(f"{p['invRGeV']} {p['g4']} {rt*p['invRGeV']} {len(c[0])}\n"+'\n'.join(f'{a:.17g} {b:.17g}' for a,b in zip(c[1],c[2])))
            cmd=[str(Path(__file__).with_name('thermal_bounce')),str(path),str(broken[0]['a']),str(tol)]
            if profile:cmd.append(str(profile))
            proc=subprocess.run(cmd,text=True,capture_output=True,timeout=120)
            if proc.returncode:raise RuntimeError(proc.stderr[-1800:])
            lines=[line for line in proc.stdout.splitlines() if line.startswith('GHU_ACTION ')]
            s=float(lines[-1].split()[1]);cache[key]=s
            if mult==1 and tol==1e-4:samples.append(dict(RT=rt,S3overT=s,alpha=broken[0]['a']))
            return s
        points=[];failures=[]
        # Scan the entire browser range. Only certify a bracket with both computed actions.
        critical_window=[]
        # Additional fine grid resolves narrow supercooling windows, particularly case 2.
        for rt in np.linspace(.018,.028,61):critical_window.append(float(rt))
        for rt in sorted(set(np.geomspace(.001,.6,65).tolist()+critical_window)):
            try:
                s=action(float(rt));points.append((float(rt),s))
            except (ValueError,RuntimeError,subprocess.TimeoutExpired) as e:failures.append(dict(RT=float(rt),reason=str(e)))
        brackets=[(a,b) for (a,sa),(b,sb) in zip(points[:-1],points[1:]) if sa<140<sb and b/a<1.12]
        result=dict(schema='ghu-external-result-v1',experiment='thermal',parameters=p,backend=json.loads(Path('/opt/ghu-tool-versions.json').read_text()),samples=samples,failures=failures,nucleation=None,gravitationalWaves=None)
        if brackets:
            lo,hi=brackets[-1];tn=brentq(lambda t:action(t)-140,lo,hi,xtol=1e-7)
            s=action(tn,profile=out.with_suffix('.profile.csv'));fine=action(tn,2,2e-5)
            dt=tn*1e-3;beta=tn*(action(tn+dt)-action(tn-dt))/(2*dt)
            c=coefficients(p,tn);m=minima(c)[0];C=3*p['invRGeV']**4/(64*np.pi**6)
            v=m['v'];dv=(value(coefficients(p,tn+dt),m['a'])-value(coefficients(p,tn-dt),m['a']))/(2*dt)
            alpha=C*(-v+tn*dv/4)/(np.pi**2/30*106.75*(tn*p['invRGeV'])**4)
            result['nucleation']=dict(RT=tn,temperatureGeV=tn*p['invRGeV'],S3overT=s,alpha=m['a'],betaOverH=beta,traceAnomalyStrength=alpha,gStar=106.75,doubledCutoffTighterToleranceS3overT=fine,relativeActionShift=(fine-s)/s,criterion='O(3) S3/T=140 proxy; radiation domination, not an integrated nucleation/percolation condition')
        result['samples']=sorted(samples,key=lambda s:s['RT'])
        result['scope']='One-loop flat SU(3), canonical phi=alpha/(g4 R), no daisy resummation, no percolation or wall-speed prediction; GW not evaluated.'
        out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
        print(json.dumps(result['nucleation']))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('input');parser.add_argument('output');args=parser.parse_args()
    obj=json.loads(Path(args.input).read_text());run(obj.get('parameters',obj),args.output)
