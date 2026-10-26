"""Exact certificate for one finite neutral complex; standard rank criteria.
Maintained in Excovery. The lab receives presentation data and replay evidence.
Run: python -m excovery.neutral_complex [--export LAB]
Replay: python verify.py certificate.json  (requires SymPy).
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
import zipfile

CERTIFICATE = {
  "schema": "ghu-neutral-complex-v1",
  "field": "C",
  "parameters": [
    "c",
    "s"
  ],
  "A": [
    [
      "1",
      "0",
      "0",
      "0",
      "0",
      "1",
      "0"
    ],
    [
      "0",
      "0",
      "1",
      "0",
      "0",
      "c",
      "-s"
    ]
  ],
  "M": [
    [
      "0",
      "1",
      "0",
      "0",
      "0"
    ],
    [
      "0",
      "0",
      "1",
      "0",
      "0"
    ],
    [
      "0",
      "c",
      "0",
      "0",
      "-s"
    ],
    [
      "-s",
      "0",
      "c",
      "0",
      "0"
    ],
    [
      "-1/2",
      "0",
      "0",
      "-1",
      "1/2"
    ],
    [
      "0",
      "-1",
      "0",
      "0",
      "0"
    ],
    [
      "0",
      "0",
      "0",
      "0",
      "-1"
    ]
  ],
  "q": [
    "1",
    "0",
    "0",
    "-1/2",
    "0"
  ],
  "h": [
    "0",
    "0",
    "0",
    "1",
    "0",
    "0",
    "0"
  ],
  "w": [
    "0",
    "-c",
    "0",
    "1",
    "0",
    "0",
    "0"
  ],
  "cases": [
    {
      "condition": "s != 0",
      "rankA": 2,
      "rankM": 5,
      "kernelA": 5,
      "kernelM": 0,
      "quotient": 0
    },
    {
      "condition": "s = 0",
      "rankA": 2,
      "rankM": 4,
      "kernelA": 5,
      "kernelM": 1,
      "quotient": 1
    }
  ],
  "scope": "Specified finite complex only; continuous-domain reduction and physical action matching are external."
}
PROOF = "FINITE NEUTRAL COMPLEX: STATEMENT AND PROOF\nVersion 1, 26 October 2026. Author: Carles Marin.\nThis is a certificate of a specified finite complex, not a new theorem.\n\nLet c,s be any complex scalars. Matrices A:C^7 -> C^2 and M:C^5 -> C^7\nare exactly those in certificate.json. No circle relation is needed.\nCoordinates in C^7: (alpha1,alpha2,beta1,beta2,chiO,chiP1,chiP2).\nUse zero-based row and column indices throughout.\n\n1. AM=0, so im M is contained in ker A. The A minor on columns (0,2)\nis 1, hence rank A=2 and dim ker A=5 for every c,s.\n2. The M minor on rows (0,1,3,4,6), all columns, is -s.\nThus for s!=0, rank M=5, and ker A/im M has dimension zero.\n3. The M minor on rows (0,1,4,6), columns (1,2,3,4), is 1.\nThus rank M>=4 everywhere. q=(1,0,0,-1/2,0) is nonzero and Mq=-s h,\nwhere h=(0,0,0,1,0,0,0). At s=0 this gives rank M<=4.\nConsequently rank M=4 and dim(ker A/im M)=1 at s=0.\n4. Ah=0. At s=0 the row w=(0,-c,0,1,0,0,0) annihilates M,\nwhereas wh=1. Therefore h represents a nonzero quotient class, and\nit spans this one-dimensional quotient. At s!=0, h=M(-q/s).\nThe disappearance of this class is exact, not a numerical tolerance.\n5. rank-nullity gives dim ker M=0 (s!=0) or 1 (s=0).\nThese are dimensions of different spaces, not additional physical states.\n\nThe verifier checks polynomial identities over Q[c,s], not sampled angles.\nThe proof supplies both upper and lower rank bounds; tests or hashes alone\nwould not do so. Computation uses existing SymPy exact linear algebra.\nStandard reference: rank-nullity and determinant rank criterion.\nNo mathematical originality is claimed.\n\nPHYSICAL APPLICATION (NOT PART OF THIS CERTIFICATE)\nSetting c=cos(theta),s=sin(theta) is allowed. To identify the quotient with\ncontinuous scalar zero modes one must independently prove the reduction\nof the chosen weak operator domain to these matrices and control the gauge\nrange. Matching that realization to the full action, corner conditions and\norbifold remains external. A Wilson-Higgs direction outside this block,\na Higgs mass, an experimental fit, and the vacuum are not certified.\nRelevant continuum background: Costabel-McIntosh, arXiv:0808.2614;\nboundary fields: Csaki-Hubisz-Meade, hep-ph/0510275, section 2.3.\nThese references do not assert this particular matrix result.\n"

def verify(data):
    import sympy as sp
    c, s = sp.symbols("c s")
    atoms = {str(n): sp.Integer(n) for n in (-1, 0, 1)}
    atoms.update({"1/2": sp.Rational(1, 2), "-1/2": -sp.Rational(1, 2),
                  "c": c, "-c": -c, "s": s, "-s": -s})
    if data.get("schema") != "ghu-neutral-complex-v1":
        raise ValueError("Wrong certificate schema")
    def matrix(rows):
        return sp.Matrix([[atoms[x] for x in row] for row in rows])
    A, M = matrix(data["A"]), matrix(data["M"])
    q, h, w = (matrix([data[k]]) for k in ("q", "h", "w"))
    q, h = q.T, h.T
    if (A.shape, M.shape, q.shape, h.shape, w.shape) != ((2,7),(7,5),(5,1),(7,1),(1,7)):
        raise ValueError("Wrong dimensions")
    checks = []
    def equal(name, left, right):
        delta = left-right
        values = list(delta) if isinstance(delta, sp.MatrixBase) else [delta]
        if any(sp.expand(v) != 0 for v in values):
            raise ValueError(name)
        checks.append(name)
    equal("AM = 0", A*M, sp.zeros(2,5))
    equal("A pivot minor = 1", A[:, [0,2]].det(), 1)
    equal("M generic minor = -s", M[[0,1,3,4,6], :].det(), -s)
    equal("M persistent minor = 1", M[[0,1,4,6], [1,2,3,4]].det(), 1)
    equal("q is nonzero", q[0], 1)
    equal("Mq = -s h", M*q, -s*h)
    equal("Ah = 0", A*h, sp.zeros(2,1))
    equal("wM vanishes at s=0", (w*M).subs(s,0), sp.zeros(1,5))
    equal("wh = 1", (w*h)[0], 1)
    expected = [
        dict(condition="s != 0",rankA=2,rankM=5,kernelA=5,kernelM=0,quotient=0),
        dict(condition="s = 0",rankA=2,rankM=4,kernelA=5,kernelM=1,quotient=1)]
    if data["cases"] != expected or data.get("field") != "C" or data.get("parameters") != ["c","s"]:
        raise ValueError("Invalid field, parameters or inferred rank claims")
    checks.append("rank-nullity conclusions match the proof")
    return dict(status="VERIFIED", sympy_version=sp.__version__, checks=checks,
                scope="Polynomial identities and rank certificate for the specified finite complex")

def export(lab):
    receipt = verify(CERTIFICATE)
    payload = {
        "certificate.json": json.dumps(CERTIFICATE,indent=2)+"\n",
        "PROOF.txt": PROOF,
        "verify.py": Path(__file__).read_text(encoding="utf-8"),
        "receipt.json": json.dumps(receipt,indent=2)+"\n"}
    memory = io.BytesIO()
    with zipfile.ZipFile(memory, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, text in sorted(payload.items()):
            info = zipfile.ZipInfo(name, (2026,10,26,0,0,0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, text.encode("utf-8"))
    raw = memory.getvalue()
    ref = dict(certificate=CERTIFICATE,proof=PROOF,receipt=receipt,
               sha256=hashlib.sha256(raw).hexdigest(),
               base64=base64.b64encode(raw).decode("ascii"))
    lab = Path(lab)
    if not (lab/"src/modules/boundary_research.mjs").is_file():
        raise ValueError("Expected the GHU lab source tree")
    target = lab/"proof/neutral-complex"
    target.mkdir(parents=True,exist_ok=True)
    for name,text in payload.items():
        (target/name).write_text(text,encoding="utf-8",newline="\n")
    (target/"certificate.zip").write_bytes(raw)
    (lab/"src/modules/neutral_complex_reference.mjs").write_text(
        "// Generated by the Excovery finite-complex certificate exporter.\n"
        "export const NCX_REFERENCE="+json.dumps(ref,ensure_ascii=True)+";\n",
        encoding="utf-8",newline="\n")
    return dict(status="EXPORTED",sha256=ref["sha256"],checks=len(receipt["checks"]))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("certificate",nargs="?",type=Path)
    parser.add_argument("--export",type=Path)
    args = parser.parse_args()
    if args.export and args.certificate:
        parser.error("Choose replay or export")
    data = json.loads(args.certificate.read_text(encoding="utf-8")) if args.certificate else CERTIFICATE
    print(json.dumps(export(args.export) if args.export else verify(data),indent=2))
if __name__ == "__main__":
    main()
