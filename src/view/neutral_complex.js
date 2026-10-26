/* Scoped bilingual view; arithmetic identities are in the downloadable proof. */
const NCX_SPANISH={
 "Exact neutral stratum": "Estrato neutro exacto",
 "Generic: s ≠ 0": "Genérico: s ≠ 0",
 "Restored: s = 0": "Restaurado: s = 0",
 "Choose an exact neutral stratum": "Elige un estrato neutro exacto",
 "6 · How many closed classes remain after removing gauge directions?": "6 · ¿Cuántas clases cerradas quedan al retirar las direcciones gauge?",
 "Finite complex": "Complejo finito",
 "Gauge directions · rank M": "Direcciones gauge · rango M",
 "Closed directions · dim ker A": "Direcciones cerradas · dim ker A",
 "Gauge stabilizer · dim ker M": "Estabilizador gauge · dim ker M",
 "Remaining classes · dim(ker A/im M)": "Clases restantes · dim(ker A/im M)",
 "Exact stratum": "Estrato exacto",
 "Dimension": "Dimensión",
 "The exact stratum is selected independently of the numerical Wilson slider. No tolerance decides whether s is zero.": "El estrato exacto se selecciona independientemente del deslizador numérico de Wilson. Ninguna tolerancia decide si s es cero.",
 "For this specified finite complex, all five closed directions are gauge.": "En este complejo finito concreto, las cinco direcciones cerradas son gauge.",
 "For this specified finite complex, one closed class remains. The gauge stabilizer also has dimension one; it is a different space.": "En este complejo finito concreto queda una clase cerrada. El estabilizador gauge también tiene dimensión uno; es un espacio distinto.",
 "The quotient can represent continuous scalar zero modes only after a separate proof of domain reduction. This certificate gives no Higgs mass or full GHU spectrum.": "El cociente puede representar modos cero escalares continuos solo tras demostrar por separado la reducción del dominio. Este certificado no proporciona una masa del Higgs ni el espectro GHU completo.",
 "Exact matrices and rank witnesses": "Matrices exactas y testigos de rango",
 "Save finite result": "Guardar resultado finito",
 "Download finite proof and verifier (ZIP)": "Descargar demostración finita y verificador (ZIP)",
 "Extract the ZIP and replay with SymPy:": "Descomprime el ZIP y repite la verificación con SymPy:",
 "Written proof": "Demostración escrita",
 "Test six separate boundary questions: spectra, profile independence, parity traces, a restricted tensor condition, matched responses and a finite neutral quotient.": "Examina seis preguntas de frontera separadas: espectros, independencia de perfiles, trazas con paridad, condición tensorial restringida, respuestas tras matching y un cociente neutro finito."
};
function ncxPresent(r){
 const d=NCX_REFERENCE.certificate;
 return '<section id="ncx_panel" style="scroll-margin-top:300px"><h3>6 · How many closed classes remain after removing gauge directions?</h3>'+
 '<p>Finite complex: ℂ⁵ → M → ℂ⁷ → A → ℂ². <b>Exact stratum: '+rxEscape(r.condition)+'</b>.</p>'+
 '<p>The exact stratum is selected independently of the numerical Wilson slider. No tolerance decides whether s is zero.</p>'+
 rxTable(['Quantity','Dimension'],[['Closed directions · dim ker A',r.kernelA],['Gauge directions · rank M',r.rankM],['Gauge stabilizer · dim ker M',r.kernelM],['Remaining classes · dim(ker A/im M)',r.quotient]])+
 '<p><b>'+(r.quotient?'For this specified finite complex, one closed class remains. The gauge stabilizer also has dimension one; it is a different space.':'For this specified finite complex, all five closed directions are gauge.')+'</b></p>'+
 '<p class="note">The quotient can represent continuous scalar zero modes only after a separate proof of domain reduction. This certificate gives no Higgs mass or full GHU spectrum.</p>'+
 '<p style="display:flex;gap:8px;flex-wrap:wrap"><button data-ncx-export class="ghost">Save finite result</button><button data-ncx-certificate class="primary">Download finite proof and verifier (ZIP)</button></p>'+
 '<details><summary>Exact matrices and rank witnesses</summary><pre>'+rxEscape('A =\n'+d.A.map(x=>x.join('  ')).join('\n')+'\nM =\n'+d.M.map(x=>x.join('  ')).join('\n'))+'</pre>'+
 '<p>AM = 0; det A[0,2] = 1; det M[0,1,3,4,6] = −s; det M[0,1,4,6;1,2,3,4] = 1.</p>'+
 '<p>Mq = −s h; Ah = 0; wM = 0 (s = 0); wh = 1.</p>'+
 '<p>q = (1,0,0,−1/2,0); h = (0,0,0,1,0,0,0); w = (0,−c,0,1,0,0,0).</p>'+
 '<p>Extract the ZIP and replay with SymPy: <code>python verify.py certificate.json</code></p></details>'+
 '<details><summary>Written proof</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+rxEscape(NCX_REFERENCE.proof)+'</pre></details></section>';
}
function ncxBind(container,r){
 const panel=container.querySelector('#ncx_panel');if(!panel)return;
 panel.querySelector('[data-ncx-export]').onclick=()=>rxDownload('neutral-complex-result.json',JSON.stringify(r,null,2));
 panel.querySelector('[data-ncx-certificate]').onclick=()=>rxDownload('neutral-complex-certificate.zip',Uint8Array.from(atob(NCX_REFERENCE.base64),x=>x.charCodeAt(0)),'application/zip');
}
