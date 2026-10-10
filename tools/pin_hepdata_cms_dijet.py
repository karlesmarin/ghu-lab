"""Pin the CMS dijet-resonance limits (arXiv:1911.03947, JHEP 05 (2020) 033, HEPData ins1764471) into data/.

HEPData answers 403 to urllib, so the two tables are a documented curl step:
  curl -sL "https://www.hepdata.net/download/table/ins1764471/Cross-section%20limits%20for%20a%20quark-quark%20type%20dijet%20resonance/1/json" -o narrow.json
  curl -sL "https://www.hepdata.net/download/table/ins1764471/Cross-section%20limits%20for%20a%20qq,%20spin%201%20dijet%20resonance/1/json" -o spin1.json
  python tools/pin_hepdata_cms_dijet.py narrow.json spin1.json
Raw bytes are kept as served (CC0); the meta file holds the parsed columns ('-' -> null), DOI and sha256.
The narrow table carries CMS's own model predictions (sigma x B x A, NWA, CTEQ6L1 LO times K; paper Sec. 7),
including the axigluon/coloron curve used for the 6.6 TeV limit — the control for this laboratory's cross section.
"""
import datetime
import hashlib
import json
import sys


def parse(raw):
    d = json.loads(raw)
    names = [h['name'] for h in d['headers']]
    cols = {n: [] for n in names}
    for row in d['values']:
        cols[names[0]].append(float(row['x'][0]['value']))
        for k, y in enumerate(row['y'], 1):
            v = y['value']
            cols[names[k]].append(None if v in ('-', '') else float(v))
    return d['doi'], names, cols


out = {'schema': 'ghu-hepdata-pin-v1', 'paper': 'CMS, arXiv:1911.03947 (137 fb^-1, 13 TeV), JHEP 05 (2020) 033',
       'license': 'CC0 (HEPData)', 'downloaded_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
       'kinematics': '|Delta eta_jj| < 1.1, |eta| < 2.5; limits on sigma x B x A (pb) versus resonance mass (GeV)',
       'model_predictions': 'NWA, CTEQ6L1 LO; K = 1.1 (0.6 TeV) to 1.3 (8.1 TeV) for axigluon/coloron; B to five light quarks and gluons (top in the width only); A at parton level, about 0.5 for isotropic decays',
       'tables': {}}
for tag, path, fname in (('narrow_qq', sys.argv[1], 'data/hepdata_cms_ins1764471_narrow_qq.json'),
                         ('spin1_qq_widths', sys.argv[2], 'data/hepdata_cms_ins1764471_spin1_qq.json')):
    raw = open(path, 'rb').read()
    open(fname, 'wb').write(raw)
    doi, names, cols = parse(raw)
    out['tables'][tag] = {'doi': doi, 'raw_file': fname, 'raw_sha256': hashlib.sha256(raw).hexdigest(),
                          'headers': names, 'columns': cols}
    print(tag, doi, len(cols[names[0]]), 'rows')
json.dump(out, open('data/hepdata_cms_ins1764471.meta.json', 'w', encoding='utf-8'), indent=1)
n = out['tables']['narrow_qq']['columns']
print('coloron theory at 6000/6600/7000 GeV:', [(m, c) for m, c in zip(n['Resonance mass [GeV]'], n['Axigluon/coloron cross section [pb]']) if m in (6000.0, 6600.0, 7000.0)])
