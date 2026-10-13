import Lean
/- Conditional arithmetic certificates for H=S(U(2)xU(3)).
   The cocharacter/characteristic-class dictionary and GS ansatz are inputs. -/
namespace GHUQuantization
def A (m n : Int) : Int := m*n
def B (m n u v : Int) : Int := u*v + u*(-m-n-u-v) + v*(-m-n-u-v)
def C (m n : Int) : Int := (m+n)^2
def form (p q r m n u v : Int) : Int := p*A m n + q*B m n u v + r*C m n
def integralOnH (p q r t : Int) : Prop :=
  ∀ m n u v : Int, ∃ k : Int, form p q r m n u v = t*k

theorem integral_basis_criterion (p q r t : Int) :
    integralOnH p q r t ↔
      ∃ a b c : Int, p=t*a ∧ q=t*b ∧ r=t*c := by
  constructor
  · intro h
    obtain ⟨a, ha⟩ := h 1 (-1) 0 0
    obtain ⟨b, hb⟩ := h 0 0 1 (-1)
    obtain ⟨c, hc⟩ := h 1 0 (-1) 0
    simp [form, A, B, C] at ha hb hc
    refine ⟨-a, -b, c, ?_, ?_, ?_⟩ <;> grind
  · rintro ⟨a,b,c,hp,hq,hr⟩ m n u v
    refine ⟨a*A m n + b*B m n u v + c*C m n, ?_⟩
    unfold form
    grind

theorem quotient_witness : form 0 0 1 1 0 (-1) 0 = 1 := by decide
theorem cover_witness : form 0 0 1 (-3) (-3) 2 2 = 36 := by decide
theorem cover_misses_fraction :
    ¬ integralOnH 0 0 1 36 := by
  intro h
  obtain ⟨k,hk⟩ := h 1 0 (-1) 0
  simp [form,A,B,C] at hk
  omega

/- Let doubled tensor mixed-gravity coefficients be integers p,q,r.
   Six times the required transfer coefficients are 16-3p,-3q,-3r.
   Parent invariants impose x+y+2z=0. -/
theorem parent_annihilator (s t : Int) :
    (-2*s) + (-2*t) + 2*(s+t) = 0 := by omega

theorem standard_tensor_obstruction (p q r : Int) :
    (16-3*p) + (-3*q) + 2*(-3*r) ≠ 0 := by omega

theorem no_standard_tensor_parent_match :
    ¬ (∃ p q r : Int, (16-3*p) + (-3*q) + 2*(-3*r) = 0) := by
  rintro ⟨p,q,r,h⟩
  exact standard_tensor_obstruction p q r h

theorem residue_mod_three (p q r : Int) :
    ((16-3*p) + (-3*q) + 2*(-3*r)) % 3 = 1 := by omega
end GHUQuantization
#print axioms GHUQuantization.integral_basis_criterion
#print axioms GHUQuantization.quotient_witness
#print axioms GHUQuantization.cover_witness
#print axioms GHUQuantization.cover_misses_fraction
#print axioms GHUQuantization.parent_annihilator
#print axioms GHUQuantization.standard_tensor_obstruction
#print axioms GHUQuantization.no_standard_tensor_parent_match
#print axioms GHUQuantization.residue_mod_three
