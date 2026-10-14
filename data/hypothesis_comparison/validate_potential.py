"""Numerical audit and publication comparison for the dominant-tower model."""
from pathlib import Path
import csv, hashlib, html, json
import numpy as np
import mpmath as mp
from scipy.integrate import quad
import scipy
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import ghu_potential as g

HERE=Path(__file__).resolve().parent
result=json.loads((HERE/'ghu_potential_results.json').read_text(encoding='utf-8'))
checks=[]
def check(name,ok,witness=None):
    checks.append(dict(name=name,passed=bool(ok),witness=witness))
    if not ok:raise AssertionError(name)
mp.mp.dps=60
# A second special-function implementation and high-precision differentiation.
errs=[]
for a,b,q in [(.727,-.273,.001),(.819,.819,.1),(-.181,.819,1.),(0,0,5.),(1,1,15.)]:
    u=mp.mpf(q)/mp.mpf(str(g.ZL));v=mp.mpf(q)
    exact=mp.besseli(a,u)*mp.besselk(b,v)-(-1)**int(round(a-b))*mp.besselk(a,u)*mp.besseli(b,v)
    errs.append(abs(float(exact)/g.ff(a,b,np.array(q))-1))
check('SciPy Bessel combinations match 60-digit mpmath',max(errs)<1e-10,max(errs))
for Q,n in [(-.999,1),(-.95,2),(.8,1)]:
    exact=np.array([float(mp.diff(lambda t:mp.log(1+mp.mpf(str(Q))*mp.cos(n*t)),mp.mpf('.1'),k)) for k in range(1,5)])
    actual=g.log_derivatives(np.array(Q),n,.1)
    check('Analytic log derivatives through fourth order '+str((Q,n)),np.allclose(actual,exact,rtol=1e-10,atol=1e-10),float(np.max(abs(actual/exact-1))))

curves=[];rows=[];drifts=[];bottom_shifts=[];bottom_recalibrated=[]
for i,r in enumerate(result['rows']):
    args=[r['nf'],r['nv'],r['cv'],*r['recalibrated_parameters']]
    base=r['recalibrated'];fine=g.evaluate(*args,n=96);tail=g.evaluate(*args,n=96,end=45)
    derivatives=np.array(base['derivatives']);scale=np.maximum(abs(derivatives),g.MH**2*g.FH**2)
    drift=float(np.max(abs(np.array(fine['derivatives'])-derivatives)/scale));drifts.append(drift)
    check(f'Point {i+1}: quadrature refinement',drift<1e-7,drift)
    check(f'Point {i+1}: cutoff 35 to 45',np.max(abs(np.array(tail['derivatives'])-fine['derivatives'])/scale)<1e-7)
    check(f'Point {i+1}: recalibration residuals',abs(fine['stationarity_scaled'])<1e-7 and abs(fine['mass_squared']/g.MH**2-1)<1e-7)
    pred=np.array([base['lambda3'],base['lambda4']]);pub=np.array(r['published_couplings']);rel=(pred/pub-1)
    # Report discrepancies, do not use them as fit targets.
    rows.append([i+1,r['nf'],r['nv'],r['cv'],*r['published_parameters'],*r['recalibrated_parameters'],
       np.sqrt(r['fixed_rounded_inputs']['mass_squared']),*pub,*pred,*rel])
    bottom=g.evaluate(*args,n=96,include_bottom=True)
    bottom_shifts.append([bottom[k]/base[k]-1 for k in ['mass_squared','lambda3','lambda4']])
    bx,br=g.solve(*args,include_bottom=True)
    bottom_recalibrated.append(dict(point=i+1,parameters=bx.tolist(),result=br,
      relative_to_paper=[br['lambda3']/r['published_couplings'][0]-1,br['lambda4']/r['published_couplings'][1]-1]))
    check(f'Point {i+1}: bottom-inclusive diagnostic recalibration',abs(br['stationarity_scaled'])<1e-7 and abs(br['mass_squared']/g.MH**2-1)<1e-7)
    q,w=g.grid(96);co=g.coefficients(q,*args)
    # Subtracted potential avoids an arbitrary theta-independent offset.
    ts=np.linspace(0,np.pi,301)
    def potential(t):
        return sum(mult*np.dot(w*q**3,np.log1p(Q*np.cos(n*t))-np.log1p(Q*np.cos(n*g.THETA))) for mult,n,Q in co)*g.PREF
    vs=np.array([potential(t) for t in ts]);curves.append(vs)
    check(f'Point {i+1}: no lower sampled point in [0,pi]',float(vs.min())>=-1e-5*g.MH**2*g.FH**2)

# Adaptive integration independently from fixed Gaussian quadrature (one point).
r=result['rows'][1];args=[r['nf'],r['nv'],r['cv'],*r['recalibrated_parameters']]
def integrand(q,k):
    return q**3*sum(mult*g.log_derivatives(Q,n,g.THETA)[k] for mult,n,Q in g.coefficients(np.array(q),*args))
adaptive=[]
for k in range(1,4):
    val,err=quad(integrand,1e-7,35,args=(k,),epsabs=1e-8,epsrel=1e-9,points=[.001,.01,.1,1,5,15],limit=250)
    ref=r['recalibrated']['derivatives'][k]/g.PREF
    adaptive.append(abs(val/ref-1))
check('Adaptive versus fixed quadrature for derivatives 2,3,4',max(adaptive)<1e-7,adaptive)

arr=np.array(rows);relative=arr[:,-2:]
summary=dict(status='dominant_tower_numerics_checked_full_physics_validation_pending',passed=all(x['passed'] for x in checks),count=len(checks),checks=checks,
 max_quadrature_drift=max(drifts),max_published_relative_discrepancy=np.max(abs(relative),axis=0).tolist(),
 max_bottom_diagnostic_relative_shift=np.max(abs(np.array(bottom_shifts)),axis=0).tolist(),bottom_diagnostic_columns=['mass_squared','lambda3','lambda4'],
 bottom_recalibrated=bottom_recalibrated,
 max_bottom_recalibrated_difference_to_paper=np.max(abs(np.array([b['relative_to_paper'] for b in bottom_recalibrated])),axis=0).tolist(),
 sampled_global_minimum_only=True,not_formally_certified=True,not_experimental_validation=True,
 rounding_mass_range_GeV=[float(arr[:,8].min()),float(arr[:,8].max())],
 limitations=['Bottom omitted in main reconstruction; alternative includes bottom with Table 2/Appendix A inputs and recalibrates. Neither is a complete electroweak/model validation.',
 'Rounded k/ct and approximate gW=0.653; electroweak input scheme not reproduced.',
 'Recalibration uses stationarity and mH, never lambda3/lambda4. Agreement at one theta does not establish validity throughout parameter space.',
 'Positive curvature and sampled potential check are not a proof of the global minimum.',
 '7.4% published quartic fitting-curve/table discrepancy persists; its cause is not established.'],
 source='https://arxiv.org/html/2002.09262v3',environment=dict(numpy=np.__version__,scipy=scipy.__version__,mpmath=mp.__version__),
 code_sha256={p:hashlib.sha256((HERE/p).read_bytes()).hexdigest() for p in ['ghu_potential.py','validate_potential.py']})
(HERE/'potential_validation.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
with (HERE/'potential_benchmarks.csv').open('w',encoding='utf-8',newline='') as f:
    writer=csv.writer(f);writer.writerow(['point','nF','nV','cV','cF_published','mV_published','cF_recalibrated','mV_recalibrated','mH_from_rounded_inputs_GeV','lambda3_paper_GeV','lambda4_paper','lambda3_reconstructed_GeV','lambda4_reconstructed','lambda3_relative_difference','lambda4_relative_difference']);writer.writerows(rows)
with (HERE/'potential_curves.csv').open('w',encoding='utf-8',newline='') as f:
    writer=csv.writer(f);writer.writerow(['theta_rad']+[f'point_{i+1}_V_minus_Vvac_GeV4' for i in range(9)]);writer.writerows(zip(ts,*curves))
plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none'})
fig,axes=plt.subplots(1,3,figsize=(13,4),layout='constrained')
for j,ax in enumerate(axes[:2]):
    ax.plot(arr[:,0],arr[:,9+j],'o',label='Tabla publicada',color='#2c3e50')
    ax.plot(arr[:,0],arr[:,11+j],'x',label='Reconstrucción dominante',color='#007d8b')
    ax.set(xlabel='Punto de la tabla 3',ylabel=['λ₃ [GeV]','λ₄'][j],xticks=range(1,10));ax.grid(alpha=.2)
axes[0].legend(fontsize=9)
axes[2].plot(arr[:,0],arr[:,8],'o',label='Parámetros redondeados',color='#985b2b')
axes[2].axhline(g.MH,color='#007d8b',label='Masa impuesta al recalibrar')
axes[2].set(xlabel='Punto de la tabla 3',ylabel='mH [GeV]',xticks=range(1,10));axes[2].legend(fontsize=8);axes[2].grid(alpha=.2)
fig.suptitle('Referencia GHU: comparación numérica a θH=0,1; sin ajuste a λ₃ ni λ₄',fontweight='bold')
fig.savefig(HERE/'potential_comparison.png',dpi=160);fig.savefig(HERE/'potential_comparison.svg');plt.close(fig)
tablehtml='<table><tr><th>Punto</th><th>λ₃ paper / cálculo [GeV]</th><th>λ₄ paper / cálculo</th><th>Diferencia relativa λ₃ / λ₄</th></tr>'+''.join(f'<tr><td>{int(a[0])}</td><td>{a[9]:.2f} / {a[11]:.5f}</td><td>{a[10]:.5f} / {a[12]:.7f}</td><td>{a[13]*100:.3f}% / {a[14]*100:.3f}%</td></tr>' for a in arr)+'</table>'
fragment=f'''<h2>7. Reconstrucción independiente del potencial GHU</h2>
<p>Se implementaron las integrales espectrales con funciones de Bessel para W, Z, top y los dos sectores de fermiones oscuros del <a href="https://arxiv.org/html/2002.09262v3">paper 2002.09262v3</a>. Se recalibran cF y mV para imponer estacionariedad y mH=125,1 GeV. Los autoacoplamientos son predicciones de esta ejecución, no objetivos del ajuste.</p>
<p>En los nueve puntos, las diferencias máximas respecto a la tabla son {np.max(abs(relative[:,0]))*100:.3f}% en λ₃ y {np.max(abs(relative[:,1]))*100:.3f}% en λ₄. Esta es una reproducción aproximada con torres dominantes, no del modelo completo.</p>
<img src="potential_comparison.png" alt="Nueve puntos: autoacoplamientos publicados y reconstruidos; efecto de parámetros redondeados sobre la masa.">
<p class="notice">Los valores redondeados, introducidos directamente con nuestras convenciones, producen masas entre {arr[:,8].min():.1f} y {arr[:,8].max():.1f} GeV. Es necesario resolver de nuevo las condiciones; no basta copiar la tabla. La discrepancia de la fórmula cuártica aproximada sigue abierta: este cálculo cercano a la tabla no demuestra su causa.</p>
<details><summary>Resultados de los nueve puntos</summary>{tablehtml}</details>
<p>{len(checks)} comprobaciones numéricas superadas: Bessel con una segunda biblioteca a 60 dígitos, derivadas hasta orden cuatro, dos cuadraturas, refinamiento de integración y extensión del extremo superior. La revisión del mínimo es por muestreo, no una demostración global.</p>
<p>Limitaciones: entradas k y ct redondeadas y gW aproximado; bottom omitido en el resultado principal. Incluirlo manteniendo los parámetros cambia λ₄ hasta {np.max(abs(np.array(bottom_shifts)[:,2]))*100:.3g}%, pero mH² hasta {np.max(abs(np.array(bottom_shifts)[:,0]))*100:.2f}%. También se recalibraron los nueve casos con bottom; sus parámetros y resultados están en la validación JSON. Este diagnóstico muestra la sensibilidad de la curvatura y no permite declarar despreciable el sector omitido para toda cantidad.</p>
<p>Con bottom y recalibración, las diferencias máximas frente al paper son {summary['max_bottom_recalibrated_difference_to_paper'][0]*100:.3f}% en λ₃ y {summary['max_bottom_recalibrated_difference_to_paper'][1]*100:.3f}% en λ₄. Falta auditar completamente la convención electrodébil antes de atribuir una diferencia al paper.</p>
<p><a href="potential_validation.json">Validaciones y alcance</a> · <a href="ghu_potential_results.json">Resultados y parámetros</a> · <a href="potential_benchmarks.csv">Tabla CSV</a> · <a href="potential_curves.csv">Curvas CSV</a> · <a href="potential_comparison.svg">Figura SVG</a></p>'''
(HERE/'potential_fragment.html').write_text(fragment,encoding='utf-8')
print(json.dumps({k:summary[k] for k in ['passed','count','max_quadrature_drift','max_published_relative_discrepancy','max_bottom_diagnostic_relative_shift','rounding_mass_range_GeV']}))
