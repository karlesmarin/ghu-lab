"""Convert the archived official DeepCore tables without fitting or renormalizing them."""
from pathlib import Path
import hashlib,json,math
ROOT=Path(__file__).resolve().parents[1]
def build():
    folder=ROOT/'data/icecube_deepcore_2018'
    provenance=json.loads((folder/'provenance.json').read_text(encoding='utf-8'))
    maps={}
    for order,suffix in [('NO','NH'),('IO','IH')]:
        path=folder/f'chi2_map_{suffix}.dat'
        assert hashlib.sha256(path.read_bytes()).hexdigest()==provenance['files'][path.name]['sha256']
        rows=[list(map(float,line.split())) for line in path.read_text().splitlines()[1:] if line.strip()]
        assert all(len(r)==3 and all(math.isfinite(x) for x in r) for r in rows)
        mass=sorted({r[0] for r in rows});angle=sorted({r[1] for r in rows})
        grid={(m,s):v for m,s,v in rows};assert len(grid)==len(rows)==len(mass)*len(angle)
        best=min(rows,key=lambda r:r[2])
        maps[order]=dict(dm32EV2=mass,s23=angle,deltaChi2=[[grid[m,s] for s in angle] for m in mass],
                         tabulatedMinimum=dict(dm32EV2=best[0],s23=best[1],deltaChi2=best[2]),rowCount=len(rows))
        print(order,len(mass),'x',len(angle),'grid minimum',best)
    fc=[[float(x) for x in line.split()] for line in (folder/'IC2017_90CL_FC.dat').read_text().splitlines()[1:] if line.strip()]
    record=dict(schema='ghu-deepcore-reference-v1',edition='IceCube DeepCore 2018: three-year, 6–56 GeV atmospheric sample',
        doi=provenance['doi'],paper='https://arxiv.org/abs/1707.07081',
        sourcePage='https://icecube.wisc.edu/data-releases/2018/02/measurement-of-atmospheric-neutrino-oscillations-with-three-years-of-data-from-the-full-sky/',
        provenance=provenance,maps=maps,feldmanCousins90NO=fc,
        scope='Published standard three-neutrino reference only. Bilinear interpolation inside the tabulated domain; no extrapolation. Each ordering has its own likelihood zero. No mass-ordering odds, ring exclusion, or combined NuFIT likelihood.',
        overlap=dict(nufitIncludesIceCube=True,source='https://www.nu-fit.org/?q=node/309',
            rule='NuFIT IC24 includes IceCube atmospheric information. Independence from this earlier IceCube sample has not been established. Do not add this reference to NuFIT or treat agreement with reconstruction inputs as a new prediction.'),
        contourScope='The supplied Feldman–Cousins 90% contour is for normal ordering and uses dm32 in 10^-3 eV^2. It is not the same as a fixed DeltaChi2=4.6 contour.')
    (ROOT/'data/icecube_deepcore_reference.json').write_text(json.dumps(record,separators=(',',':'),ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
    return record
if __name__=='__main__':build()
