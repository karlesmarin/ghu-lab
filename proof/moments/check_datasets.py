"""Check archived CMS table integrity and elementary numerical consistency.

Run: python proof/moments/check_datasets.py
These checks certify ingestion properties, not experimental measurements or a fit.
"""
import hashlib
import json
from fractions import Fraction as Q
from pathlib import Path
root=Path(__file__).resolve().parents[2]
audit=json.loads((root/'data/lhc_reference/audit.json').read_text())
checks=0
def check(value,name):
    global checks
    if not value:raise AssertionError(name)
    checks+=1
for item in audit['tables']+audit['metadataSnapshots']:
    check(hashlib.sha256((root/item['file']).read_bytes()).hexdigest()==item['sha256'],'source bytes '+item['file'])
for item in audit['tables'][:-1]:
    data=json.loads((root/item['file']).read_text());area=Q(0);rounding=Q(0);previous=Q(1)
    for p in data['values']:
        low,high=Q(p['x'][0]['low']),Q(p['x'][0]['high'])
        check(low==previous and high>low,'ordered, adjoining chi bins');previous=high
        observed=next(y for y in p['y'] if y['group']==0);s=observed['value'];value=Q(s)
        n=len(s.split('.')[1]) if '.' in s else 0
        area+=(high-low)*value;rounding+=(high-low)*Q(1,2*10**n)
        check(value>0 and all(Q(e['symerror'])>=0 for e in observed['errors']),'positive density and errors')
    check(previous==16 and abs(area-1)<=rounding,'normalization within published decimal precision')
data=json.loads((root/audit['tables'][-1]['file']).read_text())
matrix={(int(Q(v['x'][0]['value'])),int(Q(v['x'][1]['value']))):Q(v['y'][0]['value']) for v in data['values']}
check(len(matrix)==77**2,'77x77 entries')
check(all(matrix[i,j]==matrix[j,i] and abs(matrix[i,j])<=1 for i,j in matrix),'symmetric correlation matrix with bounded coefficients')
check(all(matrix[i,i]==1 for i in range(77)),'unit diagonal')
print(f'{checks} checks pass (CMS data integrity and normalization; no likelihood fit)')
