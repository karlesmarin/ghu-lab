/* Extends the existing Same potential? section; no additional navigation entry. */
const HCX_PANEL={
 id:'hypothesiscompare',title:'Hypotheses: local response and experimental context',
 intro:'Explore nine recalibrated GHU cases and a separate CMS measurement. These are independent contexts; this card does not fit those cases to CMS.',
 defaults:hcxDefaults(),validate:hcxValidate,compute:hcxModel,present:hcxPresent,rendered:hcxBindPlots,localize:hcxLocalize,dispose:hcxStopDemo,
 fields:[{key:'case',label:'GHU case',options:HCX_REFERENCE.rows.map(r=>[r.id,`Case ${r.id} · nF=${r.nf}, nV=${r.nv}, cV=${r.cv}`])},
  {key:'region',label:'Potential interval',options:[[0,'Near the vacuum'],[1,'0 to π']]},
  {key:'bin',label:'CMS interval i',options:TT_CMS.abs.bin_low_GeV.map((lo,i)=>[i,`${i+1} · ${lo}–${TT_CMS.abs.bin_high_GeV[i]} GeV`])},
  {key:'other',label:'CMS interval j',options:TT_CMS.abs.bin_low_GeV.map((lo,i)=>[i,`${i+1} · ${lo}–${TT_CMS.abs.bin_high_GeV[i]} GeV`])}],
 source:'<a href="https://arxiv.org/html/2002.09262v3">Funatsu et al. · Table 3</a> · <a href="https://doi.org/10.17182/hepdata.102956.v1/t37">CMS TOP-20-001</a> · <a href="https://doi.org/10.17182/hepdata.102956.v1/t38">Covariance</a>',
 tex:r=>`Archived GHU case ${r.parameters.case}, thetaH=0.1, mH=125.1 GeV: lambda3=${r.selected.l3}, lambda4=${r.selected.l4}. Dominant towers, bottom omitted. CMS is a separate measured spectrum; no observed fit.`
};
RX_RESEARCH_GUIDE.hypothesiscompare={question:'What changes between recalibrated cases, and what does a measured spectrum tell us?',metrics:r=>[['λ₃',r.selected.l3,'GeV'],['λ₄',r.selected.l4,'']],takeaway:()=>hcxText('Numerical reconstruction and measured data have separate provenance. An observed GHU fit is pending.','La reconstrucción numérica y los datos medidos tienen procedencias separadas. El ajuste observado GHU está pendiente.')};
rxAttach(SAMEPOT_SECTION,HCX_PANEL);
