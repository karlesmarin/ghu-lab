/* Shared views mounted in existing sections; all physics remains in pure modules. */
const HD_S={mKK:2000,mTop:173.34,modes:30,lower:.89,upper:1.19,custom:false};
const HR_S={g4:.63,span:10,windings:600};
const HR_CACHE=new Map();

function dgNumber(x,d=6) {return Number.isFinite(x)?Number(x.toPrecision(d)).toString():'—';}
function dgInput(id,label,value,lo,hi,step) {
  return `<label for="${id}" style="display:block;margin:10px 0">${label}<input id="${id}" type="number" min="${lo}" max="${hi}" step="${step}" value="${value}" style="display:block;width:100%;max-width:220px;margin-top:4px"></label>`;
}
function dgTable(head,id) {return `<div style="overflow-x:auto"><table><thead><tr>${head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody id="${id}"></tbody></table></div>`;}
function dgGraph(canvas,rows,{x,y,xLabel,yLabel,point=null,window=null}) {
  const width=Math.max(260,Math.round(canvas.getBoundingClientRect().width)),height=250;
  canvas.width=width;canvas.height=height;
  const g=canvas.getContext('2d'),left=57,right=width-18,top=24,bottom=height-42;
  let xmin=Math.min(...rows.map(x)),xmax=Math.max(...rows.map(x)),ymin=Math.min(...rows.map(y)),ymax=Math.max(...rows.map(y));
  if(point&&Number.isFinite(point.y)){ymin=Math.min(ymin,point.y);ymax=Math.max(ymax,point.y);}
  const pad=(ymax-ymin)*.14||.01;ymin-=pad;ymax+=pad;
  const X=v=>left+(v-xmin)/(xmax-xmin)*(right-left),Y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
  g.font='11px sans-serif';g.fillStyle='#fafaf7';g.fillRect(0,0,width,height);
  if(window){g.fillStyle='#dde9d9';const a=Math.max(ymin,window[0]),b=Math.min(ymax,window[1]);if(b>a)g.fillRect(left,Y(b),right-left,Y(a)-Y(b));}
  for(let i=0;i<=4;i++){
    const v=ymin+(ymax-ymin)*i/4;g.strokeStyle='#d5dada';g.beginPath();g.moveTo(left,Y(v));g.lineTo(right,Y(v));g.stroke();
    g.fillStyle='#526068';g.fillText(dgNumber(v,4),2,Y(v)+4);
    const u=xmin+(xmax-xmin)*i/4;g.fillText(dgNumber(u,3),X(u)-12,bottom+18);
  }
  g.strokeStyle='#276e78';g.lineWidth=2;g.beginPath();rows.forEach((r,i)=>i?g.lineTo(X(x(r)),Y(y(r))):g.moveTo(X(x(r)),Y(y(r))));g.stroke();
  if(point&&Number.isFinite(point.y)&&point.x>=xmin&&point.x<=xmax){g.fillStyle='#b35b38';g.beginPath();g.arc(X(point.x),Y(point.y),5,0,2*Math.PI);g.fill();}
  g.fillStyle='#526068';g.fillText(yLabel,5,13);g.fillText(xLabel,left,bottom+36);
}

const HR_FIGURES=[
  {name:'g4',title:'Model variation',axis:'g₄',note:'A range of models: g₄ changes mₕ while 1/R₅ stays fixed.'},
  {name:'mW',title:'Measured input',axis:'mW [GeV]',note:'Propagated W-mass uncertainty: the two relative responses overlap.'},
  {name:'windings',title:'Numerical convergence',axis:'Winding cutoff N',note:'Four evaluated cutoffs, equally spaced by doubling N. Connecting segments guide the eye; they are not extra evaluations.'}
];
function hrXml(text) {return String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function hrPct(x) {return !Number.isFinite(x)?'—':x===0?'0':Math.abs(x)<.001?x.toExponential(2):dgNumber(x,4);}
function hrFigureData(result,name) {
  const a=result.m_h.raw.scans.find(s=>s.knob.name===name),b=result.invR5.raw.scans.find(s=>s.knob.name===name);
  const valid=result.m_h.valid&&result.invR5.valid&&result.m_h.base>0&&result.invR5.base>0;
  return {name,kind:a.knob.kind,valid,baseline:{m_h:result.m_h.base,invR5:result.invR5.base},
    points:valid?a.values.map((p,i)=>({input:p.value,m_h:p.y,invR5:b.values[i].y,
      mhPercent:100*(p.y/result.m_h.base-1),irPercent:100*(b.values[i].y/result.invR5.base-1)})):[]};
}
function hrFiguresHTML() {
  return `<h3>See how each parameter changes the results</h3>
    <p class="note">Each graph compares both masses with their own central value (0%). Each vertical scale adjusts to its response: compare the axis labels, not just the line slopes. Hover, tap, or use the arrow keys to inspect calculated points.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:14px;margin:14px 0">
      ${HR_FIGURES.map(f=>`<figure style="min-width:0;margin:0;padding:12px;border:1px solid var(--line);border-radius:10px">
        <svg id="hrPlot_${f.name}" xmlns="http://www.w3.org/2000/svg" role="group" tabindex="0" aria-label="${f.title}: ${f.axis}. Use arrow keys to inspect points." aria-describedby="hrPoint_${f.name}" style="display:block;width:100%;height:auto;touch-action:pan-y"></svg>
        <figcaption><p id="hrPoint_${f.name}" class="note" aria-live="polite" style="min-height:60px;overflow-wrap:anywhere"></p>
        <p class="note">${f.note}</p><button id="hrSVG_${f.name}" type="button">Export SVG</button></figcaption>
      </figure>`).join('')}</div>`;
}
function hrFiguresMount(ctx) {
  const $=id=>document.getElementById(id),cache=new Map();
  function draw(f) {
    const q=cache.get(f.name),svg=$('hrPlot_'+f.name),W=Math.max(260,Math.round(svg.getBoundingClientRect().width)),H=304;
    const left=65,right=W-18,top=70,bottom=215;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('width',W);svg.setAttribute('height',H);
    const header=`<title>${hrXml(f.title+' · '+f.axis)}</title><desc>${hrXml(f.note+' Values are percentage changes relative to each central mass. '+q.context)}</desc>
      <rect width="${W}" height="${H}" fill="#fafaf7"/><text x="12" y="18" font-size="14" font-weight="600">${f.title}</text>
      <text x="12" y="36" font-size="11">Change from central value (%)</text>
      <line x1="12" y1="51" x2="33" y2="51" stroke="#276e78" stroke-width="2"/><text x="39" y="55" font-size="12">mₕ</text>
      <line x1="95" y1="51" x2="116" y2="51" stroke="#b35b38" stroke-width="2" stroke-dasharray="5 3"/><text x="122" y="55" font-size="12">1/R₅</text>`;
    let content=header;
    if(!q.data.valid){
      content+=`<text x="12" y="108" font-size="12">No complete valid scan.</text><text x="12" y="130" font-size="12">No response curve is drawn.</text>`;
      $('hrPoint_'+f.name).textContent='A positive-curvature interior minimum must be resolved for every cutoff.';
      $('hrSVG_'+f.name).disabled=true;
    }else{
      const pts=q.data.points,xs=pts.map(p=>p.input),ys=pts.flatMap(p=>[p.mhPercent,p.irPercent]);
      let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(0,...ys),ymax=Math.max(0,...ys);
      if(xmin===xmax){const pad=Math.abs(xmin)*.05||1;xmin-=pad;xmax+=pad;}
      const pad=(ymax-ymin)*.13||.01;ymin-=pad;ymax+=pad;
      const xCoord=x=>f.name==='windings'?Math.log2(x):x;
      const X=x=>left+(xCoord(x)-xCoord(xmin))/(xCoord(xmax)-xCoord(xmin))*(right-left),Y=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);
      q.positions=pts.map(p=>X(p.input));q.width=W;
      for(let i=0;i<=4;i++){
        const y=ymin+(ymax-ymin)*i/4;
        const label=hrPct(Math.abs(y)<(ymax-ymin)*1e-12?0:y);
        content+=`<line x1="${left}" y1="${Y(y)}" x2="${right}" y2="${Y(y)}" stroke="#d5dada"/><text x="${left-7}" y="${Y(y)+4}" text-anchor="end" font-size="11">${label}</text>`;
      }
      content+=`<line x1="${left}" y1="${Y(0)}" x2="${right}" y2="${Y(0)}" stroke="#74858b" stroke-dasharray="2 3"/>`;
      for(const x of [...new Set(xs)])content+=`<text x="${X(x)}" y="236" text-anchor="${x===Math.min(...xs)?'start':x===Math.max(...xs)?'end':'middle'}" font-size="11">${dgNumber(x,7)}</text>`;
      for(const [kind,key,color,dash] of [['mh','mhPercent','#276e78',''],['ir','irPercent','#b35b38','5 3']]){
        content+=`<polyline fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="${dash}" points="${pts.map(p=>X(p.input)+','+Y(p[key])).join(' ')}"/>`;
        pts.forEach((p,i)=>{content+=`<circle data-kind="${kind}" data-index="${i}" data-change="${p[key]}" cx="${X(p.input)}" cy="${Y(p[key])}" r="${kind==='mh'?3:5}" fill="${kind==='mh'?color:'none'}" stroke="${color}" stroke-width="1.6"/>`;});
      }
      const point=pts[q.index];
      content+=`<line x1="${X(point.input)}" y1="${top}" x2="${X(point.input)}" y2="${bottom}" stroke="#6f787b" stroke-dasharray="3 4"/>`;
      content+=`<text x="${left}" y="255" font-size="12">${f.axis}${f.name==='windings'?' (log₂)':''}</text>
        <text x="12" y="279" font-size="11">Central mₕ = ${dgNumber(q.data.baseline.m_h,7)} GeV</text>
        <text x="12" y="295" font-size="11">Central 1/R₅ = ${dgNumber(q.data.baseline.invR5,7)} GeV</text>`;
      $('hrPoint_'+f.name).textContent=`${f.axis} = ${dgNumber(point.input,8)}: mₕ = ${dgNumber(point.m_h,9)} GeV (${hrPct(point.mhPercent)}%); 1/R₅ = ${dgNumber(point.invR5,9)} GeV (${hrPct(point.irPercent)}%).`;
      $('hrSVG_'+f.name).disabled=false;
    }
    svg.setAttribute('data-selected-index',q.index);
    svg.innerHTML=`<g font-family="system-ui, sans-serif" fill="#34434c">${content}</g>`;
  }
  for(const f of HR_FIGURES){
    const svg=$('hrPlot_'+f.name);
    const inspect=e=>{const q=cache.get(f.name);if(!q?.data.valid)return;
      const rect=svg.getBoundingClientRect(),x=(e.clientX-rect.left)*q.width/rect.width;
      const index=q.positions.reduce((best,p,i)=>Math.abs(p-x)<Math.abs(q.positions[best]-x)?i:best,0);
      if(q.index!==index){q.index=index;draw(f);}
    };
    svg.onpointermove=inspect;svg.onpointerdown=inspect;
    svg.onkeydown=e=>{const q=cache.get(f.name);if(!q?.data.valid)return;
      const last=q.data.points.length-1;
      const index=e.key==='Home'?0:e.key==='End'?last:e.key==='ArrowLeft'?Math.max(0,q.index-1):e.key==='ArrowRight'?Math.min(last,q.index+1):null;
      if(index!==null){e.preventDefault();q.index=index;draw(f);}
    };
    $('hrSVG_'+f.name).onclick=()=>{
      const q=cache.get(f.name);if(!q?.data.valid)return;
      const copy=svg.cloneNode(true),metadata=document.createElementNS('http://www.w3.org/2000/svg','metadata');
      metadata.textContent=JSON.stringify({context:q.context,model:q.model,settings:{...HR_S},
        measured_W:EXPERIMENT.m_W,units:{masses:'GeV',relative_response:'percent of each baseline'},
        selected_index:q.index,scan:q.data});copy.appendChild(metadata);
      const blob=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ghu-robustness-${f.name}.svg`;a.click();
      setTimeout(()=>URL.revokeObjectURL(url),2000);
    };
  }
  return {render(result,model){
    for(const f of HR_FIGURES){
      const data=hrFigureData(result,f.name),old=cache.get(f.name);
      cache.set(f.name,{data,model,context:`Model ${modelId(model)}; g4=${HR_S.g4}; span=${HR_S.span}%; cutoff=${HR_S.windings}.`,
        index:Math.min(old?.index??(f.name==='windings'?2:1),Math.max(0,data.points.length-1))});
      draw(f);
    }
  }};
}

function hierarchyRobustnessHTML() {
  return `<div class="card" style="margin-top:18px"><h2>Robustness of this content</h2>
    <p class="note">The selected SU(7) bulk content and gauge seed feed the summed potential. These diagnostic controls use the registered measured W mass; the other Hierarchy results retain their paper conventions.</p>
    <div class="grid two"><div>
      ${dgInput('hrG4','Central g₄ · model convention',.63,.4,1.2,.01)}
      ${dgInput('hrSpan','g₄ variation · % each side (model range)',10,0,40,1)}
      <label for="hrWindings">Baseline winding cutoff</label><select id="hrWindings"><option>300</option><option selected>600</option><option>1200</option></select>
      <p><button id="hrReset">Reset diagnostics</button></p><p id="hrInputNote" class="note" role="status"></p>
    </div><div><div class="stat"><div class="k">mₕ · diagnostic central value</div><div class="v" id="hrMass">—</div></div>
      <div class="stat"><div class="k">1/R₅ · diagnostic central value</div><div class="v" id="hrScale">—</div></div>
      <p class="note" id="hrAnchor"></p></div></div>
    ${hrFiguresHTML()}
    <h3>Separate responses · all masses in GeV</h3>
    ${dgTable(['Variation','mₕ minimum → maximum','1/R₅ minimum → maximum'],'hrBudgets')}
    <p class="note">One parameter at a time. Ranges are actual endpoints. Numerical spread, model range and propagated W-mass uncertainty are kept separate; they are never added into a confidence interval.</p>
    <h3>Summary</h3><p id="hrSummary" role="status"></p>
    <details><summary>Winding convergence and vacuum diagnostics</summary>
      ${dgTable(['Windings','α minimum','F″','mₕ [GeV]','1/R₅ [GeV]'],'hrVacua')}
      <p class="note">Full winding spread target: 0.01 GeV for each quantity. This finite scan does not certify a remainder, resolve arbitrarily narrow minima or establish radius stability.</p>
    </details></div>`;
}
function hierarchyRobustnessResult(model,data) {
  const terms=termTable(model,data),key=JSON.stringify([terms,HR_S]);
  if(!HR_CACHE.has(key)) {
    if(HR_CACHE.size>=12)HR_CACHE.delete(HR_CACHE.keys().next().value);
    HR_CACHE.set(key,robustness(terms,{g4:HR_S.g4,g4Fraction:HR_S.span/100,windings:HR_S.windings}));
  }
  return HR_CACHE.get(key);
}
function hierarchyRobustnessMount(ctx) {
  const $=id=>document.getElementById(id);
  const figures=hrFiguresMount(ctx);
  for(const [id,key,lo,hi] of [['hrG4','g4',.4,1.2],['hrSpan','span',0,40],['hrWindings','windings',300,1200]]) {
    $(id).onchange=()=>{const el=$(id),v=Number(el.value);
      if(el.value===''||!Number.isFinite(v)||v<lo||v>hi||(key==='windings'&&![300,600,1200].includes(v))){el.value=HR_S[key];$('hrInputNote').textContent='Invalid input; the last valid value is retained.';return;}
      HR_S[key]=v;$('hrInputNote').textContent='';ctx.refresh();};
  }
  $('hrReset').onclick=()=>{Object.assign(HR_S,{g4:.63,span:10,windings:600});$('hrInputNote').textContent='';ctx.refresh();};
  return {render(model,data){
    const r=hierarchyRobustnessResult(model,data);
    figures.render(r,model);
    for(const [id,k] of [['hrG4','g4'],['hrSpan','span'],['hrWindings','windings']])$(id).value=HR_S[k];
    $('hrMass').textContent=dgNumber(r.m_h.base)+' GeV';$('hrScale').textContent=dgNumber(r.invR5.base)+' GeV';
    $('hrAnchor').textContent=`W anchor = ${EXPERIMENT.m_W.value} ± ${EXPERIMENT.m_W.error} GeV (registered measured uncertainty). ${EXPERIMENT.m_W.source}; read ${EXPERIMENT.m_W.read}.`;
    $('hrBudgets').innerHTML=r.knobs.map((k,i)=>{const a=r.m_h.raw.scans[i],b=r.invR5.raw.scans[i];
      return `<tr><td>${k.name} · ${k.kind}</td><td>${dgNumber(a.lo)} → ${dgNumber(a.hi)}</td><td>${dgNumber(b.lo)} → ${dgNumber(b.hi)}</td></tr>`;}).join('');
    $('hrSummary').textContent=!r.m_h.valid||!r.invR5.valid?'No complete valid scan: no resolved interior minimum with positive curvature for every cutoff. No robustness verdict is available.':
      `${r.m_h.line}. ${r.invR5.line}. Winding convergence: mₕ ${r.m_h.convergenceOK?'within':'outside'} target, 1/R₅ ${r.invR5.convergenceOK?'within':'outside'} target. Changing g₄ leaves 1/R₅ unchanged in this normalization.`;
    $('hrVacua').innerHTML=[...r.vacua].sort((a,b)=>a.windings-b.windings).map(q=>{
      const i=r.m_h.raw.scans[0].values.find(v=>v.value===q.windings),j=r.invR5.raw.scans[0].values.find(v=>v.value===q.windings);
      return `<tr><td>${q.windings}</td><td>${dgNumber(q.alpha,8)}</td><td>${dgNumber(q.curvature)}</td><td>${dgNumber(i?.y,9)}</td><td>${dgNumber(j?.y,9)}</td></tr>`;}).join('');
    return r;
  }};
}
function hierarchyRobustnessExport(ctx,r) {
  const result=hierarchyRobustnessResult(r.model,ctx.DATA),values=new Map(r.values);
  values.set('robustness_diagnostics',val(result,{status:STATUS.VERIFIED,units:'GeV; one parameter at a time',source:'Summed potential; sensitivity.mjs; registered EXPERIMENT.m_W; diagnostics settings exported separately from paper conventions.'}));
  values.set('robustness_verdict',result.m_h.valid&&result.invR5.valid?val({m_h:result.m_h.verdict,invR5:result.invR5.verdict},{status:STATUS.VERIFIED,source:'Complete finite scan; conditional numerical diagnostics'}):unknown('No complete valid interior-minimum scan'));
  return {card:makeCard({...r.model,diagnostic_settings:{...HR_S,mW:EXPERIMENT.m_W.value,mWError:EXPERIMENT.m_W.error}},values,
    {version:VERSION,build:BUILD,kernelHash:KERNEL_HASH,certificates:HIERARCHY_SECTION.certificates})};
}

function higgsDiagnosticsHTML() {
  return `<div class="card"><h2>Higgs production · top KK reference</h2>
    <p>Explore the gluon-fusion production ratio R<sub>gg</sub> with the existing Carson–Okada top-tower calculation.</p>
    <p class="note">SU(3) × U(1)′, flat S¹/Z₂; only top KK modes. This reference has its own inputs and does not inherit the builder or neutrino-ring parameters.</p></div>
    <div class="grid two" style="margin-top:18px"><div class="card"><h2>Parameters</h2>
      <label for="hdScale">M<sub>KK</sub> [GeV]</label><input id="hdScale" type="range" min="500" max="10000" step="10" value="2000" style="width:100%">
      ${dgInput('hd_mKK','MKK · precise value [GeV]',2000,500,10000,10)}
      ${dgInput('hd_mTop','Top mass [GeV]',173.34,160,185,.01)}
      ${dgInput('hd_modes','KK levels in partial sum',30,1,1000,1)}
      <label for="hdCustom"><input id="hdCustom" type="checkbox"> Use a custom comparison window</label>
      ${dgInput('hd_lower','Lower Rgg edge',.89,.5,1.05,.01)}${dgInput('hd_upper','Upper Rgg edge',1.19,.6,1.5,.01)}
      <button id="hdReset">Published reference inputs</button><p id="hdInputNote" class="note" role="status"></p>
    </div><div class="card"><h2>Joint results</h2>
      <div class="stat"><div class="k">Rgg · leading analytic tower</div><div class="v" id="hdRate">—</div></div>
      <div class="stat"><div class="k">MKK interval within the chosen domain</div><div class="v" id="hdInterval" style="font-size:21px">—</div></div>
      <p class="note" id="hdWindowSource"></p><h3>Summary</h3><p id="hdSummary" role="status"></p>
      <p class="note" id="hdDomain"></p><p class="note">A window comparison under these assumptions is not a global fit or an exclusion of the other GHU models in this laboratory.</p>
    </div></div>
    <div class="grid two" style="margin-top:18px"><div class="card"><h2>Rate versus compactification scale</h2>
      <canvas id="hdCurve" style="width:100%;display:block" aria-label="Leading Rgg against MKK in TeV"></canvas>
      <p class="note">Curve: leading infinite tower; green shading: selected window; dot: current point when in domain.</p></div>
    <div class="card"><h2>Convergence of the KK sum</h2>
      <canvas id="hdConvergence" style="width:100%;display:block" aria-label="Partial tower rate against number of levels"></canvas>
      <p class="note" id="hdTail"></p></div></div>
    <div class="card" style="margin-top:18px"><h2>Approximation and provenance</h2>
      ${dgTable(['Quantity','Value'],'hdDiagnostics')}
      <p class="note">The determinant low-energy theorem (LET) keeps higher powers of mₜ/MKK. Its difference from the leading result is an approximation diagnostic, not a complete theory error. Finite-mass loop corrections, additional particles and decay branching fractions are not computed here.</p>
      <p class="note">Reference: <a href="https://arxiv.org/abs/1510.03092" target="_blank" rel="noopener">Carson–Okada, arXiv:1510.03092</a>, equations (33), (35), (41), Table 1 (top-only row). The paper benchmark gives MKK ≳ 1.32 TeV. Its experimental window is historical.</p></div>`;
}
function higgsDiagnosticsMount(ctx) {
  const $=id=>document.getElementById(id);
  const accept=(key,value)=>{const next={...HD_S,[key]:value};try{hdModel(next);}catch{ $('hdInputNote').textContent='Invalid input; the last valid value is retained.';return false;}
    Object.assign(HD_S,next);$('hdInputNote').textContent='';ctx.refresh();return true;};
  for(const k of Object.keys(HD_LIMITS))$('hd_'+k).onchange=()=>{const el=$('hd_'+k);if(!accept(k,el.value===''?NaN:Number(el.value)))el.value=HD_S[k];};
  $('hdScale').oninput=e=>accept('mKK',Number(e.target.value));
  $('hdCustom').onchange=e=>{if(!accept('custom',e.target.checked))e.target.checked=HD_S.custom;};
  $('hdReset').onclick=()=>{Object.assign(HD_S,hdDefaults());$('hdInputNote').textContent='';ctx.refresh();};
  return {render(){
    const r=hdModel(HD_S);for(const k of Object.keys(HD_LIMITS))$('hd_'+k).value=HD_S[k];
    $('hdScale').value=HD_S.mKK;$('hdCustom').checked=HD_S.custom;
    $('hd_lower').disabled=$('hd_upper').disabled=!HD_S.custom;
    $('hdRate').textContent=dgNumber(r.rgg,7);
    $('hdInterval').textContent=r.interval.empty?'No finite point in domain':`${dgNumber(r.interval.lower/1000,5)} TeV ≤ MKK`+(r.interval.upperUnbounded?'':` ≤ ${dgNumber(r.interval.upper/1000,5)} TeV`);
    $('hdWindowSource').textContent=`Rgg window [${r.window.join(', ')}]. ${r.provenance}. The displayed interval intersects this window with MKK ≥ ${dgNumber(r.domainMin/1000)} TeV; this domain boundary is not an experimental limit.`;
    $('hdSummary').textContent=r.summary;$('hdDomain').textContent=`(mₜ/MKK)² = ${dgNumber(r.expansionParameter)}. ${r.domainPolicy}`;
    dgGraph($('hdCurve'),hdCurve(HD_S),{x:p=>p.mKK/1000,y:p=>p.rgg,xLabel:'MKK [TeV]',yLabel:'Rgg',point:{x:HD_S.mKK/1000,y:r.rgg},window:r.window});
    if(r.inDomain){
      const ns=[1,2,3,5,10,20,30,50,100,200,500,1000],rows=ns.map(modes=>({n:modes,r:hdModel({...HD_S,modes}).finiteRgg}));
      dgGraph($('hdConvergence'),rows,{x:p=>Math.log10(p.n),y:p=>p.r,xLabel:'log10(number of KK levels)',yLabel:'Partial Rgg',point:{x:Math.log10(HD_S.modes),y:r.finiteRgg}});
      $('hdTail').textContent=`Partial sum: ${dgNumber(r.finiteRgg,9)}. Difference from the leading analytic tower: ${dgNumber(r.rateTail)}; integral-test upper bound: ${dgNumber(r.rateTailBound)}. This bound concerns truncation only.`;
    }else{$('hdConvergence').getContext('2d').clearRect(0,0,$('hdConvergence').width,$('hdConvergence').height);$('hdTail').textContent='No partial-sum rate is quoted outside the chosen domain.';}
    $('hdDiagnostics').innerHTML=[['Amplitude shift from the leading tower',r.shift],['Leading analytic Rgg',r.rgg],['Partial-sum Rgg',r.finiteRgg],['Determinant LET Rgg',r.letRgg],['LET minus leading Rgg',r.letDifference],['Truncation upper bound on rate difference',r.rateTailBound]]
      .map(([k,v])=>`<tr><td>${k}</td><td class="num">${dgNumber(v,9)}</td></tr>`).join('');
    return r;
  }};
}
function higgsDiagnosticsExport() {
  const r=hdModel(HD_S),source='Carson–Okada arXiv:1510.03092, top-only reference; docs/diagnostics.md',
    v=x=>val(x,{status:STATUS.VERIFIED,source,units:'rates dimensionless; mKK, mTop, domainMin, rawBound and interval bounds in GeV; modes integer'});
  return {card:makeCard({group:'ghu-top-kk-reference',section:'predict',variant:'higgs-rate',parameters:{...HD_S},
    orbifold:{name:'S1/Z2'},bulk:[],brane:[],conventions:{m_W:null,g4:null,mh_window:null,windings:null,gauge_seed:null},assumptions:HD_SCOPE},
    {higgs_diagnostics:v(r),rate:r.inDomain?v(r.rgg):unknown(r.summary),
      comparison_window:v({window:r.window,provenance:r.provenance}),
      current_global_fit:unknown('Historical benchmark or custom scenario; no current combined likelihood'),
      builder_matching:unknown('The reference top spectrum has not been derived for the selected builder model'),
      full_theory_error:unknown('LET diagnostic and KK truncation do not include every physical correction')},
    {version:VERSION,build:BUILD,kernelHash:KERNEL_HASH,certificates:{reference:'data/higgs_diagnostics_reference.json'}}),
    mathKeys:[],sources:[],caption:'GHU top KK production reference with explicit domain and window provenance.'};
}
