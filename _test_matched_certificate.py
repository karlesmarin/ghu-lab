"""Checks binding between the shipped display and its replayed certificate."""
import base64,hashlib,io,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def module(name):
    body=(ROOT/"src/modules"/name).read_text(encoding="utf-8")
    return json.loads(body.split(" = ",1)[1].strip().rstrip(";"))
cert=module("matched_profiles_certificate.mjs")
refs=module("matched_profiles_reference.mjs")
raw=base64.b64decode(cert["base64"],validate=True)
passed=0
def check(value):
    global passed
    assert value
    passed+=1
check(hashlib.sha256(raw).hexdigest()==cert["sha256"])
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    check(set(z.namelist())=={"README.txt","proof.txt","verify.py","receipt.json","reports.json","VERIFIED.json","SHA256SUMS.json"})
    manifest=json.loads(z.read("SHA256SUMS.json"))
    check(manifest==cert["files_sha256"])
    for name,digest in manifest.items():check(hashlib.sha256(z.read(name)).hexdigest()==digest)
    evidence=json.loads(z.read("VERIFIED.json"))
    check(evidence["status"]=="passed" and evidence["checks_passed"]==cert["checks"] and cert["checks"]>=190)
    check(evidence["sage_version"]==cert["sage_version"])
    for name,key in [("receipt.json","receipt_sha256"),("reports.json","reports_sha256"),("verify.py","verifier_sha256"),("proof.txt","proof_sha256")]:
        check(evidence[key]==manifest[name])
    check(json.loads(z.read("reports.json"))==refs)
    check({r["parameters"]["t"] for r in refs}=={"1/4","1/2"} and len(refs)==2)
    check(all(r["parameters"]["width"]=="1/8" and r["parameters"]["alpha"]=="1/20" and r["parameters"]["degree"]==3 for r in refs))
    check(b"from excovery" not in z.read("verify.py"))
print(str(passed)+" passed, 0 failed (display bound to replayed independent certificate)")
