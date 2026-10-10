"""Pin the CMS parton-level m(tt̄) spectrum (TOP-20-001, arXiv:2108.02803, PRD 104 (2021) 092013; HEPData ins1901295):
absolute and normalised dσ/dm(tt̄) with their covariance matrices.

HEPData answers 403 to urllib, so the four tables are a documented curl step into one folder:
  for t in parton_abs_ttm parton_abs_ttm_covariance parton_norm_ttm parton_norm_ttm_covariance; do
    curl -sL "https://www.hepdata.net/download/table/ins1901295/$t/1/json" -o <dir>/$t.json; done
  python tools/pin_hepdata_cms_ttbar.py <dir>
Raw bytes are kept as served (CC0) under data/hepdata_cms_ins1901295_<table>.json; the meta file holds bin edges,
values, stat/sys errors and the covariance as a matrix, with DOI and sha256 per table.
"""
import datetime
import hashlib
import json
import sys

src = sys.argv[1]
meta = {'schema': 'ghu-hepdata-pin-v1', 'paper': 'CMS TOP-20-001, arXiv:2108.02803, Phys. Rev. D 104 (2021) 092013',
        'record': 'HEPData ins1901295', 'license': 'CC0 (HEPData)', 'level': 'parton (full kinematic range)',
        'downloaded_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'tables': {}}
for kind in ('abs', 'norm'):
    spec_name, cov_name = f'parton_{kind}_ttm', f'parton_{kind}_ttm_covariance'
    raws = {n: open(f'{src}/{n}.json', 'rb').read() for n in (spec_name, cov_name)}
    for n, raw in raws.items():
        open(f'data/hepdata_cms_ins1901295_{n}.json', 'wb').write(raw)
    s, c = json.loads(raws[spec_name]), json.loads(raws[cov_name])
    lo = [float(r['x'][0]['low']) for r in s['values']]
    hi = [float(r['x'][0]['high']) for r in s['values']]
    val = [float(r['y'][0]['value']) for r in s['values']]
    err = {e['label']: [] for e in s['values'][0]['y'][0]['errors']}
    for r in s['values']:
        for e in r['y'][0]['errors']:
            err[e['label']].append(float(e['symerror']))
    n = len(val)
    cov = [[0.0] * n for _ in range(n)]
    for r in c['values']:
        i, j = int(float(r['x'][0]['low']) + 0.5) - 1, int(float(r['x'][1]['low']) + 0.5) - 1   # bins numbered from 1
        cov[i][j] = float(r['y'][0]['value'])
    meta['tables'][kind] = {'doi': s['doi'], 'covariance_doi': c['doi'], 'headers': [h['name'] for h in s['headers']],
                            'raw_sha256': {k: hashlib.sha256(v).hexdigest() for k, v in raws.items()},
                            'bin_low_GeV': lo, 'bin_high_GeV': hi, 'value': val, 'errors': err, 'covariance': cov}
    diag_ok = max(abs(cov[i][i] ** 0.5 / (err['stat'][i] ** 2 + err['sys'][i] ** 2) ** 0.5 - 1) for i in range(n))
    print(kind, s['doi'], n, 'bins; worst |sqrt(C_ii)/sqrt(stat^2+sys^2) - 1| =', round(diag_ok, 4))
json.dump(meta, open('data/hepdata_cms_ins1901295.meta.json', 'w', encoding='utf-8'), indent=1)
