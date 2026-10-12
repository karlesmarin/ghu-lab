"""A check-only rebuild preserves the artifact; changed content is not concealed."""
from pathlib import Path
from unittest.mock import patch
import datetime,sys
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT/'build'))
import build_app
out=ROOT/'.tmp/reproducible-build.html'
class Clock(datetime.datetime):
    minute=1
    @classmethod
    def now(cls,tz=None):return cls(2026,10,12,12,cls.minute)
with patch.object(build_app.datetime,'datetime',Clock):
    build_app.build(out_path=out);first=out.read_bytes()
    Clock.minute=2;build_app.build(out_path=out)
    assert out.read_bytes()==first,'Timestamp-only rebuild must retain exact bytes'
    changed=first.replace(b'<title>',b'<title>deliberately altered ',1)
    assert changed!=first
    out.write_bytes(changed);Clock.minute=3;build_app.build(out_path=out)
    final=out.read_bytes()
    assert b'deliberately altered' not in final,'A real content difference must be rebuilt'
    assert b'2026-10-12 12:03' in final,'A changed artifact receives the new build time'
print('4 passed, 0 failed (repeat builds preserve bytes; content changes rebuild)')
