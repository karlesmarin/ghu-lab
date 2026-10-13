from pathlib import Path
import hashlib,json,re,subprocess,sys
HERE=Path(__file__).resolve().parent
src=HERE/'GHUQuantization.lean'
assert not re.search(r'\b(sorry|admit|native_decide|axiom|unsafe)\b',src.read_text(encoding='utf-8-sig'))
run=subprocess.run(['lean',str(src)],capture_output=True,text=True,check=True,timeout=120)
assert not run.stderr and 'warning:' not in run.stdout and 'error:' not in run.stdout
names=['integral_basis_criterion','quotient_witness','cover_witness','cover_misses_fraction',
       'parent_annihilator','standard_tensor_obstruction','no_standard_tensor_parent_match','residue_mod_three']
deps={}
for name in names:
    line=next(s for s in run.stdout.splitlines() if s.startswith("'GHUQuantization."+name+"'"))
    if 'does not depend on any axioms' in line: axioms=[]
    else: axioms=[s.strip() for s in re.search(r'\[([^\]]*)\]',line)[1].split(',')]
    assert set(axioms)<= {'propext','Quot.sound','Classical.choice'}
    deps[name]=axioms
out=dict(passed=True,theorems=len(names),axioms=deps,
         version=subprocess.run(['lean','--version'],capture_output=True,text=True,check=True).stdout.strip(),
         source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),
         scope='Universal arithmetic only; physical assumptions and topology supplied externally')
if sys.argv[1:]==['--check']:
    assert json.loads((HERE/'lean_checks.json').read_text())==out
    assert (HERE/'lean_output.txt').read_text()==run.stdout
elif not sys.argv[1:]:
    (HERE/'lean_checks.json').write_text(json.dumps(out,indent=2)+'\n')
    (HERE/'lean_output.txt').write_text(run.stdout)
else: raise SystemExit('Use no args or --check')
print(json.dumps(dict(passed=True,theorems=len(names))))
