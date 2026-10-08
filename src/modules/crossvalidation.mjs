/* Conditional matching: edited inputs cannot inherit archived numerical evidence. */
export function cvThermalComparison(parameters,reference){
  if(reference.schema!=='ghu-thermal-crossvalidation-v1'||reference.mode!=='full')return null;
  const row=reference.cases.find(c=>Object.keys(c.parameters).length===Object.keys(parameters).length&&
    Object.entries(c.parameters).every(([k,v])=>Number.isFinite(parameters[k])&&parameters[k]===v));
  if(!row)return null;
  return {schema:reference.schema,record:row,targets:reference.targets,tolerances:reference.tolerances,
    normalization:reference.normalization,criterion:reference.criterion,backend:reference.backend,
    methodScope:reference.methodScope,inputs:reference.inputs,sources:reference.sources,
    physicalUnknowns:reference.physicalUnknowns,scope:reference.scope};
}

export function cvUncertaintyBudget(record,reference){
  if(!record||reference.schema!=='ghu-uncertainty-budget-v1')return null;
  const budget=reference.benchmarks.find(b=>b.row===record.row&&b.seed===record.seed&&
    ['alpha','higgsGeV','compactificationGeV','curvature'].every(k=>
      b.full[k].length===record.full[k].length&&b.full[k].every((x,i)=>x===record.full[k][i])));
  return budget?{schema:reference.schema,record:budget,conventions:reference.conventions,
    measuredW:reference.measuredW,identities:reference.identities,inputs:reference.inputs,
    arithmetic:reference.arithmetic,attribution:reference.attribution,scope:reference.scope}:null;
}
