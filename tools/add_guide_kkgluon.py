"""Add the user guide of the 'kkgluon' experiment card (Collider) to docs/user-guides.json and docs/user-guides.es.json,
preserving each file's own JSON formatting (checked before writing). Idempotent: an existing 'kkgluon' entry is replaced.
    python tools/add_guide_kkgluon.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
REFS = [
    {"label": "ATLAS tt̄ resonances, arXiv:2512.17856", "url": "https://arxiv.org/abs/2512.17856"},
    {"label": "HEPData: ATLAS Fig. 10c (KK gluon limits)", "url": "https://doi.org/10.17182/hepdata.168229.v1/t15"},
    {"label": "CMS dijet resonances, arXiv:1911.03947", "url": "https://arxiv.org/abs/1911.03947"},
    {"label": "HEPData: CMS spin-1 qq limits by width", "url": "https://doi.org/10.17182/hepdata.91059.v1/t10"},
    {"label": "Casagrande et al., RS reference point, arXiv:0807.4937", "url": "https://arxiv.org/abs/0807.4937"},
    {"label": "Atre et al., colour-octet widths, arXiv:1206.1661", "url": "https://arxiv.org/abs/1206.1661"},
    {"label": "CMS differential tt̄ (TOP-20-001), arXiv:2108.02803", "url": "https://arxiv.org/abs/2108.02803"},
    {"label": "HEPData: CMS parton-level dσ/dm(tt̄)", "url": "https://doi.org/10.17182/hepdata.102956.v1/t37"},
    {"label": "HEPData: its covariance matrix", "url": "https://doi.org/10.17182/hepdata.102956.v1/t38"},
]
META = {"id": "kkgluon", "kind": "experiment", "host": "collider", "route": "s=collider&help=kkgluon", "video": "kkgluon",
        "source": "src/modules/kk_gluon_lhc.mjs", "terms": [], "related": ["collider", "higgstools", "rsanomaly", "rsrunning"],
        "references": REFS}
EN = {
    "title": "First KK gluon at the LHC: couplings, widths, tt̄ / dijet limits and the m(tt̄) spectrum",
    "what": "Compute the first KK gluon of flat GHU (√2 g_s to every quark) or of a warped extra dimension (zero-mode quarks of bulk mass c), its widths and branching fractions, and compare its leading-order σ × BR with the ATLAS tt̄ and CMS dijet limits as r = prediction / limit. Then compute the m(tt̄) spectrum with the interference between the KK gluon and the QCD gluon, in the bins of the CMS parton-level measurement, and the expected Δχ² against its covariance.",
    "steps": ["New here? Press 🎬 Demo in the card heading: a forty-second guided simulation presses the buttons for you and ends with how to read the result.", "Choose a preset: the flat GHU coloron, the published RS point of arXiv:0807.4937, or illustrative warped values.",
              "Change one input: the mass, kL or one of the c values.",
              "Read Γ/M, BR(tt̄) and the two r values at the chosen mass, then the two mass scans.",
              "Read the m(tt̄) paragraph: the sign of the interference below the pole, the largest change of the spectrum, Δχ² and the mass where it falls to 3.84; then the two spectrum figures.",
              "Open the certificates and the PDF systematic before quoting a crossing mass."],
    "read": "r ≥ 1 means the LO prediction exceeds the published observed limit of that experiment's benchmark. A crossing is a comparison with that benchmark, not a validated exclusion at another width; the low-tail share tells you when the result is mostly off-shell exchange.",
    "purpose": "Use this to see which LHC channel constrains which realisation: the flat coloron couples democratically (BR(tt̄) ≈ 1/6) and is probed by dijets and, through its large light-quark production, by tt̄; a warped KK gluon is top-philic (BR(tt̄) > 0.8) and broad, so tt̄ resonance searches are its channel.",
    "controls": [
        {"name": "Realisation", "meaning": "Flat GHU (Part VII coloron) or warped zero-mode quarks.", "try": "Switch at fixed mass and compare BR(tt̄)."},
        {"name": "KK-gluon mass [TeV]", "meaning": "The resonance mass at which the r values are read.", "try": "Move it across the crossing and watch r pass 1."},
        {"name": "kL and the c values", "meaning": "Warp factor and bulk masses (left-handed UV-localised for c > 1/2, right-handed for c < −1/2), as in the RS localisation probe.", "try": "Raise c of t_R and watch the top coupling and the width grow."},
        {"name": "α_s(M_Z)", "meaning": "0.130, the PDF set's value at M_Z, or this laboratory's 0.118; either is run to the mass at one loop with six flavours (the PDF set's own α_s table differs by about 0.6% at 1.8 TeV).", "try": "Compare the two; the production scales with the coupling."},
        {"name": "SM theory uncertainty per m(tt̄) bin", "meaning": "An uncorrelated fraction of each measured bin added to the CMS covariance, standing for the scale and PDF errors of the SM prediction.", "try": "Set it to 0 and to 0.2: the Δχ² and the mass where it reaches 3.84 move a lot, which is the honest size of this comparison."}],
    "outputs": [
        {"name": "Couplings g₁/g_s", "meaning": "Zero-mode couplings to the first KK gluon, certified against a 40-digit reference."},
        {"name": "Γ/M, BR(tt̄), BR(dijet)", "meaning": "Leading-order widths to quark pairs; the top threshold depends on chirality."},
        {"name": "r(tt̄) and r(dijet)", "meaning": "Prediction over the ATLAS observed limit (Γ/M = 30% template) and over the CMS spin-1 limit interpolated to this width."},
        {"name": "Low-tail and pole shares", "meaning": "Where σ(tt̄) comes from; a large low-tail share means the interference with QCD matters (computed in the spectrum)."},
        {"name": "Interference below the pole", "meaning": "Its sign is −sign(v_u v_t), v = (c_L + c_R)/2: destructive for same-sign couplings (flat GHU), constructive for the warped reference point."},
        {"name": "Δχ² of the m(tt̄) spectrum", "meaning": "Separation of SM and SM + KK gluon in units of the CMS covariance, if the data equal the SM: a sensitivity, not an exclusion. The shift is applied as R × data because the LO SM shape is not the measured one."}],
    "example": {"title": "The published RS point at the edge of the ATLAS limit",
                "steps": ["Load the published RS point preset.", "Read r(tt̄) at 3.75 TeV.", "Move the mass to 3.67 TeV, the point's own first KK gluon.", "Open the certificates."],
                "expect": "r(tt̄) is close to 1: the 2008 reference point sits at the edge of the 2025 ATLAS comparison, within the ±15% of the control."},
    "limits": ["Leading order; no K-factor for tt̄. The interference enters the m(tt̄) spectrum only; the resonance-search comparison uses the Breit–Wigner alone, as the experiments' templates do.",
               "The spectrum's Δχ² assumes the K-factor of the KK gluon and of the interference equals the SM's, and depends strongly on the SM theory uncertainty chosen.",
               "A limit set with one width template is not guaranteed conservative for another width.",
               "Above about 6 TeV the q q̄ luminosity differs between PDF sets by more than 20%.",
               "Four-top production and fermion KK modes are not computed."],
    "troubleshooting": [{"symptom": "An r value reads 'not evaluated'.", "action": "The mass or width lies outside the published grid (ATLAS 0.5–5 TeV; CMS width interpolation needs 10–30% and 2.1–6 TeV)."}],
}
ES = {
    "title": "Primer gluón KK en el LHC: acoplos, anchuras, límites tt̄ / dijets y espectro m(tt̄)",
    "what": "Calcula el primer gluón KK de GHU plana (√2 g_s a todos los quarks) o de una dimensión extra curvada (quarks de modo cero con masa de bulk c), sus anchuras y fracciones de desintegración, y compara su σ × BR a primer orden con los límites de ATLAS (tt̄) y CMS (dijets) como r = predicción / límite. Después calcula el espectro m(tt̄) con la interferencia entre el gluón KK y el gluón de QCD, en los intervalos de la medida de CMS a nivel de partones, y el Δχ² esperado frente a su covarianza.",
    "steps": ["¿Primera vez? Pulsa 🎬 Demo en el título de la tarjeta: una simulación guiada de cuarenta segundos pulsa los botones por ti y termina explicando cómo leer el resultado.", "Elige un preajuste: el coloron de GHU plana, el punto RS publicado de arXiv:0807.4937 o valores curvados ilustrativos.",
              "Cambia una entrada: la masa, kL o uno de los c.",
              "Lee Γ/M, BR(tt̄) y los dos r a la masa elegida, y después los dos barridos en masa.",
              "Lee el párrafo de m(tt̄): el signo de la interferencia bajo el polo, el mayor cambio del espectro, el Δχ² y la masa a la que baja a 3,84; después, las dos figuras del espectro.",
              "Abre los certificados y la sistemática de PDF antes de citar una masa de cruce."],
    "read": "r ≥ 1 significa que la predicción a primer orden supera el límite observado publicado para el benchmark de ese experimento. Un cruce es una comparación con ese benchmark, no una exclusión validada a otra anchura; la fracción de cola baja indica cuándo el resultado es sobre todo intercambio fuera de capa.",
    "purpose": "Sirve para ver qué canal del LHC acota cada realización: el coloron plano acopla por igual a todos los quarks (BR(tt̄) ≈ 1/6) y lo exploran los dijets y, por su gran producción desde quarks ligeros, el tt̄; el gluón KK curvado es top-fílico (BR(tt̄) > 0,8) y ancho, así que su canal son las búsquedas de resonancias tt̄.",
    "controls": [
        {"name": "Realización", "meaning": "GHU plana (coloron de la Parte VII) o quarks de modo cero en la dimensión curvada.", "try": "Cambia a masa fija y compara BR(tt̄)."},
        {"name": "Masa del gluón KK [TeV]", "meaning": "La masa a la que se leen los valores de r.", "try": "Muévela a través del cruce y mira cómo r pasa por 1."},
        {"name": "kL y los c", "meaning": "Factor de curvatura y masas de bulk (levógiro localizado en la UV si c > 1/2, dextrógiro si c < −1/2), como en la sonda de localización RS.", "try": "Sube el c de t_R y mira crecer el acoplo del top y la anchura."},
        {"name": "α_s(M_Z)", "meaning": "0,130, el valor del conjunto de PDF en M_Z, o el 0,118 de este laboratorio; los dos se llevan a la masa a un lazo con seis sabores (la tabla de α_s del propio conjunto difiere en torno al 0,6 % a 1,8 TeV).", "try": "Compara los dos; la producción escala con el acoplo."},
        {"name": "Incertidumbre teórica del SM por intervalo de m(tt̄)", "meaning": "Una fracción no correlacionada de cada intervalo medido que se suma a la covarianza de CMS, en lugar de los errores de escala y de PDF de la predicción del SM.", "try": "Ponla a 0 y a 0,2: el Δχ² y la masa a la que llega a 3,84 se mueven mucho; ese es el tamaño honesto de esta comparación."}],
    "outputs": [
        {"name": "Acoplos g₁/g_s", "meaning": "Acoplos de los modos cero al primer gluón KK, certificados contra una referencia de 40 dígitos."},
        {"name": "Γ/M, BR(tt̄), BR(dijets)", "meaning": "Anchuras a pares de quarks a primer orden; el umbral del top depende de la quiralidad."},
        {"name": "r(tt̄) y r(dijets)", "meaning": "Predicción entre el límite observado de ATLAS (plantilla Γ/M = 30 %) y entre el límite de espín 1 de CMS interpolado a esta anchura."},
        {"name": "Fracciones de cola baja y de polo", "meaning": "De dónde sale σ(tt̄); una cola baja grande significa que importa la interferencia con QCD (calculada en el espectro)."},
        {"name": "Interferencia bajo el polo", "meaning": "Su signo es −signo(v_u v_t), v = (c_L + c_R)/2: destructiva con acoplos del mismo signo (GHU plana), constructiva en el punto de referencia curvado."},
        {"name": "Δχ² del espectro m(tt̄)", "meaning": "Separación entre el SM y el SM + gluón KK en unidades de la covarianza de CMS, si los datos son el SM: una sensibilidad, no una exclusión. El cambio se aplica como R × datos porque la forma del SM a primer orden no es la medida."}],
    "example": {"title": "El punto RS publicado en el borde del límite de ATLAS",
                "steps": ["Carga el preajuste del punto RS publicado.", "Lee r(tt̄) a 3,75 TeV.", "Lleva la masa a 3,67 TeV, el primer gluón KK del propio punto.", "Abre los certificados."],
                "expect": "r(tt̄) queda cerca de 1: el punto de referencia de 2008 está en el borde de la comparación con ATLAS de 2025, dentro del ±15 % del control."},
    "limits": ["Primer orden; sin factor K para tt̄. La interferencia entra solo en el espectro m(tt̄); la comparación con las búsquedas de resonancias usa solo la Breit–Wigner, como las plantillas de los experimentos.",
               "El Δχ² del espectro supone que el factor K del gluón KK y el de la interferencia son los del SM, y depende mucho de la incertidumbre teórica del SM elegida.",
               "Un límite obtenido con una plantilla de anchura no es necesariamente conservador para otra anchura.",
               "Por encima de unos 6 TeV la luminosidad q q̄ difiere más de un 20 % entre conjuntos de PDF.",
               "No se calculan la producción de cuatro tops ni los modos KK de los fermiones."],
    "troubleshooting": [{"symptom": "Un valor de r dice «not evaluated».", "action": "La masa o la anchura caen fuera de la malla publicada (ATLAS 0,5–5 TeV; la interpolación de CMS necesita 10–30 % y 2,1–6 TeV)."}],
}
for fname, body in (("docs/user-guides.json", EN), ("docs/user-guides.es.json", ES)):
    path = ROOT / fname
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    fmt = next((ind for ind in (1, 2, None) if json.dumps(data, ensure_ascii=False, indent=ind) + "\n" == text
                or json.dumps(data, ensure_ascii=False, indent=ind) == text), "unknown")
    if fmt == "unknown":
        raise SystemExit(f"{fname}: formatting not reproducible by json.dumps; refusing to rewrite it")
    data["guides"] = [g for g in data["guides"] if g["id"] != "kkgluon"]
    entry = {**META, **body} if fname.endswith(".es.json") else {**META, **body}
    entry = {k: entry[k] for k in ["id", "kind", "title", "host", "route", "video", "source", "what", "steps", "read",
                                   "purpose", "controls", "outputs", "example", "limits", "troubleshooting", "terms", "related", "references"]}
    data["guides"].append(entry)
    out = json.dumps(data, ensure_ascii=False, indent=fmt) + ("\n" if text.endswith("\n") else "")
    path.write_bytes(out.encode("utf-8"))   # bytes: write_text would turn LF into CRLF on Windows (E19 class)
    print(fname, "indent", fmt, "guides", len(data["guides"]))
