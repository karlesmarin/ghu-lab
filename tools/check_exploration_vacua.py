"""Independently test the chosen candidate-search representatives in full Fourier."""
from pathlib import Path
import argparse,json
from check_candidate_vacua import check_content
ROOT=Path(__file__).resolve().parents[1]
def run(directory):
    out=Path(directory);source=json.loads((out/'candidate_rung_search.json').read_text());data=json.loads((ROOT/'data/su7_km25.json').read_text());rows=[]
    for scan in source['scans']:
        for point in scan['selectedForFullPotential']:
            coarse=check_content(data,point['bulk'],1024);fine=check_content(data,point['bulk'],2048)
            rows.append(dict(k=scan['k'],approximate=point,fine=fine,coarse=coarse,
                fullMassInWindow=fine['higgsMassGeV'] is not None and 123<=fine['higgsMassGeV']<=127,
                globalAndInWindow=fine['globalSmallAngle'] and 123<=fine['higgsMassGeV']<=127))
        selected=[r for r in rows if r['k']==scan['k']]
        print(json.dumps(dict(k=scan['k'],tested=len(selected),globalAndInWindow=sum(r['globalAndInWindow'] for r in selected),deeperVacuum=sum(not r['fine']['globalSmallAngle'] for r in selected))),flush=True)
    record=dict(schema='ghu-candidate-search-vacua-v1',rows=rows,
        scope='Independent numerical checks of selected representatives, not all enumerated potentials. A negative result here does not prove the target mass box empty. 1024/2048 winding comparison and analytic Fourier tails; extrema located numerically, not by rigorous interval root isolation.')
    (out/'candidate_full_potential.json').write_text(json.dumps(record,indent=2)+'\n')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('directory');a=p.parse_args();run(a.directory)
