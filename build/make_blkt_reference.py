"""Reference values for the special functions blkt.mjs implements, at 40 digits, from mpmath.

Run inside the sage image:  sage -python ref_specfun.py
Nothing here is ours: mpmath computes psi, E_1 and Gamma(a,x) to arbitrary precision, so the JS
is being held to an instrument it does not share a line of code with.
"""
import json

from mpmath import mp, mpf, digamma, e1, gammainc, pi

mp.dps = 40

out = {"digamma": {}, "e1": {}, "gamma_minus2": {}, "note": "mpmath, mp.dps = 40"}

for z in ["0.5", "1", "2.7", "11.4", "5000"]:
    out["digamma"][z] = str(digamma(mpf(z)))

for x in ["0.1", "1", "5", "20", "0.0025"]:
    out["e1"][x] = str(e1(mpf(x)))

# Gamma(-2, x), the upper incomplete gamma
for x in ["0.05", "0.6", "3", "0.000625"]:
    out["gamma_minus2"][x] = str(gammainc(mpf(-2), mpf(x)))

# and the object the potential actually needs: int_0^L dl l exp(-x^2/l) = x^4 Gamma(-2, x^2/L)
out["potential_integral"] = {}
for x, L in [("0.5", "400"), ("1.2", "400"), ("2.0", "1600")]:
    xx, LL = mpf(x), mpf(L)
    out["potential_integral"]["x=%s,L=%s" % (x, L)] = str(xx ** 4 * gammainc(mpf(-2), xx * xx / LL))

print(json.dumps(out, indent=1))
