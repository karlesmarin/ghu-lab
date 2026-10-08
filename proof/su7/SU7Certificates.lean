import Lean

/-!
Exact finite SU(7) identities in the kernel of Lean 4.
These are formalizations of conditional algebra, not a novelty claim and
not a formalization of the infinite Fourier/interval analysis.
No `sorry`, no added axioms, and no `native_decide`.
-/
namespace GHU

structure Weight where
  q : Int
  p : Int
  b : Int
deriving DecidableEq, Repr

def fundamental : List Weight :=
  [⟨0,1,1⟩, ⟨0,1,1⟩, ⟨0,1,1⟩, ⟨0,-1,-1⟩,
   ⟨0,-1,1⟩, ⟨1,-1,-1⟩, ⟨-1,-1,-1⟩]

def tensor (a b : Weight) : Weight :=
  ⟨a.q+b.q, a.p*b.p, a.b*b.b⟩

def conjugate (a : Weight) : Weight := ⟨-a.q,a.p,a.b⟩

instance : Inhabited Weight := ⟨⟨0,1,1⟩⟩

def w (i : Nat) : Weight := fundamental[i]!

def symmetric2 : List Weight :=
  (List.range 7).bind fun i =>
    ((List.range 7).filter fun j => i ≤ j).map fun j => tensor (w i) (w j)

def symmetric3 : List Weight :=
  (List.range 7).bind fun i =>
    (List.range 7).bind fun j =>
      ((List.range 7).filter fun k => i ≤ j && j ≤ k).map fun k =>
        tensor (tensor (w i) (w j)) (w k)

-- End(V) has dimension 49. Removing its neutral singlet gives the adjoint;
-- the singlet contributes to none of the nonzero-charge counts below.
def endomorphisms : List Weight :=
  fundamental.bind fun a => fundamental.map fun b => tensor a (conjugate b)

def channel (rep : List Weight) (q b : Int) : Nat :=
  (rep.filter fun a => a.q == q && a.b == b).length

def parityChannel (q p b : Int) : Nat :=
  (endomorphisms.filter fun a => a.q == q && a.p == p && a.b == b).length

set_option maxRecDepth 100000
set_option maxHeartbeats 2000000

theorem fundamental_dimension : fundamental.length = 7 := by decide
theorem symmetric2_dimension : symmetric2.length = 28 := by decide
theorem symmetric3_dimension : symmetric3.length = 84 := by decide
theorem adjoint_dimension : endomorphisms.length - 1 = 48 := by decide

theorem fundamental_coefficients :
    channel fundamental 1 (-1) = 1 ∧ channel fundamental 1 1 = 0 := by decide

theorem symmetric2_coefficients :
    channel symmetric2 2 1 = 1 ∧ channel symmetric2 2 (-1) = 0 ∧
    channel symmetric2 1 1 = 1 ∧ channel symmetric2 1 (-1) = 4 := by decide

theorem adjoint_coefficients :
    channel endomorphisms 2 1 = 1 ∧ channel endomorphisms 2 (-1) = 0 ∧
    channel endomorphisms 1 1 = 2 ∧ channel endomorphisms 1 (-1) = 8 := by decide

theorem symmetric3_coefficients :
    channel symmetric3 3 (-1) = 1 ∧ channel symmetric3 3 1 = 0 ∧
    channel symmetric3 2 (-1) = 1 ∧ channel symmetric3 2 1 = 4 ∧
    channel symmetric3 1 (-1) = 12 ∧ channel symmetric3 1 1 = 4 := by decide

theorem adjoint_parity_resolution :
    parityChannel 2 1 1 = 1 ∧ parityChannel 1 1 1 = 2 ∧
    parityChannel 1 1 (-1) = 2 ∧ parityChannel 1 (-1) (-1) = 6 ∧
    parityChannel 2 (-1) 1 = 0 ∧ parityChannel 1 (-1) 1 = 0 := by decide

def gaugeFourM (periodicDof q b : Int) : Int :=
  -periodicDof * (parityChannel q 1 b : Int) - (parityChannel q (-1) b : Int)

theorem printed_gauge_coefficients :
    gaugeFourM 4 2 1 = -4 ∧ gaugeFourM 4 1 1 = -8 ∧
    gaugeFourM 4 1 (-1) = -14 := by decide

theorem background_gauge_coefficients :
    gaugeFourM 3 2 1 = -3 ∧ gaugeFourM 3 1 1 = -6 ∧
    gaugeFourM 3 1 (-1) = -12 := by decide

def d8Four (n : Int) : Int :=
  32*gaugeFourM n 2 1 + 8*gaugeFourM n 1 1 - 6*gaugeFourM n 1 (-1)
def a4Four (n : Int) : Int := 16*gaugeFourM n 2 1 + gaugeFourM n 1 1
def wFour (n : Int) : Int := -gaugeFourM n 1 1 + gaugeFourM n 1 (-1)

theorem seed_shift_d8 : d8Four 3 - d8Four 4 = 36 := by decide
theorem seed_shift_a4 : a4Four 3 - a4Four 4 = 18 := by decide
theorem seed_shift_w : wFour 3 = wFour 4 := by decide

-- Hence Δ(8D)=9, ΔA4=9/2 and ΔW=0, for the same matter content.
theorem seed_shift_preserves_law_combination :
    (d8Four 3-2*a4Four 3) = (d8Four 4-2*a4Four 4) := by decide

-- The fourth state of an SU(2) quartet cannot be discarded in the potential:
-- Sym3 of charges {-1,+1} has {-3,-1,+1,+3}, each with multiplicity one.
def doublet : List Weight := [⟨1,-1,-1⟩, ⟨-1,-1,-1⟩]
def quartet : List Weight :=
  (List.range 2).bind fun i => (List.range 2).bind fun j =>
    ((List.range 2).filter fun k => i ≤ j && j ≤ k).map fun k =>
      tensor (tensor doublet[i]! doublet[j]!) doublet[k]!

theorem quartet_lower_weight_is_required :
    channel quartet 1 (-1) = 1 ∧ channel quartet 3 (-1) = 1 := by decide

theorem same_matter_preserves_d8_shift (matter : Int) :
    (d8Four 3 + matter) - (d8Four 4 + matter) = 36 := by
  have h := seed_shift_d8
  omega

theorem same_matter_preserves_a4_shift (matter : Int) :
    (a4Four 3 + matter) - (a4Four 4 + matter) = 18 := by
  have h := seed_shift_a4
  omega

theorem same_matter_preserves_w (matter : Int) :
    wFour 3 + matter = wFour 4 + matter := by
  rw [seed_shift_w]

theorem dirac_chirality_trace_cancels_parity (z : Int) :
    2*(1+z) + 2*(1+z) + 2*(1-z) + 2*(1-z) = 8 := by omega

def representationD8 (rep : List Weight) (eta : Int) : Int :=
  (rep.filter fun a => a.q > 0).foldl
    (fun total a => total + (if eta*a.b == 1 then 8 else -6)*a.q^2) 0

def representation2A4 (rep : List Weight) (eta : Int) : Int :=
  (rep.filter fun a => a.q > 0).foldl
    (fun total a => total + (if eta*a.b == 1 then 2*a.q^4 else 0)) 0

def representationMoments (rep : List Weight) (eta : Int) : Int × Int :=
  (representationD8 rep eta, representation2A4 rep eta)

theorem eight_generator_moments :
    [representationMoments fundamental 1, representationMoments fundamental (-1),
     representationMoments symmetric2 1, representationMoments symmetric2 (-1),
     representationMoments endomorphisms 1, representationMoments endomorphisms (-1),
     representationMoments symmetric3 1, representationMoments symmetric3 (-1)] =
    [(-6,0),(8,2),(16,34),(2,8),(0,36),(28,16),(10,136),(80,218)] := by decide

def bulkD8 (a b c d e f g h : Int) : Int :=
  -6*a+8*b+16*c+2*d+0*e+28*f+10*g+80*h
def bulk2A4 (a b c d e f g h : Int) : Int :=
  0*a+2*b+34*c+8*d+36*e+16*f+136*g+218*h

theorem universal_matter_congruence (a b c d e f g h : Int) :
    (bulkD8 a b c d e f g h - bulk2A4 a b c d e f g h) % 6 = 0 := by
  unfold bulkD8 bulk2A4
  omega

theorem published_seed_congruence (a b c d e f g h : Int) :
    ((-27 + bulkD8 a b c d e f g h) - (-36 + bulk2A4 a b c d e f g h)) % 6 = 3 := by
  unfold bulkD8 bulk2A4
  omega

theorem candidate_seed_congruence (a b c d e f g h : Int) :
    ((-18 + bulkD8 a b c d e f g h) - (-27 + bulk2A4 a b c d e f g h)) % 6 = 3 := by
  unfold bulkD8 bulk2A4
  omega

theorem published_seed_odd (a b c d e f g h : Int) :
    (-27 + bulkD8 a b c d e f g h) % 2 = 1 := by
  unfold bulkD8
  omega

theorem candidate_seed_even (a b c d e f g h : Int) :
    (-18 + bulkD8 a b c d e f g h) % 2 = 0 := by
  unfold bulkD8
  omega

#print axioms fundamental_dimension
#print axioms symmetric2_dimension
#print axioms symmetric3_dimension
#print axioms adjoint_dimension
#print axioms fundamental_coefficients
#print axioms symmetric2_coefficients
#print axioms adjoint_coefficients
#print axioms symmetric3_coefficients
#print axioms adjoint_parity_resolution
#print axioms printed_gauge_coefficients
#print axioms background_gauge_coefficients
#print axioms seed_shift_d8
#print axioms seed_shift_a4
#print axioms seed_shift_w
#print axioms seed_shift_preserves_law_combination
#print axioms quartet_lower_weight_is_required
#print axioms same_matter_preserves_d8_shift
#print axioms same_matter_preserves_a4_shift
#print axioms same_matter_preserves_w
#print axioms dirac_chirality_trace_cancels_parity
#print axioms eight_generator_moments
#print axioms universal_matter_congruence
#print axioms published_seed_congruence
#print axioms candidate_seed_congruence
#print axioms published_seed_odd
#print axioms candidate_seed_even

end GHU
