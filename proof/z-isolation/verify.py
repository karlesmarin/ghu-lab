"""Certified neutral-mode enclosures for a declared GHU unit-square model.
Maintained in Excovery; exported copies are replay evidence, not a second engine.
encaje: reuses SymPy/Fractions and the proved rotated trial; no new FEM solver.
"""
from __future__ import annotations
import argparse
import base64
from copy import deepcopy
from fractions import Fraction as Q
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile

SCHEMA = "ghu-z-isolation-v1"
MODEL = {
    "geometry": "unit_square", "L5": "1", "L6": "1",
    "muOmega": "1", "muPhi": "1", "eta": "0",
    "theta_domain": "0 < theta <= 1/4; rational queries",
    "K": [[0,0,-1,0,0],[0,0,0,0,1],[1,0,0,0,0],[0,0,0,0,0],[0,-1,0,0,0]],
    "b": ["1/2","0","0","1","-1/2"],
    "C": [[0,1,0,0,0],[0,0,0,0,1]],
    "N0_indices": [0,3,4], "trial_n": [2,0,0,-1,0],
    "mass_metric": "L2", "omitted_exact_zero_directions": 3,
}
SCOPE = "Continuous active neutral block only; fixed geometry and walls. No certified Wilson derivative, RZW, vacuum or experimental matching."
POINTS = ("1/10", "1/5", "1/4")

def rational(text):
    if not isinstance(text, str) or not re.fullmatch(r"[0-9]{1,12}(?:/[1-9][0-9]{0,11})?", text):
        raise ValueError("Use a bounded exact nonnegative rational string")
    return Q(text)

def enclose(theta):
    t = rational(theta)
    if not 0 < t <= Q(1,4):
        raise ValueError("Certified domain: 0 < theta <= 1/4")
    rho = Q(4,5)*t*t
    residual = Q(4,25)*t**4
    beta = Q(5,32)-t*t
    gap = beta-rho
    if not gap > 0 or not residual < rho*gap:
        raise ValueError("Temple hypotheses failed; no certificate")
    return dict(theta=str(t), lambda_lower=str(rho-residual/gap),
                lambda_upper=str(rho), lambda2_lower=str(beta),
                gap_lower=str(gap), residual_squared=str(residual),
                status="positive_simple_isolated", derivative_status="not_certified")

def certificate():
    return dict(schema=SCHEMA, model=deepcopy(MODEL), scope=SCOPE,
                cases=[enclose(t) for t in POINTS])

def verify(data):
    """Exact finite checks supporting PROOF.txt, including natural boundaries."""
    import sympy as s
    if set(data) != {"schema","model","scope","cases"} or data["schema"] != SCHEMA:
        raise ValueError("Schema")
    if data["model"] != MODEL or data["scope"] != SCOPE:
        raise ValueError("Uncertified model or scope")
    x,t = s.symbols("x t", real=True)
    K=s.Matrix(data["model"]["K"])
    b=s.Matrix([[s.Rational(z) for z in data["model"]["b"]]])
    C=s.Matrix(data["model"]["C"]); n=s.Matrix(data["model"]["trial_n"])
    P=s.diag(1,0,0,1,1); I=s.eye(5); G=C.T*C
    R=s.Matrix([[s.cos(t),0,-s.sin(t),0,0],[0,s.cos(t),0,0,s.sin(t)],
                [s.sin(t),0,s.cos(t),0,0],[0,0,0,1,0],[0,-s.sin(t),0,0,s.cos(t)]])
    v=R.subs(t,t*x)*n; dx=v.diff(x); Av=-v.diff(x,2)
    checks=[]
    def equal(name,a,b):
        d=a-b
        terms=list(d) if isinstance(d,s.MatrixBase) else [d]
        if any(s.simplify(s.trigsimp(z)) != 0 for z in terms):
            raise ValueError(name)
        checks.append(name)
    equal("skew generator",K.T,-K)
    equal("generator norm",K.T*K,s.diag(1,1,1,0,1))
    equal("rotation derivative",R.diff(t),K*R)
    equal("rotation isometry",R.T*R,I)
    equal("upper wall invariant",G*K,K*G)
    equal("kernel dimension at zero",s.Matrix.vstack(I-P,b,C).rank(),4)
    equal("left trial wall",b*n,s.zeros(1,1))
    equal("upper trial wall",C*v,s.zeros(2,1))
    equal("trial normalization",(v.T*v)[0],5)
    equal("left essential",(I-P)*v.subs(x,0),s.zeros(5,1))
    equal("right essential",(I-P)*R.T*v.subs(x,1),s.zeros(5,1))
    equal("left natural",P*(-dx.subs(x,0)+b.T*b*v.subs(x,0)),s.zeros(5,1))
    equal("right natural",P*R.T*dx.subs(x,1),s.zeros(5,1))
    rho=s.Rational(4,5)*t**2; residual=Av-rho*v
    equal("Rayleigh quotient",(v.T*Av)[0]/5,rho)
    equal("operator residual",(residual.T*residual)[0]/5,s.Rational(4,25)*t**4)
    equal("trace mean constant",s.integrate((1-x)**2,(x,0,1)),s.Rational(1,3))
    equal("wall row norm",(b*b.T)[0],s.Rational(3,2))
    c0,c1,c2,c4=s.symbols("c0 c1 c2 c4", real=True)
    c=s.Matrix([c0,c1,c2,2*c0,c4]); bc=(b*c)[0]
    equal("mean orthogonal decomposition",(c.T*c)[0],c1**2+c2**2+c4**2+s.Rational(4,5)*(bc+c4/2)**2)
    for name,left,right in [("x variance coefficient",Q(29,15)+Q(1,2),Q(16,5)),
                            ("y variance coefficient",Q(14,15)+Q(1,2),Q(16,5)),
                            ("upper wall coefficient",Q(14,5),Q(16,5))]:
        if left>right: raise ValueError(name)
        checks.append(name)
    equal("Temple positivity polynomial",rho*(s.Rational(5,32)-t**2-rho)-s.Rational(4,25)*t**4,
          t**2*(s.Rational(1,8)-s.Rational(8,5)*t**2))
    if not Q(5,32)-Q(9,5)*Q(1,4)**2 > 0 or not Q(1,8)-Q(8,5)*Q(1,4)**2 > 0:
        raise ValueError("Uniform parameter interval")
    checks.append("uniform parameter interval")
    if not isinstance(data["cases"],list) or len(data["cases"]) != 3:
        raise ValueError("Query count")
    for query,row in zip(POINTS,data["cases"]):
        # SymPy recomputes endpoints; the generator uses Python Fractions.
        tt=s.Rational(query); rr=rho.subs(t,tt); bb=s.Rational(5,32)-tt**2
        ee=s.Rational(4,25)*tt**4
        expected=dict(theta=query,lambda_lower=str(rr-ee/(bb-rr)),lambda_upper=str(rr),
                      lambda2_lower=str(bb),gap_lower=str(bb-rr),residual_squared=str(ee),
                      status="positive_simple_isolated",derivative_status="not_certified")
        if row!=expected: raise ValueError("Query enclosure: "+query)
        checks.append("query "+query)
    return dict(status="VERIFIED", checks=checks, method="exact algebra + external written functional proof")

def self_test(data):
    bad=[]
    for key in ("lambda_lower","lambda_upper","lambda2_lower","gap_lower","residual_squared"):
        d=deepcopy(data);d["cases"][1][key]="1";bad.append(d)
    for key,value in [("eta","1/40"),("muOmega","2"),("L6","2")]:
        d=deepcopy(data);d["model"][key]=value;bad.append(d)
    d=deepcopy(data);d["model"]["K"][0][2]=1;bad.append(d)
    d=deepcopy(data);d["cases"][1]["derivative_status"]="certified";bad.append(d)
    d=deepcopy(data);d["cases"].reverse();bad.append(d)
    d=deepcopy(data);d["scope"]="Full physical prediction";bad.append(d)
    for d in bad:
        try: verify(d)
        except ValueError: pass
        else: raise AssertionError("Corruption accepted")
    for t in ("0","1/3","-1/5","1/0",0.2,"NaN","1e-1","1/1000000000000"):
        try: enclose(t)
        except ValueError: pass
        else: raise AssertionError("Out-of-contract input accepted")
    return len(bad)+8

def export(lab):
    data=certificate(); receipt=verify(data)
    receipt["negative_checks"]=self_test(data)
    proof=Path(__file__).with_name("PROOF.txt").read_text(encoding="utf-8")
    if "5/16" not in proof or "Dom(A)" not in proof:
        raise ValueError("Missing functional proof")
    files={"certificate.json":(json.dumps(data,indent=2)+"\n").encode(),
           "PROOF.txt":proof.encode(),"verify.py":Path(__file__).read_bytes()}
    receipt["sha256"]={k:hashlib.sha256(v).hexdigest() for k,v in files.items()}
    files["receipt.json"]=(json.dumps(receipt,indent=2)+"\n").encode()
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,"w",zipfile.ZIP_DEFLATED) as z:
        for name,raw in files.items():
            info=zipfile.ZipInfo(name,(2026,10,28,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,raw)
    raw=buf.getvalue(); target=Path(lab)/"proof/z-isolation"
    target.mkdir(parents=True,exist_ok=True)
    for name,content in files.items(): (target/name).write_bytes(content)
    (target/"certificate.zip").write_bytes(raw)
    ref=dict(certificate=data,receipt=receipt,proof=proof,
             sha256=hashlib.sha256(raw).hexdigest(),base64=base64.b64encode(raw).decode())
    (Path(lab)/"src/modules/z_isolation_reference.mjs").write_text(
        "/* Generated certified data; replay package accompanies this reference. */\nexport const ZIS_REFERENCE="+
        json.dumps(ref,ensure_ascii=True,separators=(",",":"))+";\n",encoding="utf-8")
    return receipt

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("certificate",nargs="?")
    ap.add_argument("--export",metavar="LAB")
    ap.add_argument("--theta",help="Exact rational in (0,1/4]")
    ap.add_argument("--self-test",action="store_true")
    args=ap.parse_args()
    if args.export: out=export(args.export)
    elif args.theta: out=enclose(args.theta)
    else:
        data=json.loads(Path(args.certificate).read_text(encoding="utf-8")) if args.certificate else certificate()
        out=verify(data)
        if args.self_test: out["negative_checks"]=self_test(data)
    print(json.dumps(out,indent=2))

if __name__=="__main__": main()
