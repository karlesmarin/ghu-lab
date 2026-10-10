"""Parton luminosities at the LHC, pinned once (DESIGN D7), for s-channel resonance cross sections in the browser.

    docker run --rm -v <repo>:/w -w /w ghu-pdf:local python tools/make_parton_lumi.py   -> data/parton_lumi_13TeV.json

    dL_ab/dtau (tau, mu) = int_tau^1 dx/x [ f_a(x,mu) f_b(tau/x,mu) + (a <-> b) ],   tau = shat/s
tabulated for q qbar (q = u, d, s, c, b) and g g, at sqrt(s) = 13 TeV, on sqrt(shat) in [0.2, 8] TeV (10 GeV steps),
for the factorisation scale mu = sqrt(shat) and mu = sqrt(shat)/2 (the second is the scale-variation witness).

Certificates written beside the numbers:
  - integration: every entry recomputed with half the panels; the worst relative shift is stored;
  - the PDF itself: momentum sum rule  sum_f int x f dx = 1  and valence sums  int (u - ubar) = 2, int (d - dbar) = 1
    at mu = 100 GeV and 3 TeV, evaluated on this same installation;
  - provenance: LHAPDF version, set name, member, LHAPDF ID, alpha_s(MZ) of the set.
"""
import json
import math
import lhapdf
import numpy as np

SET, MEMBER, SQRTS = 'NNPDF23_lo_as_0130_qed', 0, 13000.0
p = lhapdf.mkPDF(SET, MEMBER)


def f(pid, x, mu):
    if x >= 1.0:          # LHAPDF refuses x = 1; every PDF vanishes there
        return 0.0
    return p.xfxQ(pid, x, mu) / x


def lumi(a, b, tau, mu, n):
    # integral over y = ln x in [ln tau, 0], Simpson with n panels: dx/x = dy
    ys = np.linspace(math.log(tau), 0.0, n + 1)
    h = (ys[-1] - ys[0]) / n
    vals = []
    for y in ys:
        x = math.exp(y)
        x2 = tau / x
        vals.append(f(a, x, mu) * f(b, x2, mu) + f(b, x, mu) * f(a, x2, mu))
    w = np.ones(n + 1); w[1:-1:2] = 4; w[2:-1:2] = 2
    return h / 3 * float(np.dot(w, vals))


def sumrules(mu, n=20000):
    xs = np.logspace(-9, math.log10(1 - 1e-9), n)
    def integ(g):
        y = np.array([g(x) for x in xs])
        return float(np.trapezoid(y, xs))      # numpy 2 removed np.trapz
    mom = integ(lambda x: sum(p.xfxQ(i, x, mu) for i in [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 21]) + p.xfxQ(22, x, mu))
    uv = integ(lambda x: (p.xfxQ(2, x, mu) - p.xfxQ(-2, x, mu)) / x)
    dv = integ(lambda x: (p.xfxQ(1, x, mu) - p.xfxQ(-1, x, mu)) / x)
    return {'mu_GeV': mu, 'momentum': mom, 'u_valence': uv, 'd_valence': dv}


rules = [sumrules(100.0), sumrules(3000.0)]          # cheap checks FIRST: a failure here must not cost the table
print('sum rules', rules, flush=True)
grid = [round(m, 3) for m in np.arange(200.0, 8000.0 + 1e-9, 10.0)]
channels = {'uu': (2, -2), 'dd': (1, -1), 'ss': (3, -3), 'cc': (4, -4), 'bb': (5, -5), 'gg': (21, 21)}
table, worst = {}, 0.0
for scale_name, sfac in (('mu=sqrt(shat)', 1.0), ('mu=sqrt(shat)/2', 0.5)):
    table[scale_name] = {}
    for ch, (a, b) in channels.items():
        col = []
        for m in grid:
            tau = (m / SQRTS) ** 2
            mu = sfac * m
            fine, coarse = lumi(a, b, tau, mu, 400), lumi(a, b, tau, mu, 200)
            if ch == 'gg':
                fine, coarse = fine / 2, coarse / 2      # gg: the (a<->b) term double counts identical partons
            worst = max(worst, abs(fine - coarse) / abs(fine))
            col.append(fine)
        table[scale_name][ch] = col
    print(scale_name, 'done; worst relative shift so far', worst, flush=True)

out = {'schema': 'ghu-parton-lumi-v1', 'sqrts_GeV': SQRTS,
       'pdf': {'set': SET, 'member': MEMBER, 'lhapdf_id': p.lhapdfID, 'lhapdf_version': lhapdf.version(),
               'alphas_MZ': p.alphasQ(91.1876)},
       'definition': 'dL_ab/dtau = int_tau^1 dx/x [f_a(x) f_b(tau/x) + (a<->b)]; for gg the identical-parton factor 1/2 is applied; q qbar entries are per flavour',
       'grid_sqrtshat_GeV': grid, 'tables': table,
       'certificates': {'integration': {'rule': 'Simpson in ln x, 400 panels', 'worstRelativeShiftVs200': worst},
                        'sum_rules': rules}}
with open('data/parton_lumi_13TeV.json', 'w', encoding='utf-8') as fh:
    json.dump(out, fh)
print(json.dumps(out['certificates'], indent=1))
