"""Replay scoped algebra, exact covariance and pointwise numerical enclosures.

Run from the repository root: python proof/hypothesis/certify.py [--check]
No network, no full-integral or experimental certificate. See notes.html.
"""
from pathlib import Path
from fractions import Fraction as F
from math import factorial
import hashlib, importlib.util, json, re, subprocess, sys
import numpy as np
import sympy as sp

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
if not __debug__:
    raise RuntimeError('Certificates require assertions enabled; do not use -O.')
CHECK = '--check' in sys.argv
checks = []
def ck(name, condition):
    if not bool(condition):
        raise AssertionError(name)
    checks.append(dict(name=name, passed=True))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(name, value):
    p = HERE/name
    if CHECK:
        ck('Saved artifact matches replay: '+name, read(p) == value)
    else:
        p.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# Same Lean version and permitted foundational axioms as proof/replay_all.py.
lean = HERE/'HypothesisAlgebra.lean'
version = subprocess.check_output(['lean', '--version'], text=True).strip()
ck('Lean 4.27.0', '4.27.0' in version)
code = re.sub(r'/\-.*?\-/', '', lean.read_text(encoding='utf-8'), flags=re.S)
ck('No proof placeholders or extra axioms', not re.search(r'\b(sorry|admit|native_decide|axiom|unsafe)\b', code))
run = subprocess.run(['lean', str(lean)], capture_output=True, text=True, encoding='utf-8', timeout=180, check=True)
ck('Lean kernel accepts declarations', not run.stderr and not any(s in run.stdout for s in ['sorryAx','warning:','error:']))
deps = {}
for line in run.stdout.splitlines():
    if 'axioms' not in line: continue
    match = re.search(r'\[([^\]]*)\]', line)
    axioms = [a.strip() for a in match[1].split(',')] if match else []
    ck('Allowed axioms: '+line.split("'")[1], set(axioms) <= {'propext','Classical.choice','Quot.sound'})
    deps[line.split("'")[1]] = axioms
ck('All theorem dependencies printed', len(deps) == len(re.findall(r'^theorem\s+', code, re.M)) == 10)

# Exact symbolic calculus; these are CAS checks, separately from Lean algebra.
t, Q, n = sp.symbols('theta Q n', real=True)
D = 1+Q*sp.cos(n*t)
a,b,c,d = [sp.diff(D,t,k)/D for k in range(1,5)]
formulas = [a,b-a*a,c-3*a*b+2*a**3,d-4*a*c-3*b*b+12*a*a*b-6*a**4]
for k, expression in enumerate(formulas,1):
    ck('Symbolic derivative of log determinant, order '+str(k), sp.trigsimp(sp.diff(sp.log(D),t,k)-expression) == 0)
h,f = sp.symbols('H fH', nonzero=True)
v = sp.symbols('v0:5')
V = sum(v[k]*t**k/sp.factorial(k) for k in range(5))
for k in [2,3,4]:
    ck('Canonical Taylor coefficient, order '+str(k), sp.expand(V.subs(t,h/f)).coeff(h,k) == v[k]/(sp.factorial(k)*f**k))

# Read published decimal strings directly: exact certificate for this rounded
# table, not for unknown underlying unrounded values.
raw_path = ROOT/'data/hepdata_cms_ins1901295_parton_abs_ttm_covariance.json'
raw = read(raw_path)
C = [[F(0) for _ in range(15)] for _ in range(15)]
seen = set()
for cell in raw['values']:
    i,j = [int(F(x['low'])+F(1,2))-1 for x in cell['x']]
    ck('Unique valid covariance cell '+str((i,j)), 0 <= i < 15 and 0 <= j < 15 and (i,j) not in seen)
    seen.add((i,j));C[i][j] = F(cell['y'][0]['value'])
ck('Complete symmetric 15 by 15 covariance', len(seen)==225 and all(C[i][j]==C[j][i] for i in range(15) for j in range(15)))
L = [[F(i==j) for j in range(15)] for i in range(15)]
pivots = []
for j in range(15):
    pivot = C[j][j]-sum(L[j][k]**2*pivots[k] for k in range(j))
    ck('Exact LDL positive pivot '+str(j+1), pivot>0)
    pivots.append(pivot)
    for i in range(j+1,15):
        L[i][j] = (C[i][j]-sum(L[i][k]*L[j][k]*pivots[k] for k in range(j)))/pivot
ck('Exact LDL reconstructs every entry', all(C[i][j] == sum(L[i][k]*pivots[k]*L[j][k] for k in range(15)) for i in range(15) for j in range(15)))
ck('All pairwise correlation squared bounds', all(C[i][j]**2 <= C[i][i]*C[j][j] for i in range(15) for j in range(15)))

# Compare actual browser module, not a copied numerical matrix.
js = "import {hcxModel} from './src/modules/hypothesis_compare.mjs'; console.log(JSON.stringify(hcxModel()));"
lab = json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True,encoding='utf-8'))
ck('Lab uses the certified decimal covariance', lab['cms']['covariance'] == [[float(v) for v in row] for row in C])
x = sp.Matrix([sp.Rational(str(v)) for v in lab['cms']['value']])
w = sp.Matrix([sp.Rational(str(hi))-sp.Rational(str(lo)) for lo,hi in zip(lab['cms']['bin_low_GeV'],lab['cms']['bin_high_GeV'])])
T = (w.T*x)[0];J = sp.eye(15)/T-x*w.T/T**2
CM = sp.Matrix([[sp.Rational(v.numerator,v.denominator) for v in row] for row in C])
CY = J*CM*J.T
ck('Exact density area is one', (w.T*(x/T))[0] == 1)
ck('Exact Jacobian null direction', w.T*J == sp.zeros(1,15))
ck('Exact transformed covariance null direction', CY*w == sp.zeros(15,1))
ck('Exact normalization Jacobian rank is fourteen', J.rank() == 14)
ck('Observed likelihood remains disabled', lab['observedFitReady'] is False)

# Rational interval arithmetic, following the existing boundary certificates.
def point(v): return (F(v),F(v))
def add(a,b): return (a[0]+b[0],a[1]+b[1])
def neg(a): return (-a[1],-a[0])
def sub(a,b): return add(a,neg(b))
def mul(a,b):
    values = [x*y for x in a for y in b]
    return (min(values),max(values))
def scale(v,a): return mul(point(v),a)
def power(a,k):
    out = point(1)
    for _ in range(k): out = mul(out,a)
    return out
def inv(a):
    if a[0] <= 0: raise ValueError('Positive denominator enclosure required')
    return (1/a[1],1/a[0])
def trig(z,sine):
    # Taylor polynomial through degree 24/25; next parity coefficient zero.
    # |derivative| <= 1 on R gives a Lagrange remainder bound.
    offset = int(sine);m = 12
    p = sum((F((-1)**j)*z**(2*j+offset)/factorial(2*j+offset) for j in range(m+1)),F(0))
    degree = 2*m+offset+2;err = abs(z)**degree/factorial(degree)
    return (p-err,p+err)
def pack(a): return dict(lower=str(a[0]),upper=str(a[1]))

spec = importlib.util.spec_from_file_location('ghu_potential',ROOT/'data/hypothesis_comparison/ghu_potential.py')
engine = importlib.util.module_from_spec(spec);spec.loader.exec_module(engine)
enclosures = []
for qv,harmonic in [(F('-0.999'),1),(F('-0.95'),2),(F('0.8'),1)]:
    theta = F(1,10);sn = trig(harmonic*theta,True);cs = trig(harmonic*theta,False)
    denominator = add(point(1),scale(qv,cs));reciprocal = inv(denominator)
    aa = mul(scale(-harmonic*qv,sn),reciprocal)
    bb = mul(scale(-harmonic**2*qv,cs),reciprocal)
    cc = mul(scale(harmonic**3*qv,sn),reciprocal)
    dd = mul(scale(harmonic**4*qv,cs),reciprocal)
    values = [aa,sub(bb,power(aa,2)),add(sub(cc,scale(3,mul(aa,bb))),scale(2,power(aa,3))),
              sub(add(sub(sub(dd,scale(4,mul(aa,cc))),scale(3,power(bb,2))),scale(12,mul(power(aa,2),bb))),scale(6,power(aa,4)))]
    calculated = engine.log_derivatives(np.array(float(qv)),harmonic,float(theta))
    errors = [max(abs(F.from_float(float(val))-lo),abs(F.from_float(float(val))-hi)) for val,(lo,hi) in zip(calculated,values)]
    ck('Rational determinant strictly positive: '+str(qv), denominator[0]>0)
    ck('Pointwise derivative absolute errors below 1e-7: '+str(qv), max(errors)<F(1,10**7))
    enclosures.append(dict(Q=str(qv),harmonic=harmonic,theta=str(theta),determinant=pack(denominator),derivatives=list(map(pack,values)),float_absolute_error_upper_bounds=list(map(str,errors))))
try:
    inv((F(-1),F(1)))
except ValueError:
    ck('Reject interval crossing zero',True)
else:
    ck('Reject interval crossing zero',False)
try:
    engine.log_derivatives(np.array(-2.),1,0.)
except ValueError:
    ck('Engine rejects nonpositive determinant',True)
else:
    ck('Engine rejects nonpositive determinant',False)

# Replay the frozen numerical values, retaining original model assumptions.
archived = read(ROOT/'data/hypothesis_comparison/ghu_potential_results.json')
drift = []
for i,row in enumerate(archived['rows']):
    args = [row['nf'],row['nv'],row['cv'],*row['recalibrated_parameters']]
    base = engine.evaluate(*args)
    refined = engine.evaluate(*args,n=96,end=45)
    keys = ['mass_squared','lambda3','lambda4']
    ck('Archived physical coefficients replay, case '+str(i+1), all(np.isclose(base[k],row['recalibrated'][k],rtol=1e-11,atol=1e-12) for k in keys))
    delta = max(abs(refined[k]/base[k]-1) for k in keys)
    ck('Refinement diagnostic, case '+str(i+1), delta<1e-8)
    drift.append(float(delta))

inputs = ['HypothesisAlgebra.lean','certify.py','notes.html']
sources = {str(Path('proof/hypothesis')/p).replace('\\','/'):sha(HERE/p) for p in inputs}
for name in ['data/hepdata_cms_ins1901295_parton_abs_ttm_covariance.json','data/hypothesis_comparison/ghu_potential.py','data/hypothesis_comparison/ghu_paper_benchmark.json','data/hypothesis_comparison/ghu_potential_results.json','src/modules/hypothesis_compare.mjs','src/modules/tt_cms_reference.mjs']:
    sources[name] = sha(ROOT/name)

certificate = dict(schema='ghu-hypothesis-certificates-v1',date='2026-10-14',
    scope='First batch: rational algebra, symbolic differentiation, exact published covariance and pointwise derivative enclosures. Not a full GHU certificate.',
    lean=dict(version=version,theorems=len(deps),domain='Rat',axiom_dependencies=deps),
    covariance=dict(doi=raw['doi'],dimension=15,method='Exact rational LDL transpose factorization of published decimal values',
        L=[[str(v) for v in row] for row in L],D=list(map(str,pivots)),positive_definite=True,
        normalization_rank=14,normalization_covariance='First-order propagation only; does not replace the official normalized covariance'),
    derivative_enclosures=enclosures,
    numerical_diagnostic=dict(max_relative_refinement_drift=max(drift),rigorous_integral_error_bound=False),
    pending=['Real-analysis formalization and differentiation under the spectral integral','Rigorous Bessel enclosures and both integration tails','Certified global minimum over the continuum','Complete electroweak inputs and omitted sectors','Published quartic-fit/table discrepancy about 7.4 percent','Compatible theory prediction and observed experimental likelihood'],
    full_potential_certified=False,observed_fit_ready=False,sources=sources)
# Artifact comparison is excluded from the recorded check list so --check is idempotent.
recorded_checks=list(checks)
certificate['checks']=recorded_checks;certificate['checkCount']=len(recorded_checks);certificate['passed']=True
write('certificates.json',certificate)
if not CHECK:
    (HERE/'lean.log').write_text(run.stdout,encoding='utf-8')
print(json.dumps(dict(passed=True,checks=len(recorded_checks),lean_theorems=len(deps),exact_covariance_dimension=15,pointwise_enclosures=len(enclosures),full_potential_certified=False)))
