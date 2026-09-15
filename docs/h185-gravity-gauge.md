# Gravity–gauge · 3D (H185)

Open the app and choose **Gravity & gauge · research → Gravity–gauge · 3D**.
The section owns its model; switching to the SU(N) builder does not reinterpret these inputs.

## Use

1. Start at p=1.1. Press eta=-0.9, eta=0 and eta=4. Compare the paired masses and the changing response.
2. Drag either 3D plot to rotate it; focus it and use arrow keys for keyboard control. The mouse wheel changes relief and double-click resets the view.
3. On the response surface, switch `drag: turn` to `drag: select point` to change the source position and eta directly. Shift-drag always rotates.
4. The surface can display a spectral-weight multiplier or the gauge kinetic function Z. The horizontal eta coordinate and the height are logarithmic, labelled explicitly.
5. Read the table, then use the header **card**, **LaTeX** or **link** buttons. Each export carries this section's input and its scope. No Higgs mass or collider rate is exported as known.

The source position t is a prescribed point in the extra dimension. It is not a movable laboratory detector. The default t=0.5 is a theoretical probe.

## Model and normalization

On t=z/ell in [0.1,1], take A=-p log(t), p=1 or 1.1. Write I(t)=integral_0.1^t exp(3A) dt, P=I/I(1), F=(1+eta P)/(1+eta), and Z=exp(-4A) F^2. The displayed domain is -0.99<=eta<=4; eta<=-1 is excluded. Z(IR)=1.

The canonical vector variable psi=sqrt(w) v, w=exp(A)Z, obeys -psi''+V_P psi=m^2 psi with V_P=9 A'^2/4-3 A''/2, independent of eta. For Dirichlet at both ends this is the massive tensor partner. The tensor has a zero mode that the map annihilates; the paired vector has none. For vector Neumann boundaries the canonical Robin coefficients depend on eta and the masses move.

With W=integral w dz and J=integral dz/w, g4^2=g5^2/W. At fixed g4, g5 is recalibrated. A Wilson angle of fixed period has f_theta^2=1/(g4^2 W J). This is a leading-derivative kinetic coefficient in a specified generator convention, not the measured Higgs mass or a complete SO(5) prediction. A fixed point current has residue g4^2 W v_n(t)^2; its ratio to eta=0 is W/(W0 F(t)^2). Different charges or source profiles must be specified before using this as a collider coupling.

## Covariant bulk realization and limits

For p>1, with M=M5^3 and action M R/2-(d phi)^2/2-U, choose phi=c log(t), c^2=3M p(p-1), and U=-3M p(3p+1)t^(2p-2)/(2ell^2). Einstein and the scalar equation hold. Since t=exp(phi/c), every displayed Z is a local positive function Z(phi). At zero background field strength it does not alter this bulk solution. Boundary actions and a scalar/radion stability analysis are still needed for a full model.

For p=1 this scalar is constant. The nonconstant prescribed Z weights have no realization through that same constant scalar. The special eta=-0.99 point gives Z=1 and is minimal RS on this interval. No experimental scale has been fitted. Positivity of Z alone does not certify an effective-theory cutoff.

## Numerical provenance

`data/h185_reference.json` records the Python/SciPy reference and its hash. The first three DD roots for each of the two geometries are pinned Bessel roots cross-checked with DOP853. The exact all-mode statement is an operator identity, not an extrapolation from three roots. The browser solves the first massive NN root independently using RK4 and bisection, and evaluates W, J and the response using closed forms. `_test_gravitygauge.mjs` compares these routes and rejects inputs outside the declared domain.

## Literature

- [Lim et al. (2005), supersymmetry of extra-dimensional gauge operators](https://arxiv.org/abs/hep-th/0502022).
- [Lim et al. (2007/08), five-dimensional gravity](https://arxiv.org/abs/0710.0170).
- [Brandhuber and Sfetsos (2000, corrected addendum), gauge/gravity partner potentials, eqs.31–32](https://arxiv.org/abs/hep-th/0010048).
- [Sakamura (2007), Wilson-line effective action, section2.3](https://arxiv.org/abs/0705.1334).
- [DeWolfe et al., Einstein–scalar backgrounds](https://arxiv.org/abs/hep-th/9909134).

The operator mechanism and Wilson-line normalization have established antecedents. H185 is a derivation and diagnostic example; it makes no claim of literature priority or experimental discovery.

## Re-run the interface checks

Run `node build/gravitygauge.mjs` after building the app. It checks real pointer rotation and point selection, presets, invalid input, both header exports, permalink reload, navigation, reset and mobile layout. Chromium is required for this optional check; the app itself runs offline without it. Screenshots and the check report are saved in `shots/gravitygauge/`.
