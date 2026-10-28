"""Bind the offline download to its exact replay and functional proof."""
import base64
import hashlib
import io
import json
from pathlib import Path
import runpy
import zipfile

root=Path(__file__).resolve().parent
ref=json.loads((root/'src/modules/z_isolation_reference.mjs').read_text(encoding='utf-8').split('ZIS_REFERENCE=',1)[1].strip().removesuffix(';'))
raw=base64.b64decode(ref['base64'],validate=True)
assert hashlib.sha256(raw).hexdigest()==ref['sha256']
checks=1
directory=root/'proof/z-isolation'
assert raw==(directory/'certificate.zip').read_bytes()
checks+=1
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    assert set(z.namelist())=={'certificate.json','PROOF.txt','verify.py','receipt.json'}
    checks+=1
    for name in z.namelist():
        assert z.read(name)==(directory/name).read_bytes()
        checks+=1
    assert json.loads(z.read('certificate.json'))==ref['certificate']
    assert json.loads(z.read('receipt.json'))==ref['receipt']
    assert z.read('PROOF.txt').decode()==ref['proof']
    checks+=3
for name,digest in ref['receipt']['sha256'].items():
    assert hashlib.sha256((directory/name).read_bytes()).hexdigest()==digest
    checks+=1
replay=runpy.run_path(str(directory/'verify.py'))
receipt=replay['verify'](ref['certificate'])
assert receipt['status']=='VERIFIED' and receipt['checks']==ref['receipt']['checks']
checks+=len(receipt['checks'])
neg=replay['self_test'](ref['certificate'])
assert neg==ref['receipt']['negative_checks']
checks+=neg
print(f'{checks} passed, 0 failed (neutral continuous proof, replay, corruptions and download binding)')
