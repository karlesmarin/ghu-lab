"""Refine a saved PhaseTracer curve for integrated nucleation and percolation.

Run in the pinned scientific image with this tree mounted at /work. This adds
coarse and doubled-cutoff actions on the same temperature grid; original results
and parameters are retained. No wall velocity is inferred by this calculation.
"""
import argparse, json, math, os, subprocess, tempfile
from pathlib import Path
import numpy as np
from scipy.optimize import brentq
from thermal_run import coefficients, minima, value

def refine(source,destination):
    record=json.loads(Path(source).read_text());p=record['parameters']
    assert record['experiment']=='thermal' and record['nucleation']
    executable=Path(os.environ.get('GHU_THERMAL_BOUNCE','/opt/adapter/thermal_bounce'))
    tn=record['nucleation']['RT'];cache={}
    with tempfile.TemporaryDirectory() as tmp:
        def action(t,mult=1):
            key=(float(t),mult)
            if key in cache:return cache[key]
            c=coefficients(p,t,mult);ms=minima(c)
            if not ms or ms[0]['a']<=0 or ms[0]['v']>=0 or value(c,0,2)<=0:
                raise ValueError('Temperature outside the metastable transition branch')
            path=Path(tmp)/'coefficients.txt'
            path.write_text(f"{p['invRGeV']} {p['g4']} {t*p['invRGeV']} {len(c[0])}\n"+'\n'.join(f'{a:.17g} {b:.17g}' for a,b in zip(c[1],c[2])))
            proc=subprocess.run([str(executable),str(path),str(ms[0]['a']),'0.00002'],capture_output=True,text=True,timeout=120,check=True)
            s=float(next(line.split()[1] for line in proc.stdout.splitlines() if line.startswith('GHU_ACTION ')))
            if not math.isfinite(s) or s<=0:raise ValueError('Invalid bounce action')
            cache[key]=dict(RT=float(t),S3overT=s,alpha=ms[0]['a']);return cache[key]
        # Find endpoints on the first cooling crossing, using the archived bracketing samples.
        prior=sorted({s['RT']:s for s in record['samples']}.values(),key=lambda s:s['RT'])
        low_action=max(70,min(s['S3overT'] for s in prior)*1.05)
        low=max(s['RT'] for s in prior if s['RT']<tn and s['S3overT']<low_action)
        high=min(s['RT'] for s in prior if s['RT']>tn and s['S3overT']>210)
        # Uniform in temperature over the transition window; both cutoffs use identical knots.
        grid=sorted(set(np.linspace(low,high,81).tolist()+[tn]))
        samples=[]
        for i,t in enumerate(grid):
            coarse=action(t);fine=action(t,2);four=action(t,4);eight=action(t,8)
            samples.append({**coarse,'fineS3overT':fine['S3overT'],'fineAlpha':fine['alpha'],
                'fourfoldS3overT':four['S3overT'],'eightfoldS3overT':eight['S3overT']})
            if i%10==0:print(f'{i+1}/{len(grid)} RT={t:.9g} actions={coarse["S3overT"]:.6g}/{fine["S3overT"]:.6g}',flush=True)
    record['historySamples']=samples
    record['historyPrecision']={'spatialCutoffs':[p['windings']*i for i in [1,2,4,8]],
        'thermalCutoffs':[p['thermalTerms']*i for i in [1,2,4,8]], 'shootingTolerance':.00002,
        'sampling':'81 equally spaced temperatures plus the proxy crossing; no action extrapolation',
        'scope':'Cutoff comparison is a convergence diagnostic, not a rigorous error enclosure.'}
    Path(destination).write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
    print('Saved',destination,flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source');parser.add_argument('destination');args=parser.parse_args()
    refine(args.source,args.destination)
