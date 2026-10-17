/* Certified instances only: no unverified imports or arbitrary parameter solver. */
const GMR_SPANISH={
 'Boundary research: spectra, profiles, anomalies and certified response':'Investigación de fronteras: espectros, perfiles, anomalías y respuesta certificada',
 'Test five separate boundary questions: a flat fermion gap, profile independence, parity-inserted traces, a restricted tensor condition and certified response differences after matching.':'Examina cinco preguntas de frontera separadas: brecha fermiónica plana, independencia de perfiles, trazas con paridad, condición tensorial restringida y diferencias certificadas de respuesta tras matching.',
 'Certified response query':'Sonda de respuesta certificada','Choose a certified response query':'Elige una sonda de respuesta certificada',
 'Certified response intervals':'Intervalos de respuesta certificados','Certified ΔC lower bound':'Cota inferior certificada de ΔC',
 'Matched profiles: downloadable proof and certificate':'Perfiles tras matching: demostración y certificado descargables',
 '5 · Do the profiles remain distinguishable after matching?':'5 · ¿Siguen distinguiéndose los perfiles después del matching?',
 'Compare uniform and triangular layers with the same source, pole s = 0.01 and residue R = 0.5.':'Compara capas uniforme y triangular con la misma fuente, polo s = 0,01 y residuo R = 0,5.',
 'Certified t = 1/4':'Certificado t = 1/4','Certified t = 1/2':'Certificado t = 1/2',
 'Difference enclosed away from zero for the declared model.':'Diferencia acotada sin incluir cero para el modelo declarado.',
 'Written proof and independently checked computational certificate; no Lean formalization.':'Demostración escrita y certificado computacional comprobado independientemente; sin formalización Lean.',
 'Quantity':'Magnitud','Enclosing interval':'Intervalo de cota','Uniform C':'C uniforme','Triangular C':'C triangular',
 'Uniform minus triangular':'Uniforme menos triangular','Matching coefficients and certificate':'Coeficientes de matching y certificado',
 'Profile':'Perfil','Uniform layer':'Capa uniforme','Triangular layer':'Capa triangular',
 'Outward-rounded decimal endpoints, also checked by the certificate verifier.':'Extremos decimales redondeados hacia fuera, también comprobados por el verificador del certificado.',
 'Save certified result':'Guardar resultado certificado','Download proof and certificate (ZIP)':'Descargar demostración y certificado (ZIP)',
 'Only these two certified queries are admitted. Other parameters require a new independently verified certificate.':'Solo se admiten estas dos sondas certificadas. Otros parámetros requieren un nuevo certificado verificado independientemente.',
 'The ZIP contains the functional proof, exact polynomial witnesses, displayed results and a standalone Sage verifier. Extract it and run:':'El ZIP contiene la demostración funcional, testigos polinómicos exactos, resultados mostrados y un verificador Sage autónomo. Descomprímelo y ejecuta:',
 'Declared quadratic model; this does not certify full GHU, an experimental fit or a thin-layer rate.':'Modelo cuadrático declarado; esto no certifica la GHU completa, un ajuste experimental ni una tasa de capa delgada.',
 'Model, proof and limits':'Modelo, demostración y límites',
 'Right/bottom traces vanish.':'Las trazas derecha e inferior se anulan.',
 'Profile matching: written proof and independently replayed certificate in section 5.':'Matching de perfiles: demostración escrita y certificado repetido independientemente en la sección 5.'
};
function gmrCurrent(){return gmrModel({probe:RX_STATE.boundaryresearch?.matchedProbe??0});}
function gmrInterval(pair){return '['+pair.join(', ')+']';}
function gmrPresent(snapshot){
 const {parameters:p,result:r}=snapshot;
 if(!r)throw Error('No admitted certificate for these inputs');
 return '<section id="gmr_panel" style="scroll-margin-top:150px"><h3>5 · Do the profiles remain distinguishable after matching?</h3>'+
 '<p>Compare uniform and triangular layers with the same source, pole s = 0.01 and residue R = 0.5.</p>'+
 '<p>ε = 1/8; α = 1/20; c = 38; kL = 2; kT = 8; t = '+rxEscape(p.t)+'.</p>'+
 
 '<div data-gmr-result><p><b>Difference enclosed away from zero for the declared model.</b></p>'+
 '<details open><summary>Certified response intervals</summary>'+rxTable(['Quantity','Enclosing interval'],[['Uniform C',gmrInterval(r.profiles[0].report.response)],['Triangular C',gmrInterval(r.profiles[1].report.response)],['Uniform minus triangular',gmrInterval(r.comparison.difference_a_minus_b)]])+'</details>'+
 '<p>Outward-rounded decimal endpoints, also checked by the certificate verifier.</p></div>'+
 '<p>Written proof and independently checked computational certificate; no Lean formalization.</p>'+
 '<p style="display:flex;gap:8px;flex-wrap:wrap"><button data-gmr-export class="ghost">Save certified result</button><button data-gmr-certificate class="primary">Download proof and certificate (ZIP)</button></p>'+
 '<details><summary>Matching coefficients and certificate</summary>'+
 rxTable(['Profile','κ','ζ'],r.profiles.map(x=>[x.profile==='uniform'?'Uniform layer':'Triangular layer',gmrInterval(x.matching.kappa),gmrInterval(x.matching.zeta)]))+
 '<p>Sage '+rxEscape(GMR_CERTIFICATE.sage_version)+' · '+GMR_CERTIFICATE.checks+' checks.</p>'+
 '<p style="overflow-wrap:anywhere">SHA-256 (ZIP): '+GMR_CERTIFICATE.sha256+'</p></details>'+
 '<details><summary>Model, proof and limits</summary>'+
 '<p>Only these two certified queries are admitted. Other parameters require a new independently verified certificate.</p>'+
 '<p>The ZIP contains the functional proof, exact polynomial witnesses, displayed results and a standalone Sage verifier. Extract it and run: <code>sage -python verify.py receipt.json</code></p>'+
 '<p>Ω = (0,1)²; A = ∫Ω |∇u|²/c + ∫L |u′|²/w + ∫T |u′|²/kT; B = ∫Ω u²/c + ∫L u²/kL + ∫T u²/kT. w = 2 + α fε on L; q = u(0,1) = 1. Right/bottom traces vanish. D(t) = min(A−tB), F = t/D; Q = F(t) − F(s) − (t−s)F′(s); C = −1/[(t−s)/R + Q].</p>'+
 '<p>Declared quadratic model; this does not certify full GHU, an experimental fit or a thin-layer rate.</p></details></section>';
}
function gmrBind(container,snapshot,ctx){
 const panel=container.querySelector('#gmr_panel');if(!panel)return;
 let active=true;
 panel.querySelector('[data-gmr-export]').onclick=()=>{
  if(!active)return;const r=snapshot.result;
  rxDownload('matched-profile-result.json',JSON.stringify({...r,certificate:{sha256:GMR_CERTIFICATE.sha256,checks:GMR_CERTIFICATE.checks,sage_version:GMR_CERTIFICATE.sage_version}},null,2));
 };
 panel.querySelector('[data-gmr-certificate]').onclick=()=>rxDownload('matched-profile-certificate.zip',Uint8Array.from(atob(GMR_CERTIFICATE.base64),c=>c.charCodeAt(0)),'application/zip');
 return ()=>{active=false;};
}
