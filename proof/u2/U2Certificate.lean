import Lean

/- Integer arithmetic certificate for the U(2) example in 1711.04777v3,
   equations (3.32)--(3.34). The translation from Lie theory to this
   quadratic numerator is mathematical input, documented separately.
   No claim about a complete supergravity spectrum is formalized here. -/
namespace U2Certificate

def numerator (b0 b1 m n : Int) : Int :=
  2 * b0 * (m - n)^2 + b1 * (m + n)^2

def jointIntegral (b0 b1 : Int) : Prop :=
  ∀ m n : Int, ∃ k : Int, numerator b0 b1 m n = 8 * k

def separateIntegral (b0 b1 : Int) : Prop :=
  (∃ k : Int, b0 = 4 * k) ∧ (∃ k : Int, b1 = 8 * k)

theorem positive_identity (m n : Int) :
    numerator 1 6 m n = 8 * (m*m + m*n + n*n) := by
  unfold numerator
  grind

theorem positive_joint : jointIntegral 1 6 := by
  intro m n
  exact ⟨m*m + m*n + n*n, positive_identity m n⟩

theorem positive_not_separate : ¬ separateIntegral 1 6 := by
  intro ⟨⟨k, hk⟩, _⟩
  omega

theorem corrected_criterion (b0 b1 : Int) :
    jointIntegral b0 b1 ↔ ∃ d : Int, 2*b0 + b1 = 8*d := by
  constructor
  · intro h
    obtain ⟨d, hd⟩ := h 1 0
    exact ⟨d, by simpa [numerator] using hd⟩
  · rintro ⟨d, hd⟩ m n
    refine ⟨d*(m*m+n*n) + (2*d-b0)*m*n, ?_⟩
    unfold numerator
    grind

theorem separate_sufficient (b0 b1 : Int) :
    separateIntegral b0 b1 → jointIntegral b0 b1 := by
  rintro ⟨⟨k, hk⟩, ⟨l, hl⟩⟩
  apply (corrected_criterion b0 b1).mpr
  exact ⟨k+l, by omega⟩

theorem joint_does_not_imply_separate :
    ¬ (∀ b0 b1 : Int, jointIntegral b0 b1 → separateIntegral b0 b1) := by
  intro h
  exact positive_not_separate (h 1 6 positive_joint)

/- Common-denominator encoding: b0 = p/t, b1 = q/t for t != 0.
   Q is integer-valued exactly when numerator p q m n = 8*t*k.
   The theorem is valid even for t=0, but that case does not encode rationals. -/
def scaledJoint (p q t : Int) : Prop :=
  ∀ m n : Int, ∃ k : Int, numerator p q m n = 8*t*k

theorem rational_corrected_criterion (p q t : Int) :
    scaledJoint p q t ↔
      ∃ c d : Int, p = t*c ∧ 2*p+q = 8*t*d := by
  constructor
  · intro h
    obtain ⟨d, hd⟩ := h 1 0
    obtain ⟨e, he⟩ := h 1 1
    simp [numerator] at hd he
    refine ⟨4*d-e, d, ?_, ?_⟩
    · grind
    · grind
  · rintro ⟨c, d, hc, hd⟩ m n
    refine ⟨d*(m*m+n*n) + (2*d-c)*m*n, ?_⟩
    unfold numerator
    grind

/- A quadratic polynomial on Z^2 is integer-valued iff these two
   samples are integers in this Weyl-invariant two-parameter family. -/
theorem two_samples_suffice (p q t : Int)
    (h10 : ∃ d : Int, numerator p q 1 0 = 8*t*d)
    (h11 : ∃ e : Int, numerator p q 1 1 = 8*t*e) :
    scaledJoint p q t := by
  obtain ⟨d, hd⟩ := h10
  obtain ⟨e, he⟩ := h11
  simp [numerator] at hd he
  apply (rational_corrected_criterion p q t).mpr
  refine ⟨4*d-e, d, ?_, ?_⟩ <;> grind

end U2Certificate

#print axioms U2Certificate.positive_identity
#print axioms U2Certificate.positive_joint
#print axioms U2Certificate.positive_not_separate
#print axioms U2Certificate.corrected_criterion
#print axioms U2Certificate.separate_sufficient
#print axioms U2Certificate.joint_does_not_imply_separate
#print axioms U2Certificate.rational_corrected_criterion
#print axioms U2Certificate.two_samples_suffice
