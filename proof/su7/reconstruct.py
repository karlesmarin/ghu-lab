"""Independent SU(7) reconstruction. Run with native Python, SymPy and mpmath.

The exclusion certificates use Python integers only, including pi, trig,
roundoff and the infinite Fourier remainder. mpmath only locates roots.
No Docker/Sage, no network, no writes to either published repository.
"""
from collections import Counter
from fractions import Fraction as Q
from functools import lru_cache
from itertools import combinations_with_replacement, product
from math import factorial, prod
from pathlib import Path
import hashlib
import json
import os
import platform
import sys
import time

import mpmath as mp
import sympy as sp

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = Path(os.environ.get('GHU_CERT_OUTPUT', str(ROOT / 'results/ghu_su7_reconstruction_20261008')))
OUT.mkdir(parents=True, exist_ok=True)
LAB = Path(os.environ.get('GHU_LAB', str(ROOT)))
SCALE = 10**50
CHECKS = []


def check(name, ok):
    CHECKS.append({'name': name, 'passed': bool(ok)})
    if not ok:
        raise AssertionError(name)


def ceildiv(a, b):
    assert b > 0
    return -((-a) // b)


def fixedstr(n):
    return ('-' if n < 0 else '') + str(abs(n)//SCALE) + '.' + str(abs(n)%SCALE).zfill(50)


class I:
    """Closed [lo/SCALE, hi/SCALE], outward rounding by integer division."""
    __slots__ = ('lo', 'hi')

    def __init__(self, x=0, *, raw=None):
        if raw is not None:
            self.lo, self.hi = raw
        elif isinstance(x, I):
            self.lo, self.hi = x.lo, x.hi
        else:
            x = Q(x)
            self.lo = (x.numerator*SCALE)//x.denominator
            self.hi = ceildiv(x.numerator*SCALE, x.denominator)
        assert self.lo <= self.hi

    def __add__(self, other):
        o = I(other)
        return I(raw=(self.lo+o.lo, self.hi+o.hi))

    __radd__ = __add__

    def __neg__(self):
        return I(raw=(-self.hi, -self.lo))

    def __sub__(self, other):
        return self + (-I(other))

    def __rsub__(self, other):
        return I(other) + (-self)

    def __mul__(self, other):
        o = I(other)
        endpoints = [self.lo*o.lo, self.lo*o.hi, self.hi*o.lo, self.hi*o.hi]
        return I(raw=(min(endpoints)//SCALE, ceildiv(max(endpoints), SCALE)))

    __rmul__ = __mul__

    def __truediv__(self, other):
        o = I(other)
        assert o.lo > 0 or o.hi < 0, 'division interval contains zero'
        endpoints = [Q(a*SCALE, b) for a in (self.lo, self.hi) for b in (o.lo, o.hi)]
        low, high = min(endpoints), max(endpoints)
        return I(raw=(low.numerator//low.denominator, ceildiv(high.numerator, high.denominator)))

    def __pow__(self, n):
        assert isinstance(n, int) and n >= 0
        ans = I(1)
        for _ in range(n):
            ans = ans*self
        return ans

    def upper_abs(self):
        return I(raw=(max(abs(self.lo), abs(self.hi)),)*2)

    def widen(self, radius):
        r = I(radius)
        assert r.lo >= 0
        return I(raw=(self.lo-r.hi, self.hi+r.hi))

    def bounds(self):
        return [fixedstr(self.lo), fixedstr(self.hi)]


def atan_reciprocal(q, n=80):
    # Alternating series: exact rational sum and first omitted term.
    s = sum((Q((-1)**j, (2*j+1)*q**(2*j+1)) for j in range(n)), Q(0))
    r = Q(1, (2*n+1)*q**(2*n+1))
    return I(s).widen(r)


PI = 16*atan_reciprocal(5)-4*atan_reciprocal(239)


@lru_cache(maxsize=80000)
def trig(angle):
    """sin(pi*angle), cos(pi*angle); angle is rational, reduced exactly."""
    angle = (angle+1) % 2 - 1
    x = PI*angle
    y = -(x*x)
    sine = st = x
    cosine = ct = I(1)
    for j in range(1, 36):
        st = st*y / ((2*j)*(2*j+1))
        ct = ct*y / ((2*j-1)*(2*j))
        sine = sine+st
        cosine = cosine+ct
    # Taylor polynomials through degrees 72 and 71 respectively (zero terms
    # included). Derivatives of sine/cosine are bounded by one on real x.
    return (sine.widen(Q(22, 7)**73/factorial(73)),
            cosine.widen(Q(22, 7)**72/factorial(72)))


def combine(terms):
    out = Counter()
    for m, s, c in terms:
        out[(int(s), int(c))] += Q(str(m))
    return {k: v for k, v in out.items() if v}


def termlist(table):
    return [[str(m), s, c] for (s, c), m in sorted(table.items())]


def derivative_finite(terms, alpha, degree=1, cut=512):
    total = I(0)
    for (s, c), m in terms.items():
        sub = I(0)
        for n in range(1, cut+1):
            sn, cs = trig(Q(alpha)*c*n)
            sub = sub + (sn if degree == 1 else cs)*s**n/n**(5-degree)
        total = total+(-1 if degree else 1)*m*(PI*c)**degree*sub
    return total


def tail(terms, degree, cut):
    return sum((abs(m)*(PI*c)**degree for (s, c), m in terms.items()), I(0))/((4-degree)*cut**(4-degree))


def third_bound(terms):
    return sum((abs(m)*(PI*c)**3 for (s, c), m in terms.items()), I(0))*PI**2/6


def residual(terms, alpha, halfwidth=Q(1, 2000), cut=512):
    f1 = derivative_finite(terms, alpha, 1, cut)
    f2 = derivative_finite(terms, alpha, 2, cut)
    radius = tail(terms, 1, cut)+I(halfwidth)*(f2.upper_abs()+tail(terms, 2, cut))+third_bound(terms)*Q(halfwidth)**2/2
    return f1.widen(radius)


def convolve(a, b):
    out = Counter()
    for (q1, p1, b1), n1 in a.items():
        for (q2, p2, b2), n2 in b.items():
            out[(q1+q2, p1*p2, b1*b2)] += n1*n2
    return out


def power_character(a, n):
    out = Counter()
    for (q, p, b), count in a.items():
        out[(n*q, p**n, b**n)] += count
    return out


def derive_representations():
    p6 = sp.diag(1, 1, 1, -1, -1, -1, -1)
    p5 = sp.diag(1, 1, 1, 1, 1, -1, -1)
    p5p = sp.diag(1, 1, 1, -1, -1, -1, 1)
    charge = sp.zeros(7)
    charge[4, 6] = charge[6, 4] = 1
    # Independent simultaneous eigenbasis of Q, P6 and B=P5*P5'.
    eye = sp.eye(7)
    basis = sp.Matrix.hstack(*(eye[:, j] for j in [0, 1, 2, 3, 5]), eye[:, 4]+eye[:, 6], eye[:, 4]-eye[:, 6])
    diagonals = [basis.inv()*op*basis for op in (charge, p6, p5*p5p)]
    check('Q, P6 and B simultaneously diagonalized exactly', all(m.is_diagonal() for m in diagonals))
    check('P5 and P5p reverse Q; P6 preserves Q', p5*charge*p5 == -charge and p5p*charge*p5p == -charge and p6*charge*p6 == charge)
    weights = [tuple(int(m[i, i]) for m in diagonals) for i in range(7)]
    reps = {'7': Counter(weights)}
    for rank, name in [(2, '28'), (3, '84')]:
        rep = Counter()
        for indices in combinations_with_replacement(range(7), rank):
            ws = [weights[i] for i in indices]
            rep[(sum(w[0] for w in ws), prod(w[1] for w in ws), prod(w[2] for w in ws))] += 1
        reps[name] = rep
    adj = Counter((a[0]-b[0], a[1]*b[1], a[2]*b[2]) for a, b in product(weights, repeat=2))
    adj[(0, 1, 1)] -= 1
    reps['48'] = adj
    # Second route: Newton character identities, without tensor occupations.
    f = reps['7']
    f2 = convolve(f, f)
    h2 = f2+power_character(f, 2)
    h2 = {k: Q(v, 2) for k, v in h2.items()}
    f3 = convolve(f2, f)
    cross = convolve(f, power_character(f, 2))
    third = power_character(f, 3)
    keys = set(f3)|set(cross)|set(third)
    h3 = {k: Q(f3[k]+3*cross[k]+2*third[k], 6) for k in keys}
    check('Sym2 occupation weights equal Newton character identity', h2 == reps['28'])
    check('Sym3 occupation weights equal Newton character identity', h3 == reps['84'])
    for name, rep in reps.items():
        check(f'{name}: dimension and charge reflection', sum(rep.values()) == int(name) and all(rep[(-q,p,b)] == n for (q,p,b),n in rep.items()))
    return weights, reps


def fermion(rep, eta=1):
    result = Counter()
    for (q, p, b), n in rep.items():
        if q > 0:
            result[(eta*b, q)] += Q(n)
    return dict(result)


def gauge(adj, periodic_dof):
    result = Counter()
    for (q, p, b), n in adj.items():
        if q > 0:
            result[(b, q)] -= Q(n*(periodic_dof if p > 0 else 1), 4)
    return dict(result)


def add(*tables):
    ans = Counter()
    for t in tables:
        for k, v in t.items():
            ans[k] += v
    return {k: v for k, v in ans.items() if v}


def numeric(terms, alpha, degree=1):
    return mp.fsum(mp.mpf(m.numerator)/m.denominator*(mp.pi*c)**degree*mp.re((1j)**degree*mp.polylog(5-degree, s*mp.exp(1j*mp.pi*c*alpha))) for (s,c),m in terms.items())


def local_root(terms, guess):
    # First bracket the positive branch; an unconstrained secant step can
    # otherwise converge to its negative mirror (the potential is even).
    left = mp.mpf(str(guess))/4
    while numeric(terms, left) >= 0 and left > mp.mpf('1e-8'):
        left /= 2
    right = left*2
    while numeric(terms, right) <= 0 and right < mp.mpf('.3'):
        left, right = right, right*2
    root = mp.findroot(lambda a: numeric(terms, a), (left, right), solver='anderson', tol=mp.mpf('1e-45'))
    if not (0 < root < mp.mpf('.3')):
        raise ValueError(f'Root finder left the small-phase branch: {root}')
    # Numerical location is only a proposal. Integer interval proof below
    # certifies existence, uniqueness and positive curvature in the box.
    center = Q(mp.nstr(root, 17))
    h = Q(1, 1000000)
    cut = 1024
    left = derivative_finite(terms, center-h, 1, cut).widen(tail(terms, 1, cut))
    right = derivative_finite(terms, center+h, 1, cut).widen(tail(terms, 1, cut))
    curvature = derivative_finite(terms, center, 2, cut).widen(tail(terms, 2, cut)+third_bound(terms)*h)
    check('Local stationary point bracket with strictly positive curvature', left.hi < 0 < right.lo and curvature.lo > 0)
    return {'numerical_alpha': mp.nstr(root, 25), 'certified_alpha_interval': [str(center-h), str(center+h)], 'certified_halfwidth': str(h), 'left_derivative': left.bounds(), 'right_derivative': right.bounds(), 'curvature_interval': curvature.bounds(), 'numeric_curvature': mp.nstr(numeric(terms, root, 2), 22), 'cutoff': cut, 'global_minimum_certified': False}


def finite_cutoff_candidates(terms, a, upto=64):
    # Direct partial sums, including Taylor variation across the entire
    # rounding box. This tests every integer N in 1..upto, not a sample.
    f1, f2 = I(0), I(0)
    h = Q(1, 2000)
    m3 = third_bound(terms)
    possible, enclosures = [], []
    for n in range(1, upto+1):
        for (s,c), m in terms.items():
            sn, cs = trig(a*c*n)
            f1 = f1-m*(PI*c)*s**n*sn/n**4
            f2 = f2-m*(PI*c)**2*s**n*cs/n**3
        box = f1.widen(h*f2.upper_abs()+m3*h*h/2)
        enclosures.append(box.bounds())
        if box.lo <= 0 <= box.hi:
            possible.append(n)
    infinity = residual(terms, a)
    # Uniform on alpha: |F'_N-F'_infinity| <= tail(N), monotone in N.
    all_larger = infinity.widen(tail(terms, 1, upto))
    return {'tested_cutoffs': [1, upto], 'not_excluded_cutoffs': possible, 'derivative_intervals': enclosures, 'all_N_at_least_64_interval': all_larger.bounds(), 'all_N_at_least_64_excluded': all_larger.hi < 0 or all_larger.lo > 0}


def finite_k_bound(matter, adj, k=10):
    # Exact positive Taylor lower bound e^6 > 400; pi > 3, hence
    # exp(-2*pi*k) < 400^(-k). For x>=pi*k>=1, x^j exp(-2x)
    # decreases for j=0,1,2. This bounds all n>=1 and all k>=10.
    check('Exact Taylor lower bound exp(6)>400', sum((Q(6)**j/factorial(j) for j in range(21)), Q(0)) > 400)
    t = Q(1, 400**k)
    x = Q(22*k, 7)
    gb = 2*t/(1-t)+4*x*t/(1-t)**2+Q(8,3)*x*x*t*(1+t)/(1-t)**3
    coefficient = sum(abs(m)*c for (s,c),m in matter.items())+Q(5,8)*sum(n*q for (q,p,b),n in adj.items() if q > 0)
    # sum 1/n^4 < 2 and pi <22/7.
    return I(Q(22,7)*2*coefficient*gb)


def arithmetic_selfcheck():
    check('Machin pi enclosed between 3 and 22/7', PI.lo > 3*SCALE and Q(PI.hi,SCALE) < Q(22,7))
    # Exact reference rationals exercise all endpoint signs and division.
    values = [Q(-7,3), Q(-1,19), Q(0), Q(1,13), Q(8,3)]
    for a,b in product(values, repeat=2):
        for interval, exact in [(I(a)+I(b),a+b), (I(a)*I(b),a*b)] + ([(I(a)/I(b),a/b)] if b else []):
            if not Q(interval.lo,SCALE) <= exact <= Q(interval.hi,SCALE):
                raise AssertionError('outward rational arithmetic')
    check('Signed integer interval arithmetic encloses exact rationals', True)
    for a, s, c in [(Q(0),0,1),(Q(1,2),1,0),(Q(1),0,-1),(Q(-1,2),-1,0),(Q(5,2),1,0)]:
        si,co = trig(a)
        check(f'Trig special value {a}', si.lo <= s*SCALE <= si.hi and co.lo <= c*SCALE <= co.hi)


def main():
    start = time.monotonic()
    mp.mp.dps = 60
    arithmetic_selfcheck()
    weights, reps = derive_representations()
    printed_gauge = gauge(reps['48'], 4)
    candidate_gauge = gauge(reps['48'], 3)
    # The experimental reconstruction above has no access to lab tables.
    source = LAB/'data/su7_km25.json'
    if not source.exists():
        source = HERE/'su7_km25.input.json'
    raw = source.read_bytes()
    data = json.loads(raw)
    (HERE/'su7_km25.input.json').write_bytes(raw)
    check('Published gauge reconstructed from adjoint weights matches lab', printed_gauge == combine(data['gauge']))
    check('Gauge + ghost 3+1 reconstruction matches existing candidate', candidate_gauge == combine(data['gauge_seeds']['candidate']['gauge']))
    comparisons = []
    for name in ['7','28','48','84']:
        for eta, key in [(1,'(+,+)'),(-1,'(+,-)')]:
            got = fermion(reps[name], eta)
            same = got == combine(data['reps'][name][key])
            check(f'Independent {name} {key} coefficients match lab', same)
            comparisons.append({'representation':name,'eta_eta_prime':eta,'terms':termlist(got),'matches_lab':same})
    check('Sym3 quartet lower weight contributes c=1 antiperiodic', fermion(reps['84'])[(-1,1)] == 12)
    result = {'date':'2026-10-08','scope':'Massless additional bulk Dirac fields; flat Wilson background; alpha-dependent one-loop terms; large R5/R6 limit. No global minimum or physical validity certificate.',
              'source':'https://arxiv.org/pdf/2503.04090v1', 'paper_sha256':hashlib.sha256((HERE/'2503.04090v1.pdf').read_bytes()).hexdigest(),
              'lab_input_sha256':hashlib.sha256(raw).hexdigest(), 'python':platform.python_version(), 'sympy':sp.__version__, 'mpmath':mp.__version__,
              'fundamental_simultaneous_weights_q_p6_B':weights, 'representations':{k:[{'q':q,'p6':p,'B':b,'count':n} for (q,p,b),n in sorted(v.items())] for k,v in reps.items()},
              'coefficient_comparisons':comparisons, 'printed_gauge':termlist(printed_gauge),'candidate_gauge':termlist(candidate_gauge),
              'certificate_arithmetic':{'type':'integer fixed-point outward intervals','decimal_places':50,'pi_method':'Machin identity with rational alternating series bounds, 80 terms','pi_interval':PI.bounds(),'trig_method':'exact rational phase reduction, Taylor polynomial plus analytic remainder','rounding_halfwidth':'1/2000','exclusion_fourier_cutoff':512},'rows':[]}
    lambda_boxes = []
    cutoff_intersection = set(range(1,65))
    for row in data['published_rows']:
        matter = Counter()
        for f in row['bulk']:
            for key,value in fermion(reps[f['rep']],prod(f['parities'])).items():
                matter[key] += f['multiplicity']*value
        terms = add(printed_gauge,matter)
        alternative = add(candidate_gauge,matter)
        a = Q(str(row['published']['alpha_min']))
        excluded = residual(terms,a)
        check(f"Row {row['label']}: full printed rounding box nonstationary", excluded.hi < 0)
        alt_excluded = residual(alternative,a)
        gbox,mbox = residual(printed_gauge,a),residual(matter,a)
        lam = -gbox/mbox
        lambda_boxes.append(lam)
        cutoffs = finite_cutoff_candidates(terms,a)
        cutoff_intersection.intersection_update(cutoffs['not_excluded_cutoffs'])
        kerror = finite_k_bound(matter,reps['48'])
        check(f"Row {row['label']}: finite k>=10 correction cannot close gap", excluded.widen(kerror).hi < 0)
        record = {'row':row['label'],'published_alpha':str(a),'published_rounding_box':[str(a-Q(1,2000)),str(a+Q(1,2000))],
                  'terms':termlist(terms), 'derivative_over_rounding_box':excluded.bounds(),
                  'candidate_derivative_over_rounding_box':alt_excluded.bounds(),
                  'required_relative_fermion_factor_interval':lam.bounds(), 'finite_cutoffs':cutoffs,
                  'finite_k_at_least_10_derivative_error_bound':kerror.bounds(),
                  'printed_local_minimum':local_root(terms,float(a)),
                  'candidate_local_minimum':local_root(alternative,float(a))}
        result['rows'].append(record)
        print(json.dumps({k:record[k] for k in ['row','derivative_over_rounding_box','required_relative_fermion_factor_interval']}),flush=True)
        print('roots',record['printed_local_minimum']['numerical_alpha'],record['candidate_local_minimum']['numerical_alpha'],flush=True)
    check('One common matter normalization cannot repair all five rounding boxes',max(v.lo for v in lambda_boxes)>min(v.hi for v in lambda_boxes))
    check('No common positive integer Fourier cutoff repairs all five rows',not cutoff_intersection and all(r['finite_cutoffs']['all_N_at_least_64_excluded'] for r in result['rows']))
    result['common_relative_fermion_factor_excluded'] = True
    result['common_integer_fourier_cutoff_excluded'] = True
    result['checks'] = CHECKS
    result['passed'] = len(CHECKS)
    result['elapsed_seconds'] = time.monotonic()-start
    result['script_sha256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    (OUT/'reconstruction.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':len(CHECKS),'seconds':result['elapsed_seconds'],'output':str(OUT/'reconstruction.json')}),flush=True)


if __name__ == '__main__':
    main()
