// M3-S5: presentation-only, fail-closed summary of ALREADY source-audited Clocked judgments.
// No document language is classified by a keyword map; no authorization is ever granted.
const TYPES=new Set(['CLOCKED_SEMANTIC_REVIEW','CLOCKED_CONDITIONAL_AUTHORITY_REVIEW','CLOCKED_SEMANTIC_AMBIGUOUS','NO_SEMANTIC_LINK_DETECTED','FORMAT_UNVERIFIED']);
export function modelGrantScope(quote,sceneId){
 const sceneNumber=/^S(\d+)$/.exec(sceneId||'')?.[1];
 const named=[...String(quote??'').matchAll(/\bScene\s+(\d+)\b/gi)].map(m=>m[1]);
 if(sceneNumber && named.length && named.every(n=>n===sceneNumber))return {matched:true,reason:null};
 return {matched:false,reason:named.length?'Named scene does not exclusively match this scene':'No explicit scene scope in this clause'};
}
function brief(r){return {index:r.index,quote:r.clause,range:[...r.range],requestHash:r.requestHash,relevance:r.finding.relevance,grant:r.finding.grant,code:r.finding.code};}
export function sceneAuthoritySummary(bound){
 if(!bound)return {status:'NOT_EVALUATED',headline:'Awaiting Clocked assessment',detail:'No source-bound Clocked scene assessment exists. Missing findings never imply permission.',restriction:null,grant:null,additional:[],missing:[],modelOrigin:'NONE',notClearance:true};
 if(bound.notClearance!==true||!['live','recorded'].includes(bound.origin)||!Array.isArray(bound.checked)||!Number.isInteger(bound.candidates)||!Number.isInteger(bound.attempts)||bound.attempts<bound.checked.length||bound.checked.length>bound.candidates)throw Error('Invalid source-audited Clocked summary contract');
 for(const r of bound.checked)if(!TYPES.has(r?.finding?.code)||r.notClearance!==true||!Array.isArray(r.range)||typeof r.clause!=='string'||!/^[a-f0-9]{64}$/.test(r.requestHash||''))throw Error('Invalid audited clause for summary');
 const items=bound.checked;
 const restrictions=items.filter(r=>r.finding.code==='CLOCKED_SEMANTIC_REVIEW').map(brief);
 const modelGrants=items.filter(r=>r.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW').map(brief);
 const uncertain=items.filter(r=>['CLOCKED_SEMANTIC_AMBIGUOUS','FORMAT_UNVERIFIED'].includes(r.finding.code)).map(brief);
 // A per-clause model grant score is not an exception to a DIFFERENT clause's restriction.
 // Promote it into the scene-scoped variation slot only with documentary evidence
 // explicitly and unambiguously naming the current scene. This is a scope fence,
 // NOT keyword classification of activities or a substitute for signer verification.
 // Broad location consent remains visible as a model-positive claim for human review.
 const scoped=[],unverified=[];
 for(const g of modelGrants){
  const scope=modelGrantScope(g.quote,bound.sceneId);
  if(scope.matched)scoped.push(g);
  else unverified.push({...g,scopeReason:scope.reason});
 }
 const restriction=restrictions[0]||null,grant=scoped[0]||null;
 const additional=[...restrictions.slice(1).map(r=>({kind:'ADDITIONAL_RELEVANT_CLAUSE',...r})),
  ...scoped.slice(1).map(r=>({kind:'ADDITIONAL_SCENE_SCOPED_MODEL_GRANT',...r})),
  ...unverified.map(r=>({kind:'MODEL_GRANT_SCOPE_UNVERIFIED',...r})),
  ...uncertain.map(r=>({kind:'UNRESOLVED_SCOPE',...r}))];
 const missing=[];
 if(bound.coverageWarning)missing.push('Source candidates omitted or incomplete; review original document manually.');
 if(!bound.complete)missing.push('Clocked evaluation incomplete; no missing answers may be inferred.');
 if(scoped.length)missing.push('Confirm signer authority, document authenticity, exact scene/date/location and every conditional prerequisite with a responsible human.');
 if(unverified.length)missing.push('A model-positive documentary grant lacks unambiguous scene-specific scope; it is NOT an exception to any activity-specific restriction. Verify issued scope and precedence manually.');
 if(restrictions.length&&!scoped.length)missing.push('No scene-scoped documentary variation established among evaluated source candidates; this does NOT prove a grant does not exist elsewhere.');
 if(additional.length)missing.push('Additional or ambiguous clauses may concern a separate request, scope or extension; do not call them proven violations.');
 let status,headline,detail;
 if(!bound.complete){status='PARTIAL_ASSESSMENT';headline='Incomplete scene assessment';detail='The live assessment stopped early. All unanswered clauses and authority questions remain unresolved.';}
 else if(grant&&restriction){status='RESTRICTION_AND_CONDITIONAL_GRANT';headline='Restriction and possible conditional variation';detail='Clocked found an activity-related condition and a separate clause describing a possible documentary grant. Neither authenticity nor fulfillment of prerequisites has been established.';}
 else if(grant){status='CONDITIONAL_GRANT_REVIEW';headline='Possible conditional documentary grant';detail='Clocked identified a scene-related grant statement. It is not proof of effective authorization, authentic signatures or completed requirements.';}
 else if(restriction){status='CONDITION_REVIEW_NO_GRANT';headline='Related condition; no documented grant established here';detail='Clocked found a potentially applicable source condition, but no scene-specific grant among the evaluated clauses. This is neither a proven violation nor proof that no other grant exists.';}
 else if(uncertain.length){status='UNRESOLVED_SCOPE';headline='Source relationship remains uncertain';detail='The assessed clauses do not support a dependable semantic conclusion. Human review required.';}
 else {status='NO_LINK_IN_SEGMENTED_CANDIDATES';headline='No linked condition in assessed candidates';detail='No relevant semantic relationship was established in this bounded scan. This does not establish unrestricted filming permission.';}
 return {status,headline,detail,restriction,grant,additional,missing,counts:{tested:items.length,total:bound.candidates,related:restrictions.length,grants:modelGrants.length,uncertain:uncertain.length},modelOrigin:bound.origin.toUpperCase(),notClearance:true};
}
export function authoritySummaryForDossier(summary){
 if(summary.notClearance!==true)throw Error('Summary must retain no-clearance guarantee');
 const lines=[`Scene authority state: ${summary.status}`,`Interpretation: ${summary.headline}. ${summary.detail}`,`Clocked execution provenance: ${summary.modelOrigin}`];
 if(summary.restriction)lines.push(`Relevant source condition: Clause ${summary.restriction.index} [${summary.restriction.range.join(',')}) "${summary.restriction.quote}" (model relevance ${summary.restriction.relevance}; original request ${summary.restriction.requestHash})`);
 if(summary.grant)lines.push(`Potential documentary variation: Clause ${summary.grant.index} [${summary.grant.range.join(',')}) "${summary.grant.quote}" (model grant ${summary.grant.grant}; original request ${summary.grant.requestHash})`);
 for(const other of summary.additional)lines.push(`Additional clause requiring scope review (${other.kind}): Clause ${other.index} "${other.quote}"${other.kind==='MODEL_GRANT_SCOPE_UNVERIFIED'?` (model grant ${other.grant}; ${other.scopeReason}; NOT a scene-scoped exception; request ${other.requestHash})`:''}`);
 for(const m of summary.missing)lines.push(`Outstanding human verification: ${m}`);
 lines.push('NO filming clearance or verified permit authority inferred.');
 return lines;
}
