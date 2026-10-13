"""Verify the byte integrity of the downloaded certificate bundle; no physical certification."""
from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'proof/manifest.json').read_text(encoding='utf-8'))
errors=[]
for row in manifest['files']:
 p=(root/row['path']).resolve()
 if not p.is_relative_to(root) or not p.is_file():errors.append(row['path']+': missing');continue
 if hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:errors.append(row['path']+': digest mismatch')
if errors:raise SystemExit('\n'.join(errors))
print(json.dumps({'passed':True,'files':len(manifest['files']),'scope':'Byte integrity only; replay commands are listed in the catalogue'}))
