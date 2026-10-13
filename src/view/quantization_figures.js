/* Exact data come from gqModel; only SVG coordinates are approximate display values. */
function gqFigures(r){
 const t=gqText,e=gqEsc,d=r.figures,number=s=>{const [a,b='1']=s.split('/');return Number(a)/Number(b);};
 const x=a=>65+(a+3)*49,y=v=>330-(v+3)*46;
 const head=(id,title)=>`<svg id="${id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 405" role="img" aria-label="${e(title)}" style="width:100%;max-width:530px;background:#f6f8fa;color:#203745;font:13px system-ui"><title>${e(title)}</title><rect width="430" height="405" fill="#f6f8fa"/><text x="20" y="25" fill="#203745" font-size="16" font-weight="600">${e(title)}</text>`;
 let lattice=head('gqLatticeSvg',t('Two lattices for the same class','Dos retículas para la misma clase'));
 lattice+=`<text x="20" y="46" fill="#203745">β = ${e(d.current.beta)} · α ↔, δ ↕</text>`;
 for(let k=-3;k<=3;k++)lattice+=`<path d="M${x(k)} 54V330 M65 ${y(k)}H359" stroke="${k===0?'#91a4b2':'#dce4ea'}"/><text x="${x(k)}" y="350" text-anchor="middle" fill="#203745">${k}</text><text x="50" y="${y(k)+4}" text-anchor="end" fill="#203745">${k}</text>`;
 for(const p of d.lattice){const px=x(number(p.alpha)),py=y(number(p.delta)),name=`α=${p.alpha}, δ=${p.delta}: ${p.universal?t('universal and spin','universal y espín'):t('spin only','solo espín')}`;
  lattice+=`<g data-gq-lattice="${e(p.alpha+';'+p.delta)}" tabindex="0" role="button" aria-label="${e(name)}" style="cursor:pointer"><title>${e(name)}</title><circle cx="${px}" cy="${py}" r="10" fill="transparent"/>`+(p.universal?`<path d="M${px} ${py-5}l5 5 -5 5 -5 -5Z" fill="#137b80"/>`:`<circle cx="${px}" cy="${py}" r="4" stroke="#ad671b" fill="#fff5e6" stroke-width="2"/>`)+'</g>';
 }
 const a=number(d.current.alpha),dd=number(d.current.delta),inside=Number.isFinite(a)&&Number.isFinite(dd)&&Math.abs(a)<=3&&Math.abs(dd)<=3;
 if(inside){const xx=x(a),yy=y(dd);lattice+=`<g><title>${e('α='+d.current.alpha+', δ='+d.current.delta)}</title><circle cx="${xx}" cy="${yy}" r="10" fill="none" stroke="#202633" stroke-width="2"/><path d="M${xx-14} ${yy}h28 M${xx} ${yy-14}v28" stroke="#202633" stroke-width="1.5"/></g>`;}
 lattice+=`<text x="20" y="378" fill="#137b80">◆ ${t('Universal + spin','Universal + espín')}</text><text x="232" y="378" fill="#995b17">○ ${t('Spin only','Solo espín')}</text></svg>`;
 let heat=head('gqCocharacterSvg',t('Fractional-period fingerprint','Huella de períodos fraccionarios'));
 heat+=`<text x="20" y="46" fill="#203745">m ↔, n ↕ · Q mod 1</text>`;
 const colors=['#147b80','#ffe2c1','#ffd19b','#ffc077','#eeaa54','#dc9040','#c67829','#ac611b'];
 for(const c of d.cocharacters){const xx=65+(c.m+4)*33,yy=60+(4-c.n)*30,label=`(${c.m},${c.n}): Q=${c.period}; Q mod 1=${c.fractionalPart}`;
  heat+=`<g data-gq-cell="${c.m},${c.n}" tabindex="0" role="button" aria-label="${e(label)}" style="cursor:pointer"><title>${e(label)}</title><rect x="${xx}" y="${yy}" width="31" height="28" rx="3" fill="${colors[c.residueEighths]}"/><text x="${xx+15.5}" y="${yy+18}" text-anchor="middle" font-size="10" fill="${c.integral?'white':'#35230c'}">${e(c.fractionalPart)}</text></g>`;
 }
 for(let k=-4;k<=4;k++)heat+=`<text x="${80.5+(k+4)*33}" y="350" text-anchor="middle" fill="#203745">${k}</text><text x="50" y="${78+(4-k)*30}" text-anchor="end" fill="#203745">${k}</text>`;
 heat+=`<text x="20" y="378" fill="#137b80">0: ${t('integral','integral')}</text><text x="140" y="378" fill="#995b17">≠ 0: ${t('fractional witness','testigo fraccionario')}</text></svg>`;
 return `<p>${t('Both figures use the current exact inputs. Select a lattice point to set α and δ without changing β. Select a cocharacter cell to inspect its full period.','Ambas figuras usan las entradas exactas actuales. Selecciona un punto de la retícula para fijar α y δ conservando β. Selecciona una celda de cocarácter para leer su período completo.')}</p><div style="display:flex;flex-wrap:wrap;gap:16px"><div style="flex:1 1 340px;min-width:0">${lattice}</div><div style="flex:1 1 340px;min-width:0">${heat}</div></div><p id="gqFigurePosition">α=${e(d.current.alpha)}, β=${e(d.current.beta)}, δ=${e(d.current.delta)}. ${!d.lattice.length?t('Nonintegral β: neither lattice has admissible points in this slice.','β no entero: ninguna retícula tiene puntos admisibles en este corte.'):''} ${!inside?t('Current point lies outside the displayed window.','El punto actual queda fuera de la ventana dibujada.'):''}</p><p id="gqCellReadout" aria-live="polite">${t('Select a cell: every color and printed fraction comes from the exact Q value.','Selecciona una celda: cada color y fracción impresa procede del valor exacto de Q.')}</p><p>${t('The 81 cocharacters are a finite window, not a substitute for the universal theorem. SVG positions are approximate; classifications and exported fractions are exact.','Los 81 cocaracteres son una ventana finita; no sustituyen al teorema universal. Las posiciones SVG son aproximadas; las clasificaciones y fracciones exportadas son exactas.')}</p><button id="gqSaveFigures" class="ghost">↓ SVG</button>`;
}
function gqBindFigures(root,r){
 const activate=(el,fn)=>{el.onclick=fn;el.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();fn();}};};
 root.querySelectorAll('[data-gq-lattice]').forEach(el=>activate(el,()=>{const [a,d]=el.dataset.gqLattice.split(';');Object.assign(GQ_STATE,gqLatticePreset(a,d,r.figures.current.beta));GQ_CONTEXT?.refresh();}));
 root.querySelectorAll('[data-gq-cell]').forEach(el=>activate(el,()=>{const [m,n]=el.dataset.gqCell.split(',').map(Number),c=r.figures.cocharacters.find(v=>v.m===m&&v.n===n);document.getElementById('gqCellReadout').textContent=`(m,n)=(${m},${n}); Q=${c.period}; Q mod 1=${c.fractionalPart}.`;}));
 document.getElementById('gqSaveFigures').onclick=()=>{
  const svgs=['gqLatticeSvg','gqCocharacterSvg'].map(id=>document.getElementById(id).innerHTML),meta=gqEsc(JSON.stringify({parameters:r.parameters,figures:r.figures}));
  rxDownload('ghu-quantization-figures.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1290" height="608" viewBox="0 0 860 405"><metadata>${meta}</metadata><g>${svgs[0]}</g><g transform="translate(430,0)">${svgs[1]}</g></svg>`,'image/svg+xml');
 };
}
