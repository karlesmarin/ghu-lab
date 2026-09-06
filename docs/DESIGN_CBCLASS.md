# Design — `cbclass`, the conjugate boundary conditions section

Carles Marín + Claude (AI assistant). 2026-09-06.

**This designs a panel for mathematics we have not done yet.** That is stated first because it
decides the order of everything below: the section is registered `ready: false` — *listed, not
hidden*, which is DESIGN.md's own rule about a gap you can see — and it stays that way until the
quotient of §2 exists and is verified. A panel that promises a classification we do not have would
be the tool telling its first lie.

---

## Why the section should exist

`bcclass` answers, for ordinary chiral orbifolding, the question a model builder meets first:
*which of these boundary conditions are the same theory?* On S¹/Z₂ the answer is settled — four
block sizes `[p,q,r,s]`, one relation, `(N+1)²` classes — and the panel's real payload is the
consequence: **the apparent unbroken symmetry is not an invariant of the class.**

There is a second family of boundary conditions in the literature for which the same question has
**no published answer**, and it is a family the physics is actively using. A *conjugate boundary
condition* identifies a field with its charge conjugate under the orbifold reflection,

    psi(y_i - y) = P_i psi^c(y_i + y),    y_0 = 0,  y_1 = pi R,

so its zero mode is a four-dimensional Majorana fermion — the thing a five-dimensional spinor
cannot otherwise be. For a multiplet `P_i` is a **matrix**, and there is one at each fixed point.

Two facts set the size of the gap, and both are quoted rather than assumed:

- **Grzadkowski and Wudka** (*Phys. Rev. D* **72** (2005) 125012) derive the general form of the
  allowed twist matrices, by Schur's lemma and the grand orthogonality theorem. They give the
  *form*. Searching their paper for a quotient turns up nothing: no count of classes, no orbit, no
  "up to gauge transformation". The classification stops at the constraints.
- **Abe, Adachi and Fujimoto** (arXiv:2607.11150, July 2026) work with `P_0 = P_1`, and say so:
  *"In general, the parities at the fixed points can be chosen differently. However, we assume that
  the parities are the same at both fixed points for simplicity."* Their footnote 4 adds that an
  additional parity can be assigned.

So the object exists, its general form is known, and nobody has taken the quotient. That is the
section.

---

## What has to be true before a line of it is written

Three things, in this order. None of them is UI.

**(1) The relation.** For chiral orbifolding the whole classification is one move,
`[p,q,r,s] ~ [p-1,q+1,r+1,s-1]`, and it has two independent derivations — Haba–Hosotani–Kawamura
from gauge transformations, Takeuchi–Inagaki from trace conservation at each fixed point alone.
The conjugate case needs its own derivation, and **the trace-conservation route may not survive**:
the twist is antilinear, so what is conserved at a fixed point is not obviously a trace. Until the
relation is derived, there is no orbit and there is nothing to count.

**(2) The invariant, and whether it is complete.** On S¹/Z₂ the ordinary invariant is the pair of
eigenvalue spectra of the two parity matrices, and it is complete — that is what gives `(N+1)²`
exactly. On T²/Z₃ the analogous invariant is *not* complete (477 classes among 495 conditions at
N = 4). Which of those two the conjugate case resembles is an open question and the panel must be
able to say **either** answer, including "the label is not complete here".

**(3) A second, independent count.** The house does not ship a count from one route. `bcclass`
computes orbits directly and checks them against the closed form; `cbclass` needs the same, and if
no closed form is available then two independent enumerations.

---

## The physics hook, and what makes this more than a counting exercise

Under a conjugate condition the gauge field's parities **invert**. Abe, Goto, Kawamura and
Nishikawa (*Mod. Phys. Lett. A* **31** (2016) 1650208, eqs. (2.19)–(2.21)) show `C_mu` odd and
`C_5` even, so the zero mode of the extra-dimensional component survives *without being arranged
for*: gauge-Higgs unification arrives from the boundary condition rather than from a parity
assignment chosen to produce it.

That means a conjugate sector has a Wilson line, and therefore a one-loop potential, and therefore
belongs in this instrument beside `sun5d`. The tower is in Abe–Adachi–Fujimoto's eq. (44), taken
from Grzadkowski–Wudka: with Scherk–Schwarz phase `alpha`,

    m_n = sqrt( m^2 + ((2 pi n + alpha) / (2 pi R))^2 ),    n in Z

— a full integer tower with a single shift, structurally unlike the half-shifted tower a
Z₂-projected fermion gives. **We have not computed the resulting potential.** The panel shows it
only once `_test_cbclass.mjs` checks it against a route that is not the panel's own.

---

## The panel, top to bottom

The grammar is `bcclass`'s, deliberately: a reader who has used one section should not have to
learn a second vocabulary to use the next. Same card rhythm, same honesty chips, same "what this
cannot tell you" at the end.

### 1 · How to use this section — and a demo

Collapsed by default, as everywhere. The demo walks: pick a condition, see its class, see that two
members with different apparent symmetry are one theory, load one into the builder.

**In-page help is not optional here, and this section needs more of it than any other.** Every
other panel in the instrument works on objects a gauge-Higgs model builder already handles daily;
this one asks them to hold an *antilinear* twist, a congruence rather than a similarity, and a
symmetry type that decides between two different real forms. A researcher who has to leave the page
to find out what `P = -P^T` buys them has been failed by the page.

So, using the machinery the instrument already has (`helpMark()`, `src/view/help.js`, gated by
`_test_help.py` and `_test_howto.py`) rather than inventing a second one:

- **A `?` on every term that is not standard**: *conjugate boundary condition*, *antilinear twist*,
  *congruence*, *symmetry type*, *real form*, *Majorana zero mode*, *Scherk–Schwarz phase*. Each
  opens two or three sentences and **the citation for where it comes from**, so the help is also
  the attribution.
- **The condition itself printed above the dial**, in its own notation, so nobody has to guess the
  convention. Conventions differ across this literature and a tool that hides its own is unusable
  from outside.
- **One worked example reachable in a click**, as a permalink, not as prose: the smallest case
  where a conjugate condition and an ordinary one give different physics.
- **A contrast card**: the same quantity computed for the ordinary condition beside the conjugate
  one. For a reader who knows `bcclass`, the fastest possible explanation of this section is the
  diff against the section they already understand.
- **Every empty panel says why it is empty.** `UNKNOWN` with one sentence beats a blank card, and
  it is the same rule the rest of the instrument already follows.

### 2 · THE CONJUGATE CONDITION *(the dial)*

The input, and the condition printed above it in its own notation so nobody has to guess which
convention the panel is in:

    psi(y_i - y) = P_i psi^c(y_i + y)

- `N`, and the two conjugating matrices `P_0`, `P_1` entered as block data.
- **The fixed subgroup, computed and shown**: the invariant subgroup of a conjugation automorphism
  of SU(N) is `SO(N)` when the pairing is symmetric and `Sp(N/2)` when it is antisymmetric. Real
  and quaternionic. This is standard group theory and carries the `THEOREM` chip.
- A toggle for whether `P_0 = P_1` is imposed, **defaulting to the case the literature works in**,
  with the freed case marked as the new one. A tool that silently opens on the unpublished corner
  is a tool that misrepresents what is known.

*Attribution, in this panel:* Grzadkowski–Wudka for the general form of the allowed twists;
Abe–Goto–Kawamura–Nishikawa for the name and for the gauge-field parity inversion, with the
equation numbers, in the panel, not in a ledger at the end.

### 3 · ITS EQUIVALENCE CLASS

The members of the class, each with its apparent unbroken symmetry, exactly as `bcclass` lists
them — because the point is the same point and it should look the same. Row click loads that
member. The count of distinct apparent symmetries within the class is the line that does the work.

*Attribution:* the method is Haba–Hosotani–Kawamura's and Takeuchi–Inagaki's, applied to a
different object. The panel says that. What is ours is the application, and it says that too.

### 4 · HOW MANY CLASSES THERE ARE

`N` against conditions, classes, relations, and — the column `bcclass` already has and which is the
honest one — **is the label complete?** Yes/no per row, measured, not asserted.

### 5 · THE TOWER, AND WHAT IT DOES TO THE POTENTIAL

Two plots side by side, and this is where the section earns a picture rather than decorating one:

- **left, 2D**: the KK tower `m_n(alpha)` as `alpha` sweeps — the levels crossing and repelling.
  A conjugate tower runs over all of `Z` with one shift, so the picture is visibly *not* the
  half-shifted ladder of the ordinary case, and putting the two on the same axes is the fastest
  honest way to show the difference.
- **right, 3D**: the one-loop potential `V(alpha, m R)` as a surface. Two dials, so a surface is
  the truthful object and not an ornament — the same test the existing 3D towers pass. Drag to
  turn, and the drag is driven in `drive.mjs`, because a caption saying "drag to turn" that no gate
  has ever turned is a claim nobody checks.

**Both start empty, with the `UNKNOWN` chip and one sentence saying what has not been computed.**
They fill in when the computation exists and its harness is green, and not before.

*Attribution:* eq. (44) of Abe–Adachi–Fujimoto, itself from Grzadkowski–Wudka, named on the plot.

### 6 · WHICH MEMBER THE ENERGY PREFERS

Only if the analogue of HHK's vacuum-energy comparison survives for a conjugate sector. If it does
not, the panel says which step fails. An empty panel with a reason is worth more than a filled one
without.

### 7 · WHAT CANNOT BE COMPARED, AND WHY

The standing panel. At minimum it will carry: that the classification is a mathematical statement
and **no measurement distinguishes two members of one class** — collider data constrains the models
a class contains, never the class structure; and whatever of (1)–(3) above is still open.

### 8 · EVERY CLASS AT ONCE

The lattice map and its surface, as in `bcclass`, once there is a lattice to draw.

---

## Attribution, as a rule rather than a courtesy

The series earned a third standing rule on 2026-09-01 and it applies here without change:

> **What is theirs is said to be theirs, in the section where it is used, and not only in the
> ledger.**

Concretely, for this section:

| what | whose | where it is named |
|---|---|---|
| general form of the allowed conjugate twists | Grzadkowski & Wudka, *PRD* **72** (2005) 125012 | panel 2 |
| the name CBC; the gauge-field parity inversion | Abe, Goto, Kawamura & Nishikawa, *MPLA* **31** (2016) 1650208, eqs. (2.19)–(2.21) | panels 2 and 5 |
| KK spectrum, mode functions, eq. (44) tower | Abe, Adachi & Fujimoto, arXiv:2607.11150 | panel 5 |
| the equivalence-class method being copied | Haba, Hosotani & Kawamura, *PTP* **111** (2004) 265; Takeuchi & Inagaki, *PTEP* 2024 033B03 | panels 3 and 4 |
| the fixed subgroup of a conjugation being a real form | standard; no individual claim | panel 2, chip `THEOREM` |
| the quotient, the count, the completeness of the label | ours, **if it survives** | panels 3 and 4, stated plainly |

And the negative attribution, which is the one that takes discipline: the panel must not imply that
Grzadkowski and Wudka failed to take a quotient they never set out to take, nor that Abe, Adachi
and Fujimoto's `P_0 = P_1` is a shortcoming. They chose a scope and stated it. The panel says what
each paper *did*, and what remains is described as remaining — not as an omission.

---

## Order of work

1. Derive the relation. Until it exists there is no section. *(Research, not UI.)*
2. Enumerate and orbit, two independent routes, in `src/modules/cbclass.mjs` + `_test_cbclass.mjs`.
3. Decide whether the pair-of-spectra invariant is complete, and measure it per `N`.
4. Only then panels 2–4, `ready: true`.
5. The potential, and only then panel 5's plots.

Steps 2–5 are a few days of the usual work. Step 1 is the one that can fail, and if it fails the
honest outcome is a section that says so — which is still worth more than nothing, because
"nobody has taken this quotient and here is the obstruction" is a result.
