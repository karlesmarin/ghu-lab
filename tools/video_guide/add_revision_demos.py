"""Mark the video storyboard as the 2026-10-10-demos revision: the welcome mentions the 🎬 Demo buttons, the KK-gluon
chapter opens by starting its card's own guided demo and then takes over, and its narration follows the card after
the external review (all nine bulk masses; the m(tt̄) Δχ² with the theory error correlated). Every chapter is then
re-recorded, so the screens show the current laboratory. Idempotent; refuses a file whose formatting json.dumps
cannot reproduce, and writes bytes (LF) so the diff is only the change.
    python tools/video_guide/add_revision_demos.py
"""
import json
import pathlib

PATH = pathlib.Path(__file__).resolve().parent / 'storyboard.json'
CARD = '#rx_kkgluon'

DEMO_STEP = {
    "text": "Every menu section, Simulator mode and experiment card now has a Demo button, marked with a film clapper. "
            "It presses the real controls, explains each step in a banner, and ends with how to read the result. "
            "Here the Kaluza Klein gluon card starts its own demo.",
    "textES": "Cada sección del menú, cada modo del Simulador y cada tarjeta de experimento tiene ahora un botón Demo, marcado con una claqueta. "
              "Pulsa los controles de verdad, explica cada paso en un recuadro y termina con cómo leer el resultado. "
              "Aquí la tarjeta del gluón de Kaluza Klein arranca su propia demo.",
    "actions": [{"kind": "click", "selector": CARD + " .cdm-btn"}],
    "focus": {"selector": CARD, "index": 0}}   # the banner is fixed: focusing it would not scroll the card into view

OLD_FIRST = ("Open the first Kaluza Klein gluon card in Collider and load the published R S point of Casagrande and collaborators. ",
             "Abre la tarjeta del primer gluón de Kaluza Klein en Collider y carga el punto R S publicado por Casagrande y colaboradores. ")
NEW_FIRST = ("Stop the demo and take over: load the published R S point of Casagrande and collaborators, with all nine of its quark bulk masses. ",
             "Para la demo y toma el control: carga el punto R S publicado por Casagrande y colaboradores, con sus nueve masas de bulk de los quarks. ")
OLD_LAST = ("It is a sensitivity if the data equal the S M, not an exclusion, ",
            "Es una sensibilidad si los datos son el S M, no una exclusión, ")
NEW_LAST = ("With the same ten percent taken as one correlated normalisation, delta chi squared would be five point three instead of one point eight: "
            "the reach depends on that assumption, and the card shows both. It is a sensitivity if the data equal the S M, not an exclusion, ",
            "Con el mismo diez por ciento tomado como una normalización correlada, el delta chi cuadrado sería cinco coma tres en vez de uno coma ocho: "
            "el alcance depende de ese supuesto, y la tarjeta da los dos. Es una sensibilidad si los datos son el S M, no una exclusión, ")
WELCOME = ("and the first Kaluza Klein gluon against L H C data.",
           "y el primer gluón de Kaluza Klein frente a datos del L H C.")
WELCOME_NEW = ("and the first Kaluza Klein gluon against L H C data. Every section and card also has a Demo button that runs a guided simulation.",
               "y el primer gluón de Kaluza Klein frente a datos del L H C. Cada sección y cada tarjeta tiene además un botón Demo con una simulación guiada.")

text = PATH.read_text(encoding='utf-8')
plan = json.loads(text)
fmt = next((i for i in (1, 2, None) if json.dumps(plan, ensure_ascii=False, indent=i) + '\n' == text
            or json.dumps(plan, ensure_ascii=False, indent=i) == text), 'unknown')
if fmt == 'unknown':
    raise SystemExit('storyboard.json: formatting not reproducible; refusing to rewrite it')

if plan['revision'] != '2026-10-10-demos':
    ch = next(c for c in plan['chapters'] if c['id'] == 'kkgluon')
    steps = [{k: v for k, v in s.items()} for s in ch['steps']]
    first, last = steps[0], steps[-1]
    for key, i in (('text', 0), ('textES', 1)):
        assert first[key].count(OLD_FIRST[i]) == 1, (key, 'first')
        first[key] = first[key].replace(OLD_FIRST[i], NEW_FIRST[i])
        assert last[key].count(OLD_LAST[i]) == 1, (key, 'last')
        last[key] = last[key].replace(OLD_LAST[i], NEW_LAST[i])
    first['actions'] = [{"kind": "click", "selector": "[data-cdm-stop]"}] + first['actions']
    demo = {"text": DEMO_STEP["text"], "actions": DEMO_STEP["actions"], "focus": DEMO_STEP["focus"], "title": None,
            "id": None, "textES": DEMO_STEP["textES"]}
    steps = [demo] + steps
    for k, s in enumerate(steps):
        s['id'] = f"{ch['number']:02d}_kkgluon_{k + 1:02d}"
    ch['steps'] = steps
    start = plan['chapters'][0]['steps'][0]
    for key, i in (('text', 0), ('textES', 1)):
        assert start[key].count(WELCOME[i]) == 1, (key, 'welcome')
        start[key] = start[key].replace(WELCOME[i], WELCOME_NEW[i])
    plan['revisionOf'] = plan['revision']
    plan['revision'] = '2026-10-10-demos'
    plan['date'] = '2026-10-10'
    assert plan['scope'].count('the first KK gluon against ATLAS and CMS data.') == 1
    plan['scope'] = plan['scope'].replace('the first KK gluon against ATLAS and CMS data.',
                                          'the first KK gluon against ATLAS and CMS data, and the guided Demo buttons.')
out = json.dumps(plan, ensure_ascii=False, indent=fmt) + ('\n' if text.endswith('\n') else '')
PATH.write_bytes(out.encode('utf-8'))
print('revision', plan['revision'], 'of', plan['revisionOf'], 'chapters', len(plan['chapters']),
      'scenes', sum(len(c['steps']) for c in plan['chapters']))
