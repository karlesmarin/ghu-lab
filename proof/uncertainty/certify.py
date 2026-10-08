"""Conditional SU(7) numerical/input budget using existing Arb certificates.

sage -python proof/uncertainty/certify.py [output.json]
No theory-error distribution is assumed. Missing physics is never assigned zero.
"""
import hashlib
import json
import sys
from pathlib import Path
from sage.all import QQ, RealBallField, RealIntervalField
from sage.version import version

ROOT=Path(__file__).resolve().parents[2]
B=RealBallField(192); I=RealIntervalField(192)
checks=[]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def check(name,condition):
    checks.append(dict(name=name,passed=bool(condition)))
    if not condition: raise AssertionError(name)
def enc(x): return [str(QQ(I(x).lower())),str(QQ(I(x).upper()))]
def ball(iv): return B(I(QQ(iv[0]),QQ(iv[1])))
def upper(x): return str(QQ(I(x).upper()))
def scale_interval(iv,factor):
    values=[QQ(x)*factor for x in iv]
    return [str(min(values)),str(max(values))]

def main():
    src=ROOT/'data/moment_diagnostics.json'; source=json.loads(src.read_text())
    check('source proof script unchanged',sha(ROOT/'proof/moments/certify.py')==source['scriptSHA256'])
    check('source interval checks passed',all(c['passed'] for c in source['checks']))
    check('fixed mass inputs',source['conventions']==dict(mWGeV=80.4,g4=.63))
    check('model data unchanged',sha(ROOT/'data/su7_km25.json')==source['modelSHA256'])
    for name,digest in source['inputs'].items():
        check('source certificate '+name,sha(ROOT/'data/su7_certification'/name)==digest)
    w=QQ(200923)/2500; sigma=QQ(133)/10000; old_w=QQ(402)/5; g=QQ(63)/100
    rows=[]
    for row in source['benchmarks']:
        label=row['row']+' '+row['seed']
        a=ball(row['full']['alpha']); lo,hi=map(QQ,row['full']['alpha'])
        mid=(lo+hi)/2; half=(hi-lo)/2
        curv=ball(row['full']['curvature']); pi=B.pi(); n=2048
        terms=[(QQ(m),s,c) for m,s,c in row['terms']]
        # Integral-test tail for F'' and absolutely summable F''' Lipschitz bound.
        tail=sum((abs(m)*(pi*c)**2 for m,s,c in terms),B(0))/(2*B(n)**2)
        third=sum((abs(m)*(pi*c)**3 for m,s,c in terms),B(0))*pi**2/6
        floor=B(QQ(I(curv).lower()))-tail
        cap=B(QQ(I(curv).upper()))+tail
        check(label+': positive full/finite curvature floor',floor.lower()>0)
        k=B(3).sqrt()*old_w*g/(2*pi**3)
        root_bound=k*B(half)*(third/(2*B(lo)*floor.sqrt())+cap.sqrt()/B(lo)**2)
        tail_bound=k*tail/(2*B(mid)*floor.sqrt())
        scale_root=2*old_w*B(half)/(B(lo)*B(mid))
        mh=ball(row['full']['higgsGeV']); ir=ball(row['full']['compactificationGeV'])
        wrows={}
        for name,x in [('higgsGeV',mh),('compactificationGeV',ir)]:
            iv=row['full'][name]
            wrows[name]=dict(atMeasuredCentral=scale_interval(iv,w/old_w),centralShift=scale_interval(iv,w/old_w-1),
                             propagatedOneSigma=scale_interval(iv,sigma/old_w),
                             inputBand=[str(QQ(iv[0])*(w-sigma)/old_w),str(QQ(iv[1])*(w+sigma)/old_w)])
            check(label+': positive W response '+name,ball(wrows[name]['propagatedOneSigma']).lower()>0)
        mhlo,mhhi=map(QQ,row['full']['higgsGeV'])
        numeric=dict(fourierTerms=n,rootRadius=str(half),
                     curvatureTailUpper=upper(tail),thirdDerivativeUpper=upper(third),
                     curvatureFloor=str(QQ(I(floor).lower())),
                     rootLocationMassUpperGeV=upper(root_bound),fourierTailMassUpperGeV=upper(tail_bound),
                     rootPlusTailMassUpperGeV=upper(root_bound+tail_bound),
                     rootLocationScaleUpperGeV=upper(scale_root),
                     fullMassEnclosureHalfWidthGeV=str((mhhi-mhlo)/2),
                     scope='Bounds relative to the exact N-term curvature mass at the rational root-interval midpoint. Root and Fourier bounds may be added as worst-case absolute bounds; they are not independent statistical errors. The full enclosure already includes both effects and Arb rounding; do not add its half-width again.')
        check(label+': positive numerical bounds',root_bound.lower()>0 and tail_bound.lower()>0)
        check(label+': measured input band encloses central',
              QQ(wrows['higgsGeV']['inputBand'][0])<=QQ(wrows['higgsGeV']['atMeasuredCentral'][0]) and
              QQ(wrows['higgsGeV']['inputBand'][1])>=QQ(wrows['higgsGeV']['atMeasuredCentral'][1]))
        rows.append(dict(row=row['row'],seed=row['seed'],full=row['full'],
                         momentApproximation=row['errors'],numerical=numeric,measuredW=wrows,
                         couplingScenario=dict(fraction='1/10',range=['567/1000','693/1000'],
                                               massHalfSpanGeV=scale_interval(row['full']['higgsGeV'],QQ(1)/10),scaleChangeGeV=['0','0'],
                                               scope='Chosen g4 +/-10% scenario at fixed potential and W input; not a measured uncertainty.'),
                         theoryUncertainty=dict(status='not-quantified',massGeV=None,
                                                missing=['Curvature-to-pole mass matching, with a specified renormalization scheme',
                                                         'Higher-loop corrections and perturbative control',
                                                         'Model completion, boundary terms and physical parameter matching']),
                         totalPhysicalUncertaintyGeV=None))
    result=dict(schema='ghu-uncertainty-budget-v1',date='2026-10-08',arithmetic='SageMath '+version+' / Arb 192 bits',
                conventions=source['conventions'],benchmarks=rows,
                measuredW=dict(value='200923/2500',sigma='133/10000',unit='GeV',
                               source='PDG 2025, Mass and Width of the W Boson; LHC-TeV W-mass Working Group average',
                               url='https://pdg.lbl.gov/2025/reviews/rpp2025-rev-w-mass.pdf',
                               scope='Pinned input used in the laboratory; not a combination with the excluded CDF 2022 measurement.'),
                identities=['At fixed potential geometry, m_h is proportional to g4*mW; 1/R5 is proportional to mW and independent of g4.',
                            'F double-prime tail <= sum |multiplicity| (pi charge)^2 / (2 N^2).',
                            'sup |F triple-prime| <= zeta(2) sum |multiplicity| (pi charge)^3.',
                            'A certified enclosure is a mathematical inclusion, not a probability interval.'],
                inputs={'data/moment_diagnostics.json':sha(src),'proof/moments/certify.py':sha(ROOT/'proof/moments/certify.py'),
                        'proof/uncertainty/certify.py':sha(Path(__file__)),'src/kernel/experiment.mjs':sha(ROOT/'src/kernel/experiment.mjs')},
                checks=checks,passed=len(checks),
                attribution='Komori–Maru model; Haba–Takenaga–Yamashita and Sakamoto–Takenaga expansions; Carles Marin, Part VII SU(7) moment application. Verification and uncertainty bookkeeping make no priority claim.',
                scope='Conditional one-loop budget. Gauge prescriptions remain separate hypotheses. Approximation bias, numerical enclosure, measured-input propagation and chosen parameter scenarios are not combined in quadrature. No total physical error or exclusion significance is available.')
    out=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'data/uncertainty_budget.json'
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'passed':len(checks),'benchmarks':len(rows),'saved':str(out)}))

if __name__=='__main__': main()
