"""Independent high-precision reference for src/modules/rs_fermions.mjs (run inside the SageMath image).

    docker run --rm -v <repo>:/w -w /w sage-normaliz:local sage -python tools/rs_fermions_sage_control.py

Conventions are those of rs_unification.mjs (ruFermion): conformal z in [R, R'], R = 1, R'/R = e^{kL};
a left-handed zero mode of bulk mass c has density |chi|^2 dz proportional to z^{-2c} dz (UV-localised for c > 1/2);
a right-handed one has density z^{+2c} (UV-localised for c < -1/2). Gauge KK modes: Neumann-Neumann,
f_n(z) = z [J1(m z) + b Y1(m z)], normalised by int dz (R/z) f_n^2 = 1; zero mode f_0 = 1/sqrt(kL).
Coupling of the n-th KK gluon to a zero-mode quark, in units of g_s: int density * f_n / f_0.
Zero-mode boundary value F(c)^2 = (1-2c)/(1-e^{-(1-2c)kL}) (LH), F(-c) for RH; F(1/2)^2 = 1/kL.
Everything is computed with mpmath at 40 digits; the JSON stores 25 significant digits as strings.
"""
import json
import mpmath as mp

mp.mp.dps = 40


def gauge_modes(kL, n_modes=3):
    eps = mp.e ** (-kL)
    F = lambda x: mp.besselj(0, x * eps) * mp.bessely(0, x) - mp.besselj(0, x) * mp.bessely(0, x * eps)
    roots, x, step = [], mp.mpf('0.5'), mp.mpf('0.01')
    f_prev = F(x)
    while len(roots) < n_modes:
        x2 = x + step
        f2 = F(x2)
        if f_prev * f2 < 0:
            roots.append(mp.findroot(F, (x, x2), solver='anderson'))  # bracketing
        x, f_prev = x2, f2
    modes = []
    for x1 in roots:
        m = x1 * eps
        b = -mp.besselj(0, m) / mp.bessely(0, m)
        f = lambda u, m=m, b=b: mp.e ** u * (mp.besselj(1, m * mp.e ** u) + b * mp.bessely(1, m * mp.e ** u))
        knots = [mp.mpf(0)] + [kL * mp.mpf(i) / 40 for i in range(1, 40)] + [mp.mpf(kL)]
        norm = mp.quad(lambda u: f(u) ** 2, knots)
        modes.append({'x': x1, 'f': f, 'norm': norm, 'residual': F(x1)})
    return modes, knots


def density_weight(c, chirality):
    """exponent a in density e^{a u} du (z = e^u, dz = z du): LH z^{-2c} dz -> e^{(1-2c)u}; RH z^{2c} dz -> e^{(1+2c)u}."""
    return (1 - 2 * c) if chirality == 'L' else (1 + 2 * c)


def coupling(mode, c, chirality, kL, knots):
    a = density_weight(mp.mpf(c), chirality)
    w = lambda u: mp.e ** (a * u)
    f0 = 1 / mp.sqrt(kL)
    num = mp.quad(lambda u: w(u) * mode['f'](u) / mp.sqrt(mode['norm']) / f0, knots)
    den = mp.quad(w, knots)
    return num / den


def zero_mode_F(c, kL):
    c = mp.mpf(c)
    if c == mp.mpf('0.5'):
        return mp.sqrt(1 / mp.mpf(kL))
    return mp.sqrt((1 - 2 * c) / (1 - mp.e ** (-(1 - 2 * c) * kL)))


def s(x):
    return mp.nstr(x, 25)


out = {'schema': 'ghu-rs-fermions-reference-v1', 'engine': 'mpmath ' + mp.__version__ + ' at 40 digits inside SageMath',
       'conventions': __doc__.split('Conventions are')[1].split('Everything')[0].strip(), 'cases': []}
c_grid = ['0.7', '0.6', '0.55', '0.5', '0.45', '0.3', '0', '-0.3', '-0.5', '-0.7']
for kL in [mp.mpf('26.67'), mp.mpf(35), mp.mpf(12)]:
    modes, knots = gauge_modes(kL)
    case = {'kL': s(kL), 'modes': []}
    for n, md in enumerate(modes, 1):
        case['modes'].append({'n': n, 'x': s(md['x']), 'rootResidual': s(md['residual']),
                              'couplingL': {c: s(coupling(md, c, 'L', kL, knots)) for c in c_grid},
                              'couplingR': {c: s(coupling(md, c, 'R', kL, knots)) for c in c_grid}})
    case['zeroModeF'] = {c: s(zero_mode_F(c, kL)) for c in c_grid}
    out['cases'].append(case)
    print('kL', s(kL)[:6], 'x_n', [s(m['x'])[:10] for m in modes],
          'gL(0.6), gR(0.3) n=1:', case['modes'][0]['couplingL']['0.6'][:10], case['modes'][0]['couplingR']['0.3'][:10],
          flush=True)
# Benchmark point of arXiv:0807.4937 Sec. 6.3, in the PAPER's own convention (no lab map is used here, so the
# harness comparing with the lab's mapped implementation also tests the map c_lab = -c_Q (LH), +c_q (RH)).
bench = json.load(open('data/rs_benchmark_cghnp2008.json', encoding='utf-8'))
Lb = mp.log(mp.mpf(10) ** 16)
Fp = lambda c: mp.sqrt((1 + 2 * mp.mpf(c)) / (1 - mp.e ** (-(1 + 2 * mp.mpf(c)) * Lb)))   # paper F, sign dropped
cp = bench['c_paper']
FQ = [Fp(cp['Q_%d' % i]) for i in (1, 2, 3)]
def zma_masses(sing, Y):
    Fq = [Fp(cp['%s_%d' % (sing, i)]) for i in (1, 2, 3)]
    M = mp.matrix(3, 3)
    for i in range(3):
        for j in range(3):
            M[i, j] = mp.mpf(246) / mp.sqrt(2) * FQ[i] * mp.mpc(Y[i][j][0], Y[i][j][1]) * Fq[j]
    sv = mp.svd_c(M, compute_uv=False)
    return sorted([sv[i] for i in range(3)])
bmodes, bknots = gauge_modes(Lb, 1)
lab_c = {('L', 'Q_%d' % i): -mp.mpf(cp['Q_%d' % i]) for i in (1, 2, 3)}
lab_c.update({('R', '%s_%d' % (q, i)): mp.mpf(cp['%s_%d' % (q, i)]) for q in 'ud' for i in (1, 2, 3)})
out['benchmark'] = {'source': 'arXiv:0807.4937 Sec. 6.3', 'kL': s(Lb), 'x1': s(bmodes[0]['x']),
                    'masses_GeV': {'up': [s(x) for x in zma_masses('u', bench['Yu'])],
                                   'down': [s(x) for x in zma_masses('d', bench['Yd'])]},
                    'coupling_g1': {k[1]: s(coupling(bmodes[0], v, k[0], Lb, bknots)) for k, v in lab_c.items()}}
print('benchmark masses up', out['benchmark']['masses_GeV']['up'], 'down', out['benchmark']['masses_GeV']['down'], flush=True)
with open('data/rs_fermions_reference.json', 'w', encoding='utf-8') as fh:
    json.dump(out, fh, indent=1, ensure_ascii=False)
    fh.write('\n')
print('written data/rs_fermions_reference.json')
