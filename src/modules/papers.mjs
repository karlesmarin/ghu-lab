/* papers.mjs — four published models loaded into this instrument, and every statement they print
 * that it can compute, put beside what it computes.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS IS, AND WHY IT IS THE SHARPEST GATE IN THE REPOSITORY.  Every other harness here holds
 * the instrument to OUR reading of a formula.  This one holds it to somebody else's PUBLISHED
 * NUMBER — a group, a count, a potential, a vacuum, a mass — computed by people who had no idea
 * this engine would exist, from a boundary condition and a bulk content typed off their page.  A
 * general formula that reproduces four independent papers it was not fitted to is a general
 * formula; one that reproduces only the paper it came from is a transcription.
 *
 * THE UNIT OF THIS FILE IS THE ANCHOR, NOT THE MODEL.  An anchor is one sentence a paper prints,
 * with its locator, next to the one number this instrument returns for it, with a verdict.  Three
 * verdicts and no fourth:
 *
 *   `same`    — the instrument returns what the paper prints.
 *   `differs` — it does not, and the row says by how much and which of the two the rest of the
 *               paper agrees with.  A `differs` that is EXPECTED is not a failure of this file;
 *               it is its output.  What fails the build is a verdict that CHANGES.
 *   `outside` — the instrument cannot compute it.  Said out loud, never left blank: an empty cell
 *               reads as a no, and "we did not compute it" is not "it does not hold".
 *
 * THE ONE RESULT THIS FILE PRODUCED.  Kubo–Lim–Yamashita's eq. (35), the Higgs mass-squared at
 * their α = 0 vacuum, reads (9 − N_f) where their own eq. (33) gives (9 − 2N_f).  It is arithmetic
 * on their potential, not a modelling choice: the same second derivative taken at their OTHER
 * vacuum reproduces their eq. (39) exactly, for every N_f, and at N_f = 0 — where the fermions are
 * gone and only the prefactor is left — eq. (35) agrees too.  So the prefactor is right and the
 * fermion term is the only thing in question.  Their eq. (34) is a second, independent witness: it
 * is exact with the 4N_f of eq. (32) and wrong by a factor of three with a 2N_f.  Nothing in their
 * paper's conclusions moves — at N_f ≤ 1, which is where α = 0 is the vacuum, both readings give a
 * positive mass — and the row says that too, because a defect whose consequences are nil should be
 * reported as one.  Read off the RENDERED page, not a text extraction, after this house paid once
 * for the opposite ([[a-dropped-delimiter-leaves-a-formula-that-still-parses]]).
 *
 * TWO THINGS THAT ARE CONVENTIONS AND ARE MARKED AS SUCH, because an unmarked convention is the
 * next false verdict:
 *
 *  - CHIRALITY LABELS.  KLY's eq. (28) puts the singlet zero mode in ψ_R and the doublet in ψ_L;
 *    this instrument returns the mirror.  Only the RELATIVE chirality is physical — the absolute
 *    labels follow the γ₅ sign in their eq. (1), which is the opposite of the one `spectrum5d.mjs`
 *    uses — and the potential, which cannot see γ₅ at all, forces η = +1 either way and comes out
 *    exact.  So the anchor is the pair {singlet, doublet, opposite chiralities} and the row says
 *    what was compared.
 *  - THE SPLIT OF η INTO (η₀, η₁).  For a hypermultiplet only the PRODUCT is physical: its two
 *    chiral halves carry (η₀, η₁) and (−η₀, −η₁), so the pair {(+,−), (−,+)} is one field and this
 *    instrument's single `eta` names it.  That is why Burdman–Nomura's eqs. (38) AND (39) — the
 *    two halves of one hypermultiplet, ten parity assignments between them — both fall out of
 *    `{ rep: "anti", eta: −1 }` with nothing else set.
 *
 * WHAT EACH PAPER IS FOR HERE, because four models were not chosen to be four:
 *   KLY02  the only one that publishes a POTENTIAL, a VACUUM and a HIGGS MASS: it anchors the
 *          dynamics end to end, and it is where the engine can be wrong by a number.
 *   KAW00  the ZERO-phase case — his own footnote says the Hosotani mechanism cannot work in his
 *          model — plus the triplet-doublet splitting that the whole orbifold-GUT field is about.
 *   BN02   the only one whose paper prints the full parity MATRIX, so the reading of (P, P′) into
 *          block letters is checked entry by entry rather than asserted.
 *   HHK04  Table I: the standard-model content of the zero modes of 5, 5̄, 10, 10̄ and 24 in all
 *          four parity sectors — twenty cells from one table.  Its §3 energy and its eq. (3.20)
 *          are anchored elsewhere already (`bcclass.mjs`, `_test_spectrum5d.mjs`) and are NOT
 *          repeated here; a gate stated twice is not a gate stated twice as well.
 *
 * WHAT IS DELIBERATELY NOT CLAIMED.  Three of the four papers are SUPERSYMMETRIC, and this
 * instrument's potential is not.  Every anchor taken from them is therefore parity linear algebra
 * — which boundary condition, which group, which zero modes — and never their dynamics; each row
 * carries the scope it was read at.  KLY is not supersymmetric and is the one whose dynamics is
 * anchored.  Burdman–Nomura's up-type matter lives in the 20 = Λ³6, and this engine carries
 * fundamental, Λ², S² and adjoint only, so that row is `outside` and says which representation it
 * would need.
 */

import { sun5dBlocks, sun5dUnbroken, sun5dTerms, sun5dV, sun5dMinimum, sun5dHessian }
  from "./sun5d.mjs";
import { sp5Sectors, sp5States, sp5ZeroModes } from "./spectrum5d.mjs";
/* ζ(5) comes from `bcclass.mjs` rather than being retyped: the inliner puts every module in ONE
 * scope and its collision guard refuses a second `ZETA5`, which is the right refusal — a constant
 * declared twice is a constant that can drift in one of the two places. */
import { bcClasses, bcShow, ZETA5 } from "./bcclass.mjs";

export const ZETA3 = 1.2020569031595943;
export { ZETA5 };

/* KLY's Fig. 2 caption sets C = 3/(128π⁷R⁵).  `sun5dV` and `sun5dHessian` report in
 * Haba–Yamashita's C = 3/(64π⁷R⁵), which is twice it — so a KLY number is twice ours, and every
 * row of that model below is written in THEIR unit and says so. */
const KLY_C = 2;

/* ------------------------------------------------------------------ the boundary conditions */

/* The models, exactly as their papers print them.  `bulk` is in the SU(N) builder's own key form
 * ("rep|eta|kind" → multiplicity) so that loading a paper into the builder is an assignment and
 * not a translation — the page the reader then drives is the same object every other 5D section
 * reads. */
export const PAPER_MODELS = Object.freeze([
  {
    id: "kly_su3",
    cite: "KLY02",
    label: "Kubo–Lim–Yamashita · SU(3)",
    group: "SU(3)", orbifold: "S¹/Z₂", susy: false,
    where: "their §3.2, eqs. (27)–(39)",
    P: [+1, -1, -1], Pp: [+1, -1, -1],
    printed: "P = diag(1, −1, −1), used as both orbifold parities",
    about: "the only one of the four that publishes a potential, a vacuum and a Higgs mass — so " +
           "it is the one where this engine can be wrong by a number rather than by a label",
    knob: { id: "Nf", label: "N_f", of: "triplet Dirac fermions", min: 0, max: 8, def: 3 },
    bulk: (k) => (k.Nf ? { "fund|1|dirac": k.Nf } : {}),
    anchorIds: ["kly-group", "kly-vectors", "kly-scalars", "kly-fermions", "kly-potential",
                "kly-depth", "kly-vacuum", "kly-mass-1", "kly-mass-0"],
  },
  {
    id: "kaw_su5",
    cite: "KAW00",
    label: "Kawamura · SU(5)",
    group: "SU(5)", orbifold: "S¹/(Z₂ × Z′₂)", susy: true,
    where: "their §3, eq. (3.7) and Table I",
    P: [+1, +1, +1, +1, +1], Pp: [-1, -1, -1, +1, +1],
    printed: "P = diag(1,1,1,1,1), P′ = diag(−1,−1,−1,1,1)",
    about: "the zero-phase case — his own footnote says the Hosotani mechanism cannot work here — " +
           "and the triplet-doublet splitting the whole orbifold-GUT field is about",
    knob: null,
    /* His H₁ = {H₅, Ĥ₅̄} and H₂ = {Ĥ₅, H₅̄} are two hypermultiplets; each is a chiral half at
     * (η₀, η₁) and one at (−η₀, −η₁), which is exactly what one `eta` names here. */
    bulk: () => ({ "fund|1|scalar": 2 }),
    anchorIds: ["kaw-group", "kaw-phases", "kaw-adj", "kaw-ay", "kaw-split", "kaw-higgs",
                "kaw-class"],
  },
  {
    id: "bn_su6",
    cite: "BN02",
    label: "Burdman–Nomura · SU(6)",
    group: "SU(6)", orbifold: "S¹/(Z × Z′)", susy: true,
    where: "their §4, eqs. (36)–(39)",
    P: [+1, +1, +1, +1, +1, -1], Pp: [+1, +1, -1, -1, -1, -1],
    printed: "P = diag(1,1,1,1,1,−1), P′ = diag(1,1,−1,−1,−1,−1)",
    about: "the only one that prints the whole parity MATRIX, so the reading of (P, P′) into block " +
           "letters is checked entry by entry instead of asserted",
    knob: null,
    bulk: () => ({ "anti|-1|dirac": 1 }),
    anchorIds: ["bn-group", "bn-matrix", "bn-vectors", "bn-higgs", "bn-phases", "bn-15", "bn-15z",
                "bn-20"],
  },
  {
    id: "hhk_su5",
    cite: "HHK04",
    label: "Haba–Hosotani–Kawamura · SU(5)",
    group: "SU(5)", orbifold: "S¹/Z₂", susy: true,
    where: "their Table I (p. 21)",
    P: [+1, +1, +1, +1, +1], Pp: [+1, +1, -1, -1, -1],
    printed: "their class [p; q, r; s] = [2; 3, 0; 0] — Kawamura's boundary condition reached from " +
             "the other end, written here as P = 1, P′ = diag(+,+,−,−,−)",
    about: "twenty cells of one table: the standard-model content of the zero modes of 5, 5̄, 10, " +
           "10̄ and 24 in each of the four parity sectors",
    knob: null,
    bulk: () => ({ "fund|1|dirac": 1, "anti|1|dirac": 1 }),
    anchorIds: ["hhk-t1-5", "hhk-t1-10", "hhk-t1-24", "hhk-elsewhere"],
  },
]);

export const paperById = (id) => PAPER_MODELS.find((m) => m.id === id) || null;

/* ------------------------------------------------------------------ the model, built */

const bulkList = (map) => Object.entries(map).filter(([, n]) => n).map(([k, n]) => {
  const [rep, eta, kind] = k.split("|");
  return { rep, eta: +eta, kind, multiplicity: n };
});

/* Everything an anchor may need, computed once.  `knob` carries the model's own dial (KLY's N_f)
 * and is `{}` for the three that have none. */
export function paperContext(m, knob = {}) {
  const k = { ...(m.knob ? { [m.knob.id]: m.knob.def } : {}), ...knob };
  const b = sun5dBlocks({ P: m.P, Pp: m.Pp });
  const bulkMap = m.bulk(k);
  const content = { bulk: bulkList(bulkMap) };
  const terms = sun5dTerms(b, content);
  return { m, knob: k, b, bulkMap, content, terms };
}

/* THE POTENTIAL IN THE PAPER'S OWN UNIT.  Not a convenience: a factor nobody wrote down is how a
 * reproduction becomes a coincidence. */
export const paperV = (ctx, theta, w = 4000) => KLY_C * sun5dV(ctx.terms, theta, w);
export const paperCurvature = (ctx, theta, w = 20000) =>
  KLY_C * sun5dHessian(ctx.terms, theta, w)[0][0];

/* ------------------------------------------------------------------ the anchors */

/* An anchor: what the paper says, where it says it, what scope it was read at, and a `run` that
 * returns their value and ours in the SAME shape so the comparison is not a judgement call.
 * `expect` is what we measured — a value or a function of the knob — and the harness fails when
 * the live verdict stops matching it. */
export const PAPER_ANCHORS = Object.freeze({

  /* ---------------------------------------------------------------- Kubo–Lim–Yamashita */

  "kly-group": {
    says: "the parity assignment breaks SU(3) → SU(2) ⊗ U(1)",
    where: "eq. (27)", scope: "the parities alone", expect: "same",
    run: (c) => ({ theirs: "SU(2) × U(1)", ours: sun5dUnbroken(c.b) }),
  },
  "kly-vectors": {
    says: "the massless vectors are A_μ^a with a = 3, 6, 7, 8 — four of them",
    where: "eq. (28)", scope: "the parities alone", expect: "same",
    run: (c) => ({ theirs: 4, ours: sp5ZeroModes(c.b, c.content).vectors }),
  },
  "kly-scalars": {
    says: "the massless scalars are A_y^a with a = 1, 2, 4, 5 — one complex SU(2) doublet",
    where: "eq. (28)", scope: "the parities alone", expect: "same",
    run: (c) => ({ theirs: 4, ours: sp5ZeroModes(c.b, c.content).scalars }),
  },
  "kly-fermions": {
    says: "a triplet leaves ψ₁ᴿ, ψ₂ᴸ, ψ₃ᴸ — a singlet and a doublet, of opposite chirality",
    where: "eq. (28)", scope: "the parities alone, up to the γ₅ convention", expect: "same",
    note: "their eq. (1) takes ψ → Pγ₅ψ, the opposite γ₅ sign to this instrument's, so the " +
          "ABSOLUTE labels come out mirrored: we return the singlet left-handed and the doublet " +
          "right-handed. Only the relative chirality is physical, and that is what is compared. " +
          "The potential cannot see γ₅ and pins η = +1 either way.",
    /* ONE triplet, whatever the dial says: their eq. (28) is a statement about a single multiplet,
     * and reading it off N_f copies would turn a content into an arithmetic accident. */
    run: (c) => {
      const z = sp5ZeroModes(c.b, { gauge: false,
        bulk: [{ rep: "fund", eta: +1, kind: "dirac", multiplicity: 1 }] })
        .list.filter((x) => x.kind === "fermion");
      /* named from the piece's own label, not from its size: "one state, therefore a singlet" is
       * true here and is an accident of SU(2) */
      const name = (x) => (/singlet/.test(x.label) ? "singlet" : "doublet");
      const chir = new Set(z.map((x) => x.chirality));
      return {
        theirs: "1 singlet + 2 doublet, opposite chiralities",
        ours: `${z.map((x) => `${x.n} ${name(x)}`).sort().join(" + ")}, ` +
              `${chir.size === 2 ? "opposite chiralities" : "the same chirality"}`,
      };
    },
  },
  "kly-potential": {
    says: "V_eff = −3C Σ n⁻⁵[cos 2πnα + 2cos πnα] + 4N_f C Σ n⁻⁵ cos πnα",
    where: "eq. (33)", scope: "the full one-loop dynamics", expect: "same", tol: 1e-9,
    note: "the largest disagreement over 41 values of α in [0, 2], in their own unit " +
          "C = 3/(128π⁷R⁵). Zero is the only passing answer; the number is printed so that a " +
          "drift shows as a number and not as a boolean.",
    run: (c) => {
      const Nf = c.knob.Nf ?? 0;
      const theirs = (a, W = 4000) => {
        let s = 0;
        for (let n = 1; n <= W; n++)
          s += (-3 * (Math.cos(2 * Math.PI * n * a) + 2 * Math.cos(Math.PI * n * a))
                + 4 * Nf * Math.cos(Math.PI * n * a)) / n ** 5;
        return s;
      };
      let worst = 0;
      for (let i = 0; i <= 40; i++) {
        const a = i / 20;
        worst = Math.max(worst, Math.abs(paperV(c, [a]) - theirs(a)));
      }
      return { theirs: 0, ours: worst };
    },
  },
  "kly-depth": {
    says: "V(α=0) − V(α=1) = 4C Σ (2n+1)⁻⁵ (2N_f − 3)",
    where: "eq. (34)", scope: "the full one-loop dynamics", expect: "same", tol: 1e-6,
    note: "exact when the printed lower limit n = 1 is read as n = 0: with n = 0 the sum is " +
          "(31/32)ζ(5) and the closed form is (31/8)ζ(5)(2N_f − 3), which this instrument returns " +
          "to six figures. Taken literally from n = 1 the same expression is about 222 times too " +
          "small, and the sign — which is all their argument uses — is unaffected either way.",
    run: (c) => {
      const Nf = c.knob.Nf ?? 0;
      return { theirs: (31 / 8) * ZETA5 * (2 * Nf - 3), ours: paperV(c, [0]) - paperV(c, [1]) };
    },
  },
  "kly-vacuum": {
    says: "the global minimum is at α = 0 for N_f ≤ 1 and at α = 1 for N_f ≥ 2",
    where: "Table 1", scope: "the full one-loop dynamics", expect: "same", tol: 2e-3,
    run: (c) => {
      const Nf = c.knob.Nf ?? 0;
      const min = sun5dMinimum(c.terms, c.b.phases, { grid: 4000, windings: 2000, lo: 0, hi: 2 });
      return { theirs: Nf <= 1 ? 0 : 1, ours: min ? min.theta[0] : null };
    },
  },
  "kly-mass-1": {
    says: "m²(A_y) = 9g₄²(5 + 2N_f)ζ(3)/(128π⁴R²) at the α = 1 vacuum",
    where: "eq. (39)", scope: "the full one-loop dynamics", expect: "same", tol: 1e-6,
    note: "compared as the bracket alone, in their own unit. With m² = g²R² ∂²V/∂α², g² = 2πR g₄² " +
          "and C = 3/(128π⁷R⁵), the whole prefactor is 3g₄²ζ(3)/(64π⁴R²) and what multiplies it " +
          "is X = ∂²(V/C)/∂α² ÷ π²ζ(3). Their eq. (39) is X = 3/2·(5 + 2N_f); their eq. (35) is " +
          "X = 2(9 − N_f). Both brackets are read off the same X, which is why one of them " +
          "agreeing is what makes the other one's disagreement mean something.",
    run: (c) => {
      const Nf = c.knob.Nf ?? 0;
      return { theirs: 1.5 * (5 + 2 * Nf), ours: paperCurvature(c, [1]) / (Math.PI ** 2 * ZETA3) };
    },
  },
  "kly-mass-0": {
    says: "m²(A_y) = 3g₄²(9 − N_f)ζ(3)/(32π⁴R²) at the α = 0 vacuum",
    where: "eq. (35)", scope: "the full one-loop dynamics",
    expect: (k) => ((k.Nf ?? 0) === 0 ? "same" : "differs"), tol: 1e-6,
    note: "the same second derivative that reproduces their eq. (39) exactly, taken at their other " +
          "vacuum, gives (9 − 2N_f). It is arithmetic on their own eq. (33): V″(0) = π²ζ(3)(18 − " +
          "4N_f). At N_f = 0 the two readings agree, which is what fixes the prefactor and leaves " +
          "the fermion term as the only thing in question — and their eq. (34), exact with the " +
          "4N_f of eq. (32), is the second witness. None of their conclusions moves: α = 0 is the " +
          "vacuum only for N_f ≤ 1, where both readings give a positive mass.",
    run: (c) => {
      const Nf = c.knob.Nf ?? 0;
      return { theirs: 2 * (9 - Nf), ours: paperCurvature(c, [0]) / (Math.PI ** 2 * ZETA3) };
    },
  },

  /* ---------------------------------------------------------------- Kawamura */

  "kaw-group": {
    says: "P and P′ reduce SU(5) to the standard model group SU(3)×SU(2)×U(1)",
    where: "after eq. (3.7)", scope: "the parities alone", expect: "same",
    run: (c) => ({ theirs: "SU(3) × SU(2) × U(1)", ours: sun5dUnbroken(c.b) }),
  },
  "kaw-phases": {
    says: "the Hosotani mechanism does not work here — A₅ has odd parity and its VEV must vanish",
    where: "his footnote *** on p. 4", scope: "the parities alone", expect: "same",
    note: "a boundary condition with A = B = 0 has no Wilson-line phase at all, which is the same " +
          "statement counted rather than argued: with P = 1 the A₅ of every generator is odd, so " +
          "there is nothing for a Wilson line to be. This instrument returns zero phases and zero " +
          "massless scalars from the gauge sector, independently.",
    run: (c) => ({ theirs: 0, ours: c.b.phases + sp5ZeroModes(c.b, { gauge: true }).scalars }),
  },
  "kaw-adj": {
    says: "A_μ: (8,1)+(1,3)+(1,1) at (+,+) and (3,2)+(3̄,2) at (+,−) — twelve and twelve",
    where: "Table I, rows 1–2", scope: "the parities alone", expect: "same",
    run: (c) => ({ theirs: "12/12/0/0", ours: (() => {
      const s = sp5Sectors(c.b, "adj");
      return `${s["++"]}/${s["+-"]}/${s["-+"]}/${s["--"]}`;
    })() }),
  },
  "kaw-ay": {
    says: "A₅, Σ, λ¹: (8,1)+(1,3)+(1,1) at (−,−) and (3,2)+(3̄,2) at (−,+)",
    where: "Table I, rows 3–4", scope: "the parities alone", expect: "same",
    note: "A₅ carries the adjoint with BOTH parities flipped, so its sectors are the mirror of " +
          "A_μ's — and neither of them is (+,+), which is why nothing here is massless.",
    run: (c) => ({ theirs: "0/0/12/12", ours: (() => {
      const o = { "++": 0, "+-": 0, "-+": 0, "--": 0 };
      for (const s of sp5States(c.b, "adj", [1, 1], [], { flip: true }))
        o[`${s.P0 > 0 ? "+" : "-"}${s.P1 > 0 ? "+" : "-"}`]++;
      return `${o["++"]}/${o["+-"]}/${o["-+"]}/${o["--"]}`;
    })() }),
  },
  "kaw-split": {
    says: "H₅ splits into H_u (1,2) at (+,+) and H_C (3,1) at (+,−): the doublet keeps its zero " +
          "mode and the colour triplet does not",
    where: "Table I, rows 6 and 5", scope: "the parities alone", expect: "same",
    note: "this is the whole point of the paper, and it is two integers.",
    run: (c) => {
      const s = sp5Sectors(c.b, "fund", [1, 1]);
      return { theirs: "2 doublet at (+,+), 3 triplet at (+,−)",
               ours: `${s["++"]} doublet at (+,+), ${s["+-"]} triplet at (+,−)` };
    },
  },
  "kaw-higgs": {
    says: "the massless fields are the MSSM gauge multiplets and the two doublets H_u⁽⁰⁾, H_d⁽⁰⁾",
    where: "Table I, caption", scope: "the parities alone", expect: "same",
    run: (c) => {
      const z = sp5ZeroModes(c.b, c.content);
      return { theirs: "12 vectors, 4 scalars (2 doublets)",
               ours: `${z.vectors} vectors, ${z.scalars} scalars` +
                     ` (${z.scalars / 2} doublet${z.scalars === 2 ? "" : "s"})` };
    },
  },
  "kaw-class": {
    says: "his boundary condition is the class HHK write [p; q, r; s] = [2; 3, 0; 0]",
    where: "HHK §4, p. 21", scope: "the parities alone", expect: "same",
    note: "the same model reached from two papers: Kawamura writes the matrices, HHK write the " +
          "class. The instrument's block letters are the bridge, and the equivalence-class walk " +
          "of `bcclass.mjs` says which other boundary conditions are the same theory.",
    run: (c) => ({ theirs: bcShow([2, 3, 0, 0]),
                   ours: bcShow([c.b.nPP, c.b.nPM, c.b.nMP, c.b.nMM]) }),
  },

  /* ---------------------------------------------------------------- Burdman–Nomura */

  "bn-group": {
    says: "the standard model gauge group with an extra U(1)_X",
    where: "before eq. (36)", scope: "the parities alone", expect: "same",
    run: (c) => ({ theirs: "SU(3) × SU(2) × U(1)^2", ours: sun5dUnbroken(c.b) }),
  },
  "bn-matrix": {
    says: "the 6 × 6 table of (Z, Z′) parities of the gauge multiplet — thirty-six entries",
    where: "eq. (36)", scope: "the parities alone", expect: "same",
    note: "this is a transcription gate and is worth exactly that: it checks that the (P, P′) " +
          "typed off their page and the matrix printed beside it are the same object, entry by " +
          "entry, so a mis-read diagonal cannot pass as a physics agreement further down.",
    run: (c) => {
      const m = c.m, sg = (x) => (x > 0 ? "+" : "-");
      const ours = m.P.map((_, i) =>
        m.P.map((__, j) => `${sg(m.P[i] * m.P[j])}${sg(m.Pp[i] * m.Pp[j])}`).join(" ")).join(" | ");
      /* their eq. (36), transcribed row by row from the rendered page */
      const theirs = [
        "++ ++ +- +- +- --",
        "++ ++ +- +- +- --",
        "+- +- ++ ++ ++ -+",
        "+- +- ++ ++ ++ -+",
        "+- +- ++ ++ ++ -+",
        "-- -- -+ -+ -+ ++",
      ].join(" | ");
      return { theirs, ours };
    },
  },
  "bn-vectors": {
    says: "fourteen (+,+) entries, one of them the trace: thirteen massless vectors",
    where: "eq. (36)", scope: "the parities alone", expect: "same",
    run: (c) => ({ theirs: 13, ours: sp5ZeroModes(c.b, {}).vectors }),
  },
  "bn-higgs": {
    says: "Σ yields zero modes (1,2)_{1/2,6} ⊕ (1,2)_{−1/2,−6} — the two Higgs doublets of the MSSM",
    where: "after eq. (37)", scope: "the parities alone", expect: "same",
    run: (c) => {
      const z = sp5ZeroModes(c.b, {}).list.filter((x) => x.kind === "scalar");
      const n = z.reduce((a, x) => a + x.n, 0);
      return { theirs: "4 scalars in 2 pieces", ours: `${n} scalars in ${z.length} pieces` };
    },
  },
  "bn-phases": {
    says: "— (they do not discuss the Wilson line: the theory is supersymmetric and the vacuum is " +
          "fixed by other means)",
    where: "not stated", scope: "ours, not theirs", expect: "outside",
    note: "the instrument returns one Wilson-line phase for this boundary condition, so the " +
          "Hosotani mechanism is live here in a way it is not in Kawamura's. That is a statement " +
          "about their boundary condition, not about their model: their supersymmetric one-loop " +
          "potential is not this engine's, and the row does not pretend otherwise.",
    run: (c) => ({ theirs: null, ours: c.b.phases }),
  },
  "bn-15": {
    says: "the 15 splits as Q(+,+) ⊕ U(+,−) ⊕ E(+,−) ⊕ D̄(−,−) ⊕ L̄(−,+), and its conjugate half " +
          "carries the opposite parities",
    where: "eqs. (38) and (39)", scope: "the parities alone", expect: "same",
    note: "six, four, two and three states in the four sectors for D, and the mirror for Dᶜ — ten " +
          "parity assignments off two printed equations, all from `{ rep: \"anti\", eta: −1 }`.",
    run: (c) => {
      const half = (flip) => {
        const o = { "++": 0, "+-": 0, "-+": 0, "--": 0 };
        for (const s of sp5States(c.b, "anti", [-1, 1], [], { flip }))
          o[`${s.P0 > 0 ? "+" : "-"}${s.P1 > 0 ? "+" : "-"}`]++;
        return `${o["++"]}/${o["+-"]}/${o["-+"]}/${o["--"]}`;
      };
      return { theirs: "6/4/2/3 and 3/2/4/6", ours: `${half(true)} and ${half(false)}` };
    },
  },
  "bn-15z": {
    says: "zero modes arise only from D_Q and Dᶜ_D — the MSSM quark doublet and the down singlet",
    where: "after eq. (39)", scope: "the parities alone", expect: "same",
    run: (c) => {
      const z = sp5ZeroModes(c.b, c.content).list.filter((x) => x.kind === "fermion");
      return { theirs: "9 states in 2 pieces (6 + 3)",
               ours: `${z.reduce((a, x) => a + x.n, 0)} states in ${z.length} pieces ` +
                     `(${z.map((x) => x.n).sort((a, x) => x - a).join(" + ")})` };
    },
  },
  "bn-20": {
    says: "the up-type quark comes from a hypermultiplet in the 20 of SU(6), eqs. (40)–(41)",
    where: "eqs. (40)–(41)", scope: "not computed", expect: "outside",
    note: "20 = Λ³6, and this engine carries the fundamental, Λ², S² and the adjoint. The row is " +
          "here because leaving it out would let the model read as fully reproduced when a third " +
          "of its matter was never looked at.",
    run: () => ({ theirs: "Λ³ of SU(6)", ours: null }),
  },

  /* ---------------------------------------------------------------- Haba–Hosotani–Kawamura */

  "hhk-t1-5": {
    says: "5 at (η₀,η₁) = (++) has the doublet massless, at (+−) the colour triplet",
    where: "Table I, rows 1–2", scope: "the parities alone", expect: "same",
    note: "their table is written per HYPERMULTIPLET, so each row already contains both chiral " +
          "halves; the instrument's single `eta` is the same statement.",
    run: (c) => {
      const zm = (eta) => sp5ZeroModes(c.b, { gauge: false,
        bulk: [{ rep: "fund", eta, kind: "dirac", multiplicity: 1 }] }).fermions;
      return { theirs: "2 at (++), 3 at (+−)", ours: `${zm(+1)} at (++), ${zm(-1)} at (+−)` };
    },
  },
  "hhk-t1-10": {
    says: "10 at (++) gives (3̄,1)_{−2/3} + (1,1)_1, at (+−) gives (3,2)_{1/6}",
    where: "Table I, rows 3–4", scope: "the parities alone", expect: "same",
    note: "four and six: Λ² of a doublet is one singlet and Λ² of a triplet is a 3̄, which is the " +
          "four; the six is the bifundamental. The instrument builds them from the weights, so " +
          "the arithmetic of the decomposition is checked and not copied.",
    run: (c) => {
      const zm = (eta) => sp5ZeroModes(c.b, { gauge: false,
        bulk: [{ rep: "anti", eta, kind: "dirac", multiplicity: 1 }] }).fermions;
      return { theirs: "4 at (++), 6 at (+−)", ours: `${zm(+1)} at (++), ${zm(-1)} at (+−)` };
    },
  },
  "hhk-t1-24": {
    says: "24 at (++) gives (8,1)₀+(1,3)₀+(1,1)₀, at (+−) gives (3,2)_{−5/6}+(3̄,2)_{5/6}",
    where: "Table I, row 5", scope: "the parities alone", expect: "same",
    run: (c) => {
      const s = sp5Sectors(c.b, "adj");
      return { theirs: "12 at (++), 12 at (+−)", ours: `${s["++"]} at (++), ${s["+-"]} at (+−)` };
    },
  },
  "hhk-elsewhere": {
    says: "their eq. (3.20) sector counts and their §3 vacuum-energy ordering",
    where: "eqs. (3.20), (3.25), (3.27)", scope: "anchored in another file", expect: "outside",
    note: "already gated: `_test_spectrum5d.mjs` derives eq. (3.20) from the components for a " +
          "sweep of boundary conditions, and `bcclass.mjs` carries eq. (3.25) with their SU(5) " +
          "conclusion pinned in `_test_bcclass.mjs`. Repeating them here would be a second copy " +
          "of one gate, not a second gate.",
    run: () => ({ theirs: "see _test_spectrum5d.mjs and _test_bcclass.mjs", ours: null }),
  },
});

/* ------------------------------------------------------------------ running them */

const near = (a, b, tol) => Math.abs(a - b) <= tol;

export function paperVerdict(a, res, knob) {
  const want = typeof a.expect === "function" ? a.expect(knob) : a.expect;
  if (want === "outside") return { verdict: "outside", want, agrees: null };
  const { theirs, ours } = res;
  let agrees;
  if (typeof theirs === "number" && typeof ours === "number") agrees = near(theirs, ours, a.tol ?? 1e-9);
  else agrees = String(theirs) === String(ours);
  return { verdict: agrees ? "same" : "differs", want, agrees };
}

/* Every anchor of one model, run.  `held` is false when the live verdict is not the recorded one —
 * which is the only thing in this file that should ever fail a build. */
export function paperRun(m, knob = {}) {
  const c = paperContext(m, knob);
  const rows = m.anchorIds.map((id) => {
    const a = PAPER_ANCHORS[id];
    if (!a) throw new Error(`no anchor "${id}" — model "${m.id}" names one that does not exist`);
    const res = a.run(c);
    const v = paperVerdict(a, res, c.knob);
    return { id, says: a.says, where: a.where, scope: a.scope, note: a.note || null,
             theirs: res.theirs, ours: res.ours, ...v, held: v.verdict === v.want };
  });
  return { ...c, rows,
           same: rows.filter((r) => r.verdict === "same").length,
           differs: rows.filter((r) => r.verdict === "differs").length,
           outside: rows.filter((r) => r.verdict === "outside").length,
           held: rows.every((r) => r.held) };
}

export const paperRunAll = (knobs = {}) =>
  PAPER_MODELS.map((m) => paperRun(m, knobs[m.id] || {}));

/* the one-line reading, and it never says "all checks passed" when one of them is `outside` */
export function paperShow(r) {
  const bits = [`${r.same} reproduced`];
  if (r.differs) bits.push(`${r.differs} differ`);
  if (r.outside) bits.push(`${r.outside} outside this engine`);
  return `${r.m.label} — ${bits.join(", ")}` + (r.held ? "" : " — A VERDICT MOVED");
}

/* what a section hands the SU(N) builder: the same shape `SUN5D_S` holds, nothing translated */
export const paperState = (m, knob = {}) => ({
  /* the four letters and nothing else: `sun5dBlocks` also returns N, A, B and the leftovers, and
   * `SUN5D_S.blocks` is the INPUT the builder edits — handing it derived fields would let a stale
   * `phases` sit next to letters that no longer imply it */
  blocks: (({ nPP, nPM, nMP, nMM }) => ({ nPP, nPM, nMP, nMM }))(sun5dBlocks({ P: m.P, Pp: m.Pp })),
  bulk: m.bulk({ ...(m.knob ? { [m.knob.id]: m.knob.def } : {}), ...knob }),
});

/* the equivalence class the boundary condition sits in, for the models on S¹/Z₂ */
export function paperClass(m) {
  const b = sun5dBlocks({ P: m.P, Pp: m.Pp });
  const C = bcClasses(b.N, "S1/Z2");
  const cls = C.of([b.nPP, b.nPM, b.nMP, b.nMM]);
  const members = C.classes[cls] ? C.classes[cls].members : [];
  return { cls, size: members.length, members, nClasses: C.nClasses };
}
