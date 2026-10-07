"""The live app's opt-in localhost bridge is physically absent from an Edition."""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT/'build'))
import build_app
from editiongate import check
out=ROOT/'.tmp/research-offline.html';out.parent.mkdir(exist_ok=True)
build_app.build(edition=True,out_path=out)
text=out.read_text(encoding='utf-8');violations,waivers=check(text)
assert not violations and not waivers,(violations,waivers)
assert 'const RX_NETWORK_ENABLED=false;' in text
assert 'return await fetch(' not in text
assert 'Offline Edition · import results instead' in text
assert 'RX_EXTERNAL_REFERENCE' in text
print('5 passed, 0 failed (offline Edition strips the optional scientific network bridge)')
