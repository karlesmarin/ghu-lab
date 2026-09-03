#!/usr/bin/env sage -python
"""vacuum5d_sage_control.py -- the THIRD route for src/modules/vacuum5d.mjs: SageMath's own
linear algebra, sharing nothing with the JavaScript.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

For each (boundary condition, theta) below it builds P0 and P1' = W^-1 P1 over RDF, and for each
representation (fund, adj, anti, sym) and twist (e0, e1) counts the joint eigenspace
dim{v : rho(P0) v = e0 v, rho(P1') v = e1 v} and lists the folded eigenvalue angles of
rho(P1' P0) -- the massless content and the tower at the vacuum, by Sage.  Compared on
2026-09-03 with the module's own numbers (vac5Count, vac5Tower on the same cases): 200 of 200
agree.

  docker cp tools/vacuum5d_sage_control.py sage_pacemaker:/tmp/v.py
  MSYS_NO_PATHCONV=1 docker exec sage_pacemaker sage -python /tmp/v.py > sage.json

ONE TRAP, and it cost the first run 39 false mismatches: Sage's RDF `rank()` counts the 1e-16
pivots that cos(pi) and sin(pi) leave behind, so at theta = 1 and at complementary angles it
returned nullities that were too small -- and negative once, for a kernel that provably holds
the identity.  Nullity is taken from an SVD with an explicit tolerance instead.
"""
import json, sys, itertools
from sage.all import RDF, matrix, identity_matrix, pi, cos, sin, block_diagonal_matrix

CASES = [([1, 0, 0, 1], [0.3]), ([1, 0, 0, 1], [1.0]), ([2, 0, 0, 1], [0.37]), ([2, 0, 0, 1], [1.0]),
         ([1, 1, 1, 1], [0.3, 0.7]), ([2, 1, 1, 1], [0.41, 0.59]), ([3, 0, 0, 2], [0.3, 0.3]),
         ([3, 0, 0, 2], [0.3, 0.6]), ([1, 0, 3, 1], [0.25]), ([1, 2, 2, 1], [0.3, 0.7, 0.2])]

def matrices(bc, theta):
    p, q, r, s = bc; N = p + q + r + s
    A, B = min(p, s), min(q, r)
    P0 = matrix(RDF, N, N); P1 = matrix(RDF, N, N)
    off = [0, p, p + q, p + q + r, N]; SIGN = [(1, 1), (1, -1), (-1, 1), (-1, -1)]
    for a in range(4):
        for i in range(off[a], off[a + 1]):
            P0[i, i] = SIGN[a][0]; P1[i, i] = SIGN[a][1]
    pairs = []
    for k in range(A): pairs.append(("A", off[0] + k, off[3] + k, theta[k]))
    for k in range(B): pairs.append(("B", off[1] + k, off[2] + k, theta[A + k]))
    for kind, i, j, th in pairs:
        c, s_ = float(cos(pi * th)), float(sin(pi * th)); sg = 1 if kind == "A" else -1
        P1[i, i] = sg * c; P1[i, j] = sg * s_; P1[j, i] = sg * s_; P1[j, j] = -sg * c
    return N, P0, P1

def rep_matrix(M, rep):
    N = M.nrows()
    if rep == "fund": return M
    if rep == "adj":
        # X -> M X M on the N^2 coordinates, index a*N+b
        R = matrix(RDF, N * N, N * N)
        for a in range(N):
            for b in range(N):
                for c in range(N):
                    for d in range(N):
                        R[c * N + d, a * N + b] = M[c, a] * M[d, b]
        return R
    pairs = [(a, b) for a in range(N) for b in range(N) if (a < b if rep == "anti" else a <= b)]
    idx = {ab: k for k, ab in enumerate(pairs)}
    R = matrix(RDF, len(pairs), len(pairs))
    for col, (a, b) in enumerate(pairs):
        for c in range(N):
            for d in range(N):
                if rep == "anti":
                    if c >= d: continue
                    R[idx[(c, d)], col] += M[c, a] * M[d, b] - M[d, a] * M[c, b]
                else:
                    if c > d: continue
                    row = idx[(c, d)]
                    if a == b: R[row, col] += M[c, a] * M[c, a] if c == d else M[c, a] * M[d, a]
                    else: R[row, col] += 2 * M[c, a] * M[c, b] if c == d else M[c, a] * M[d, b] + M[d, a] * M[c, b]
    return R

out = []
for bc, theta in CASES:
    N, P0, P1 = matrices(bc, theta)
    rec = {"bc": bc, "theta": theta, "counts": {}, "angles": {}}
    for rep in ["fund", "adj", "anti", "sym"]:
        R0 = rep_matrix(P0, rep); R1 = rep_matrix(P1, rep); D = R0.nrows(); I = identity_matrix(RDF, D)
        for e0, e1 in [(1, 1), (1, -1), (-1, 1), (-1, -1)]:
            S = (R0 - e0 * I).stack(R1 - e1 * I)
            # Sage's RDF rank() counts 1e-16 pivots at the exact-zero points; nullity by SVD instead
            import numpy
            sv = numpy.linalg.svd(S.numpy(), compute_uv=False)
            null = D - int((sv > 1e-9 * max(float(sv.max()), 1.0)).sum())
            if rep == "adj" and e0 > 0 and e1 > 0: null -= 1
            rec["counts"]["%s|%d|%d" % (rep, e0, e1)] = int(null)
        U = R1 * R0
        ev = U.eigenvalues()
        import cmath
        angs = []
        for z in ev:
            x = (cmath.phase(complex(z)) / (2 * cmath.pi)) % 1.0
            if x > 0.5: x = 1 - x
            angs.append(round(x, 6))
        if rep == "adj": angs.remove(0.0)   # the trace
        rec["angles"][rep] = sorted(angs)
    out.append(rec)
print(json.dumps(out))
