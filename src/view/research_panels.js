/* Reusable controls, figures, tables and JSON/SVG export inside existing sections. */
const RX_STATE={};
const RX_EXTERNAL={};
const RX_BASELINES={};
const RX_NETWORK_ENABLED=true;
async function rxScientificCall(payload,signal){
  // rx-app-network-start
  return await fetch('http://127.0.0.1:8793/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal}); // edition-allow: explicit localhost calculation in the live App; removed from frozen Edition
  // rx-app-network-end
}
const RX_RESEARCH_GUIDE={
 su6mn:{question:'Does this fermion content select a small Wilson phase, and is that minimum numerically stable?',
   metrics:r=>[['Wilson minimum α',r.minimum.alpha,''],['Published α',r.published?.alpha??null,''],['N = 1000 α',r.convergence.at(-1).alpha,'']],
   takeaway:r=>r.minimum.alpha>0&&r.minimum.alpha<1?'An interior minimum is present. Compare Fourier convergence before interpreting its size.':'The preferred vacuum is an endpoint; this content does not select an interior phase with these inputs.'},
 rsrunning:{question:'How large must the UV brane terms be to reconcile the two independent gauge-coupling differences?',
   metrics:r=>[['Required Δλ₂₁',r.requiredDeltaLambda[0],''],['Required Δλ₃₁',r.requiredDeltaLambda[1],''],['Largest / NDA',r.maxRequired/r.nda,'×']],
   takeaway:r=>`The required brane terms are ${rxNumber(r.maxRequired/r.nda)} times the NDA reference at their largest. Residuals test your chosen boundary terms, not statistical exclusion.`},
 flavour:{question:'Can three independent ring copies realize the chosen neutrino masses and PMNS orientation?',
   metrics:r=>[['Light rank',r.rank,''],['Σ masses',r.sumMassEV,'eV'],['Light mββ',r.mBBEV,'eV'],['JCP',r.jarlskog,'']],
   takeaway:r=>`The inverse construction realizes rank ${r.rank}. ${r.comparison.filter(c=>!c.inside).length} of the displayed inputs lie outside their separate NuFIT 3σ ranges; this is not a combined fit.`},
 thermal:{question:'Does the thermal Wilson vacuum change, and does an actual bubble calculation support nucleation?',
   metrics:r=>[['Preferred α',r.minima[0]?.a??null,''],['Coexistence Tc',r.critical?.temperatureGeV??null,'GeV'],['Nucleation proxy Tn',r.externalResult?.nucleation?.temperatureGeV??null,'GeV']],
   takeaway:r=>r.externalResult?.nucleation?(Math.abs(r.externalResult.nucleation.relativeActionShift)>.02?'The original proxy is precision-sensitive. The history panel below uses a refined action table when available.':'The matching PhaseTracer run finds an S₃/T = 140 crossing. For integrated nucleation and percolation, see the history panel below.'):'Inspect the coexistence candidate first, then calculate the bounce for these same inputs.'},
 rsanomaly:{question:'Does the chosen RS matter content cancel gauge anomalies while retaining the baryon-current anomaly?',
   metrics:r=>[['Selected F¹Z',r.selected.F1,''],['γγZ gauge factor',r.gaugeGammaGammaZ,''],['Baryon boundary factor',r.baryon.normalizedBoundaryCoefficient,'']],
   takeaway:r=>r.groups.Q2T3===0?'The displayed gauge factors cancel for the chosen complete matter generations. The baryon current is a separate calculation.':'The chosen quark/lepton imbalance leaves a gauge anomaly: this matter choice needs completion.'},
 higgstools:{question:'What do the assumed GHU Higgs couplings imply for rates, widths and matching experimental tests?',
   metrics:r=>[['Total width',r.widthGeV*1000,'MeV'],['Invisible BR',r.branching.directInv,''],['Δχ² vs SM',r.externalResult?.signals?.deltaChisq??null,'']],
   takeaway:r=>r.externalResult?`${r.externalResult.bounds.allowed?'Not excluded':'Excluded'} by the selected HiggsBounds limits for this explicit scalar scenario. HiggsSignals provides a separate χ² comparison.`:'Rates are computed. The experimental verdict needs a matching HiggsTools run for these couplings.'}
};
function rxOverview(def,r){
 const guide=RX_RESEARCH_GUIDE[def.id];if(!guide)return '';
 const metrics=guide.metrics(r),baseline=RX_BASELINES[def.id],previous=baseline?guide.metrics(baseline.result):null;
 return `<div style="margin:14px 0;padding:14px;background:#f1f6f6;border-left:4px solid #277987;border-radius:6px;color:#203c42"><b>What this tests</b><p style="margin:6px 0 12px">${rxEscape(guide.question)}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px">`+
 metrics.map(([label,value,unit],i)=>`<div><span style="font-size:13px">${rxEscape(label)}</span><br><strong style="font-size:21px">${rxEscape(rxNumber(value))}</strong> ${rxEscape(unit)}${previous?`<br><small>Reference: ${rxEscape(rxNumber(previous[i][1]))}${typeof value==='number'&&typeof previous[i][1]==='number'?`; Δ ${rxEscape(rxNumber(value-previous[i][1]))}`:''}</small>`:''}</div>`).join('')+
 `</div><p style="margin:12px 0 0"><b>Reading:</b> ${rxEscape(guide.takeaway(r))}</p>${baseline?'<p style="margin:8px 0 0;font-size:13px">Saved reference is a calculation snapshot. Its inputs and results are included in the JSON export.</p>':''}</div>`;
}
function rxExternal(def,p){return [RX_EXTERNAL[def.id],...(def.id==='thermal'?Object.values(TH_HISTORY_REFERENCE):[]),...(RX_EXTERNAL_REFERENCE[def.id]||[])].find(d=>rxMatchExternal(def.id,p,d))||null;}
function rxResult(def,p){const r=def.compute(p);return def.external?{...r,externalResult:rxExternal(def,p),...(def.id==='thermal'?{crossValidation:cvThermalComparison(p,THERMAL_CROSSVALIDATION)}:{})}:r;}
function rxExternalHTML(def,r){
 if(!def.external)return '';
 const e=r.externalResult;if(!e)return '<p><b>Experimental calculation pending for these inputs.</b> Local rates and potential update immediately. Run the local scientific engine or import its result to evaluate this parameter point.</p>';
 if(def.id==='higgstools')return `<h3>HiggsBounds / HiggsSignals · matching inputs</h3><p><b>${e.bounds.allowed?'Not excluded':'Excluded'} by the selected HiggsBounds limits for this scenario.</b> HiggsSignals χ² = ${rxNumber(e.signals.chisq)}, SM reference = ${rxNumber(e.signals.SMchisq)}, Δχ² = ${rxNumber(e.signals.deltaChisq)} (${rxNumber(e.signals.observableCount)} observables). Δχ² is not converted into a confidence level.</p>`+
 rxTable(['Particle','Selected limit','Observed ratio','Expected ratio'],Object.entries(e.bounds.selected).map(([k,v])=>[k,v.reference+' · '+v.description,v.obsRatio,v.expRatio]))+
 `<p class="note">Official dataset commits: HB ${rxEscape(e.datasets.HiggsBounds.commit)}, HS ${rxEscape(e.datasets.HiggsSignals.commit)}. Only the selected most sensitive expected limit enters the HB decision; all applied limits are retained in the JSON.</p>`;
 const n=e.nucleation;return `<h3>PhaseTracer · matching inputs</h3>`+(n?`<p><b>Nucleation proxy Tn = ${rxNumber(n.temperatureGeV)} GeV</b>, S₃/T = ${rxNumber(n.S3overT)}, β/H = ${rxNumber(n.betaOverH)}, trace-anomaly strength = ${rxNumber(n.traceAnomalyStrength)} for g* = ${n.gStar}. Doubling the potential cutoffs and tightening the shooting tolerance changes S₃/T by ${rxNumber(100*n.relativeActionShift)}%. ${Math.abs(n.relativeActionShift)>.02?'<b>Precision-sensitive result: refine before interpretation.</b>':''}</p>`:'<p>No S₃/T = 140 crossing located by this run.</p>')+
 rxPlot('Computed thermal bounce action',[{name:'PhaseTracer O(3)',points:e.samples.map(s=>[s.RT,Math.log10(s.S3overT)])},{name:'S₃/T = 140',points:e.samples.map(s=>[s.RT,Math.log10(140)])}],'R T','log₁₀(S₃/T)',e.parameters)+`<p class="note">${rxEscape(n?.criterion||'No nucleation proxy located')}. ${rxEscape(e.scope)}</p>`;
}
function rxEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rxNumber(x){return x===null||x===undefined?'not evaluated':typeof x==='number'?(x===0?'0':Math.abs(x)<.001||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(7)).toString()):String(x);}
function rxTick(x){return x===0?'0':Math.abs(x)<.001||Math.abs(x)>=1e4?x.toExponential(1):Number(x.toPrecision(3)).toString();}
function rxCompared(id,series,points){const b=RX_BASELINES[id];return b?[...series,{name:'Saved reference',color:'#667079',dashed:true,points:points(b.result)}]:series;}
function rxPlot(title,series,xlabel,ylabel,metadata={}) {
  const pts=series.flatMap(s=>s.points).filter(p=>p.every(Number.isFinite));
  if(!pts.length)return '<p>No finite points to plot.</p>';
  let xmin=Math.min(...pts.map(p=>p[0])),xmax=Math.max(...pts.map(p=>p[0])),ymin=Math.min(...pts.map(p=>p[1])),ymax=Math.max(...pts.map(p=>p[1]));
  if(xmax===xmin)xmax=xmin+1;if(ymax===ymin){ymax+=.5;ymin-=.5;}
  const nonnegative=ymin>=0,dy=(ymax-ymin)*.08;ymax+=dy;ymin-=dy;if(nonnegative)ymin=Math.max(0,ymin);
  const X=x=>110+504*(x-xmin)/(xmax-xmin),Y=y=>247-160*(y-ymin)/(ymax-ymin);
  const txt=(x,y,s,rest='')=>`<text x="${x}" y="${y}" ${rest}>${rxEscape(s)}</text>`;
  let body='';
  for(let j=0;j<=4;j++){
    const x=xmin+(xmax-xmin)*j/4,y=ymin+(ymax-ymin)*j/4;
    body+=`<path d="M110 ${Y(y)}H614" stroke="#dfe5e6"/>`+txt(100,Y(y)+5,rxTick(y),'text-anchor="end" font-size="13"')+txt(X(x),265,rxTick(x),'text-anchor="middle" font-size="13"');
  }
  series.forEach((s,i)=>{
    const color=s.color||['#277987','#b35b38','#7859a1','#5b7d36'][i%4];
    body+=`<path d="${s.points.filter(p=>p.every(Number.isFinite)).map((p,j)=>`${j?'L':'M'}${X(p[0])} ${Y(p[1])}`).join(' ')}" stroke="${color}" fill="none" stroke-width="2.5" ${s.dashed?'stroke-dasharray="7 5"':''}/>`;
    body+=txt(90+(i%3)*175,22+Math.floor(i/3)*18,s.name,`fill="${color}" font-size="14"`);
  });
  body+=txt(350,292,xlabel,'text-anchor="middle"')+txt(110,69,ylabel,'font-size="14"');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 305" role="img" aria-label="${rxEscape(title)}" style="width:100%;height:auto;display:block"><title>${rxEscape(title)}</title><metadata>${rxEscape(JSON.stringify(metadata))}</metadata><rect width="640" height="305" fill="white"/><g font-family="Arial,sans-serif" font-size="15" fill="#334750">${body}</g></svg>`;
}
function rxTable(headers,rows){return `<div style="overflow-x:auto"><table><thead><tr>${headers.map(h=>`<th>${rxEscape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${rxEscape(rxNumber(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function cbEvidenceHTML(r){
  return `<p><b>${rxEscape(r.seed)} seed · bounds within the small-angle moment approximation.</b> ${rxEscape(r.reason)} These upper bounds do not establish attainable masses or a global minimum of the full potential.</p>`+
    (r.applicable?rxPlot('Conditional compactification upper bounds',[{name:'Small-angle upper bound',points:r.rows.map(x=>[x.k8D,x.upperGeV/1000])}],'Rung k = 8D','Upper bound on 1/R₅ [TeV]',r.conventions)+
      rxTable(['Rung k','A₄ cap','Upper bound [TeV]'],r.rows.map(x=>[x.k8D,x.A4cap,x.upperGeV/1000])):'')+
    `<p class="note">${rxEscape(r.missing)}</p>`+
    (r.seed==='candidate'?`<h3>Independent full-Fourier witness checks</h3><p>Fixed mW = 80.4 GeV and g₄ = 0.63. Numerical stationary-point search at 1024 and 2048 Fourier terms, with analytic tail estimates; global here means lowest among the numerically located extrema.</p>`+
      rxTable(['Content','k','Local mₕ [GeV]','Local 1/R₅ [TeV]','Small-angle minimum globally preferred?'],CANDIDATE_VACUA.cases.map(x=>[x.name,x.fine.k8D,x.fine.higgsMassGeV,x.fine.compactificationGeV===null?null:x.fine.compactificationGeV/1000,x.fine.localSmallAngle?(x.fine.globalSmallAngle?'yes, numerically':'no — deeper minimum elsewhere'):'no small-angle minimum']))+
      `<p>These examples test specified contents. A universal full-potential ceiling and a common action linking flavour, Higgs rates and collider likelihoods remain unresolved.</p>`:'');
}
function rxMatrix(title,values,rows,columns,metadata={}){
 const max=Math.max(...values.flat().map(Math.abs),1e-30);let cells='';
 rows.forEach((label,i)=>{cells+=`<text x="65" y="${99+i*67}" text-anchor="end">${rxEscape(label)}</text>`;});
 columns.forEach((label,j)=>{cells+=`<text x="${165+j*153}" y="36" text-anchor="middle">${rxEscape(label)}</text>`;});
 values.forEach((row,i)=>row.forEach((v,j)=>{const level=Math.abs(v)/max;cells+=`<g><title>${rxEscape(rows[i]+' / '+columns[j]+': '+rxNumber(v))}</title><rect x="${90+j*153}" y="${52+i*67}" width="146" height="60" rx="5" fill="hsl(190,45%,${96-level*60}%)"/><text x="${163+j*153}" y="${89+i*67}" text-anchor="middle" fill="${level>.65?'white':'#173b42'}">${rxEscape(rxNumber(v))}</text></g>`;}));
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280" role="img" aria-label="${rxEscape(title)}" style="width:100%;height:auto;display:block"><title>${rxEscape(title)}</title><metadata>${rxEscape(JSON.stringify(metadata))}</metadata><rect width="640" height="280" fill="white"/><g font-family="Arial,sans-serif" font-size="17" fill="#334750">${cells}<text x="320" y="270" text-anchor="middle" font-size="14">${rxEscape(title)} · darker = larger magnitude</text></g></svg>`;
}
function rxDownload(name,text,type='application/json'){
  const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function rxHTML(def){return `<div class="card" id="rx_${def.id}" style="margin-top:18px;scroll-margin-top:90px"><h2>${rxEscape(def.title)}</h2><p>${def.intro}</p><div id="rx_${def.id}_controls" style="display:flex;gap:14px;flex-wrap:wrap;align-items:end"></div><p id="rx_${def.id}_error" role="status" aria-live="polite"></p><div id="rx_${def.id}_result" aria-live="polite"></div><p><button id="rx_${def.id}_json" class="ghost">Save inputs and results (JSON)</button> <button id="rx_${def.id}_svg" class="ghost">Save figure (SVG)</button> ${def.load?`<button id="rx_${def.id}_load" class="primary">Load into the SU(N) builder</button>`:''}</p><p class="note">${def.source}</p></div>`;}
function rxMount(def,ctx){
  const $=suffix=>document.getElementById(`rx_${def.id}_${suffix}`);
  const jump=document.getElementById(`rx_${def.id}_jump`);if(jump)jump.onclick=()=>document.getElementById(`rx_${def.id}`).scrollIntoView({behavior:'smooth',block:'start'});
  RX_STATE[def.id]??={...def.defaults};let last=null,active=true,pending=null;
  const advanced=new Set(['windings','thermalTerms','alpha21','alpha31','d1','d2','d3','cPlus','cMinus','mUV']);
  const field=f=>`<label>${rxEscape(f.label)}<br>${f.options?`<select data-rx="${f.key}">${f.options.map(([v,t])=>`<option value="${v}">${rxEscape(t)}</option>`).join('')}</select>`:`<input data-rx="${f.key}" type="number" min="${f.min}" max="${f.max}" step="${f.step??'any'}" style="width:180px;max-width:100%">`}</label>`;
  $('controls').innerHTML=def.fields.filter(f=>!advanced.has(f.key)).map(field).join('')+(def.fields.some(f=>advanced.has(f.key))?`<details style="flex-basis:100%"><summary>Additional parameters and numerical precision</summary><div style="display:flex;gap:14px;flex-wrap:wrap;padding-top:10px">${def.fields.filter(f=>advanced.has(f.key)).map(field).join('')}</div></details>`:'');
  $('controls').onchange=e=>{
    const key=e.target.dataset.rx;if(!key)return;
    const value=e.target.value.trim()===''?NaN:Number(e.target.value);
    try {const proposed={...RX_STATE[def.id],[key]:value};def.validate(proposed);def.compute(proposed);RX_STATE[def.id]=proposed;$('error').textContent='';ctx.refresh();}
    catch(err){$('error').textContent=err.message+'. Last valid results retained.';}
  };
  if(def.presets){const box=document.createElement('p');box.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
    for(const preset of def.presets){const button=document.createElement('button');button.className='ghost';button.textContent=preset.label;
      button.onclick=()=>{const p={...RX_STATE[def.id],...preset.values};try{def.validate(p);def.compute(p);RX_STATE[def.id]=p;$('error').textContent='';ctx.refresh();}catch(e){$('error').textContent=e.message;}};box.append(button);}
    $('controls').before(box);
  }
  if(def.external){const box=document.createElement('div');box.innerHTML=`<p><button class="ghost" data-run>Calculate with local scientific engine</button> <label>Import computed result <input type="file" accept=".json,application/json" data-import style="max-width:100%"></label></p><details><summary>How to activate the scientific engine</summary><p>One-time setup in the GHU-LAB repository: <code>python tools/backend.py setup</code>. Start it with <code>python tools/backend.py serve</code>, then use the calculation button. Alternatively, save the inputs, run the command-line adapter and import its JSON. <a href="https://github.com/karlesmarin/ghu-lab/blob/main/docs/research-extensions.md" target="_blank" rel="noopener">Instructions and assumptions</a>.</p></details>`;
    const accept=data=>{if(!active)return;if(!rxMatchExternal(def.id,RX_STATE[def.id],data))throw Error('Result rejected: parameters, rates or result schema do not match');RX_EXTERNAL[def.id]=data;$('error').textContent='External calculation loaded for the matching inputs.';ctx.refresh();};
    box.querySelector('[data-import]').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>5e6)throw Error('Result file exceeds 5 MB');accept(JSON.parse(await f.text()));}catch(e){if(active)$('error').textContent=e.message;}};
    box.querySelector('[data-run]').onclick=async e=>{const button=e.target;button.disabled=true;pending=new AbortController();$('error').textContent='Scientific engine running…';try{
      const response=await rxScientificCall({experiment:def.id,parameters:RX_STATE[def.id]},pending.signal);
      const data=await response.json();if(!response.ok)throw Error(data.error||'Scientific engine failed');accept(data);
    }catch(e){if(active)$('error').textContent=e.message+'. Start the local scientific engine as described below, or import a computed result.';}finally{button.disabled=false;pending=null;}};
    if(!RX_NETWORK_ENABLED){box.querySelector('[data-run]').disabled=true;box.querySelector('[data-run]').textContent='Offline Edition · import results instead';}
    $('controls').after(box);
  }
  const compare=document.createElement('p');compare.style.cssText='display:flex;gap:8px;flex-wrap:wrap';compare.innerHTML='<button class="ghost" data-pin>Use this point as comparison</button> <button class="ghost" data-clear>Clear comparison</button> <button class="ghost" data-default>Restore reference inputs</button> <button class="ghost" data-note>Save research summary</button>';
  compare.querySelector('[data-pin]').onclick=()=>{if(last){RX_BASELINES[def.id]={parameters:structuredClone(RX_STATE[def.id]),result:structuredClone(last)};ctx.refresh();}};
  compare.querySelector('[data-clear]').onclick=()=>{delete RX_BASELINES[def.id];ctx.refresh();};
  compare.querySelector('[data-default]').onclick=()=>{RX_STATE[def.id]={...def.defaults};$('error').textContent='';ctx.refresh();};
  compare.querySelector('[data-note]').onclick=()=>{if(!last)return;const guide=RX_RESEARCH_GUIDE[def.id];rxDownload(`ghu-${def.id}-summary.txt`,[def.title,'',guide.question,'',...Object.entries(RX_STATE[def.id]).map(([k,v])=>`${k}: ${v}`),'',...guide.metrics(last).map(([label,v,unit])=>`${label}: ${rxNumber(v)} ${unit}`),'',guide.takeaway(last),'',last.scope||'',last.externalResult?JSON.stringify({backend:last.externalResult.backend,datasets:last.externalResult.datasets},null,2):'External calculation: not attached.',RX_BASELINES[def.id]?'Comparison snapshot included in the full JSON export.':'No comparison snapshot saved.'].join('\n'),'text/plain');};
  $('result').before(compare);
  $('json').onclick=()=>rxDownload(`ghu-${def.id}.json`,JSON.stringify({schema:'ghu-lab-experiment-v1',experiment:def.id,parameters:RX_STATE[def.id],result:last,comparison:RX_BASELINES[def.id]||null},null,2));
  const figures=document.createElement('select');figures.setAttribute('aria-label','Figure to save');figures.style.maxWidth='100%';$('svg').before(figures);
  $('svg').onclick=()=>{const svg=$('result').querySelectorAll('svg')[+figures.value||0];if(svg)rxDownload(`ghu-${def.id}-${+figures.value+1}.svg`,svg.outerHTML,'image/svg+xml');};
  if(def.load)$('load').onclick=()=>def.load(last,ctx);
  return {dispose(){active=false;if(pending)pending.abort();},render(){
    const visible=!def.visible||def.visible();document.getElementById(`rx_${def.id}`).hidden=!visible;if(jump)jump.hidden=!visible;if(!visible)return null;
    const p=RX_STATE[def.id];try{last=rxResult(def,p);}catch(e){last=null;$('error').textContent=e.message;$('result').textContent='No result is valid for the current combined inputs.';$('json').disabled=true;$('svg').disabled=true;return null;}
    $('json').disabled=false;$('svg').disabled=false;
    $('controls').querySelectorAll('[data-rx]').forEach(el=>el.value=p[el.dataset.rx]);
    $('result').innerHTML=rxOverview(def,last)+def.present(last)+rxExternalHTML(def,last)+(def.id==='thermal'?cvThermalHTML(last):'');
    const selectedFigure=figures.value||'0';figures.innerHTML=Array.from($('result').querySelectorAll('svg')).map((s,i)=>`<option value="${i}">${rxEscape(s.getAttribute('aria-label')||'Figure '+(i+1))}</option>`).join('');if(+selectedFigure<figures.options.length)figures.value=selectedFigure;
    // Detailed numerical tables stay one click away, keeping the visual reading first.
    $('result').querySelectorAll('div[style="overflow-x:auto"]').forEach((table,i)=>{if(table.closest('details'))return;const detail=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Numerical details · '+Array.from(table.querySelectorAll('th')).slice(0,3).map(x=>x.textContent).join(' / ');detail.append(summary);table.before(detail);detail.append(table);});
    return last;
  }};
}
