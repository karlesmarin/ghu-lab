"""Replay the four Lean files and the newly installed portable checks; preserve historical logs."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
version=subprocess.check_output(['lean','--version'],text=True).strip()
assert '4.27.0' in version,version
rows=[]
for rel in ['proof/su7/SU7Certificates.lean','proof/quantization/GHUQuantization.lean','proof/quantization/SpinPeriod.lean','proof/u2/U2Certificate.lean']:
 p=ROOT/rel;src=p.read_text(encoding='utf-8')
 code=re.sub(r'/\-.*?\-/','',src,flags=re.S)
 assert not re.search(r'\b(sorry|admit|native_decide|axiom|unsafe)\b',code),rel
 r=subprocess.run(['lean',str(p)],text=True,capture_output=True,check=True,timeout=180)
 assert not r.stderr and not any(x in r.stdout for x in ['sorryAx','warning:','error:']),r.stdout
 count=len(re.findall(r'^theorem\s+',code,re.M));dep_lines=[x for x in r.stdout.splitlines() if 'axioms' in x]
 assert len(dep_lines)==count,(rel,count,len(dep_lines))
 deps={}
 for line in dep_lines:
  name=line.split("'")[1];m=re.search(r'\[([^\]]*)\]',line);a=[x.strip() for x in m[1].split(',')] if m else []
  assert set(a)<={'propext','Classical.choice','Quot.sound'},line
  deps[name]=a
 rows.append(dict(path=rel,theorems=count,sha256=sha(p),axiom_dependencies=deps,passed=True))
 if '/su7/' in rel:
  (ROOT/'proof/su7/lean-4.27.0.log').write_text(r.stdout,encoding='utf-8')
commands=[['python','proof/quantization/verify_lean.py','--check'],['python','proof/quantization/verify_spin.py','--check'],['python','proof/u2/verify_lean.py','--check'],['node','proof/quantization/test_lab.mjs','--check'],['node','proof/quantization/test_spin.mjs','--check'],['python','proof/lifts/background_lift_checks.py'],['python','proof/lifts/background_lift_checks.py','--check'],['python','proof/boundary-research/certify.py','--check']]
checks=[]
commands.extend([['node','proof/u2/lab_crosscheck.mjs','--check'],['python','proof/quantization/literature_checks.py','--check']])
for command in commands:
 r=subprocess.run(command,cwd=ROOT,text=True,encoding='utf-8',capture_output=True,check=True,timeout=180)
 checks.append(dict(command=command,passed=True,output=r.stdout.strip()))
report=dict(passed=True,lean_version=version,lean=rows,checks=checks,scope='Arithmetic replay and scoped computational checks; topology and full physical consistency not formalized')
(ROOT/'proof/replay.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(passed=True,lean_files=len(rows),formal_theorems=sum(r['theorems'] for r in rows),replay_commands=len(checks))))
