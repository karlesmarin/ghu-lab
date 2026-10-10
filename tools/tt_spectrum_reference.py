"""Independent certificates for tt_spectrum.mjs (DESIGN D7: compute once outside the page, pin, compare).

    docker run --rm -v <repo>:/w -w /w ghu-pdf:local python tools/tt_spectrum_reference.py  -> data/tt_spectrum_reference.json

A. PARTONIC, from Dirac matrices (no formula of the module is used).  For q(p1) qbar(p2) -> t(p3) tbar(p4) through
   s-channel octet vectors with vertices gamma^mu (cL PL + cR PR), the spin sum of M_A M_B^* is
       L_q^{mu nu} L^t_{mu nu},  L_q = Tr[p2/ G_A^mu p1/ Gbar_B^nu],  L_t = Tr[(p3/ + m) G_A,mu (p4/ - m) Gbar_B,nu],
   with the gluon polarisation sum -g (the quark current is conserved).  Colour: sum over octet exchange
   Tr(T^a T^b) Tr(T^a T^b) = 2; average 1/4 (spin) x 1/9 (colour).  Integrated over cos(theta) by Gauss-Legendre,
       sigma = beta / (32 pi shat) int dcos |M|^2_avg.
   Stored: sigma_qq, sigma_V and sigma_int at several shat, masses, widths and chiral couplings.
   The gg -> tt channel is checked against the textbook differential |M|^2 (Combridge; Ellis-Stirling-Webber eq. 10.12)
   integrated numerically, a different formula from the integrated one the module uses.
B. HADRONIC, with LHAPDF directly (not the 10 GeV interpolated luminosity grid): dsigma/dm averaged over the CMS bins
   for the SM and two octets, with the same alpha_s rule as the harness.
"""
import json
import math

import numpy as np

# ---------- A. Dirac algebra ----------
I2, Z2 = np.eye(2), np.zeros((2, 2))
sx, sy, sz = np.array([[0, 1], [1, 0]]), np.array([[0, -1j], [1j, 0]]), np.array([[1, 0], [0, -1]])
G0 = np.block([[I2, Z2], [Z2, -I2]]).astype(complex)
G = [G0] + [np.block([[Z2, s], [-s, Z2]]).astype(complex) for s in (sx, sy, sz)]
G5 = 1j * G[0] @ G[1] @ G[2] @ G[3]
PL, PR = (np.eye(4) - G5) / 2, (np.eye(4) + G5) / 2
METRIC = np.diag([1.0, -1.0, -1.0, -1.0])


def slash(p):
    return sum(METRIC[m, m] * p[m] * G[m] for m in range(4))


def vertex(cL, cR):
    return [G[m] @ (cL * PL + cR * PR) for m in range(4)]


def bar(Gm):
    return [G0 @ g.conj().T @ G0 for g in Gm]


def spinsum(p1, p2, p3, p4, mt, A, B, Aq, Bq):
    """sum over spins of M_A M_B^* stripped of couplings-independent factors: L_q^{mu nu} L_t_{mu nu} with -g sums."""
    s1, s2, s3, s4 = slash(p1), slash(p2), slash(p3), slash(p4)
    Bqb, Bb = bar(Bq), bar(B)
    tot = 0.0
    for mu in range(4):
        for nu in range(4):
            Lq = np.trace(s2 @ Aq[mu] @ s1 @ Bqb[nu])
            Lt = np.trace((s3 + mt * np.eye(4)) @ A[mu] @ (s4 - mt * np.eye(4)) @ Bb[nu])
            tot += METRIC[mu, mu] * METRIC[nu, nu] * Lq * Lt     # lower both top indices
    return tot


def partonic(shat, mt, alpha, alphaV, M, Gam, cq, ct, nodes=24):
    g2, gV2 = 4 * math.pi * alpha, 4 * math.pi * alphaV
    E = math.sqrt(shat) / 2
    beta = math.sqrt(1 - 4 * mt * mt / shat)
    pt = E * beta
    gl, Vq, Vt = vertex(1, 1), vertex(*cq), vertex(*ct)
    prop_g, prop_V = 1 / shat, 1 / (shat - M * M + 1j * M * Gam)
    xs, ws = np.polynomial.legendre.leggauss(nodes)
    acc = {'qq': 0.0, 'V': 0.0, 'int': 0.0}
    for c, w in zip(xs, ws):
        s = math.sqrt(1 - c * c)
        p1, p2 = np.array([E, 0, 0, E]), np.array([E, 0, 0, -E])
        p3, p4 = np.array([E, pt * s, 0, pt * c]), np.array([E, -pt * s, 0, -pt * c])
        gg_ = spinsum(p1, p2, p3, p4, mt, gl, gl, gl, gl)
        VV = spinsum(p1, p2, p3, p4, mt, Vt, Vt, Vq, Vq)
        gV = spinsum(p1, p2, p3, p4, mt, gl, Vt, gl, Vq)
        col = 2 / 36                                            # colour sum 2, average 1/4 x 1/9
        acc['qq'] += w * col * g2 * g2 * abs(prop_g) ** 2 * gg_.real
        acc['V'] += w * col * gV2 * gV2 * abs(prop_V) ** 2 * VV.real
        acc['int'] += w * col * 2 * (g2 * gV2 * prop_g * np.conj(prop_V) * gV).real
    return {k: beta / (32 * math.pi * shat) * v for k, v in acc.items()}


def gg_textbook(shat, mt, alpha, nodes=64):
    """ESW eq. (10.12), spin- and colour-averaged: |M|^2 = g^4 (1/(6 t1 t2) - 3/8)(t1^2 + t2^2 + rho - rho^2/(4 t1 t2)),
    t1,2 = (1 -+ beta cos)/2"""
    g4 = (4 * math.pi * alpha) ** 2
    rho = 4 * mt * mt / shat
    beta = math.sqrt(1 - rho)
    xs, ws = np.polynomial.legendre.leggauss(nodes)
    tot = 0.0
    for c, w in zip(xs, ws):
        t1, t2 = (1 - beta * c) / 2, (1 + beta * c) / 2
        tot += w * g4 * (1 / (6 * t1 * t2) - 3 / 8) * (t1 * t1 + t2 * t2 + rho - rho * rho / (4 * t1 * t2))
    return beta / (32 * math.pi * shat) * tot                     # t and tbar are distinct: no symmetry factor


MT = 172.5
cases = [
    {'shat': 400.0 ** 2, 'M': 3000.0, 'Gam': 450.0, 'alphaV': 0.09, 'cq': [0.3, -0.5], 'ct': [2.5, 0.8]},
    {'shat': 1000.0 ** 2, 'M': 3000.0, 'Gam': 450.0, 'alphaV': 0.09, 'cq': [0.3, -0.5], 'ct': [2.5, 0.8]},
    {'shat': 2800.0 ** 2, 'M': 3000.0, 'Gam': 600.0, 'alphaV': 0.08, 'cq': [-0.2, -0.2], 'ct': [1.0, 3.0]},
    {'shat': 3500.0 ** 2, 'M': 3000.0, 'Gam': 600.0, 'alphaV': 0.08, 'cq': [1.4142, 1.4142], 'ct': [1.4142, 1.4142]},
    {'shat': 360.0 ** 2, 'M': 4600.0, 'Gam': 736.0, 'alphaV': 0.075, 'cq': [1.0, 0.0], 'ct': [0.0, 1.0]},
]
partonic_rows = []
for k in cases:
    r = partonic(k['shat'], MT, 0.1, k['alphaV'], k['M'], k['Gam'], k['cq'], k['ct'])
    partonic_rows.append({**k, 'mt': MT, 'alpha': 0.1, **{'sigma_' + a: b for a, b in r.items()}})
    print('partonic', k['shat'] ** 0.5, r, flush=True)
gg_rows = [{'shat': s, 'mt': MT, 'alpha': 0.1, 'sigma_gg_textbook': gg_textbook(s, MT, 0.1)} for s in (360.0 ** 2, 500.0 ** 2, 2000.0 ** 2)]
print('gg', gg_rows, flush=True)

# ---------- B. hadronic, LHAPDF directly ----------
import lhapdf  # noqa: E402  (after the cheap part: a missing PDF must not cost section A)

SET, SQRTS = 'NNPDF23_lo_as_0130_qed', 13000.0
pdf = lhapdf.mkPDF(SET, 0)
meta = json.load(open('data/hepdata_cms_ins1901295.meta.json', encoding='utf-8'))['tables']['abs']
bins = list(zip(meta['bin_low_GeV'], meta['bin_high_GeV']))
GEV2PB = 3.8937937e8


def f(pid, x, mu):
    return 0.0 if x >= 1.0 else pdf.xfxQ(pid, x, mu) / x


def lumi(a, b, tau, mu, n=300):
    ys = np.linspace(math.log(tau), 0.0, n + 1)
    h = (ys[-1] - ys[0]) / n
    w = np.ones(n + 1); w[1:-1:2] = 4; w[2:-1:2] = 2
    v = [f(a, math.exp(y), mu) * f(b, tau / math.exp(y), mu) + f(b, math.exp(y), mu) * f(a, tau / math.exp(y), mu) for y in ys]
    return h / 3 * float(np.dot(w, v))


ALPHA_S = {'aZ': 0.13, 'nf': 6, 'MZ': 91.1876}   # one loop, the rule of collider.mjs alphasRun with the PDF set's alpha_s(MZ)


def a_s(mu):
    b0 = (33 - 2 * ALPHA_S['nf']) / (12 * math.pi)
    return ALPHA_S['aZ'] / (1 + ALPHA_S['aZ'] * b0 * 2 * math.log(mu / ALPHA_S['MZ']))


def sig_parts(sh, aS, aV, M, Gam, cq, ct):
    """the module's integrated formulas would be circular here; use the Dirac-matrix partonic result instead"""
    return partonic(sh, MT, aS, aV, M, Gam, cq, ct, nodes=12)


def gg_int(sh, aS):
    rho = 4 * MT * MT / sh
    b = math.sqrt(1 - rho)
    return math.pi * aS * aS / (3 * sh) * ((1 + rho + rho * rho / 16) * math.log((1 + b) / (1 - b)) - b * (7 / 4 + 31 * rho / 16))


octets = {
    'flat_4600': {'M': 4600.0, 'GoverM': 0.16, 'cq': {q: [1.41421356, 1.41421356] for q in ('uu', 'dd', 'ss', 'cc', 'bb')}, 'ct': [1.41421356, 1.41421356]},
    'chiral_3000': {'M': 3000.0, 'GoverM': 0.20, 'cq': {'uu': [-0.2, -0.25], 'dd': [-0.2, -0.3], 'ss': [-0.2, -0.3], 'cc': [-0.2, -0.25], 'bb': [1.0, -0.3]}, 'ct': [1.0, 3.0]},
}
flav = {'uu': (2, -2), 'dd': (1, -1), 'ss': (3, -3), 'cc': (4, -4), 'bb': (5, -5)}
nodes_per_bin = 16
out_bins = []
for lo, hi in bins:
    a = max(lo, 2 * MT * (1 + 1e-9))
    w = np.ones(nodes_per_bin + 1); w[1:-1:2] = 4; w[2:-1:2] = 2
    if lo < 2 * MT:
        # threshold bin: the integrand goes as sqrt(m - 2 mt); in u = sqrt(m - a) it is smooth (dm = 2u du)
        us = np.linspace(0.0, math.sqrt(hi - a), nodes_per_bin + 1)
        ms, dmdu, hstep = a + us * us, 2 * us, math.sqrt(hi - a) / nodes_per_bin
    else:
        ms, dmdu, hstep = np.linspace(a, hi, nodes_per_bin + 1), np.ones(nodes_per_bin + 1), (hi - a) / nodes_per_bin
    acc = {'qq': 0.0, 'gg': 0.0, **{f'{o}_{t}': 0.0 for o in octets for t in ('V', 'int')}}
    for wi, m, dm in zip(w, ms, dmdu):
        sh, tau = m * m, (m / SQRTS) ** 2
        jac = 2 * m / SQRTS ** 2 * GEV2PB * wi * dm * hstep / 3 / (hi - lo)
        if 4 * MT * MT >= sh:
            continue
        aS = a_s(m)
        L = {q: lumi(pa, pb, tau, m) for q, (pa, pb) in flav.items()}
        acc['gg'] += jac * lumi(21, 21, tau, m) / 2 * gg_int(sh, aS)
        qq_done = False
        for o, d in octets.items():
            M, Gam = d['M'], d['GoverM'] * d['M']
            aV = a_s(M)
            for q in flav:
                x = sig_parts(sh, aS, aV, M, Gam, d['cq'][q], d['ct'])
                acc[f'{o}_V'] += jac * L[q] * x['V']
                acc[f'{o}_int'] += jac * L[q] * x['int']
                if not qq_done:
                    acc['qq'] += jac * L[q] * x['qq']
            qq_done = True
    out_bins.append({'lo': lo, 'hi': hi, **acc})
    print('bin', lo, hi, {k: f'{v:.4g}' for k, v in acc.items()}, flush=True)

json.dump({'schema': 'ghu-tt-spectrum-reference-v1', 'mt': MT,
           'pdf': {'set': SET, 'lhapdf_id': pdf.lhapdfID, 'lhapdf_version': lhapdf.version()},
           'alpha_s': ALPHA_S, 'alpha_s_rule': 'one loop, mu = m(tt) at QCD vertices, alpha_s(M) at octet vertices',
           'method': {'partonic': 'Dirac-matrix traces, Gauss-Legendre in cos(theta)', 'gg': 'integrated Combridge formula (checked against the differential one in section A)',
                      'hadronic': 'LHAPDF directly, Simpson in ln x (300 panels) and in m (16 panels per bin; the threshold bin in u = sqrt(m - 2 mt)), mu = m(tt)'},
           'partonic': partonic_rows, 'gg_textbook': gg_rows, 'octets': octets, 'bins': out_bins},
          open('data/tt_spectrum_reference.json', 'w', encoding='utf-8'), indent=1)
print('written data/tt_spectrum_reference.json')
