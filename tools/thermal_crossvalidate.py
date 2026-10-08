"""Compare matched O(3) bounces, not different potentials or physical models.

Model: Hirose and Shibuya, arXiv:2303.14192. CosmoTransitions: C. L.
Wainwright, arXiv:1109.4189. PhaseTracer2: P. Athron et al., arXiv:2412.04881.
The solvers share shooting-method ancestry. This is a numerical cross-check,
not an interval proof. All action crossings use the S3/T=140 proxy.
"""
import argparse
import hashlib
import importlib.metadata
import json
import math
import platform
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import scipy
from scipy.integrate import simpson
from scipy.optimize import brentq
from cosmoTransitions.tunneling1D import SingleFieldInstanton
import cosmoTransitions.tunneling1D as ct_module
from thermal_run import coefficients, minima, value

ROOT = Path(__file__).resolve().parents[1]
BOUNCE = Path('/opt/adapter/thermal_bounce')
TOLERANCES = (2e-5, 2e-6)
# Declared comparison targets, not statistical confidence levels or error bounds.
TARGETS = dict(actionRelative=0.01, crossingRelative=0.001,
               toleranceShiftRelative=0.002, virialRelative=0.005)

def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()

class CanonicalPotential:
    def __init__(self, parameters, rt, mult):
        self.p = parameters
        self.c = coefficients(parameters, rt, mult)
        self.scale = 3*parameters['invRGeV']**4/(64*np.pi**6)
        self.jacobian = parameters['g4']/parameters['invRGeV']
        ms = minima(self.c)
        if not ms or ms[0]['a'] <= 0 or ms[0]['v'] >= 0 or value(self.c, 0, 2) <= 0:
            raise ValueError('No lower broken minimum and metastable origin')
        self.alpha = ms[0]['a']
        self.true_phi = self.alpha/self.jacobian

    def evaluate(self, phi, derivative=0):
        phi = np.asarray(phi)
        n,c1,c2 = self.c
        w = np.pi*n
        angle = np.expand_dims(phi*self.jacobian, -1)*w
        if derivative == 0:
            raw = -2*c1*np.sin(angle/2)**2 - 2*c2*np.sin(angle)**2
        elif derivative == 1:
            raw = -w*c1*np.sin(angle) - 2*w*c2*np.sin(2*angle)
        elif derivative == 2:
            raw = -w*w*c1*np.cos(angle) - 4*w*w*c2*np.cos(2*angle)
        else:
            raise ValueError('Derivative order must be 0, 1 or 2')
        return np.sum(raw, axis=-1)*self.scale*self.jacobian**derivative

    def V(self, phi): return self.evaluate(phi,0)
    def dV(self, phi): return self.evaluate(phi,1)
    def d2V(self, phi): return self.evaluate(phi,2)

def canonical_checks(pot):
    checks = []
    for a in [0.,pot.alpha*.23,pot.alpha*.61,pot.alpha]:
        phi = a/pot.jacobian
        for order in [0,1,2]:
            expected = value(pot.c,a,order)*pot.scale*pot.jacobian**order
            got = float(pot.evaluate(phi,order))
            # Near a stationary point the derivative cancels. Scale roundoff by
            # the absolute term sum, not by that nearly zero final derivative.
            n,c1,c2=pot.c
            norm=pot.scale*pot.jacobian**order*np.sum((np.pi*n)**order*(abs(c1)+2**order*abs(c2)))
            checks.append(abs(got-expected) <= 128*np.finfo(float).eps*max(1,norm)+2e-11*abs(expected))
    # Finite differences probe the chain-rule powers independently.
    x=pot.true_phi*.41; h=pot.true_phi*1e-4
    first=(pot.V(x-2*h)-8*pot.V(x-h)+8*pot.V(x+h)-pot.V(x+2*h))/(12*h)
    second=(-pot.V(x+2*h)+16*pot.V(x+h)-30*pot.V(x)+16*pot.V(x-h)-pot.V(x-2*h))/(12*h*h)
    checks += [abs(first-pot.dV(x)) < 1e-7*max(1,abs(pot.dV(x))),
               abs(second-pot.d2V(x)) < 1e-5*max(1,abs(pot.d2V(x)))]
    if not all(checks):
        raise AssertionError(f'Canonical check failed: checks={checks}; first FD={first}, analytic={pot.dV(x)}; second FD={second}, analytic={pot.d2V(x)}; alpha={pot.alpha}; cutoffs={len(pot.c[0])}')
    return len(checks)

def cosmo_action(pot,rt,tolerance,npoints=2000):
    instanton = SingleFieldInstanton(pot.true_phi,0.,pot.V,pot.dV,pot.d2V,alpha=2)
    profile = instanton.findProfile(xtol=tolerance,phitol=tolerance,npoints=npoints)
    if profile.Rerr is not None: raise RuntimeError('CosmoTransitions profile integration hit drmin')
    s3 = float(instanton.findAction(profile))
    r,phi,dphi = profile.R,profile.Phi,profile.dPhi
    kinetic = 4*np.pi*simpson(.5*dphi**2*r**2,x=r)
    potential = 4*np.pi*simpson((pot.V(phi)-pot.V(0))*r**2,x=r)
    potential += 4*np.pi/3*r[0]**3*(pot.V(phi[0])-pot.V(0))
    result = dict(S3overT=s3/(rt*pot.p['invRGeV']),
                  virialRelative=float(abs(kinetic+3*potential)/abs(kinetic)),
                  actionIntegralRelative=float(abs(s3-kinetic-potential)/s3),
                  falseVacuumEndpointRelative=float(abs(phi[-1])/pot.true_phi),
                  profilePoints=len(r), npoints=npoints)
    if not math.isfinite(result['S3overT']) or result['S3overT'] <= 0:
        raise ValueError('Invalid CosmoTransitions action')
    return result

def phase_action(pot,rt,tolerance,directory):
    source=Path(directory)/'potential.txt'
    source.write_text(f"{pot.p['invRGeV']} {pot.p['g4']} {rt*pot.p['invRGeV']} {len(pot.c[0])}\n"+
                      '\n'.join(f'{a:.17g} {b:.17g}' for a,b in zip(pot.c[1],pot.c[2])))
    proc=subprocess.run([str(BOUNCE),str(source),str(pot.alpha),str(tolerance)],
                        capture_output=True,text=True,timeout=120,check=True)
    s=float(next(line.split()[1] for line in proc.stdout.splitlines() if line.startswith('GHU_ACTION ')))
    if not math.isfinite(s) or s<=0: raise ValueError('Invalid PhaseTracer action')
    return dict(S3overT=s)

def run_case(case,pilot=False):
    source=ROOT/f'data/thermal_history_case{case}.json'
    old=json.loads(source.read_text());p=old['parameters'];history=old['historySamples']
    cache={};checks=0
    with tempfile.TemporaryDirectory() as temp:
        def evaluate(rt,mult=8,tolerance=TOLERANCES[0],engine='cosmo',npoints=2000):
            nonlocal checks
            key=(float(rt),mult,tolerance,engine,npoints)
            if key not in cache:
                pot=CanonicalPotential(p,rt,mult)
                checks+=canonical_checks(pot)
                result=cosmo_action(pot,rt,tolerance,npoints) if engine=='cosmo' else phase_action(pot,rt,tolerance,temp)
                cache[key]={**result,'alpha':pot.alpha}
            return cache[key]
        indices=[40] if pilot else [0,10,20,30,40,50,60,70,81]
        rows=[]
        for index in indices:
            rt=history[index]['RT'];mult=1 if pilot else 8
            pt=evaluate(rt,mult,engine='phase');ct=evaluate(rt,mult)
            pt_tight=evaluate(rt,mult,TOLERANCES[1],'phase')
            ct_tight=evaluate(rt,mult,TOLERANCES[1])
            relative=(ct_tight['S3overT']/pt_tight['S3overT']-1)
            rows.append(dict(RT=rt,temperatureGeV=rt*p['invRGeV'],multiplier=mult,
                             phaseTracer=pt,cosmoTransitions=ct,phaseTracerTight=pt_tight,
                             cosmoTransitionsTight=ct_tight,relativeDifference=relative,
                             phaseToleranceShift=pt_tight['S3overT']/pt['S3overT']-1,
                             cosmoToleranceShift=ct_tight['S3overT']/ct['S3overT']-1,
                             archivedPhaseTracer=history[index]['eightfoldS3overT' if mult==8 else 'S3overT']))
            print(f'case {case} RT={rt:.10g}: PT={pt_tight["S3overT"]:.8g}, CT={ct_tight["S3overT"]:.8g}, difference={100*relative:.5g}%',flush=True)
        crossings=[]
        if not pilot:
            for mult in [1,2,4,8]:
                points={}
                # Both engines solve the same mathematical proxy; no interpolation of actions.
                for engine in ['phase','cosmo']:
                    fn=lambda t:evaluate(t,mult,TOLERANCES[1],engine)['S3overT']-140
                    lo,hi=history[0]['RT'],history[-1]['RT']
                    if not fn(lo)<0<fn(hi): raise ValueError('Unbracketed S3/T=140 crossing')
                    rt=brentq(fn,lo,hi,xtol=2e-11,rtol=1e-12)
                    result=evaluate(rt,mult,TOLERANCES[1],engine)
                    points[engine]=dict(RT=rt,temperatureGeV=rt*p['invRGeV'],**result)
                crossings.append(dict(multiplier=mult,windings=p['windings']*mult,thermalTerms=p['thermalTerms']*mult,
                                      phaseTracer=points['phase'],cosmoTransitions=points['cosmo'],
                                      relativeDifference=points['cosmo']['RT']/points['phase']['RT']-1))
                print(f'case {case} cutoffs x{mult}: T140 PT={points["phase"]["temperatureGeV"]:.10g}, CT={points["cosmo"]["temperatureGeV"]:.10g}',flush=True)
        # Same tolerances, separate action quadrature-resolution check.
        rt=history[40]['RT'];mult=1 if pilot else 8
        coarse_profile=evaluate(rt,mult,TOLERANCES[1],'cosmo',500)
        fine_profile=evaluate(rt,mult,TOLERANCES[1],'cosmo',4000)
        normal=evaluate(rt,mult,TOLERANCES[1],'cosmo',2000)
        diagnostics=dict(maxActionRelative=max(abs(x['relativeDifference']) for x in rows),
                         maxVirialRelative=max(x['cosmoTransitionsTight']['virialRelative'] for x in rows),
                         maxPhaseToleranceShift=max(abs(x['phaseToleranceShift']) for x in rows),
                         maxCosmoToleranceShift=max(abs(x['cosmoToleranceShift']) for x in rows),
                         maxCrossingRelative=max([abs(x['relativeDifference']) for x in crossings],default=0),
                         profileSampling=dict(RT=rt,multiplier=mult,points500=coarse_profile,points2000=normal,
                                              points4000=fine_profile,relative2000to4000=fine_profile['S3overT']/normal['S3overT']-1))
        passed=(diagnostics['maxActionRelative']<=TARGETS['actionRelative'] and
                diagnostics['maxCrossingRelative']<=TARGETS['crossingRelative'] and
                diagnostics['maxVirialRelative']<=TARGETS['virialRelative'] and
                max(diagnostics['maxPhaseToleranceShift'],diagnostics['maxCosmoToleranceShift'])<=TARGETS['toleranceShiftRelative'])
        return dict(case=case,parameters=p,source=source.relative_to(ROOT).as_posix(),sourceSHA256=sha(source),
                    samples=rows,crossings=crossings,diagnostics=diagnostics,
                    normalizationChecks=checks,evaluations=len(cache),withinDeclaredTargets=passed)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('output');parser.add_argument('--pilot',action='store_true')
    args=parser.parse_args()
    result=dict(schema='ghu-thermal-crossvalidation-v1',date='2026-10-08',mode='pilot' if args.pilot else 'full',
                normalization=dict(phi='alpha/(g4 R)',C4='3/(64 pi^6 R^4)',
                                   action='4 pi integral dr r^2 [0.5 (dphi/dr)^2 + V(phi,T)-V(0,T)]',dimensions=3),
                criterion='S3/T=140 proxy, not integrated nucleation or percolation',
                methodScope='Separate Python/C++ implementations with shared shooting-method ancestry and shared Fourier coefficients; no claim of algorithmic independence or interval certification.',
                targets=TARGETS,tolerances=list(TOLERANCES),
                backend=dict(python=platform.python_version(),numpy=np.__version__,scipy=scipy.__version__,
                             cosmoTransitions=importlib.metadata.version('cosmoTransitions'),
                             cosmoSourceSHA256=sha(ct_module.__file__),
                             phaseTracer=json.loads(Path('/opt/ghu-tool-versions.json').read_text())['PhaseTracer'],
                             phaseExecutableSHA256=sha(BOUNCE),
                             phaseShootingSHA256=sha('/opt/PhaseTracer/src/shooting.cpp')),
                inputs={name:sha(ROOT/name) for name in ['tools/thermal_run.py','tools/thermal_bounce.cpp','tools/thermal_crossvalidate.py','tools/crossvalidation-requirements.txt']},
                sources=[dict(url='https://arxiv.org/abs/2303.14192',role='Thermal SU(3) potential: Hirose and Shibuya'),
                         dict(url='https://arxiv.org/abs/1109.4189',role='CosmoTransitions: Carroll L. Wainwright'),
                         dict(url='https://arxiv.org/abs/2412.04881',role='PhaseTracer2 and shooting-method ancestry: Athron et al.')],
                physicalUnknowns=['Higher loops and thermal resummation','Validity at the chosen gauge couplings',
                                  'O(4) tunnelling and competing paths outside the selected one-field branch',
                                  'Wall velocity and plasma dynamics'],
                scope='Fixed one-loop SU(3) thermal benchmarks; separate from SU(7). Numerical differences are diagnostics, not statistical uncertainties or validation against experimental data.')
    result['cases']=[run_case(c,args.pilot) for c in [1,2]]
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'saved':str(out),'targetsMet':[c['withinDeclaredTargets'] for c in result['cases']]}),flush=True)

if __name__=='__main__': main()
