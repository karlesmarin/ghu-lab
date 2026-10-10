"""PDF systematic of the q qbar luminosity: NNPDF23_lo_as_0130_qed (this laboratory's set) versus cteq6l1 (the set
CMS used for its dijet model predictions, arXiv:1911.03947 Sec. 7), at mu = sqrt(shat), sqrt(s) = 13 TeV.

    docker run --rm -v <repo>:/w -w /w --entrypoint bash ghu-pdf:local -c \
      "cd /opt/lhapdf && micromamba run -n base curl -sL https://lhapdfsets.web.cern.ch/current/cteq6l1.tar.gz | tar xz \
       && cd /w && micromamba run -n base python tools/pdf_systematic.py"
-> data/pdf_systematic_cteq6l1.json

It explains the high-mass drift of the coloron control (ours/CMS = 1.10 at 6 TeV, 1.50 at 7, 3.0 at 8): the
luminosity ratio is the same drift, so above ~6 TeV a mass limit depends on the PDF set.
"""
import json
import math
import lhapdf
import numpy as np

A, B = lhapdf.mkPDF('NNPDF23_lo_as_0130_qed', 0), lhapdf.mkPDF('cteq6l1', 0)


def f(p, pid, x, mu):
    return 0.0 if x >= 1 else p.xfxQ(pid, x, mu) / x


def lumi(p, tau, mu, n=400):
    ys = np.linspace(math.log(tau), 0.0, n + 1); h = (ys[-1] - ys[0]) / n
    w = np.ones(n + 1); w[1:-1:2] = 4; w[2:-1:2] = 2
    tot = 0.0
    for q in (1, 2, 3, 4, 5):
        vals = [f(p, q, math.exp(y), mu) * f(p, -q, tau / math.exp(y), mu) + f(p, -q, math.exp(y), mu) * f(p, q, tau / math.exp(y), mu) for y in ys]
        tot += h / 3 * float(np.dot(w, vals))
    return tot


rows = []
for M in range(1000, 8001, 500):
    tau = (M / 13000.0) ** 2
    a, b = lumi(A, tau, M), lumi(B, tau, M)
    rows.append({'M_GeV': M, 'NNPDF23lo': a, 'cteq6l1': b, 'ratio': a / b})
out = {'schema': 'ghu-pdf-systematic-v1', 'sets': [A.set().name, B.set().name], 'ids': [A.lhapdfID, B.lhapdfID],
       'lhapdf_version': lhapdf.version(), 'channel': 'sum over u,d,s,c,b of q qbar luminosity, equal weights', 'rows': rows}
json.dump(out, open('data/pdf_systematic_cteq6l1.json', 'w', encoding='utf-8'), indent=1)
print([(r['M_GeV'], round(r['ratio'], 3)) for r in rows])
