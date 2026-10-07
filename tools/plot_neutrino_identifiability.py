"""Standalone research figure from the archived numerical study (no runtime app dependency)."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path(__file__).resolve().parents[1];out=root/'research/2026-10-07-neutrinos'
data=json.loads((out/'study.json').read_text(encoding='utf-8'))
cases={r['id']:r for r in data['cases']}
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.titlesize':13,'axes.labelsize':11,'axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none'})
fig,axes=plt.subplots(2,2,figsize=(12,8.5),layout='constrained')
mu=cases['NO-muBkeV'];scale=cases['NO-fGeV'];common=cases['NO-common'];unequal=cases['NO-d3']
for ax,r,key,color,title,ylabel in [
 (axes[0,0],mu,'massGeV','#267b87','01  Heavy centre stays fixed','Mass [GeV]'),
 (axes[0,1],mu,'splitEV','#b45b31','02  Heavy splitting responds','Splitting [eV]'),
 (axes[1,0],scale,'massGeV','#267b87','03  A different path moves the mass','Mass [GeV]')]:
    ax.plot([p['value'] for p in r['rows']],[p.get(key,float('nan')) for p in r['rows']],'.-',color=color,lw=2)
    ax.set(xlabel=r['axis']['label'],ylabel=ylabel,title=title);ax.grid(alpha=.18)
ax=axes[1,1]
for r,color,label in [(common,'#697d86','Equal deficits: cancellation'),(unequal,'#267b87','Unequal direction 3')]:
    rows=[p for p in r['rows'] if p['valid']]
    ax.semilogx([p['value'] for p in rows],[0 if p['maxShapeDifference']<1e-12 else p['maxShapeDifference'] for p in rows],label=label,color=color,lw=2)
ax.set(xlabel='Active deficit (log scale)',ylabel='Max sampled |normalized − unitary|',title='04  Normalization can hide a response');ax.grid(alpha=.18);ax.legend(fontsize=9)
fig.suptitle('Same light inputs, different heavy responses',fontsize=19,fontweight='bold')
fig.supxlabel('Normal ordering · copy 1, pair 1 · vacuum μ → e · tree level, leading Majorana order\nReconstructed light inputs are not predictions. The standard DeepCore reference stays fixed along each path.',fontsize=10)
for suffix in ['svg','png','pdf']:fig.savefig(out/('fixed-light-inputs.'+suffix),dpi=180)
svg=out/'fixed-light-inputs.svg'
svg.write_text('\n'.join(line.rstrip() for line in svg.read_text(encoding='utf-8').splitlines())+'\n',encoding='utf-8',newline='\n')
plt.close(fig)
print('Saved standalone SVG, PNG and PDF with units, conditions and interpretation')
