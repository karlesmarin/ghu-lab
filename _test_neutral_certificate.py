"""Replay exact identities and bind them to the package the UI downloads."""
import base64
import hashlib
import io
import json
from pathlib import Path
import runpy
import zipfile

root=Path(__file__).resolve().parent
source=(root/"src/modules/neutral_complex_reference.mjs").read_text(encoding="utf-8")
ref=json.loads(source.split("NCX_REFERENCE=",1)[1].strip().removesuffix(";"))
raw=base64.b64decode(ref["base64"],validate=True)
assert hashlib.sha256(raw).hexdigest()==ref["sha256"]
checks=1
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
    assert set(archive.namelist())=={"certificate.json","PROOF.txt","verify.py","receipt.json"}
    checks+=1
    for name in archive.namelist():
        assert archive.read(name)==(root/"proof/neutral-complex"/name).read_bytes()
        checks+=1
    data=json.loads(archive.read("certificate.json"))
    assert data==ref["certificate"]
    checks+=1
verifier=runpy.run_path(str(root/"proof/neutral-complex/verify.py"))
receipt=verifier["verify"](data)
assert receipt["status"]=="VERIFIED" and receipt["checks"]==ref["receipt"]["checks"]
checks+=len(receipt["checks"])
print(f"{checks} passed, 0 failed (finite neutral proof replay and download binding)")
