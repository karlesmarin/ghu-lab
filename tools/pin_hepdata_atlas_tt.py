"""Pin the ATLAS tt-resonance limits on a KK gluon (arXiv:2512.17856, HEPData ins3094414, Figure 10c) into data/.

    python tools/pin_hepdata_atlas_tt.py   -> data/hepdata_atlas_ins3094414_fig10c.json (raw, as served)
                                           -> data/hepdata_atlas_ins3094414_fig10c.meta.json (doi, url, sha256, columns)

The raw bytes are kept exactly as HEPData served them (CC0), so the sha256 identifies the record; the meta file
parses the five series (expected 1-lepton, expected 2-lepton, observed combined, expected combined with ±1σ/±2σ,
theory g_KK with Γ/M = 30%) into plain columns in pb versus TeV.
"""
import datetime
import hashlib
import json
import urllib.request

URL = 'https://www.hepdata.net/download/table/ins3094414/Figure%2010c/1/json'
# HEPData answers 403 to urllib (with or without a User-Agent) and 200 to curl, so the download is a documented
# curl step and this script reads its bytes:   curl -sL "<URL>" -o <file>  ;  python tools/pin_hepdata_atlas_tt.py <file>
import sys
raw = open(sys.argv[1], 'rb').read()
open('data/hepdata_atlas_ins3094414_fig10c.json', 'wb').write(raw)
d = json.loads(raw)
names = [h['name'] for h in d['headers']]
cols = {n: [] for n in names}
band = {'expected_plus1': [], 'expected_minus1': [], 'expected_plus2': [], 'expected_minus2': []}
for row in d['values']:
    cols[names[0]].append(float(row['x'][0]['value']))
    for k, y in enumerate(row['y'], 1):
        cols[names[k]].append(float(y['value']))
        if names[k] == 'Expected combined limit':
            for e in y['errors']:
                a = e['asymerror']
                tag = '1' if '1' in e['label'] else '2'
                band['expected_plus' + tag].append(float(a['plus']))
                band['expected_minus' + tag].append(float(a['minus']))
meta = {'schema': 'ghu-hepdata-pin-v1', 'doi': d['doi'], 'url': URL,
        'paper': 'ATLAS, arXiv:2512.17856 (140 fb^-1, 13 TeV), Figure 10c', 'license': 'CC0 (HEPData)',
        'downloaded_utc': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'raw_file': 'data/hepdata_atlas_ins3094414_fig10c.json', 'raw_sha256': hashlib.sha256(raw).hexdigest(),
        'units': {'mass': 'TeV', 'limits_and_theory': 'pb (sigma x BR(tt))'},
        'signal_hypothesis': 'RS KK gluon, g_q = -0.2 g_s, g_tL = g_s, Gamma/M = 30%, BR(tt) = 92.5% (paper Sec. 2); '
                             'theory column: MadGraph 2.9.3 LO, NNPDF2.3lo, no K-factor (paper Sec. 4)',
        'columns': {'mass_TeV': cols[names[0]], 'expected_1lep': cols[names[1]], 'expected_2lep': cols[names[2]],
                    'observed': cols[names[3]], 'expected': cols[names[4]], 'theory_gKK_30pc': cols[names[5]], **band}}
json.dump(meta, open('data/hepdata_atlas_ins3094414_fig10c.meta.json', 'w', encoding='utf-8'), indent=1)
print(meta['doi'], meta['raw_sha256'][:16], 'rows', len(meta['columns']['mass_TeV']))
print('observed', meta['columns']['observed'])
print('theory  ', meta['columns']['theory_gKK_30pc'])
