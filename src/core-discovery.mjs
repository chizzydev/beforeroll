/** General source inventory, fixed contracts and read-only projection. No network. */
import {readFileSync} from 'node:fs';
import {planIntelligence} from './intelligence-workflow.mjs';
import {decodeLiteralRequirements,literalHash,literalTaskTitle,strictUtf8} from './literal-requirements.mjs';
import {evaluatePreflight,sourcePointSlice} from './engine.mjs';
import {documentaryPayload,documentaryEligible,decodeDocumentary,DOCUMENTARY_CONTRACT_SHA256} from './documentary-intelligence.mjs';
const specification=JSON.parse(readFileSync(new URL('./literal-extract-contract.json',import.meta.url),'utf8'));
export const discoveryHash=x=>literalHash(JSON.stringify(x));
export const EXTRACT_CONTRACT_SHA256=discoveryHash(specification);
export const extractRequirementPayload=text=>({text,...structuredClone(specification)});
const selected=(ids,available)=>Array.isArray(ids)&&ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>available.includes(id));
export function discoveryPlan(w,{documentIds,sceneIds,verifiedBy,sourceConfirmed,maxCalls,creditBudget,creditReservePerCall,includeDocumentary=false}={}){
 if(typeof includeDocumentary!=='boolean')throw Error('Explicit documentary investigation option required');
 if(!selected(documentIds,w.documents.map(d=>d.id))||!selected(sceneIds,w.callSheet?.scenes.map(s=>s.id)??[]))throw Error('Select current documents and scenes, not individual clauses');
 if(sourceConfirmed!==true||typeof verifiedBy!=='string'||!verifiedBy.trim()||verifiedBy.length>150)throw Error('Named source-identity verification and explicit acknowledgement required; this is not permit authentication');
 if(!Number.isSafeInteger(maxCalls)||maxCalls<1||maxCalls>128||!Number.isFinite(creditBudget)||creditBudget<=0||!Number.isFinite(creditReservePerCall)||creditReservePerCall<=0)throw Error('Use a 1–128 request cap, positive credit budget and positive per-call reserve');
 const full=planIntelligence(w),tasks=full.tasks.filter(t=>documentIds.includes(t.documentId)&&sceneIds.includes(t.sceneId));
 const docs=w.documents.filter(d=>documentIds.includes(d.id)).map(d=>structuredClone(d));
 for(const d of docs)if(!d.importReceipt?.rawHash||d.importReceipt.normalizedHash!==d.sourceHash)throw Error('Import and verify original source identity before discovery');
 const extracts=docs.flatMap(d=>d.units.map(unit=>({id:discoveryHash([d.id,d.sourceHash,d.revision,d.analysisEpoch??0,unit.hash]),documentId:d.id,unitId:unit.id,payload:extractRequirementPayload(unit.text)})));
 const scenes=w.callSheet.scenes.filter(s=>sceneIds.includes(s.id)).map(s=>({id:s.id,epoch:s.sourceEpoch??0,hash:tasks.find(t=>t.sceneId===s.id).sceneHash,row:sourcePointSlice(w.callSheet.text,s.source.start,s.source.end)}));
 const fills=includeDocumentary?docs.flatMap(d=>d.units.filter(u=>documentaryEligible(u.text)).map(unit=>({id:discoveryHash(['documentary-fill-v1',d.id,d.sourceHash,d.revision,d.analysisEpoch??0,unit.hash,scenes,DOCUMENTARY_CONTRACT_SHA256]),documentId:d.id,unitId:unit.id,payload:documentaryPayload(unit.text,scenes)}))):[];
 const worstCaseCalls=tasks.length+extracts.length+fills.length;
 if(worstCaseCalls>maxCalls||worstCaseCalls*creditReservePerCall>creditBudget)throw Error('Plan exceeds authorized request cap or reserved credit budget; select a smaller production scope, never individual clauses');
 const binding={workspaceId:w.id,documents:docs.map(d=>({id:d.id,hash:d.sourceHash,revision:d.revision,epoch:d.analysisEpoch??0,rawHash:d.importReceipt.rawHash})),scenes,taskIds:tasks.map(t=>t.id),extractContract:EXTRACT_CONTRACT_SHA256,...(includeDocumentary?{documentaryContract:DOCUMENTARY_CONTRACT_SHA256,fillIds:fills.map(x=>x.id)}:{})};
 return {schema:'beforeroll-core-discovery-plan-v1',id:discoveryHash(binding),...binding,workspaceRevision:w.revision,
  documentIds:docs.map(d=>d.id),sceneIds:scenes.map(s=>s.id),sources:docs,tasks,extracts,verifiedBy:verifiedBy.trim(),sourceConfirmed:true,
  ...(includeDocumentary?{includeDocumentary:true,fills,maxFillCalls:fills.length}:{}),
  limits:{maxCalls,creditBudget,creditReservePerCall},decideCalls:tasks.length,maxExtractCalls:extracts.length,worstCaseCalls,concurrency:1,
  costWarning:'Owner reserve is not a provider quote or enforceable provider billing cap. Unknown or excessive reported cost stops further calls.',notClearance:true};
}
export function assertDiscoveryFresh(w,p){
 const fresh=discoveryPlan(w,{...p,...p.limits});
 if(fresh.id!==p.id||JSON.stringify(fresh.tasks)!==JSON.stringify(p.tasks)||JSON.stringify(fresh.extracts)!==JSON.stringify(p.extracts)||
  JSON.stringify(fresh.fills)!==JSON.stringify(p.fills)||fresh.sources.some((d,i)=>d.text!==p.sources[i]?.text||JSON.stringify(d.units)!==JSON.stringify(p.sources[i]?.units)))throw Error('STALE_SOURCE_OR_SCENE');return true;
}
export function decodedDocumentary(p,entry){
 const spec=p.fills?.find(x=>x.id===entry.id);if(!spec)throw Error('Unknown documentary intent');const document=p.sources.find(d=>d.id===spec.documentId),unit=document.units.find(u=>u.id===spec.unitId);
 return decodeDocumentary({payload:spec.payload,response:JSON.parse(strictUtf8(Buffer.from(entry.responseBase64,'base64'))),document,unit,requestSha256:entry.requestSha256,responseSha256:entry.receipt.responseSha256});
}
export function decideRouting(response){
 const a=response?.answers,keys=['activity_link','granted_for_scene'];
 if(!a||Object.keys(a).length!==2||!keys.every(k=>a[k]?.type==='noul'&&Number.isFinite(a[k].noul)&&a[k].noul>=0&&a[k].noul<=1)||typeof response.model!=='string'||!response.model)throw Error('INVALID_DECIDE_RESPONSE');
 return a.activity_link.noul>=0.8?'RELEVANT_REVIEW_ONLY':a.activity_link.noul<=0.2?'NO_LINK_DETECTED_NOT_EXONERATION':'AMBIGUOUS_MANUAL_REVIEW';
}
export function decodedExtract(p,entry,origin){
 const spec=p.extracts.find(x=>x.id===entry.id),doc=p.sources.find(x=>x.id===spec.documentId),unit=doc.units.find(x=>x.id===spec.unitId);
 return decodeLiteralRequirements({permitBytes:Buffer.from(doc.text,'utf8'),permitSha256:doc.sourceHash,unit,
  requestBytes:Buffer.from(entry.requestBase64,'base64'),responseBytes:Buffer.from(entry.responseBase64??'','base64'),requestSha256:entry.requestSha256,
  responseSha256:entry.receipt?.responseSha256,receipt:entry.receipt,provenance:origin});
}
/** Deliberately conservative lexical safety fence, never a semantic/authority verdict.
 * It catches explicit scope contradictions; absence of a cue does not establish scope. */
export function scopeCaution(quote,sceneId){
 const named=[...quote.matchAll(/\bScene\s+([\w.-]+)/gi)].map(m=>'S'+m[1]);
 if(named.some(id=>id.toUpperCase()!==sceneId.toUpperCase()))return 'OTHER_OR_MIXED_SCENE_SCOPE_REQUIRES_MANUAL_REVIEW';
 if(/\b(propos(?:al|ed|es)|request(?:ed|s)?|unissued|unsigned|not issued|not approved|suggest(?:ed|ion)|optional)\b/i.test(quote))return 'NARRATIVE_OR_UNISSUED_SCOPE_REQUIRES_MANUAL_REVIEW';
 // A historical object can be the subject of a CURRENT filming requirement.
 // An explicit focal-scene directive keeps validated model facts reviewable;
 // it does not authenticate issuance or turn the task into a fulfilled duty.
 const currentDirective=(!named.length||named.some(id=>id.toUpperCase()===sceneId.toUpperCase()))&&/\b(must|shall|requires?|mandatory)\b/i.test(quote)&&
  !/\b(last (?:year|season)|previous production|reference (?:images|only)|(?:was|were) required|imposes no conditions|shows?|depicts?|recounts?|used to|had to)\b/i.test(quote);
 if(/\b(historical|historically|photographs?|previous production)\b/i.test(quote)&&!currentDirective)return 'NARRATIVE_OR_UNISSUED_SCOPE_REQUIRES_MANUAL_REVIEW';
 return null;
}
export function projectDiscovery(w,jobs=[]){
 const out={schema:'beforeroll-core-discovery-projection-v1',jobs:[],candidates:[],notClearance:true};
 for(const job of [...jobs].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.plan.id.localeCompare(b.plan.id))){
  const p=job.plan;let current=true;try{assertDiscoveryFresh(w,p);}catch{current=false;}
  const entryById=new Map(job.entries.map(e=>[e.id,e]));
  const pairs=p.tasks.map(t=>{const e=entryById.get(t.id),x=p.extracts.find(x=>x.documentId===t.documentId&&x.unitId===t.unitId),ex=entryById.get(x.id);
   let route='UNASSESSED',answer=null;if(e?.status==='ACCEPTED'){answer=JSON.parse(strictUtf8(Buffer.from(e.responseBase64,'base64')));route=decideRouting(answer);}
   const caution=scopeCaution(t.sourceQuote,t.sceneId),literal=ex?.status==='ACCEPTED'?decodedExtract(p,ex,job.origin):null;
   return {taskId:t.id,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,quote:t.sourceQuote,range:t.sourceRange,decideStatus:e?.status??'UNASSESSED',route,
    decideRequestSha256:t.requestHash,decideResponseSha256:e?.receipt?.responseSha256??null,origin:job.origin,relevance:answer?.answers.activity_link.noul??null,modelGrantClaim:answer?.answers.granted_for_scene.noul??null,
    extractStatus:ex?.status??(route==='RELEVANT_REVIEW_ONLY'?'UNASSESSED':'NOT_ROUTED_NOT_PROVEN_IRRELEVANT'),literalFieldStates:literal?.fieldStates??null,scopeCaution:caution,notClearance:true};});
  const accepted=job.entries.filter(e=>e.status==='ACCEPTED'),credits=job.entries.reduce((n,e)=>n+(e.receipt?.credits??0),0);
  const summary={id:p.id,state:job.entries.some(e=>e.status==='IN_FLIGHT')?'IN_FLIGHT_OR_INTERRUPTED_NEVER_RETRY':job.state==='RUNNING'?'RUNNING_OR_INTERRUPTED_NO_RESUME':job.state,current,origin:job.origin,createdAt:job.createdAt,updatedAt:job.updatedAt,stopReason:job.stopReason??null,
   coverage:{pairs:p.tasks.length,assessed:pairs.filter(x=>x.decideStatus==='ACCEPTED').length,unassessed:pairs.filter(x=>x.decideStatus!=='ACCEPTED').length,
    relevant:pairs.filter(x=>x.route==='RELEVANT_REVIEW_ONLY').length,ambiguous:pairs.filter(x=>x.route==='AMBIGUOUS_MANUAL_REVIEW').length,
    extractedUnits:accepted.filter(e=>e.kind==='extract').length,totalUnits:p.extracts.length},pairs,
   attempts:job.entries.length,unknownBilling:job.entries.filter(e=>['IN_FLIGHT','BILLING_UNKNOWN'].includes(e.status)).length,reportedCredits:credits,unknownCreditEntries:job.entries.filter(e=>e.receipt?.credits===null||!e.receipt).length,
   latencyMs:job.entries.reduce((n,e)=>n+(e.receipt?.latencyMs??0),0),notClearance:true,
   ...(p.includeDocumentary?{documentaryCoverage:{inventoriedUnits:p.extracts.length,eligibleUnits:p.fills.length,acceptedUnits:accepted.filter(e=>e.kind==='fill').length,
    skippedUnits:p.extracts.filter(x=>!p.fills.some(f=>f.documentId===x.documentId&&f.unitId===x.unitId)).map(x=>({documentId:x.documentId,unitId:x.unitId,reason:'NO_DOCUMENTARY_ROUTING_CUE_NOT_PROOF_IRRELEVANT'}))},documentaryRecords:accepted.filter(e=>e.kind==='fill').map(e=>decodedDocumentary(p,e))}:{})};
  const candidates=[];if(p.includeDocumentary)summary.quarantinedRequirements=[];
  for(const pair of pairs){
   if(pair.route!=='RELEVANT_REVIEW_ONLY'||pair.scopeCaution)continue;
   const t=p.tasks.find(t=>t.id===pair.taskId),x=p.extracts.find(x=>x.documentId===t.documentId&&x.unitId===t.unitId),e=entryById.get(x.id);
   if(e?.status!=='ACCEPTED')continue;
   const result=decodedExtract(p,e,job.origin);if(result.errors.length)throw Error('Discovery literal evidence failed revalidation');
   for(const fact of result.facts){
    const documentary=summary.documentaryRecords?.find(r=>r.documentId===t.documentId&&r.unitId===t.unitId);
    // Fill identifies a documentary claim/reference. A copied reference is not
    // automatically a presently imposed prerequisite. Preserve it as inquiry.
    if(documentary&&(['request_only','historical_reference','unrelated_or_unclear'].includes(documentary.role)||
     documentary.role==='claims_issued_variation'&&!/\b(must|shall|required|requires?|mandatory|subject to|provided that)\b|only\s+(?:if|when|while|with)/i.test(t.sourceQuote))){
     summary.quarantinedRequirements.push({sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,fact,role:documentary.role,reason:'DOCUMENTARY_CLAIM_OR_REFERENCE_NOT_ESTABLISHED_AS_IMPOSED_REQUIREMENT',notClearance:true});continue;
    }
    const doc=p.sources.find(d=>d.id===t.documentId),binding={productionId:w.id,sceneId:t.sceneId,sceneHash:t.sceneHash,sceneEpoch:p.scenes.find(s=>s.id===t.sceneId).epoch,
     documentId:doc.id,documentRevision:doc.revision,documentEpoch:doc.analysisEpoch??0,permitSha256:doc.sourceHash,unitId:t.unitId,field:fact.field,unitRange:fact.unitRange,permitRange:fact.permitRange,
     requestSha256:fact.requestSha256,responseSha256:fact.responseSha256,decideResponseSha256:entryById.get(t.id).receipt.responseSha256};
    candidates.push({...fact,...binding,id:discoveryHash(binding),title:literalTaskTitle(fact),sourceTaskId:t.id,discoveryId:p.id,
     sourceReviewState:'HUMAN_VERIFICATION_REQUIRED',sourceSelection:'EXHAUSTIVE_UNIT_INVENTORY_THEN_CLOCKED_RELEVANCE',
     applicability:'MODEL_ROUTED_SCOPE_UNVERIFIED',supportCoverage:'INCOMPLETE_OR_UNASSESSED',decideRequestSha256:t.requestHash,
     contextUnitIds:t.contextUnitIds,decideRoutingBasis:pair.route,scopeVerification:'HUMAN_REQUIRED',authenticity:'UNVERIFIED',fulfillment:'UNVERIFIED',notClearance:true});
   }
  }
  for(const record of summary.documentaryRecords??[]){
   // History/unclear classifications remain inspectable records, never duties.
   if(!['claims_issued_variation','request_only'].includes(record.role))continue;
   for(const sceneId of record.sceneIds){
    const doc=p.sources.find(d=>d.id===record.documentId),unit=doc.units.find(u=>u.id===record.unitId),scene=p.scenes.find(s=>s.id===sceneId);
    const named=[...unit.text.matchAll(/\bScene\s+([\w.-]+)/gi)].map(m=>'S'+m[1]);
    if(named.length&&!named.includes(sceneId))continue;
    const t=p.tasks.find(t=>t.documentId===doc.id&&t.unitId===unit.id&&t.sceneId===sceneId),e=entryById.get(p.fills.find(f=>f.documentId===doc.id&&f.unitId===unit.id).id);
    const quote=record.fields.claim_quote,reference=record.fields.referenced_instrument.value;
    const binding={productionId:w.id,sceneId,sceneHash:scene.hash,sceneEpoch:scene.epoch,documentId:doc.id,documentRevision:doc.revision,documentEpoch:doc.analysisEpoch??0,permitSha256:doc.sourceHash,unitId:unit.id,
     field:'documentary_investigation',unitRange:quote.unitRange,permitRange:quote.permitRange,requestSha256:e.requestSha256,responseSha256:e.receipt.responseSha256};
    candidates.push({...binding,id:discoveryHash(binding),title:record.role==='request_only'?'Investigate unissued change request'+(reference?' · '+reference:''):'Verify claimed variation'+(reference?' · locate '+reference:''),
     quote:quote.value,sourceSentence:unit.text,sourceTaskId:t.id,discoveryId:p.id,documentaryRecord:record,category:'DOCUMENTARY_INVESTIGATION_NOT_PREREQUISITE',provenance:job.origin,
     sourceSelection:'AUTOMATIC_DOCUMENTARY_UNIT_ROUTING_THEN_CLOCKED_FILL',sourceReviewState:'HUMAN_VERIFICATION_REQUIRED',issuance:'UNKNOWN',authenticity:'UNVERIFIED',fulfillment:'UNVERIFIED',
     applicability:'MODEL_SUGGESTED_INVESTIGATION_TARGET_NOT_AUTHORITY',supportCoverage:'UNESTABLISHED_REQUIRES_HUMAN_INVENTORY',notClearance:true});
   }
  }
  summary.candidates=candidates.map(c=>({...c,sourceState:current?'CURRENT_REVIEW_ONLY':'HISTORICAL_SOURCE_CHANGED'}));
  summary.comparison={basis:job.origin,aiOff:evaluatePreflight({permitText:p.sources.map(d=>d.text).join('\n'),callSheetText:p.scenes.map(s=>s.row).join('\n'),fields:{}}).findings,
   aiOffLiteralTaskCount:0,modelDerivedTaskCount:candidates.length,humanEffortSeconds:null,semanticAccuracy:'NOT_MEASURED_BY_ENGINEERING_TESTS'};
  out.jobs.push(summary);if(current)out.candidates.push(...candidates);
 }
 return out;
}
export function mergeDiscoverySuggestions(w,recorded,discovery){
 if(!discovery.jobs.length)return recorded;
 const candidates=[...recorded.candidates,...discovery.candidates],seen=new Set();
 const unique=candidates.filter(c=>{const key=JSON.stringify([c.sceneId,c.documentId,c.permitSha256,c.documentEpoch,c.sceneEpoch,c.unitId,c.field,c.unitRange]);if(seen.has(key))return false;seen.add(key);return true;});
 const reviewHistory=recorded.reviewHistory.map(r=>({...r,sourceState:unique.some(c=>c.id===r.candidateId)?'CURRENT_REVIEW_ONLY':'HISTORICAL_SOURCE_CHANGED'}));
 return {...recorded,state:'SOURCE_BOUND_SUGGESTIONS_REVIEW_ONLY',candidates:unique.map(c=>({...c,humanReview:reviewHistory.filter(r=>r.candidateId===c.id).at(-1)??null})),reviewHistory,
  discovery,notice:'Model-assisted proposals, not human-confirmed duties or filming authority.'};
}
