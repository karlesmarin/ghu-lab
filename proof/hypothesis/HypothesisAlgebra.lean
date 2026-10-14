import Lean

/- Exact rational algebra only. Real differentiation, Taylor remainders,
   Bessel integrals, floating-point implementations and physics are outside
   these declarations. r represents 1/fH in the coefficient convention.
   Normalized derivatives a,b,c,d represent D'/D,...,D''''/D. -/
namespace HypothesisAlgebra

theorem canonical_quartic (v2 v3 v4 h r : Rat) :
    v2*(h*r)^2/2 + v3*(h*r)^3/6 + v4*(h*r)^4/24 =
    (v2*r^2)/2*h^2 + (v3*r^3/6)*h^3 + (v4*r^4/24)*h^4 := by
  grind

theorem mass_coefficient (v2 r : Rat) :
    2*(v2*r^2/2) = v2*r^2 := by grind

theorem log_second_numerator (D u v r : Rat) (hr : D*r=1) :
    (v*D-u^2)*r^2 = v*r-(u*r)^2 := by grind

theorem log_third_recurrence (a b c : Rat) :
    (c-a*b)-2*a*(b-a^2) = c-3*a*b+2*a^3 := by grind

theorem log_fourth_recurrence (a b c d : Rat) :
    (d-a*c)-3*((b-a^2)*b+a*(c-a*b))+6*a^2*(b-a^2) =
    d-4*a*c-3*b^2+12*a^2*b-6*a^4 := by grind

theorem vacuum_offset_cancels (v v0 c : Rat) :
    (v+c)-(v0+c)=v-v0 := by grind

/- Numerator T^2 J for two bins, T=w0*x0+w1*x1. -/
theorem normalization_null_column (w0 w1 x0 x1 : Rat) :
    w0*((w0*x0+w1*x1)-x0*w0)+w1*(-x1*w0)=0 := by grind

theorem covariance_pullback_two (a b c u v p q : Rat) :
    a*(u*p+v*q)^2 + 2*b*(u*p+v*q)*(p-q) + c*(p-q)^2 =
    (a*u^2+2*b*u+c)*p^2 +
    2*(a*u*v+b*(v-u)-c)*p*q + (a*v^2-2*b*v+c)*q^2 := by grind

theorem gram_minor_two (a b c d : Rat) :
    (a^2+b^2)*(c^2+d^2)-(a*c+b*d)^2=(a*d-b*c)^2 := by grind

theorem covariance_unit_minor (a b c si sj : Rat) :
    (si^2*a)*(sj^2*c)-(si*sj*b)^2 = (si*sj)^2*(a*c-b^2) := by grind

end HypothesisAlgebra
#print axioms HypothesisAlgebra.canonical_quartic
#print axioms HypothesisAlgebra.mass_coefficient
#print axioms HypothesisAlgebra.log_second_numerator
#print axioms HypothesisAlgebra.log_third_recurrence
#print axioms HypothesisAlgebra.log_fourth_recurrence
#print axioms HypothesisAlgebra.vacuum_offset_cancels
#print axioms HypothesisAlgebra.normalization_null_column
#print axioms HypothesisAlgebra.covariance_pullback_two
#print axioms HypothesisAlgebra.gram_minor_two
#print axioms HypothesisAlgebra.covariance_unit_minor
