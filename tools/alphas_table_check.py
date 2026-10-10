"""alphas_table_check.py — the PDF set's own α_s(Q) against the lab's one-loop running from its α_s(M_Z).

    docker run --rm -v <repo>:/w -w /w ghu-pdf:local python tools/alphas_table_check.py  -> data/alphas_table_check.txt

Consultation T133 (finding 8) quoted the NNPDF2.3lo table as 0.09000948 at 1842.07 GeV against our one-loop 0.0905734.
This prints both at the masses the KK-gluon card uses, so the label in the card states a measured difference.
"""
import math

import lhapdf

SET = 'NNPDF23_lo_as_0130_qed'
pdf = lhapdf.mkPDF(SET, 0)
aZ, MZ, nf = pdf.alphasQ(91.1876), 91.1876, 6


def one_loop(mu):
    return aZ / (1 + aZ * ((33 - 2 * nf) / (12 * math.pi)) * 2 * math.log(mu / MZ))


print(f'{SET} (LHAPDF {lhapdf.version()}): alpha_s(MZ) = {aZ:.6f}')
for mu in (500, 1000, 1842.07, 2000, 3000, 3750, 5000, 8000):
    t = pdf.alphasQ(mu)
    print(f'mu = {mu:8.2f} GeV  table {t:.8f}  one-loop nf=6 {one_loop(mu):.8f}  ratio {one_loop(mu) / t:.5f}')
