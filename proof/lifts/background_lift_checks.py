"""Exact local lift audit. No global consistency or Lean certification claim."""
from pathlib import Path
import hashlib, itertools, json, sys
HERE = Path(__file__).resolve().parent
SOURCE = HERE/'action_source.txt'
text = SOURCE.read_text(encoding='utf-8')
definition = 'U6=prod(cg[12:]);Ua=-1j*U6@prod(cg[:10]);Ub=-U6@prod(cg[:4])'
assert definition in text
checks = []
def ck(name, value):
    assert value, name
    checks.append(name)
# (phase, mask) means i**phase times the ascending Clifford monomial.
# Gamma_j**2=1 and Gamma_i Gamma_j=-Gamma_j Gamma_i for i!=j.
def mul(a, b):
    p, x = a; q, y = b
    crossings = sum((y & ((1 << j)-1)).bit_count() for j in range(20) if (x >> j) & 1)
    return ((p+q+2*crossings) % 4, x ^ y)
def product(indices):
    out = (0, 0)
    for j in indices: out = mul(out, (0, 1 << j))
    return out
def phase(k, a): return ((a[0]+k) % 4, a[1])
one = (0,0); minus = (2,0)
for j in range(20):
    ck('Clifford square '+str(j+1), mul((0,1<<j),(0,1<<j)) == one)
for j,k in itertools.combinations(range(20),2):
    ck('Clifford anticommutation '+str((j+1,k+1)), mul((0,1<<j),(0,1<<k)) == phase(2,mul((0,1<<k),(0,1<<j))))
t6 = product(range(12,20))
ta = mul(t6,product(range(10)))
tb = mul(t6,product(range(4)))
raw = {'t6':t6, 'ta':ta, 'tb':tb}
actual = {'U6':t6, 'Ua':phase(3,ta), 'Ub':phase(2,tb)}
ck('Raw degrees 8,18,12', [x[1].bit_count() for x in raw.values()] == [8,18,12])
ck('Raw squares +1,-1,+1', [mul(x,x) for x in raw.values()] == [one,minus,one])
ck('Published representation matrices are involutions', all(mul(x,x)==one for x in actual.values()))
ck('All raw lifts commute', all(mul(x,y)==mul(y,x) for x,y in itertools.combinations(raw.values(),2)))
ck('Omitting phase -i fails involution', mul(ta,ta)!=one)
ck('Only odd powers of i repair ta square', [k for k in range(4) if mul(phase(k,ta),phase(k,ta))==one] == [1,3])
vol = product(range(20))
central = [one,minus,vol,phase(2,vol)]
ck('Four central Clifford candidates square to +1', all(mul(z,z)==one for z in central))
ck('Central changes do not repair ta square', all(mul(mul(z,ta),mul(z,ta))==minus for z in central))
# Independent Jordan-Wigner basis action, matching source cg construction.
def gamma_action(j, state):
    mode = j//2; bit = (state >> (9-mode)) & 1
    prefix = state >> (10-mode)
    p = 2*prefix.bit_count() + ((1+2*bit) if j%2 else 0)
    return p%4, state ^ (1 << (9-mode))
def apply(a, state):
    p, mask = a
    for j in reversed(range(20)):
        if (mask >> j)&1:
            q,state = gamma_action(j,state); p = (p+q)%4
    return p,state
for v in range(32):
    for h in range(16):
        state = (v<<5)+(((v.bit_count()+h.bit_count())%2)<<4)+h
        ck('Even half-spin basis '+str(state), state.bit_count()%2==0)
        expected = [2*h.bit_count()%4, 2*(v.bit_count()+h.bit_count())%4, 2*((v>>3).bit_count()+h.bit_count())%4]
        for (name,a), p in zip(actual.items(),expected):
            ck(name+' factorization state '+str(state), apply(a,state)==(p,state))
        ck('Volume eigenvalue -1 state '+str(state), apply(vol,state)==(2,state))
        ck('Raw ta eigenvalue is imaginary state '+str(state), apply(ta,state)[0]%2==1)
report = dict(passed=True, check_count=len(checks), arithmetic='integer phases modulo four; independent Jordan-Wigner basis action', source=SOURCE.name, source_sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(), source_definition=definition, raw_degrees=[8,18,12], raw_squares=[1,-1,1], representation_squares=[1,1,1], negative_control='Removing -i from Ua gives square -1', scope='Local Clifford and representation identities only; no proof of global bundle admissibility, anomaly cancellation or novelty', lean_certified=False)
if sys.argv[1:]==['--check']:
    assert json.loads((HERE/'background_lift_checks.json').read_text())==report
elif not sys.argv[1:]:
    (HERE/'background_lift_checks.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
else: raise SystemExit('Use no args or --check')
print(json.dumps(report))
