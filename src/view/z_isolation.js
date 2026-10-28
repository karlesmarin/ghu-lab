/* Bilingual presentation only; mathematical engine and exact replay are external. */
const ZIS_SPANISH={
 'Test separate boundary questions: spectra, profile independence, parity traces, a restricted tensor condition, matched responses and the neutral sector.':'Examina preguntas de frontera separadas: espectros, independencia de perfiles, trazas con paridad, condición tensorial restringida, respuestas tras matching y sector neutro.',
 'Certified neutral angle':'Ángulo neutro certificado',
 'Choose a certified neutral angle':'Elige un ángulo neutro certificado',
 '6b · Is the light neutral vector mode isolated?':'6b · ¿Está aislado el modo vectorial neutro ligero?',
 'Certified continuous enclosure':'Encierro continuo certificado',
 'Neutral eigenvalue λZ = mZ²L5²':'Autovalor neutro λZ = mZ²L5²',
 'Second active eigenvalue · lower bound':'Segundo autovalor activo · cota inferior',
 'Separation from the rest · lower bound':'Separación respecto al resto · cota inferior',
 'Exact Wilson angle':'Ángulo Wilson exacto',
 'Lower bound':'Cota inferior','Upper bound':'Cota superior',
 'The light mode is positive, simple and isolated within this active block.':'El modo ligero es positivo, simple y aislado dentro de este bloque activo.',
 'This query fixes L5 = L6 = μΩ = μΦ = 1 and η = 0. The neutral angle selector is independent of the fermion landscape controls and the finite scalar stratum.':'Esta consulta fija L5 = L6 = μΩ = μΦ = 1 y η = 0. El selector del ángulo neutro es independiente de los controles del mapa fermiónico y del estrato escalar finito.',
 'Compare exact angles 1/10, 1/5 and 1/4 to see how the mass enclosure and guaranteed separation change. These bounds come from the continuous operator, including its boundary conditions.':'Compara los ángulos exactos 1/10, 1/5 y 1/4 para ver cómo cambian el encierro de masa y la separación garantizada. Estas cotas proceden del operador continuo, incluidas sus condiciones de frontera.',
 'The three decoupled zero directions are retained separately. The table orders eigenvalues only inside the active five-component block.':'Las tres direcciones cero desacopladas se conservan por separado. La tabla ordena autovalores solo dentro del bloque activo de cinco componentes.',
 'Wilson response SZ and RZW: not certified. Do not differentiate the interval endpoints. Vacuum selection, currents and the physical Higgs direction remain open.':'Respuesta Wilson SZ y RZW: sin certificar. No derives los extremos del intervalo. Siguen abiertos la selección del vacío, las corrientes y la dirección física del Higgs.',
 'Download continuous proof and verifier (ZIP)':'Descargar demostración continua y verificador (ZIP)',
 'Save neutral enclosure':'Guardar encierro neutro',
 'Proof, assumptions and replay':'Demostración, hipótesis y repetición',
 'Watch the neutral-sector supplement':'Ver el suplemento del sector neutro',
 'Extract the ZIP and verify with SymPy:':'Descomprime el ZIP y verifica con SymPy:',
 'Existing spectral methods:':'Métodos espectrales existentes:'
};
function zisPresent(r){
 return '<section id="zis_panel" style="scroll-margin-top:300px"><h3>6b · Is the light neutral vector mode isolated?</h3>'+
 '<p><b>Certified continuous enclosure</b> · <span>Exact Wilson angle</span>: θ = '+rxEscape(r.theta)+'</p>'+
 '<p>This query fixes L5 = L6 = μΩ = μΦ = 1 and η = 0. The neutral angle selector is independent of the fermion landscape controls and the finite scalar stratum.</p>'+
 rxTable(['Quantity','Lower bound','Upper bound'],[
 ['Neutral eigenvalue λZ = mZ²L5²',r.lambda_lower,r.lambda_upper],
 ['Second active eigenvalue · lower bound',r.lambda2_lower,'—'],
 ['Separation from the rest · lower bound',r.gap_lower,'—']])+
 '<p><b>The light mode is positive, simple and isolated within this active block.</b></p>'+
 '<p>Compare exact angles 1/10, 1/5 and 1/4 to see how the mass enclosure and guaranteed separation change. These bounds come from the continuous operator, including its boundary conditions.</p>'+
 '<p>The three decoupled zero directions are retained separately. The table orders eigenvalues only inside the active five-component block.</p>'+
 '<p class="note">Wilson response SZ and RZW: not certified. Do not differentiate the interval endpoints. Vacuum selection, currents and the physical Higgs direction remain open.</p>'+
 '<p style="display:flex;gap:8px;flex-wrap:wrap"><button data-zis-export class="ghost">Save neutral enclosure</button><button data-zis-certificate class="primary">Download continuous proof and verifier (ZIP)</button></p>'+
 '<p><a href="'+siteHref('video/neutral/'+(GUIDE_LANGUAGE==='es'?'index-es.html':'index.html'))+'">Watch the neutral-sector supplement</a></p>'+
 '<details><summary>Proof, assumptions and replay</summary><p>Extract the ZIP and verify with SymPy: <code>python verify.py certificate.json --self-test</code></p>'+
 '<p>Existing spectral methods: <a href="https://ems.press/content/serial-article-files/40994">Kuroda, Theorem A</a>; <a href="https://arxiv.org/pdf/1705.10180v1">Vejchodský–Šebestová, §2</a>.</p>'+
 '<pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+rxEscape(ZIS_REFERENCE.proof)+'</pre></details></section>';
}
function zisBind(container,r){
 const panel=container.querySelector('#zis_panel');if(!panel)return;
 panel.querySelector('[data-zis-export]').onclick=()=>rxDownload('neutral-isolation-result.json',JSON.stringify(r,null,2));
 panel.querySelector('[data-zis-certificate]').onclick=()=>rxDownload('neutral-isolation-certificate.zip',Uint8Array.from(atob(ZIS_REFERENCE.base64),x=>x.charCodeAt(0)),'application/zip');
}
