"""Validate study records and draw reproducible figures for the documentation."""
from pathlib import Path
import argparse,json,math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
def run(directory):
    out=Path(directory);h=json.loads((out/'higgs_degeneracy.json').read_text());t=json.loads((out/'thermal_assumptions.json').read_text());v=json.loads((out/'candidate_full_potential.json').read_text());s=json.loads((out/'candidate_rung_search.json').read_text())
    checks=[]
    def check(name,condition):
        assert condition,name;checks.append(dict(name=name,passed=True))
    check('pinned Higgs reference reproduced',abs(h['SM']['chisq']-151.64206521214305)<1e-10 and h['SM']['observables']==159)
    check('all compensated visible rates are unity',all(abs(r['visibleMu']-1)<1e-12 for r in h['compensatedLine']))
    check('HiggsSignals flat direction independently observed',h['diagnostics']['maxCompensatedDeltaChi']<1e-10)
    check('HiggsBounds resolves part of flat direction',any(r['HBallowed'] for r in h['compensatedLine']) and any(not r['HBallowed'] for r in h['compensatedLine']))
    check('profiling does not worsen a fixed point',all(r['chisq']<=h['SM']['chisq']+1e-7 for r in h['profileOverCommonKappa']))
    check('unsupported acoustics remain null',all(r['peakOmegaH2'] is None and r['peakHz'] is None for r in t['rows'] if not r['acousticEvaluated']))
    check('160 distinct thermal scenarios',len(t['rows'])==160 and len({(r['case'],r['wallSpeed'],r['efficiency'],r['vacuumBackground']) for r in t['rows']})==160)
    check('full-potential checks cover selection',len(v['rows'])==sum(len(r['selectedForFullPotential']) for r in s['scans']))
    check('rung 2 finite approximate enumeration complete',s['scans'][0]['built']==1227070 and not s['scans'][0]['capped'])
    check('rung 4 budget is reported',s['scans'][1]['built']==5000000 and s['scans'][1]['capped'])
    check('representative multiplicities partition approximate hits',all(sum(p['multiplicity'] for p in r['points'])==r['inWindow'] for r in s['scans']))
    check('full Fourier mass is independently resolved at both cutoffs',all(r['fine']['higgsMassGeV'] is None or abs(r['fine']['higgsMassGeV']-r['coarse']['higgsMassGeV'])<.02 for r in v['rows']))
    plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'savefig.dpi':170})
    fig,axes=plt.subplots(1,2,figsize=(11,4.3),layout='constrained')
    fixed=h['fixedCouplingScan'];profile=h['profileOverCommonKappa'];flat=h['compensatedLine']
    axes[0].plot([r['invisibleWidthMeV'] for r in fixed],[r['deltaChisqSM'] for r in fixed],label='Fixed couplings: kappa = 1',color='#b35b38')
    axes[0].plot([r['invisibleWidthMeV'] for r in profile],[r['deltaChisqSM'] for r in profile],label='Profiled common kappa',color='#277987')
    axes[0].set(xlabel='Invisible width [MeV]',ylabel='HiggsSignals chi-square minus SM',xlim=(0,3),ylim=(-1,35));axes[0].legend(fontsize=8);axes[0].grid(alpha=.2)
    axes[1].set_title('Compensated line: visible rates fixed to SM',fontsize=10)
    for allowed,color,label in [(True,'#47743b','HB not excluded'),(False,'#ba4d3e','HB excluded')]:
        rr=[r for r in flat if r['HBallowed']==allowed];axes[1].scatter([r['invisibleBR'] for r in rr],[max(q['obsRatio'] for q in r['selectedLimits'].values()) for r in rr],s=15,color=color,label=label)
    axes[1].axhline(1,color='#555',ls='--',lw=1);axes[1].set(xlabel='Invisible branching fraction',ylabel='Selected HiggsBounds observed ratio',ylim=(0,8));axes[1].legend(fontsize=8);axes[1].grid(alpha=.2)
    fig.suptitle('Same visible Higgs rates, different invisible-width assumptions\nPinned datasets; explicit scalar benchmark, not a GHU fit',fontsize=12)
    for ext in ['png','svg']:fig.savefig(out/f'higgs_assumptions.{ext}')
    plt.close(fig)
    fig,axes=plt.subplots(1,2,figsize=(11,4.3),layout='constrained')
    thermal=[]
    for ax,case in zip(axes,[1,2]):
        rows=[r for r in t['rows'] if r['case']==case and r['acousticEvaluated']]
        for bg,marker in [(1,'o'),(0,'x')]:
            for eff,color in [(.05,'#7859a1'),(.3,'#277987'),(.9,'#b35b38')]:
                rr=[r for r in rows if r['vacuumBackground']==bg and r['efficiency']==eff]
                ax.plot([r['wallSpeed'] for r in rr],[r['peakOmegaH2'] for r in rr],marker=marker,color=color,ls='-' if bg else '--',label=f'kappa={eff}; '+('rad + vac' if bg else 'rad'))
        ax.set(yscale='log',xlabel='Assumed wall speed / c',ylabel='Peak acoustic Omega h²',title=f'SU(3) thermal case {case}');ax.legend(fontsize=7,ncol=2);ax.grid(alpha=.2)
        lo=min(r['peakOmegaH2'] for r in rows);hi=max(r['peakOmegaH2'] for r in rows)
        thermal.append(dict(case=case,evaluatedAcousticPoints=len(rows),amplitudeMin=lo,amplitudeMax=hi,amplitudeRatio=hi/lo,TpMin=min(r['percolationGeV'] for r in rows),TpMax=max(r['percolationGeV'] for r in rows)))
    fig.suptitle('Percolation can be stable while the acoustic amplitude remains assumption-sensitive\nSlow-wall cases are not evaluated by the acoustic fit',fontsize=12)
    for ext in ['png','svg']:fig.savefig(out/f'thermal_assumptions.{ext}')
    plt.close(fig)
    fig,ax=plt.subplots(figsize=(8.5,4.8),layout='constrained')
    for ok,color,label in [(True,'#277987','Global among located extrema; full mass in window'),(False,'#b35b38','Deeper vacuum or full mass outside window')]:
        rr=[r for r in v['rows'] if r['globalAndInWindow']==ok and r['fine']['compactificationGeV'] is not None]
        ax.scatter([r['approximate']['invR']/1000 for r in rr],[r['fine']['compactificationGeV']/1000 for r in rr],s=30,color=color,label=label,alpha=.8)
    ax.plot([4,7.5],[4,7.5],ls='--',lw=1,color='#777');ax.set(xlabel='Small-angle compactification [TeV]',ylabel='Full-Fourier local compactification [TeV]',title='Candidate SU(7): selected upper scales and W-positive controls');ax.legend(fontsize=8);ax.grid(alpha=.2)
    for ext in ['png','svg']:fig.savefig(out/f'candidate_vacua.{ext}')
    plt.close(fig)
    # Matplotlib's SVG paths contain cosmetic trailing spaces. Normalize those
    # in the exported text so the repository's whitespace gate stays useful.
    for name in ['higgs_assumptions','thermal_assumptions','candidate_vacua']:
        path=out/f'{name}.svg';path.write_text('\n'.join(line.rstrip() for line in path.read_text(encoding='utf-8').splitlines())+'\n',encoding='utf-8',newline='\n')
    vacuum=[]
    for scan in s['scans']:
        rr=[r for r in v['rows'] if r['k']==scan['k']];good=[r for r in rr if r['globalAndInWindow']]
        vacuum.append(dict(k=scan['k'],enumerated=scan['built'],capped=scan['capped'],approximateHits=scan['inWindow'],potentialClasses=scan['distinctFullPotentials'],tested=len(rr),globalInMassWindow=len(good),deeperVacuum=sum(not r['fine']['globalSmallAngle'] for r in rr),bestTestedGlobalScaleGeV=max((r['fine']['compactificationGeV'] for r in good),default=None)))
    summary=dict(checks=checks,thermal=thermal,vacuum=vacuum,higgs=dict(flatDirectionMaximumDeltaChi=h['diagnostics']['maxCompensatedDeltaChi'],fixedKappaDeltaChi4WidthMeV=h['fixedKappa1DeltaChi4WidthMeV'],HBtransitionKappaBrackets=h['diagnostics']['HBtransitionKappaBrackets'],bestFit=h['bestCommonKappaAtZeroInvisibleWidth']))
    (out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('directory');a=p.parse_args();run(a.directory)
