"""Regenerate browser references from the saved scientific calculations."""
from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
for name in ['candidate_bounds.py','check_candidate_vacua.py']:
    subprocess.run([sys.executable,'-B',str(ROOT/'tools'/name)],check=True)
records={str(i):json.loads((ROOT/f'data/thermal_history_case{i}.json').read_text()) for i in [1,2]}
for name,symbol,data in [('thermal_history','TH_HISTORY_REFERENCE',records),('candidate_vacua','CANDIDATE_VACUA',json.loads((ROOT/'data/candidate_vacua.json').read_text()))]:
    header='/* Refined pinned PhaseTracer action tables. */' if name=='thermal_history' else '/* Independent full-Fourier witness checks, not exhaustive. */'
    (ROOT/f'src/modules/{name}_reference.mjs').write_text(header+'\nexport const '+symbol+'='+json.dumps(data,indent=2)+';\n',encoding='utf-8')
