"""Replay the Lean kernel check and audit axiom dependencies; --check is read only."""
from pathlib import Path
import hashlib, json, re, subprocess, sys
HERE = Path(__file__).resolve().parent
ro = sys.argv[1:] == ['--check']
if sys.argv[1:] not in ([], ['--check']): raise SystemExit('Use no args or --check')
if (HERE/'SEALED').exists() and not ro: raise SystemExit('Sealed')
src = HERE/'U2Certificate.lean'
assert not re.search(r'\b(sorry|admit|native_decide|axiom|unsafe)\b', src.read_text())
version = subprocess.run(['lean', '--version'], check=True, capture_output=True, text=True).stdout.strip()
run = subprocess.run(['lean', str(src)], check=True, capture_output=True, text=True, timeout=120)
assert not run.stderr and 'warning:' not in run.stdout and 'error:' not in run.stdout
names = ['positive_identity', 'positive_joint', 'positive_not_separate',
         'corrected_criterion', 'separate_sufficient', 'joint_does_not_imply_separate',
         'rational_corrected_criterion', 'two_samples_suffice']
deps = {}
for name in names:
    match = re.search(r"'U2Certificate\."+name+r"' depends on axioms: \[([^\]]*)\]", run.stdout)
    assert match, name
    axioms = [a.strip() for a in match[1].split(',') if a.strip()]
    assert set(axioms) <= {'propext', 'Classical.choice', 'Quot.sound'}, (name, axioms)
    deps[name] = axioms
result = dict(passed=True, theorems=len(names), lean_version=version,
              source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),
              axiom_dependencies=deps,
              scope='Integer polynomial arithmetic, including rational coefficients encoded with a common nonzero denominator. Lie theoretic translation and physical conclusions are outside Lean.')
out = HERE/'lean_checks.json'
if ro:
    assert json.loads(out.read_text()) == result
    assert (HERE/'lean_output.txt').read_text() == run.stdout
else:
    out.write_text(json.dumps(result, indent=2)+'\n')
    (HERE/'lean_output.txt').write_text(run.stdout)
print(json.dumps(dict(passed=True, theorems=len(names), read_only=ro)))
