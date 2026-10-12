/* SVG views of the same computed grid. No fitted data and no animation loop.
 * Interactions are bound to disposable result nodes, preserving the card lifecycle. */
function brxColour(m){const t=Math.max(0,Math.min(1,m/Math.SQRT1_2));return `rgb(${Math.round(237-207*t)},${Math.round(248-143*t)},${Math.round(251-118*t)})`;}
function brxProject(u,v,z,angle){const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [320+245*((u-.5)*c-(v-.5)*s),270+95*((u-.5)*s+(v-.5)*c)-160*z/Math.SQRT1_2];}
function brxLandscapeSVG(r){
 const g=r.landscape,p=r.parameters,n=g.steps,mode=p.viewMode,angle=p.viewAngle;
 const X=a=>90+460*a/g.maxStrength,Y=t=>280-215*t/Math.PI;
 const point=(i,j)=>mode?brxProject(i/n,j/n,g.masses[i][j],angle):[X(g.strengths[i]),Y(g.theta[j])];
 const path=points=>points.map((q,i)=>`${i?'L':'M'}${q[0]} ${q[1]}`).join(' ');
 const label=(x,y,t,extra='')=>`<text x="${x}" y="${y}" ${extra}>${rxEscape(t)}</text>`;
 let body='';
 if(mode){
  const cells=[];for(let i=0;i<n;i++)for(let j=0;j<n;j++)cells.push({i,j,depth:(i+.5)*Math.sin(angle*Math.PI/180)+(j+.5)*Math.cos(angle*Math.PI/180)});
  cells.sort((a,b)=>a.depth-b.depth).forEach(({i,j})=>{const z=(g.masses[i][j]+g.masses[i+1][j]+g.masses[i][j+1]+g.masses[i+1][j+1])/4;
   body+=`<path d="${path([point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)])}Z" fill="${brxColour(z)}" stroke="#34596d" stroke-opacity=".3" stroke-width=".55"><title>Cell mean mR ${rxNumber(z)}; select a mesh node</title></path>`;});
  for(const [axis,name] of [[0,'κ²L'],[1,'θ [rad]'],[2,'mR']]){
   const origin=brxProject(0,0,0,angle),end=brxProject(axis===0?1:0,axis===1?1:0,axis===2?Math.SQRT1_2:0,angle);
   body+=`<path d="${path([origin,end])}" fill="none" stroke="#203b4c" stroke-width="1.7"/>`;
   const amount=axis===0?g.maxStrength:axis===1?Math.PI:Math.SQRT1_2;
   body+=label(end[0]+(axis===1?-20:10),end[1]+(axis===2?-10:25),`${name} · ${rxTick(amount)}`,'font-size="13" text-anchor="middle"');
  }
  const cut=g.theta.map(t=>brxProject(p.strength/g.maxStrength,t/Math.PI,Math.hypot(r.roots[0].kR,t/(2*Math.PI)),angle));
  body+=`<path d="${path(cut)}" fill="none" stroke="#ae411d" stroke-width="3"/>`;
 }else{
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
   const z=(g.masses[i][j]+g.masses[i+1][j]+g.masses[i][j+1]+g.masses[i+1][j+1])/4;
   body+=`<rect x="${X(g.strengths[i])}" y="${Y(g.theta[j+1])}" width="${460/n+.1}" height="${215/n+.1}" fill="${brxColour(z)}"/>`;
  }
  for(let k=0;k<=4;k++){body+=label(X(g.maxStrength*k/4),303,rxTick(g.maxStrength*k/4),'text-anchor="middle"');body+=label(78,Y(Math.PI*k/4)+5,rxTick(Math.PI*k/4),'text-anchor="end"');}
  body+=label(320,328,'Boundary strength κ²L','text-anchor="middle"')+label(90,49,'Imposed θ [rad]');
  body+=`<path d="M${X(p.strength)} 65V280" stroke="#ae411d" stroke-width="2.5" stroke-dasharray="6 3"/>`;
 }
 const selected=mode?brxProject(p.strength/g.maxStrength,p.theta/Math.PI,r.atTheta.paired,angle):[X(p.strength),Y(p.theta)];
 body+=`<circle data-brx-point cx="${selected[0]}" cy="${selected[1]}" r="6" fill="white" stroke="#111" stroke-width="2"/>`;
 for(let i=0;i<100;i++)body+=`<rect x="${165+i*3.1}" y="372" width="3.2" height="13" fill="${brxColour(Math.SQRT1_2*i/99)}"/>`;
 body+=label(155,384,'0','text-anchor="end"')+label(485,384,'0.7071')+label(320,408,'Colour = paired mass mR · fixed linear scale','text-anchor="middle" font-size="13"');
 const title=mode?'3D paired mass surface':'2D paired mass map';
 return `<svg data-brx-map xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 430" role="img" tabindex="0" aria-label="${title}; use controls or arrow keys to select a point" style="width:100%;height:auto;display:block;touch-action:pan-y;cursor:crosshair"><title>${title}</title><metadata>${rxEscape(JSON.stringify({parameters:p,grid:g,selected:r.atTheta}))}</metadata><rect width="640" height="430" fill="white"/><g font-family="Arial,sans-serif" font-size="15" fill="#203b4c">${label(320,23,title,'text-anchor="middle" font-weight="bold"')}${body}</g></svg>`;
}
function brxGramSVG(r){
 const max=Math.max(1,...r.gram.values),width=390;
 let body='';r.gram.values.forEach((value,i)=>{const y=45+i*47,positive=value>r.gram.threshold;
  body+=`<text x="65" y="${y+19}" text-anchor="end">λ${i+1}</text><rect x="85" y="${y}" width="${width}" height="28" rx="3" fill="#edf2f4"/><rect x="85" y="${y}" width="${Math.max(0,value)/max*width}" height="28" rx="3" fill="${positive?'#226b83':'#69757a'}"/><text x="490" y="${y+19}">${rxEscape(rxNumber(value))}</text>`;});
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 250" role="img" aria-label="Gram eigenvalues and numerical rank" style="width:100%;height:auto;display:block"><title>Gram eigenvalues and numerical rank</title><metadata>${rxEscape(JSON.stringify(r.gram))}</metadata><rect width="640" height="250" fill="white"/><g font-family="Arial,sans-serif" font-size="15" fill="#203b4c"><text x="320" y="24" text-anchor="middle">${r.gram.rank} independent directions among 3 profiles</text>${body}<text x="85" y="199">0</text><text x="475" y="199" text-anchor="end">${rxEscape(rxNumber(max))}</text><text x="320" y="223" text-anchor="middle" font-size="13">Eigenvalue · linear scale</text><text x="320" y="242" text-anchor="middle" font-size="13">Unnormalized unit-rectangle profiles</text></g></svg>`;
}
function brxBindPlots(container,r,ctx){
 const card=container.closest?.('.card');if(!card)return;
 if(!card.querySelector('[data-brx-language]')){
  const selector=document.createElement('p');selector.dataset.brxLanguage='';
  selector.innerHTML='<button type="button" class="ghost" data-guide-set-language="en" lang="en">English</button> <button type="button" class="ghost" data-guide-set-language="es" lang="es">Español</button>';
  card.querySelector('h2').after(selector);
 }
 card.querySelectorAll('[data-guide-set-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideSetLanguage===GUIDE_LANGUAGE)));
 container.querySelectorAll('svg').forEach(figure=>{const frame=document.createElement('div');frame.style.cssText='max-width:100%;overflow-x:auto';figure.before(frame);frame.append(figure);figure.style.minWidth='540px';});
 const svg=container.querySelector('[data-brx-map]'),note=container.querySelector('[data-brx-preview]');if(!svg)return;
 let selected=null,drag=false;
 const locate=e=>{
  const q=svg.createSVGPoint();q.x=e.clientX;q.y=e.clientY;const v=q.matrixTransform(svg.getScreenCTM().inverse()),g=r.landscape;
  if(!r.parameters.viewMode){if(v.x<90||v.x>550||v.y<65||v.y>280)return null;return {strength:(v.x-90)/460*g.maxStrength,theta:(280-v.y)/215*Math.PI};}
  let best=null,distance=Infinity;
  for(let i=0;i<=g.steps;i++)for(let j=0;j<=g.steps;j++){const pt=brxProject(i/g.steps,j/g.steps,g.masses[i][j],r.parameters.viewAngle),d=Math.hypot(pt[0]-v.x,pt[1]-v.y);if(d<distance){distance=d;best={strength:g.strengths[i],theta:g.theta[j]};}}
  return distance<20?best:null;
 };
 const preview=e=>{const s=locate(e);if(!s)return;selected=s;const k=brxRobinRoots(s.strength,1)[0].kR,m=Math.hypot(k,s.theta/(2*Math.PI));
  note.textContent=`Selected preview: κ²L = ${rxNumber(s.strength)}, θ = ${rxNumber(s.theta)} rad, paired mR = ${rxNumber(m)}. Release to apply${r.parameters.viewMode?' (nearest mesh node)':''}.`;
  brxLocalize(card);
  const pt=r.parameters.viewMode?brxProject(s.strength/r.landscape.maxStrength,s.theta/Math.PI,m,r.parameters.viewAngle):[90+460*s.strength/r.landscape.maxStrength,280-215*s.theta/Math.PI];
  const dot=svg.querySelector('[data-brx-point]');dot.setAttribute('cx',pt[0]);dot.setAttribute('cy',pt[1]);
 };
 const commit=()=>{if(selected){Object.assign(RX_STATE.boundaryresearch,selected);ctx.refresh();}};
 svg.onpointerdown=e=>{if(!locate(e))return;e.preventDefault();drag=true;svg.setPointerCapture(e.pointerId);preview(e);};
 svg.onpointermove=e=>{if(drag)preview(e);};svg.onpointerup=()=>{if(drag){drag=false;commit();}};
 svg.onpointercancel=()=>{drag=false;selected=null;ctx.refresh();};
 svg.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
  selected={strength:Math.max(0,Math.min(r.landscape.maxStrength,r.parameters.strength+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)*r.landscape.maxStrength/24)),theta:Math.max(0,Math.min(Math.PI,r.parameters.theta+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0)*Math.PI/24))};commit();container.querySelector('[data-brx-map]')?.focus();};
 brxLocalize(card);
}
