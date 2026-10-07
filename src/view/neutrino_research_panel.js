/* Visual reading: fixed inputs -> heavy response -> current response -> archived data. */
function niFigureMetadata(r,samples){return {parameters:r.parameters,flavour:r.flavourInputs,ring:r.ringInputs,
  scope:r.scope,provenance:r.provenance,samples};}
function niScanSeries(r,key,name,color){
  // Invalid points break the line, rather than suggesting an evaluated interval.
  const series=[];let points=[];
  const push=()=>{if(points.length)series.push({name:series.length?'':name,color,points});points=[];};
  for(const row of r.rows){if(row.valid&&Number.isFinite(row[key]))points.push([row.x,row[key]]);else push();}push();
  return series;
}
function niSvg(title,description,body,metadata,height=360){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 ${height}" role="img" aria-label="${rxEscape(title)}" style="width:100%;height:auto;display:block"><title>${rxEscape(title)}</title><desc>${rxEscape(description)}</desc><metadata>${rxEscape(JSON.stringify(metadata))}</metadata><rect width="560" height="${height}" fill="#fff"/><g font-family="Arial,sans-serif" font-size="17" fill="#29454b">${body}</g></svg>`;
}
function niText(x,y,text,attrs=''){
  attrs=attrs.replace('font-size="16"','font-size="20"');
  if(attrs.includes('font-weight="bold"'))attrs+=' font-size="23"';
  return `<text x="${x}" y="${y}" ${attrs}>${rxEscape(text)}</text>`;
}
function niLegend(items){return `<div class="ni-legend">${items.map(s=>`<span><i style="border-top:3px ${s.dashed?'dashed':'solid'} ${s.color}"></i>${rxEscape(s.name)}</span>`).join('')}</div>`;}
function niChart(title,series,xlabel,ylabel,metadata,opt={}){
  const pts=series.flatMap(s=>s.points).filter(p=>p.every(Number.isFinite));
  if(!pts.length)return '<p>No evaluated points for this figure.</p>';
  let xmin=opt.xdomain?.[0]??Math.min(...pts.map(p=>p[0])),xmax=opt.xdomain?.[1]??Math.max(...pts.map(p=>p[0]));
  let lo=Math.min(...pts.map(p=>p[1])),hi=Math.max(...pts.map(p=>p[1]));
  const constant=hi-lo<=1e-11*Math.max(Math.abs(lo),Math.abs(hi),1e-16);
  if(opt.zero){lo=Math.min(0,lo);hi=Math.max(0,hi);}
  let pad=(hi-lo)*.1;if(!pad||constant)pad=Math.max(Math.abs(hi)*.07,opt.floor||1e-15);
  let ymin=lo-pad,ymax=hi+pad;if(opt.positive)ymin=Math.max(0,ymin);
  const X=x=>92+435*(x-xmin)/(xmax-xmin||1),Y=y=>282-212*(y-ymin)/(ymax-ymin);
  const peak=Math.max(Math.abs(ymin),Math.abs(ymax)),power=peak&&(peak<.01||peak>=1e4)?Math.floor(Math.log10(peak)):0,scale=10**power;
  let body=niText(22,28,title,'font-weight="bold"')+niText(92,54,ylabel+(power?' × 10^'+power:''),'font-size="16"');
  for(let i=0;i<=4;i++){
    const y=ymin+(ymax-ymin)*i/4,x=xmin+(xmax-xmin)*i/4;
    const tickDecimals=Math.min(8,Math.max(0,1-Math.floor(Math.log10((ymax-ymin)/4/scale))));
    const tick=Number((y/scale).toFixed(tickDecimals)).toString();
    body+=`<path d="M92 ${Y(y)}H527" stroke="#e1e9ea"/>`+niText(82,Y(y)+5,tick,'text-anchor="end" font-size="16"')+
      niText(X(x),307,opt.log?rxTick(10**x):rxTick(x),'text-anchor="middle" font-size="16"');
  }
  if(opt.zero&&ymin<0&&ymax>0)body+=`<path d="M92 ${Y(0)}H527" stroke="#7a8d91" stroke-dasharray="3 5"/>`;
  if(Number.isFinite(opt.cursor))body+=`<path d="M${X(opt.cursor)} 70V282" stroke="#203c42" stroke-dasharray="4 5" opacity=".5"/>`;
  series.forEach(s=>{
    const p=s.points.filter(q=>q.every(Number.isFinite));
    body+=`<path d="${p.map((q,i)=>`${i?'L':'M'}${X(q[0])} ${Y(q[1])}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="3" ${s.dashed?'stroke-dasharray="9 6"':''}/>`;
    if(p.length<=25)p.forEach(q=>{body+=`<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="2.7" fill="${s.color}"><title>${rxEscape(s.name)}: ${rxNumber(opt.log?10**q[0]:q[0])}; ${rxNumber(q[1])}</title></circle>`;});
  });
  if(Number.isFinite(opt.cursor)&&Number.isFinite(opt.selected))body+=`<circle cx="${X(opt.cursor)}" cy="${Y(opt.selected)}" r="6" fill="white" stroke="#183e46" stroke-width="3"><title>Selected point: ${rxNumber(opt.selected)}</title></circle>`;
  body+=niText(309,340,xlabel,'text-anchor="middle" font-size="16"');
  const legend=series.filter(s=>s.name),height=legend.length>1?435:360;
  if(legend.length>1)legend.forEach((s,i)=>{const x=28+(i%2)*270,y=377+Math.floor(i/2)*30;body+=`<path d="M${x} ${y-6}h24" stroke="${s.color}" stroke-width="3" ${s.dashed?'stroke-dasharray="6 4"':''}/>`+niText(x+32,y,s.name,'font-size="16"');});
  return niSvg(title,`${ylabel} versus ${xlabel}. ${opt.description||''}`,body,{...metadata,display:{yRange:[ymin,ymax],power,constant,cursor:opt.cursor??null}},height);
}
function niPanelFigure(step,title,reading,svg,legend=''){
  return `<figure class="ni-figure"><figcaption><span class="ni-step">${step}</span><strong>${rxEscape(title)}</strong><p>${reading}</p></figcaption>${svg}${legend}</figure>`;
}
function niDeepCoreFigure(r,reference){
  const p=r.deepcore,m=reference.maps[p.order],xs=m.s23,ys=m.dm32EV2;
  const X=x=>92+435*(x-xs[0])/(xs.at(-1)-xs[0]),Y=y=>282-203*(y-ys[0])/(ys.at(-1)-ys[0]);
  const color=v=>`hsl(192,50%,${96-64*Math.min(20,Math.max(0,v))/20}%)`;
  let body=niText(22,28,`DeepCore 2018 · ${p.order} reference`,'font-weight="bold"')+niText(92,60,'Δm²₃₂ [10⁻³ eV²]','font-size="16"');
  for(let j=0;j<ys.length-1;j++)for(let i=0;i<xs.length-1;i++){
    const v=(m.deltaChi2[j][i]+m.deltaChi2[j+1][i]+m.deltaChi2[j][i+1]+m.deltaChi2[j+1][i+1])/4;
    body+=`<rect shape-rendering="crispEdges" x="${X(xs[i])}" y="${Y(ys[j+1])}" width="${X(xs[i+1])-X(xs[i])+.15}" height="${Y(ys[j])-Y(ys[j+1])+.15}" fill="${color(v)}"><title>Cell-centre Δχ² ${rxNumber(v)}</title></rect>`;
  }
  for(let i=0;i<=4;i++){
    const x=xs[0]+(xs.at(-1)-xs[0])*i/4,y=ys[0]+(ys.at(-1)-ys[0])*i/4;
    body+=niText(X(x),306,rxTick(x),'text-anchor="middle" font-size="16"')+niText(81,Y(y)+5,rxTick(y*1000),'text-anchor="end" font-size="16"');
  }
  if(p.order==='NO')body+=`<path d="${reference.feldmanCousins90NO.map(([x,y],i)=>`${i?'L':'M'}${X(x)} ${Y(y*1e-3)}`).join(' ')}" stroke="#a94722" stroke-width="3" fill="none"><title>Supplied 90% Feldman–Cousins contour (not a constant Δχ² contour)</title></path>`;
  const best=m.tabulatedMinimum;
  body+=`<circle cx="${X(best.s23)}" cy="${Y(best.dm32EV2)}" r="5" stroke="#152f35" stroke-width="2" fill="white"><title>Minimum tabulated reference</title></circle>`;
  if(p.applicable){const x=X(p.s23),y=Y(p.dm32EV2);body+=`<path d="M${x-7} ${y}h14 M${x} ${y-7}v14" stroke="white" stroke-width="6"/><path d="M${x-7} ${y}h14 M${x} ${y-7}v14" stroke="#152f35" stroke-width="3"><title>Chosen inputs: sin² θ₂₃=${rxNumber(p.s23)}, Δm²₃₂=${rxNumber(p.dm32EV2)} eV²; Δχ²=${rxNumber(p.deltaChi2)}</title></path>`;}
  body+=niText(309,336,'sin² θ₂₃','text-anchor="middle" font-size="16"');
  for(let i=0;i<100;i++)body+=`<rect x="${92+435*i/100}" y="363" width="4.4" height="14" fill="${color(20*i/99)}"/>`;
  for(const v of [0,5,10,15,20])body+=niText(92+435*v/20,400,v===20?'≥20':String(v),'text-anchor="middle" font-size="16"');
  body+=niText(22,375,'Δχ²','font-size="16"');
  body+=niText(92,438,'✚ chosen inputs     ○ grid minimum','font-size="16"');
  body+=niText(92,468,p.order==='NO'?'Rust: supplied 90% FC contour':'No supplied 90% FC contour for IO','font-size="16"');
  return niSvg(`DeepCore 2018 ${p.order} standard-three-neutrino reference`,
    'Darker cells have larger reference Δχ². Cross: chosen light inputs. Open circle: grid minimum. Each ordering has its own zero. No ring exclusion follows.',body,
    {edition:reference.edition,doi:reference.doi,provenance:reference.provenance,point:p,map:m,
      contour:p.order==='NO'?reference.feldmanCousins90NO:null,scope:reference.scope},490);
}
function niPresent(r){
  const s=r.selected,a=r.axis,flavours=['e','μ','τ'],channel=(r.parameters.antineutrino?'antineutrino ':'neutrino ')+flavours[r.parameters.from]+' → '+flavours[r.parameters.to];
  const xlabel=a.label+(a.log?' · log scale':''),cursor=a.log?Math.log10(r.selectedValue):r.selectedValue;
  const domain=a.log?[Math.log10(a.lo),Math.log10(a.hi)]:[a.lo,a.hi];
  const style=`<style>
  #rx_identifiability .ni-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:18px 0}
  #rx_identifiability .ni-figure{margin:0;padding:16px 12px 12px;border:1px solid #cddde0;border-radius:12px;background:#fff;min-width:0;color:#203c42}
  #rx_identifiability .ni-figure figcaption{padding:0 8px;line-height:1.5}
  #rx_identifiability .ni-figure figcaption strong{font-size:18px}
  #rx_identifiability .ni-figure figcaption p{font-size:14px;margin:8px 0 10px}
  #rx_identifiability .ni-step{display:inline-block;font-size:12px;font-weight:bold;background:#dceef0;color:#245a65;padding:2px 8px;border-radius:12px;margin:0 8px 6px 0}
  #rx_identifiability .ni-legend{display:flex;flex-wrap:wrap;gap:8px 16px;padding:6px 8px;font-size:13px}
  #rx_identifiability .ni-legend span{display:inline-flex;align-items:center;gap:6px}
  #rx_identifiability .ni-legend i{display:inline-block;width:22px}
  #rx_identifiability .ni-fixed{display:flex;flex-wrap:wrap;gap:12px 24px;border-radius:10px;background:#edf5f2;padding:14px;color:#274a42}
  #rx_identifiability .ni-fixed span{font-size:14px}
  #rx_identifiability .ni-fixed b{display:block;font-size:15px}
  #rx_identifiability .ni-reading{border-left:3px solid #b75c32;padding:4px 0 4px 12px}
  #rx_identifiability .ni-data{align-self:start}
  @media(max-width:1100px){#rx_identifiability .ni-grid{grid-template-columns:1fr}}
  @media(max-width:480px){#rx_identifiability .ni-figure{padding:12px 0 8px}#rx_identifiability .ni-figure figcaption strong{font-size:16px}}
  </style>`;
  let html=style+`<div class="ni-fixed" aria-label="Inputs held fixed"><span><b>🔒 Light masses [eV]</b>${r.lightTargetsEV.map(rxNumber).join(' · ')}</span><span><b>🔒 PMNS orientation</b>Shared with Three active flavours</span><span><b>↔ Sweep</b>${rxEscape(a.label)}<br>${rxNumber(a.lo)} → ${rxNumber(a.hi)}</span></div>`;
  html+=`<p>${r.summary.valid}/${r.summary.total} sampled points evaluated. ${r.summary.invalid?`<b>${r.summary.invalid} points outside the module domain are left as gaps.</b>`:'Each marker is a calculated point.'} The couplings are reconstructed at each point to retain the supplied light inputs.</p>`;
  if(!s)html+=`<p role="status"><b>Selected point not evaluated.</b> ${rxEscape(r.selectedFailure)}. Choose another sweep position; the evaluated scan points remain visible.</p>`;
  else html+=`<p>Open circle and vertical guide: selected ${rxEscape(a.label)} = <b>${rxNumber(r.selectedValue)}</b> · copy ${r.parameters.copy+1}, pair ${r.parameters.pair}. Change the sweep position to follow the response.</p>`;
  const mass=r.summary.massRangeGeV,split=r.summary.splitRangeEV;
  const rangeText=(range,unit)=>range?`${rxNumber(range[0])} → ${rxNumber(range[1])} ${unit}`:'No evaluated points';
  const massFlat=mass&&mass[1]-mass[0]<1e-10*Math.max(1,mass[1]);
  html+='<div class="ni-grid">'+niPanelFigure('01','Does the heavy mass move?',
    `<b>${massFlat?'Mass unchanged along this path.':'Heavy mass responds to the sweep.'}</b> Evaluated range: ${rangeText(mass,'GeV')}. The axis is cropped to show the response; read its numerical scale.`,
    niChart('Heavy centre',niScanSeries(r,'massGeV','Calculated centre','#267b87'),xlabel,'Mass [GeV]',niFigureMetadata(r,r.rows),{cursor,selected:s?.massGeV,xdomain:domain,log:a.log,positive:true}))+
    niPanelFigure('02','Can the pair splitting distinguish points?',
    `Evaluated range: <b>${rangeText(split,'eV')}</b>. Splitting and centre are different observables; equal light masses do not fix both.`,
    niChart('Heavy-pair splitting',niScanSeries(r,'splitEV','Calculated splitting','#b45b31'),xlabel,'Splitting [eV]',niFigureMetadata(r,r.rows),{cursor,selected:s?.splitEV,xdomain:domain,log:a.log,positive:true}))+ '</div>';
  if(s){
    const names=[{name:'Unitary reference',color:'#697d86',dashed:true,key:'unitary'},
      {name:'Raw CC factor',color:'#7054a2',key:'ccKernel'}, {name:'Near-normalized factor',color:'#bd6029',dashed:true,key:'nearNormalized'}];
    const peak=Math.max(...r.curves.map(x=>Math.abs(x.nearNormalized-x.unitary))),numerical=peak<1e-12;
    html+='<div class="ni-grid">'+niPanelFigure('03','What survives the normalization?',
      `<b>${rxEscape(channel)}</b> in vacuum. Source-current strength z = ${rxNumber(s.sourceStrength)}. Close curves can overlap; the next figure resolves their differences.`,
      niChart('Vacuum current factors',names.map(v=>({...v,points:r.curves.map(x=>[x.LoverE,x[v.key]])})),
        'L/E [km/GeV]','Dimensionless factor',niFigureMetadata(r,r.curves),{positive:true,zero:true}))+
      niPanelFigure('04','A magnifying view of the difference',
      numerical?'<b>Normalized and unitary shapes coincide to numerical precision.</b> Values below 10⁻¹² are displayed as zero; the exported samples retain the raw values.':
        `<b>Largest sampled |difference|: ${rxNumber(peak)}.</b> This is an absolute factor difference, not a percentage. Positive means above the unitary reference.`,
      niChart('Near-normalized minus unitary',[{name:'Factor difference',color:'#267b87',points:r.curves.map(x=>[x.LoverE,numerical?0:x.nearNormalized-x.unitary])}],
        'L/E [km/GeV]','Absolute difference',niFigureMetadata(r,r.curves),{zero:true,floor:1e-5,description:numerical?'Numerically coincident curves displayed at zero.':'Signed difference; the zero line marks coincidence.'}))+'</div>';
    html+=`<p class="ni-reading">Raw CC factor: |N exp(−i m²L/2E) N†|², with N = U diag(√(1−dᵢ)). The hypothetical near-normalized factor divides by z${flavours[r.parameters.from]}². A common deficit cancels in this ratio. A detector and weak-input analysis is needed to turn these factors into event rates or limits.</p>`;
  }
  if(r.deepcore){const d=r.deepcore;
    html+='<div class="ni-grid">'+niPanelFigure('05','Where are the fixed light inputs in real data?',
      `Archived <b>IceCube DeepCore 2018</b> standard-three-neutrino reference. ${d.applicable?`Selected reference Δχ² = <b>${rxNumber(d.deltaChi2)}</b>.`:`<b>Outside the grid: reference not evaluated.</b> ${rxEscape(d.reason)}`}`,
      niDeepCoreFigure(r,NI_DEEPCORE))+
      `<div class="ni-data"><h3>🧭 How to read this experiment</h3><p><b>The cross stays still when you move along this sweep.</b> The experimental reference uses the light inputs held fixed in the green strip. A changed heavy spectrum therefore need not move this reference.</p><p class="ni-reading">${rxEscape(a.reading)}</p><p>The map has an independent zero for each ordering. The supplied Feldman–Cousins contour is not replaced by a constant-Δχ² line.</p><p class="note">${rxEscape(NI_DEEPCORE.overlap.rule)} No ring exclusion or ordering odds are assigned.</p></div></div>`;
  }
  html+=`<details><summary>Reconstruction checks, approximation indicators and every scan point</summary><p>Maximum light-mass residual: ${rxNumber(r.summary.maxLightResidualEV)} eV; maximum PMNS-entry change: ${rxNumber(r.summary.maxMixingResidual)}. These check the inverse construction, not a prediction of its inputs. Largest Majorana insertion / nearest conserving gap: ${rxNumber(r.summary.maxInsertionToGap)}; an approximation indicator, not a certified error bound.</p>`+
    rxTable([a.label,'Status','Centre [GeV]','Splitting [eV]','Source strength','Max shape difference','Insertion / gap'],r.rows.map(x=>[x.value,x.valid?'evaluated':x.reason,x.massGeV,x.splitEV,x.sourceStrength,x.maxShapeDifference,x.maxInsertionToGap]))+
    `<p>${rxEscape(r.scope)}</p></details>`;
  return html;
}
