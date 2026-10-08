/* Shares the Neutrino ring controls, result card and permalink. */
const ND_S={pair:1,extraEV:0,boost:1,lminMM:0,lmaxMM:1,majoron:0,chiOverF:1,sigmaOverF:1};
function neutrinoDecayHTML(){return `<div class="card" id="ndCard" style="margin-top:18px">${typeof guideLink==='function'?guideLink('neutrino-decays'):''}
  <h2>Decays, lifetime and pair coherence</h2>
  <p>Use the same six masses and active weights to calculate on-shell W, Z and SM Higgs partial widths.
  Add a hypothetical extra width to see how uncalculated channels could change the result.</p>
  <p class="note"><b>Conditional scenario.</b> Γ below is per component of a quasi-Dirac pair.
  The full ring width is unknown. Zero extra width is a reference choice; it does not close the Majoron or other new channels.</p>
  <div class="grid two">
    <div>
      <label for="ndPair">Inspect pair <select id="ndPair">${[1,2,3,4,5,6].map(i=>`<option value="${i}">${i}</option>`).join('')}</select></label>
      <p class="note">Charged-lepton flavour follows the CMS selector below; changing Dirac/Majorana reference there does not change this pair's lifetime.</p>
      <p><label><input type="checkbox" id="ndMajoron"> Include calculated Majoron channels</label></p>
       <div style="display:flex;gap:12px;flex-wrap:wrap">
         <label>χ/f <input id="ndChi" type="number" min=".25" max="4" step=".05" style="width:75px"></label>
         <label>Σ/f <input id="ndSigma" type="number" min=".25" max="4" step=".05" style="width:75px"></label></div>
       <p class="note">VEV ratios change the physical Majoron direction. Yukawas are retuned to keep fermion masses fixed; radial stability remains unchecked.</p>
       <p id="ndMajoronSummary" aria-live="polite"></p>
       <label for="ndExtra">Extra width per component [eV]</label>
      <input type="number" id="ndExtra" min="0" max="1000000000" step="any" style="width:150px;max-width:100%">
      <label for="ndExtraLog" class="note" style="display:block;margin-top:8px">Explore positive extra widths on a logarithmic scale</label>
      <input id="ndExtraLog" type="range" min="-12" max="9" step=".05" style="width:100%">
      <div style="display:flex;flex-wrap:wrap;gap:8px"><button id="ndNoExtra" class="ghost">zero extra</button>
        <button id="ndEqualExtra" class="ghost">extra = selected W/Z/h sum</button><button id="ndReset" class="ghost">reset decay controls</button></div>
      <p class="note" id="ndExtraNote"></p>
      <label for="ndBoost">Fixed boost βγ <input id="ndBoost" type="number" min=".1" max="100" step="any" style="width:95px"></label>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px">
        <label for="ndLmin">Inner flight distance [mm]<br><input id="ndLmin" type="number" min="0" max="1000000" step="any" style="width:140px"></label>
        <label for="ndLmax">Outer flight distance [mm]<br><input id="ndLmax" type="number" min=".000000000001" max="1000000" step="any" style="width:140px"></label>
      </div>
      <p class="note">Distances are along the flight path, not transverse detector radii. A fixed boost is a chosen kinematic scenario.</p>
      <p id="ndError" role="status" aria-live="polite" class="note"></p>
    </div>
    <div>
      <div class="pair"><div class="stat"><div class="k">Scenario Γ per component</div><div id="ndWidth" class="v">—</div></div>
        <div class="stat"><div class="k">Scenario proper length cτ</div><div id="ndLifetime" class="v">—</div></div></div>
      <p id="ndSummary" aria-live="polite"></p><p class="note" id="ndValidity"></p>
      <p class="note">SS/OS is the same-sign / opposite-sign dilepton ratio for an ideal isolated coherent pair with equal widths, CP conservation and integration over all decay times. The flight-window probability is a separate diagnostic; no window-selected SS/OS ratio is inferred.</p>
    </div>
  </div>
  <div class="grid two" style="margin-top:18px">
    <div><h3>Where the scenario width goes</h3><div id="ndFractionsPlot" role="img" tabindex="0" aria-label="Scenario channel fractions for six pairs. Click a bar or use left and right arrows to select a pair."></div>
      <p class="note">W: both charges · Z: light ν · h: light ν · J: light and heavy neutrinos · extra: chosen width. Bars sum to one only within this scenario. Click a bar or use arrow keys to select a pair.</p>
      <button class="ghost" id="ndExportFractions">save channel figure (SVG)</button></div>
    <div><h3>Does the splitting survive the width?</h3><div id="ndCoherencePlot" role="img" tabindex="0" aria-label="Ideal same-sign over opposite-sign ratio versus muB. Click or use arrows to change muB."></div>
      <p class="note">Dashed: W/Z/h only. Solid: selected Majoron and extra widths included. Both use the selected pair. Click or use arrow keys to change μB in the whole experiment.</p>
      <button class="ghost" id="ndExportCoherence">save coherence figure (SVG)</button></div>
  </div>
  <div style="max-width:750px;margin:20px auto 0"><h3>How far would it fly?</h3><div id="ndFlightPlot" role="img" aria-label="Cumulative decay probability versus flight distance in millimetres at the selected fixed boost."></div>
    <p class="note" id="ndFlightNote"></p><button class="ghost" id="ndExportFlight">save flight figure (SVG)</button></div>
  <details style="margin-top:18px"><summary><b>All six pairs: widths, lifetimes and coherence</b></summary>
    <div style="overflow-x:auto"><table><thead><tr><th>pair</th><th class="num">W [eV]</th><th class="num">Z [eV]</th><th class="num">h [eV]</th><th class="num">Γ scenario [eV]</th><th class="num">τ [s]</th><th class="num">cτ [mm]</th><th class="num">Δm/Γ</th><th class="num">SS/OS</th><th class="num">P(window)</th></tr></thead><tbody id="ndRows"></tbody></table></div>
  </details>
  <details style="margin-top:14px"><summary><b>Channels still missing and calculation conventions</b></summary>
    <h3>Computed Majoron cascade widths [eV]</h3><div id="ndMajoronRows"></div>
    <p id="ndMissing"></p><p id="ndCascades"></p>
    <p>Off-shell weak decays and loop corrections are omitted. A closed on-shell channel is not a stable-particle verdict.
    Higgs widths assume an unmixed SM Higgs; new scalar mixing is unresolved.
    Neutral light channels include the conserving light active residue 1 − deficit. Charged-lepton masses are retained.
    The extra width is an independent nonnegative input, identical for all pair components; it is not a Majoron calculation.</p>
    <p>Widths use the pair-summed active weight: each Majorana component carries half of it, and charge-conjugate modes restore the Dirac-width normalization.
    Existing mass inputs are retained with their recorded PDG editions. G_F and unit conversions use PDG 2025.</p>
    <p>Sources: <a href="https://arxiv.org/abs/0901.3589" target="_blank" rel="noopener">Atre et al., two-body widths</a>;
    <a href="https://arxiv.org/abs/1607.05641" target="_blank" rel="noopener">Anamiati et al., coherent-pair ratio, eq. (31)</a>;
    <a href="https://pdg.lbl.gov/2025/reviews/rpp2025-rev-phys-constants.pdf" target="_blank" rel="noopener">PDG constants</a>.
    Derivation and scope: <code>docs/neutrino-decays.md</code>. All inputs, numerical rows and unknown quantities accompany the result card.</p>
  </details>
</div>`;}

function ndXML(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function ndFmt(x){return x===null||!Number.isFinite(x)?'undefined':x===0?'0':x.toExponential(3);}
function ndSVG(title,body,meta){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" style="display:block;width:100%;height:auto" aria-label="${ndXML(title)}"><title>${ndXML(title)}</title><metadata>${ndXML(JSON.stringify(meta))}</metadata><rect width="600" height="300" fill="white"/><g font-family="Arial,sans-serif" font-size="19" fill="#334750">${body}</g></svg>`;}
function neutrinoDecayMount(ctx) {
  const $=id=>document.getElementById(id);let current=null,ring=null;
  function commit(k,v){try{const p=ndValidate({...ND_S,[k]:v});Object.assign(ND_S,p);$('ndError').textContent='';ctx.refresh();}
    catch(e){$('ndError').textContent=e.message+'. Last valid results retained.';}}
  for(const [id,key] of [['ndPair','pair'],['ndExtra','extraEV'],['ndBoost','boost'],['ndLmin','lminMM'],['ndLmax','lmaxMM'],['ndChi','chiOverF'],['ndSigma','sigmaOverF']])
    $(id).onchange=e=>commit(key,e.target.value.trim()===''?NaN:Number(e.target.value));
  $('ndMajoron').onchange=e=>commit('majoron',+e.target.checked);
  $('ndExtraLog').oninput=e=>commit('extraEV',10**Number(e.target.value));
  $('ndNoExtra').onclick=()=>commit('extraEV',0);
  $('ndEqualExtra').onclick=()=>{if(current)commit('extraEV',current.selected.weak.sumEV);};
  $('ndReset').onclick=()=>{Object.assign(ND_S,ndDefaults());$('ndError').textContent='';ctx.refresh();};
  $('ndFractionsPlot').onclick=e=>{const p=e.target.closest('[data-nd-pair]');if(p)commit('pair',Number(p.dataset.ndPair));};
  $('ndFractionsPlot').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();commit('pair',e.key==='Home'?1:e.key==='End'?6:Math.max(1,Math.min(6,ND_S.pair+(e.key==='ArrowRight'?1:-1))));}};
  function muB(value){NR_S.muBkeV=Math.max(0,Math.min(5000,value));ctx.refresh();}
  $('ndCoherencePlot').onclick=e=>{const b=e.currentTarget.getBoundingClientRect();muB(Math.round((600*(e.clientX-b.left)/b.width-62)/514*5000));};
  $('ndCoherencePlot').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();muB(e.key==='Home'?0:e.key==='End'?5000:NR_S.muBkeV+(e.key==='ArrowRight'?25:-25));}};
  for(const [button,plot,name] of [['ndExportFractions','ndFractionsPlot','channels'],['ndExportCoherence','ndCoherencePlot','coherence'],['ndExportFlight','ndFlightPlot','flight']])
    $(button).onclick=()=>{const svg=$(plot).querySelector('svg');if(!svg)return;const url=URL.createObjectURL(new Blob([svg.outerHTML],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download=`neutrino-${name}-pair-${ND_S.pair}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  function figures() {
    const p=current.selected,meta={ring:NR_S,decay:current,units:{width:'eV',flight:'mm',muB:'keV'}};
    const text=(x,y,s,extra='')=>`<text x="${x}" y="${y}" ${extra}>${ndXML(s)}</text>`;
    const colors={W:'#277987',Z:'#5878ac',h:'#b35b38',...(ND_S.majoron?{J:'#588246'}:{}),extra:'#89729d'};
    let body=text(14,18,'Fraction of scenario width');
    for(let j=0;j<=4;j++){const y=246-196*j/4;body+=`<path d="M48 ${y}H582" stroke="#dce3e6"/>`+text(5,y+4,(j/4).toFixed(2));}
    current.rows.forEach((r,i)=>{const x=68+i*85;let bottom=246;body+=`<g data-nd-pair="${r.pair}" style="cursor:pointer"><title>${ndXML(`Pair ${r.pair}; scenario width ${ndFmt(r.widthEV)} eV`)}</title>`;
      for(const [key,fraction] of Object.entries(r.channelFractions)){const height=(fraction??0)*196;body+=`<rect x="${x}" y="${bottom-height}" width="52" height="${height}" fill="${colors[key]}"><title>${ndXML(`${key}: ${ndFmt(r.channelsEV[key])} eV; fraction ${ndFmt(fraction)}`)}</title></rect>`;bottom-=height;}
      body+=`<rect x="${x-3}" y="47" width="58" height="202" fill="transparent" stroke="${r.pair===ND_S.pair?'#182f3c':'transparent'}" stroke-width="2"/>`+text(x+26,266,`${r.pair}`,'text-anchor="middle"')+'</g>';
      if(r.widthEV===0)body+=text(x+26,146,'—','text-anchor="middle"');
    });
    Object.keys(colors).forEach((k,i)=>{body+=`<rect x="${54+i*108}" y="281" width="12" height="12" fill="${colors[k]}"/>`+text(72+i*108,292,k);});
    $('ndFractionsPlot').innerHTML=ndSVG('Channel fractions in the chosen decay scenario',body,meta);
    const X=x=>62+514*x/5000,Y=y=>246-196*y;
    const samples=Array.from({length:81},(_,i)=>{const b=5000*i/80,split=ring.used.muAkeV*1000*p.weightA+b*1000*p.weightB;
      return {muBkeV:b,weakOnly:ndCoherence(split,p.weak.sumEV).ssOverOS,scenario:ndCoherence(split,p.widthEV).ssOverOS};});
    const top=Math.min(1,Math.max(1e-12,...samples.flatMap(s=>[s.weakOnly??0,s.scenario??0]))*1.08),YC=y=>246-196*y/top;
    body=text(12,18,'Ideal SS / OS · vertical scale adapts');
    for(let j=0;j<=4;j++){const y=YC(top*j/4);body+=`<path d="M62 ${y}H576" stroke="#dce3e6"/>`+text(3,y+4,j===0?'0':(top*j/4).toPrecision(2));}
    for(let j=0;j<=2;j++)body+=text(X(j*2500),269,j*2500,`text-anchor="${j===0?'start':j===2?'end':'middle'}"`);
    body+=text(300,292,'μB [keV]','text-anchor="middle"');
    for(const [key,color,dash] of [['weakOnly','#687982','5 4'],['scenario','#b35b38','']]){
      const points=samples.filter(s=>s[key]!==null);if(points.length)body+=`<path d="${points.map((s,i)=>`${i?'L':'M'}${X(s.muBkeV)} ${YC(s[key])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="${dash}"/>`;
    }
    if(p.coherence.ssOverOS!==null)body+=`<circle cx="${X(NR_S.muBkeV)}" cy="${YC(p.coherence.ssOverOS)}" r="5" fill="#277987"><title>${ndXML(`Selected SS/OS = ${ndFmt(p.coherence.ssOverOS)}`)}</title></circle>`;
    else body+=text(105,150,'No positive included width; ratio undefined');
    $('ndCoherencePlot').innerHTML=ndSVG('Selected pair coherence versus independent Majorana term',body,{...meta,samples});
    const mean=p.flight.meanFlightMM,flightSamples=[];
    body=text(10,18,'Cumulative probability P(decay before L)');
    for(let j=0;j<=4;j++){const y=Y(j/4);body+=`<path d="M62 ${y}H576" stroke="#dce3e6"/>`+text(10,y+4,(j/4).toFixed(2));}
    if(mean!==null&&Number.isFinite(8*mean)){
      const max=8*mean,a=Math.min(1,ND_S.lminMM/max),b=Math.min(1,ND_S.lmaxMM/max);
      body+=`<rect x="${62+514*a}" y="50" width="${514*(b-a)}" height="196" fill="#dbead7" opacity=".7"/>`;
      for(let i=0;i<=100;i++){const L=max*i/100;flightSamples.push({distanceMM:L,cumulative:-Math.expm1(-L/mean)});}
      body+=`<path d="${flightSamples.map((s,i)=>`${i?'L':'M'}${62+514*s.distanceMM/max} ${Y(s.cumulative)}`).join(' ')}" fill="none" stroke="#277987" stroke-width="2.5"/>`;
      for(let j=0;j<=2;j++)body+=text(62+514*j/2,269,ndFmt(max*j/2),`text-anchor="${j===0?'start':j===2?'end':'middle'}"`);
      body+=`<circle cx="${62+514/8}" cy="${Y(1-Math.exp(-1))}" r="4" fill="#b35b38"/>`;
      $('ndFlightNote').textContent=`Mean lab flight = ${ndFmt(mean)} mm. The orange dot is one mean flight (63.2% cumulative). Green marks the part of the chosen [${ndFmt(ND_S.lminMM)}, ${ndFmt(ND_S.lmaxMM)}] mm window visible on this axis. The table uses the complete window, including any part outside the plot.`;
    } else {body+=text(72,150,p.widthEV===0?'Zero included width; lifetime undefined':'Flight length outside the plotting range');$('ndFlightNote').textContent=p.flight.status+'. Missing channels may still cause decays.';}
    body+=text(305,292,'Flight distance L [mm] at fixed βγ','text-anchor="middle"');
    $('ndFlightPlot').innerHTML=ndSVG('Conditional flight-distance distribution',body,{...meta,samples:flightSamples});
  }
  return {render(r){ring=r;current=ndModel(r,ND_S,NR_CMP.flavour);const p=current.selected;
    for(const [id,key] of [['ndPair','pair'],['ndExtra','extraEV'],['ndBoost','boost'],['ndLmin','lminMM'],['ndLmax','lmaxMM'],['ndChi','chiOverF'],['ndSigma','sigmaOverF']]){
      $(id).value=Number(ND_S[key].toPrecision(6));$(id).title=String(ND_S[key]);
    }
    $('ndMajoron').checked=!!ND_S.majoron;
    $('ndMajoronSummary').textContent=`Calculated Γ(J) = ${ndFmt(p.majoron.sumEV)} eV; F_J = ${ndFmt(current.majoron.geometry.FJGeV)} GeV. ${ND_S.majoron?'Included in lifetime and coherence.':'Not included in the reference scenario.'} Width / nearest pair separation = ${ndFmt(p.widthOverNearestGap)}.`;
    $('ndMajoronRows').innerHTML=`<p>ν + J: ${ndFmt(p.majoron.lightEV)} eV</p>`+p.majoron.cascades.map(c=>`<p>Pair ${c.daughterPair} + J: ${ndFmt(c.widthEV)} eV</p>`).join('');
    $('ndExtraLog').value=ND_S.extraEV>0?Math.max(-12,Math.log10(ND_S.extraEV)):-12;
    $('ndExtraLog').setAttribute('aria-valuetext',ND_S.extraEV===0?'Extra width is zero; move to choose a positive width':ndFmt(ND_S.extraEV)+' eV');
    $('ndExtraNote').textContent=ND_S.extraEV===0?'Extra width is exactly zero. Moving the logarithmic slider selects a positive scenario width.':`Added width: ${ndFmt(ND_S.extraEV)} eV per component, for every pair.`;
    $('ndWidth').textContent=ndFmt(p.widthEV)+' eV';$('ndLifetime').textContent=p.flight.ctauMM===null?'undefined':ndFmt(p.flight.ctauMM)+' mm';
    $('ndSummary').textContent=ndSummary(current);$('ndValidity').textContent=p.issues.join('. ')+(p.issues.length?'. ':'')+'Full ring branching fractions, lifetime and detector classification remain uncomputed.';
    $('ndRows').innerHTML=current.rows.map(r=>`<tr><th>${r.pair}</th>${[r.channelsEV.W,r.channelsEV.Z,r.channelsEV.h,r.widthEV,r.flight.tauSeconds,r.flight.ctauMM,r.coherence.deltaOverGamma,r.coherence.ssOverOS,r.flight.windowProbability].map(v=>`<td class="num">${ndFmt(v)}</td>`).join('')}</tr>`).join('');
    $('ndMissing').textContent=current.missing.join('; ')+'.';
    const cascades=p.weakCascades.filter(c=>c.Zopen||c.hopen);
    $('ndCascades').textContent=cascades.length?`Selected pair: kinematically open heavy-to-heavy two-body thresholds: ${cascades.map(c=>`pair ${c.pair} + ${[c.Zopen?'Z':null,c.hopen?'h':null].filter(Boolean).join('/')}`).join(', ')}. Their rates are not included; threshold availability alone does not fix a coupling.`:'Selected pair: no lower heavy pair plus on-shell Z/h is kinematically accessible. Majoron cascades are calculated separately above; other new channels remain unresolved.';
    figures();return current;
  }};
}
