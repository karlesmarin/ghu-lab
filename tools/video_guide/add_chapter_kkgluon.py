"""Insert the 'kkgluon' chapter (First KK gluon at the LHC) into the video storyboard, after HiggsTools, and mark the
storyboard as the 2026-10-10 revision. Idempotent; refuses to rewrite a file whose formatting json.dumps cannot
reproduce, and writes bytes (LF) so the diff is only the change.
    python tools/video_guide/add_chapter_kkgluon.py
"""
import json
import pathlib

PATH = pathlib.Path(__file__).resolve().parent / 'storyboard.json'
CARD = '#rx_kkgluon'
STEPS = [
    {"text": "Open the first Kaluza Klein gluon card in Collider and load the published R S point of Casagrande and collaborators. "
             "The card computes the couplings of a warped Kaluza Klein gluon to zero-mode quarks, its width and branching fractions, "
             "and compares its leading-order rates with the ATLAS top-pair limit and the C M S dijet limit as r, prediction over limit.",
     "textES": "Abre la tarjeta del primer gluón de Kaluza Klein en Collider y carga el punto R S publicado por Casagrande y colaboradores. "
               "La tarjeta calcula los acoplos de un gluón de Kaluza Klein curvado a los quarks de modo cero, su anchura y sus fracciones de desintegración, "
               "y compara sus tasas a primer orden con el límite de ATLAS en pares de top y el límite de dijets de C M S como r, predicción entre límite.",
     "actions": [{"kind": "button", "text": "Published RS point (arXiv:0807.4937)"}],
     "focus": {"selector": CARD + "_result", "index": 0}},
    {"text": "At three point seven five tera electron volts, r for the top pair is close to one: the two thousand eight reference point sits at the edge of the ATLAS comparison. "
             "That is a comparison with ATLAS's thirty percent width benchmark, not a validated exclusion at this width.",
     "textES": "A tres coma siete cinco teraelectronvoltios, r para el par de top queda cerca de uno: el punto de referencia de dos mil ocho está en el borde de la comparación con ATLAS. "
               "Es una comparación con la plantilla de anchura del treinta por ciento de ATLAS, no una exclusión validada a esta anchura.",
     "actions": [{"kind": "scroll", "selector": CARD + "_result svg", "index": 0}],
     "focus": {"selector": CARD + "_result svg", "index": 0}},
    {"text": "Below the plots, the top-pair mass spectrum is computed with the interference between the Kaluza Klein gluon and the Q C D gluon, "
             "in the fifteen bins of the C M S parton-level measurement. For this point the light-quark and top couplings have opposite signs, "
             "so the interference is constructive below the pole.",
     "textES": "Debajo, el espectro de masa del par de top se calcula con la interferencia entre el gluón de Kaluza Klein y el gluón de Q C D, "
               "en los quince intervalos de la medida de C M S a nivel de partones. En este punto los acoplos del quark ligero y del top tienen signos opuestos, "
               "así que la interferencia es constructiva por debajo del polo.",
     "actions": [{"kind": "scroll", "selector": CARD + "_result svg", "index": 2}],
     "focus": {"selector": CARD + "_result svg", "index": 2}},
    {"text": "Now load the flat G H U coloron at four point five tera electron volts. Every quark couples equally, the couplings share one sign, "
             "and the interference turns destructive: the low bins go down instead of up.",
     "textES": "Carga ahora el coloron de G H U plana a cuatro coma cinco teraelectronvoltios. Todos los quarks acoplan igual, los acoplos tienen el mismo signo "
               "y la interferencia se vuelve destructiva: los intervalos bajos bajan en lugar de subir.",
     "actions": [{"kind": "button", "text": "Flat GHU coloron · 4.5 TeV"}],
     "focus": {"selector": CARD + "_result svg", "index": 2}},
    {"text": "The last plot is the expected delta chi squared against the measured covariance, with ten percent S M theory uncertainty per bin. "
             "Set that uncertainty to zero and the reach moves from about three point eight to about five tera electron volts. "
             "It is a sensitivity if the data equal the S M, not an exclusion, and the open certificates show the independent Dirac-trace and L H A P D F check.",
     "textES": "La última gráfica es el delta chi cuadrado esperado frente a la covarianza medida, con un diez por ciento de incertidumbre teórica del S M por intervalo. "
               "Pon esa incertidumbre a cero y el alcance pasa de unos tres coma ocho a unos cinco teraelectronvoltios. "
               "Es una sensibilidad si los datos son el S M, no una exclusión, y los certificados muestran la comprobación independiente con trazas de Dirac y L H A P D F.",
     "actions": [{"kind": "set", "selector": CARD + "_controls [data-rx=\"ttTheory\"]", "value": 0}],
     "focus": {"selector": CARD + "_result svg", "index": 3}},
]
CHAPTER = {"id": "kkgluon", "title": "First KK gluon at the LHC", "titleES": "Primer gluón KK en el LHC", "host": "collider", "setup": []}

text = PATH.read_text(encoding='utf-8')
plan = json.loads(text)
fmt = next((i for i in (1, 2, None) if json.dumps(plan, ensure_ascii=False, indent=i) + '\n' == text
            or json.dumps(plan, ensure_ascii=False, indent=i) == text), 'unknown')
if fmt == 'unknown':
    raise SystemExit('storyboard.json: formatting not reproducible; refusing to rewrite it')
plan['chapters'] = [c for c in plan['chapters'] if c['id'] != 'kkgluon']
at = next(i for i, c in enumerate(plan['chapters']) if c['id'] == 'higgstools') + 1
number = at + 1
steps = [{"text": s["text"], "actions": s["actions"], "focus": s["focus"], "title": None,
          "id": f"{number:02d}_kkgluon_{k + 1:02d}", "textES": s["textES"]} for k, s in enumerate(STEPS)]
plan['chapters'].insert(at, {**CHAPTER, "steps": steps, "number": number})
for i, c in enumerate(plan['chapters']):
    c['number'] = i + 1
plan['date'] = '2026-10-10'
plan['revisionOf'] = '2026-10-08-certification'
plan['revision'] = '2026-10-10-kkgluon'
plan['scope'] = plan['scope'].replace('eight research cards', 'nine research cards').replace(
    'named LHC datasets and matched thermal solver diagnostics.',
    'named LHC datasets, matched thermal solver diagnostics and the first KK gluon against ATLAS and CMS data.')
start = plan['chapters'][0]['steps'][0]
start['text'] = start['text'].replace('thermal solver comparison and named collider references.',
                                      'thermal solver comparison, named collider references and the first Kaluza Klein gluon against L H C data.')
start['textES'] = start['textES'].replace('comparación térmica y referencias experimentales identificadas.',
                                          'comparación térmica, referencias experimentales identificadas y el primer gluón de Kaluza Klein frente a datos del L H C.')
out = json.dumps(plan, ensure_ascii=False, indent=fmt) + ('\n' if text.endswith('\n') else '')
PATH.write_bytes(out.encode('utf-8'))
print('chapters', len(plan['chapters']), 'scenes', sum(len(c['steps']) for c in plan['chapters']), 'kkgluon at', number)
