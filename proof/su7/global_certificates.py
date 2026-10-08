"""Continuum energy certificates using the integer interval kernel."""
import json
import hashlib
import time
from fractions import Fraction as Q
import reconstruct as r


def certify(terms, local):
    center = Q(local['numerical_alpha'])
    m3 = r.third_bound(terms)
    f2 = r.derivative_finite(terms,center,2,1024).widen(r.tail(terms,2,1024))
    # A convex neighborhood larger than the already certified root bracket.
    radius = Q(f2.lo, 2*m3.hi)
    basin = (center-radius,center+radius)
    curvature = f2.widen(m3*radius)
    assert curvature.lo > 0
    assert basin[0] < Q(local['certified_alpha_interval'][0]) < Q(local['certified_alpha_interval'][1]) < basin[1]
    reference = r.derivative_finite(terms,center,0,2048).widen(r.tail(terms,0,2048))
    # zeta(3) < 1+1/8+integral_2^infinity x^-3 dx = 5/4.
    m2 = sum((abs(m)*(r.PI*c)**2 for (s,c),m in terms.items()), r.I(0))*Q(5,4)
    queue = [(Q(0),Q(1),0)]
    cover = []
    while queue:
        lo,hi,depth = queue.pop()
        if basin[0] <= lo and hi <= basin[1]:
            cover.append({'interval':[str(lo),str(hi)],'reason':'strictly-convex-basin'})
            continue
        a,h = (lo+hi)/2,(hi-lo)/2
        energy = None
        cut = 64
        for cut in ([64,256,1024] if hi-lo < Q(1,64) else [64]):
            f = r.derivative_finite(terms,a,0,cut).widen(r.tail(terms,0,cut))
            slope = r.derivative_finite(terms,a,1,cut).widen(r.tail(terms,1,cut))
            energy = f.widen(slope.upper_abs()*h+m2*h*h/2)
            if energy.lo > reference.hi:
                cover.append({'interval':[str(lo),str(hi)],'reason':'energy-above-reference','gap_lower':r.fixedstr(energy.lo-reference.hi),'cutoff':cut})
                break
        else:
            if energy.hi < reference.lo:
                return {'certified':False,'reason':'lower energy found outside candidate','interval':[str(lo),str(hi)],'energy':energy.bounds(),'reference':reference.bounds()}
            if depth >= 24:
                return {'certified':False,'reason':'unresolved box at depth limit','interval':[str(lo),str(hi)]}
            mid = (lo+hi)/2
            queue.extend([(mid,hi,depth+1),(lo,mid,depth+1)])
    cover.sort(key=lambda b:Q(b['interval'][0]))
    assert Q(cover[0]['interval'][0]) == 0 and Q(cover[-1]['interval'][1]) == 1
    assert all(a['interval'][1] == b['interval'][0] for a,b in zip(cover,cover[1:]))
    return {'certified':True,'domain':['0','1'],'period':'2','reflection':'F(-alpha)=F(alpha)',
            'claim':'Unique global minimum on [0,1]; equivalent minima at +/-alpha+2Z on the real line.',
            'root_interval':local['certified_alpha_interval'],'convex_basin':[str(x) for x in basin],
            'convex_basin_curvature':curvature.bounds(),'reference_alpha':str(center),'reference_energy':reference.bounds(),
            'cover':cover,'cover_count':len(cover)}


def main():
    start=time.monotonic()
    data=json.loads((r.OUT/'reconstruction.json').read_text())
    result={'method':'Exhaustive interval cover with exact outward integer arithmetic, Taylor bounds and infinite Fourier tails.',
            'arithmetic_script_sha256':hashlib.sha256((r.HERE/'reconstruct.py').read_bytes()).hexdigest(),'rows':[]}
    for row in data['rows']:
        terms=r.combine(row['terms'])
        alternatives=r.add(terms,{k:-v for k,v in r.combine(data['printed_gauge']).items()},r.combine(data['candidate_gauge']))
        for seed,t in [('printed',terms),('candidate',alternatives)]:
            cert=certify(t,row[f'{seed}_local_minimum'])
            item={'row':row['row'],'seed':seed,**cert}
            result['rows'].append(item)
            print(json.dumps({k:v for k,v in item.items() if k not in ['cover','convex_basin','reference_alpha']}),flush=True)
            (r.OUT/'global_certificates.json').write_text(json.dumps(result,indent=2)+'\n')
    result['elapsed_seconds']=time.monotonic()-start
    result['certified']=sum(x['certified'] for x in result['rows'])
    result['script_sha256']=hashlib.sha256(__import__('pathlib').Path(__file__).read_bytes()).hexdigest()
    (r.OUT/'global_certificates.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'certified':result['certified'],'seconds':result['elapsed_seconds']}),flush=True)


if __name__=='__main__':
    main()
