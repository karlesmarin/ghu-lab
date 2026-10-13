import Lean
/- Arithmetic certificates only. Geometric realization of period triples and
   evenness of the intersection pairing on spin 4-manifolds are external inputs.
   t is a common denominator in applications (nonzero); statements below also
   remain valid as divisibility statements at t=0. No novelty is asserted. -/
namespace SpinPeriod

def universalPeriods (p q r t : Int) : Prop :=
  ∀ a b c : Int, ∃ k : Int, p*a + q*b + r*c = t*k

def spinPeriods (p q r t : Int) : Prop :=
  ∀ a b c : Int, ∃ k : Int, p*a + q*b + 2*r*c = t*k

theorem universal_basis (p q r t : Int) :
    universalPeriods p q r t ↔ ∃ x y z : Int, p=t*x ∧ q=t*y ∧ r=t*z := by
  constructor
  · intro h
    obtain ⟨x,hx⟩ := h 1 0 0
    obtain ⟨y,hy⟩ := h 0 1 0
    obtain ⟨z,hz⟩ := h 0 0 1
    exact ⟨x,y,z, by simpa using hx, by simpa using hy, by simpa using hz⟩
  · rintro ⟨x,y,z,hx,hy,hz⟩ a b c
    refine ⟨x*a+y*b+z*c, ?_⟩
    grind

theorem spin_basis (p q r t : Int) :
    spinPeriods p q r t ↔ ∃ x y z : Int, p=t*x ∧ q=t*y ∧ 2*r=t*z := by
  constructor
  · intro h
    obtain ⟨x,hx⟩ := h 1 0 0
    obtain ⟨y,hy⟩ := h 0 1 0
    obtain ⟨z,hz⟩ := h 0 0 1
    exact ⟨x,y,z, by simpa using hx, by simpa using hy, by simpa using hz⟩
  · rintro ⟨x,y,z,hx,hy,hz⟩ a b c
    refine ⟨x*a+y*b+z*c, ?_⟩
    grind

theorem universal_implies_spin (p q r t : Int) (h : universalPeriods p q r t) :
    spinPeriods p q r t := by
  intro a b c
  obtain ⟨k,hk⟩ := h a b (2*c)
  exact ⟨k, by grind⟩

theorem half_square_spin : spinPeriods 0 0 1 2 := by
  intro a b c
  exact ⟨c, by simp⟩

theorem half_square_not_universal : ¬ universalPeriods 0 0 1 2 := by
  intro h
  obtain ⟨k,hk⟩ := h 0 0 1
  simp at hk
  omega

/- Choi et al. arXiv:2309.03937v2 Table 1, q=6, translated into
   A=c2(E2), B=c2(E3), C=c1(E3)^2; mathematical Chern sign conventions. -/
theorem q6_congruence (K2 K3 K1 : Int) :
    spinPeriods (-72*K2) (-72*K3) (18*K2+24*K3+K1) 72 ↔
      ∃ k : Int, 18*K2+24*K3+K1=36*k := by
  rw [spin_basis]
  constructor
  · rintro ⟨x,y,z,hx,hy,hz⟩
    exact ⟨z, by omega⟩
  · rintro ⟨k,hk⟩
    refine ⟨-K2,-K3,k,?_,?_,?_⟩ <;> grind

theorem q6_implies_six (K2 K3 K1 k : Int)
    (h : 18*K2+24*K3+K1=36*k) : ∃ j : Int, K1=6*j := by
  exact ⟨6*k-3*K2-4*K3, by omega⟩
end SpinPeriod
#print axioms SpinPeriod.universal_basis
#print axioms SpinPeriod.spin_basis
#print axioms SpinPeriod.universal_implies_spin
#print axioms SpinPeriod.half_square_spin
#print axioms SpinPeriod.half_square_not_universal
#print axioms SpinPeriod.q6_congruence
#print axioms SpinPeriod.q6_implies_six
