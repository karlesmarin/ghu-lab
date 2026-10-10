"""Extract the RS reference point of Casagrande, Goertz, Haisch, Neubert, Pfoh, arXiv:0807.4937 (JHEP 10 (2008) 094),
Sec. 6.3, from the paper's own LaTeX source, so no number is retyped by hand.

    python tools/make_rs_benchmark.py <path to paper_v3.tex of arXiv:0807.4937v3>  -> data/rs_benchmark_cghnp2008.json

What is extracted, with its locator:  eq:cparameter (nine bulk-mass parameters), eq:yukawas (Y_u, Y_d), eq:massesexact
(the masses the paper obtains from the exact eigenvalue equation), and the sentence fixing L = ln(10^16), M_KK = 1.5 TeV.
The paper's conventions (c_Q = +M_Q/k, c_q = -M_q/k, F(c)^2 = (1+2c)/(1-eps^{1+2c})) are recorded together with the map
to this laboratory's ruFermion convention: c_lab(LH doublet) = -c_Q, c_lab(RH singlet) = +c_q (identical F, checked in
_test_rs_fermions.mjs).
"""
import hashlib
import json
import re
import sys

tex_path = sys.argv[1]
raw = open(tex_path, 'rb').read()
tex = raw.decode('utf-8', errors='replace')


def block(label):
    i = tex.index(r'\label{' + label + '}')
    j = tex.index(r'\eeq', i) if r'\eeq' in tex[i:i + 4000] else tex.index(r'\end{eqnarray}', i)
    return tex[i:j]


cblock = block('eq:cparameter')
cs = dict(re.findall(r'c_\{([QudQ]_\d)\}\s*&=\s*([+-]?\d\.\d+)', cblock))
assert len(cs) == 9, cs

yblock = block('eq:yukawas')
num = r'([+-]?\s*\d\.\d+)\s*([+-])\s*(\d\.\d+)\s*\\hspace\{0\.5mm\}\s*i'


def matrix(name):
    part = yblock.split(r'\bm{Y}_' + name)[1]
    part = part.split(r'\right)')[0]
    entries = [(float(a.replace(' ', '')), float(s + b)) for a, s, b in re.findall(num, part)]
    assert len(entries) == 9, (name, len(entries))
    return [[list(entries[3 * r + k]) for k in range(3)] for r in range(3)]


Yu, Yd = matrix('u'), matrix('d')

mblock = block('eq:massesexact')
masses = {}
for q, val, unit in re.findall(r'm_([udcstb])\s*&?=\s*(\d+\.?\d*)\\,\\mbox\{(MeV|GeV)\}', mblock):
    masses[q] = float(val) * (1e-3 if unit == 'MeV' else 1.0)
assert len(masses) == 6, masses

assert r'$L=\ln (10^{16})$' in tex and r'$\Mkk=1.5$\,TeV as the default KK scale' in tex

out = {
    'schema': 'ghu-rs-benchmark-v1',
    'source': {'arXiv': '0807.4937v3', 'journal': 'JHEP 10 (2008) 094',
               'authors': 'Casagrande, Goertz, Haisch, Neubert, Pfoh',
               'locators': {'c': 'eq:cparameter (Sec. 6.3)', 'Y': 'eq:yukawas', 'masses_exact': 'eq:massesexact',
                            'L_and_MKK': 'Sec. 6.3, first paragraph'},
               'tex_sha256': hashlib.sha256(raw).hexdigest()},
    'paper_conventions': {'c_doublet': 'c_Q = +M_Q/k', 'c_singlet': 'c_q = -M_q/k',
                          'F': 'sgn[cos(pi c)] sqrt((1+2c)/(1-eps^{1+2c}))', 'eps': 'e^{-L}',
                          'mass_ZMA': 'singular values of (v/sqrt2) F(c_Q) Y F(c_q)', 'v_GeV': 246.0,
                          'note_v': 'paper: "v approx 246 GeV" (eq. near line 166); the exact SM inputs are in its App. B'},
    'map_to_lab': {'LH_doublet': 'c_lab = -c_Q', 'RH_singlet': 'c_lab = +c_q'},
    'L': '36.8413614879047', 'L_expr': 'ln(10^16)', 'MKK_TeV': 1.5,
    'c_paper': cs, 'Yu': Yu, 'Yd': Yd, 'masses_exact_GeV_at_MKK': masses,
    'paper_remark': 'ZMA masses essentially equal the exact ones except m_t, about 5.5 GeV larger in the ZMA',
}
with open('data/rs_benchmark_cghnp2008.json', 'w', encoding='utf-8') as fh:
    json.dump(out, fh, indent=1, ensure_ascii=False)
    fh.write('\n')
print(json.dumps({'c': cs, 'Yu00': Yu[0][0], 'Yd22': Yd[2][2], 'masses': masses}, indent=0))
