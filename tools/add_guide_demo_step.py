"""Tell readers about the 🎬 guided demos in the 'getting-started' guide, in both catalogues, preserving each file's
JSON formatting (checked before writing) and line endings. Idempotent.
    python tools/add_guide_demo_step.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
STEP = {
    'en': 'Not sure where to start? Every menu section, Simulator mode and experiment card has a 🎬 Demo button (in "How to use this section" or in the card heading): it presses the real controls for you, explains each step and ends with how to read the result.',
    'es': '¿No sabes por dónde empezar? Cada sección del menú, modo del simulador y tarjeta de experimento tiene un botón 🎬 Demo (en «Cómo utilizar esta sección» o en el título de la tarjeta): pulsa los controles reales por ti, explica cada paso y termina con cómo leer el resultado.',
}
for fname, lang in (('docs/user-guides.json', 'en'), ('docs/user-guides.es.json', 'es')):
    path = ROOT / fname
    raw = path.read_bytes()
    text = raw.decode('utf-8')
    data = json.loads(text)
    fmt = next((i for i in (1, 2, None) if json.dumps(data, ensure_ascii=False, indent=i) + '\n' == text
                or json.dumps(data, ensure_ascii=False, indent=i) == text), 'unknown')
    if fmt == 'unknown':
        raise SystemExit(f'{fname}: formatting not reproducible; refusing to rewrite it')
    g = next(x for x in data['guides'] if x['id'] == 'getting-started')
    if STEP[lang] not in g['steps']:
        g['steps'].insert(0, STEP[lang])
    out = json.dumps(data, ensure_ascii=False, indent=fmt) + ('\n' if text.endswith('\n') else '')
    path.write_bytes(out.encode('utf-8'))
    print(fname, 'getting-started steps', len(g['steps']))
