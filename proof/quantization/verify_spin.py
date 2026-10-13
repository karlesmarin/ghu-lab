from pathlib import Path
import hashlib,json,re,subprocess,sys
HERE=Path(__file__).resolve().parent
src=HERE/'SpinPeriod.lean'
assert not re.search(r'\b(sorry|admit|native_decide|axiom|unsafe)\b',src.read_text(encoding='utf-8-sig'))
run=subprocess.run(['lean',str(src)],capture_output=True,text=True,check=True,timeout=120)
assert not run.stderr and 'warning:' not in run.stdout and 'error:' not in run.stdout
names=['universal_basis','spin_basis','universal_implies_spin','half_square_spin',
       'half_square_not_universal','q6_congruence','q6_implies_six']
deps={}
for name in names:
    line=next(s for s in run.stdout.splitlines() if s.startswith("'SpinPeriod."+name+"'"))
    if 'does not depend on any axioms' in line: axioms=[]
    else: axioms=[s.strip() for s in re.search(r'\[([^\]]*)\]',line)[1].split(',')]
    assert set(axioms)<= {'propext','Quot.sound','Classical.choice'}
    deps[name]=axioms
out=dict(passed=True,theorems=len(names),axioms=deps,
         version=subprocess.run(['lean','--version'],capture_output=True,text=True,check=True).stdout.strip(),
         source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),
         scope='Arithmetic only. Spin geometry, bundles, Wu formula and differential actions are not formalized.')
if sys.argv[1:]==['--check']:
    assert json.loads((HERE/'spin_lean_checks.json').read_text())==out
    assert (HERE/'spin_lean_output.txt').read_text()==run.stdout
elif not sys.argv[1:]:
    (HERE/'spin_lean_checks.json').write_text(json.dumps(out,indent=2)+'\n')
    (HERE/'spin_lean_output.txt').write_text(run.stdout)
else: raise SystemExit('Use no args or --check')
print(json.dumps(dict(passed=True,theorems=len(names))))
