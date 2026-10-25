/** Documentary authority synthesis: source/scene scope, claimed issuance,
 * operative documentary links and outstanding obligations in ONE read-only projection.
 * Not legal advice, permission, document authentication or AI truth inference.
 * No free-text regex is used to infer authorization or supersession.
 */
import {projectSceneAuthority} from './scene-authority.mjs';
import {projectAuthorityGraph} from './document-authority.mjs';
import {projectOperations} from './production-operations.mjs';
const fold=x=>x.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
const matches=(asserted,observed)=>asserted===null?'UNREVIEWED':fold(asserted)===fold(observed)?'MATCH':'MISMATCH';
const snapAll=(fn)=>{const entries=[];for(let offset=0;;offset+=100){const page=fn(offset);entries.push(...page.records??page.links);if(!page.pagination.hasMore)break;}return entries;};
function sourceState(s,doc,related,operations){
 if(s.sourceState!=='CURRENT_UNVERIFIED')return 'STALE_ORIGINAL_EVIDENCE';
 if(!doc?.metadata)return 'DOCUMENT_PROVENANCE_NOT_REVIEWED';
 if(!s.applicability)return 'HUMAN_SCOPE_NOT_STRUCTURED';
 if(s.kind==='REQUEST_NOT_GRANTED'||doc.metadata.role==='REQUEST'||s.applicability.issuance==='REQUEST_ONLY')return 'REQUEST_ONLY_NOT_ISSUED';
 if(s.kind==='CONDITIONAL_GRANT_CLAIM'&&s.applicability.issuance!=='DOCUMENT_CLAIMS_ISSUED')return 'ISSUANCE_NOT_ESTABLISHED';
 return 'CURRENT_HUMAN_ASSERTION_NOT_AUTHENTICATED';
}
function scopeForScene(a,scene,operation){
 if(!a)return {state:'STRUCTURED_SCOPE_NOT_REVIEWED',activity:'UNREVIEWED',location:'UNREVIEWED',date:'UNREVIEWED'};
 const activity=matches(a.activity,scene.activity),location=matches(a.location,scene.location);
 let date='UNREVIEWED';
 if(a.validFrom!==null&&a.validThrough!==null){
  if(operation?.scheduleState!=='DATED_HUMAN_PLAN_NOT_AUTHORITY')date='SCENE_DATE_NOT_REVIEWED';
  else{
   const start=operation.startUtc,end=operation.endUtc;
   // Authoritative scope would require interpreting legal time zones and boundaries.
   // Keep the result CONDITIONAL on the human-recorded LOCAL scene dates.
   const latest=operation.scheduleDate??null;
   date=latest===null?'SCENE_DATE_NOT_REVIEWED':latest>=a.validFrom&&operation.scheduleEndDate<=a.validThrough?'MATCH':'MISMATCH';
  }
 }
 const fields=[activity,location,date];
 const state=fields.includes('MISMATCH')?'OUTSIDE_RECORDED_SCOPE':fields.every(x=>x==='MATCH')?'MATCHES_HUMAN_RECORDED_FACETS':'SCOPE_REQUIRES_HUMAN_REVIEW';
 return {state,activity,location,date,reviewedWindow:a.validFrom&&a.validThrough?{from:a.validFrom,through:a.validThrough}:null};
}
/** Use the exact persisted source and current schedules; never derive a grant from probabilities. */
export function projectDocumentaryReasoning(w,{asOf=new Date().toISOString(),modelRecords=[]}={}){
 if(!Array.isArray(modelRecords))throw Error('Audited model task records must be an array');
 const claims=snapAll(offset=>projectSceneAuthority(w,{offset,limit:100}));
 const links=snapAll(offset=>projectAuthorityGraph(w,{offset,limit:100}));
 const graph=projectAuthorityGraph(w),ops=projectOperations(w,{asOf});
 const documents=new Map(graph.documents.map(x=>[x.id,x]));
 const operations=new Map(ops.scenes.map(x=>[x.sceneId,x]));
 const schedules=new Map(ops.schedules.filter(x=>x.sourceState==='CURRENT_HUMAN_DATED').map(x=>[x.sceneId,x]));
 const conditions=new Map(ops.conditions.map(x=>[x.id,x]));
 const byId=new Map(claims.map(x=>[x.id,x]));
 const scenes=(w.callSheet?.scenes??[]).map(scene=>{
  const claimsHere=claims.filter(c=>c.sceneId===scene.id);
  const current=claimsHere.filter(c=>c.sourceState==='CURRENT_UNVERIFIED');
  const restrictions=current.filter(c=>c.kind==='RESTRICTION');
  const requests=current.filter(c=>c.kind==='REQUEST_NOT_GRANTED');
  const requirements=current.filter(c=>c.kind==='REQUIREMENT');
  const conflicts=current.filter(c=>c.kind==='CONFLICT_OR_UNCERTAIN');
  const schedule=schedules.get(scene.id);
  const operation=operations.get(scene.id);
  const scopedOperation={...operation,scheduleDate:schedule?.date??null,scheduleEndDate:schedule?.endDate??null};
  const rows=claimsHere.map(c=>{
   const doc=documents.get(c.documentId);
   const applicable=scopeForScene(c.applicability,scene,scopedOperation);
   const source=sourceState(c,doc,links,ops);
   const related=(c.applicability?.relatedRestrictionIds??[]).map(id=>{
    const reference=byId.get(id);
    return {id,active:reference?.kind==='RESTRICTION'&&reference.sceneId===scene.id&&reference.sourceState==='CURRENT_UNVERIFIED',documentId:reference?.documentId??null};
   });
   const linked=(c.applicability?.conditionIds??[]).map(id=>{
    const entry=conditions.get(id);
    return {id,status:entry?.sourceState==='CURRENT_HUMAN_CLAIM'?entry.decision:'SOURCE_CHANGED_OR_MISSING',sourceState:entry?.sourceState??'MISSING',reviewerDecisionIsNotAuthority:true};
   });
   const connectingLinks=links.filter(l=>l.status==='HUMAN_ASSERTED_UNVERIFIED'&&
     ['AMENDS','SUPERSEDES'].includes(l.kind)&&l.fromId===c.documentId&&related.some(r=>r.documentId===l.toId&&r.active));
   const documentaryConnection=connectingLinks.length?'CURRENT_HUMAN_ASSERTED_AMENDMENT_LINK':'NO_CURRENT_AMENDMENT_LINK_TO_RESTRICTION';
   const conflictingLinks=links.filter(l=>l.status==='HUMAN_ASSERTED_UNVERIFIED'&&l.kind==='CONFLICTS_WITH'&&
     (l.fromId===c.documentId||l.toId===c.documentId||related.some(r=>r.documentId===l.fromId||r.documentId===l.toId)));
   const issuanceDate=doc?.metadata?.issuedOn??null;
   const issuanceChronology=issuanceDate===null?'ISSUED_DATE_UNREVIEWED':schedule?.date===undefined?'SCENE_DATE_UNREVIEWED':issuanceDate>schedule.date?'ISSUED_AFTER_SCENE':'CLAIMED_DOCUMENT_DATE_PRECEDES_SCENE';
   const modelHits=modelRecords.filter(t=>t.sceneId===scene.id&&t.documentId===c.documentId&&t.unitId===c.unitId&&t.modelState==='COMPLETE'&&t.model).map(t=>({taskId:t.id,requestHash:t.requestHash,code:t.model.code,relevance:t.model.relevance,grant:t.model.grant,origin:t.modelOrigin,notAuthority:true}));
   const evidenceClass=modelHits.length?'HUMAN_AND_CLOCKED_SEPARATE_CLAIMS':'HUMAN_ASSERTION_ONLY';
   let assertionState='HUMAN_REVIEW_REQUIRED';
   if(c.sourceState!=='CURRENT_UNVERIFIED')assertionState='HISTORICAL_NOT_CURRENT';
   else if(c.kind==='REQUEST_NOT_GRANTED'||doc?.metadata?.role==='REQUEST'||c.applicability?.issuance==='REQUEST_ONLY')assertionState='REQUEST_NOT_ISSUED';
   else if(c.kind==='CONDITIONAL_GRANT_CLAIM'){
    const prerequisiteMode=c.applicability?.prerequisiteMode??'NOT_REVIEWED';
    const outstanding=prerequisiteMode==='NOT_REVIEWED'||prerequisiteMode==='LINKED_CONDITIONS'&&linked.some(x=>x.status!=='HUMAN_CONFIRMED_NOT_AUTHORITY');
    if(source!=='CURRENT_HUMAN_ASSERTION_NOT_AUTHENTICATED'||doc?.metadata?.role!=='AMENDMENT')assertionState='GRANT_ISSUANCE_OR_DOCUMENT_ROLE_UNREVIEWED';
    else if(issuanceChronology!=='CLAIMED_DOCUMENT_DATE_PRECEDES_SCENE')assertionState='GRANT_ISSUANCE_CHRONOLOGY_REQUIRES_REVIEW';
    else if(c.scope!=='EXACT_SCENE')assertionState='GRANT_EXACT_SCENE_SCOPE_NOT_ATTESTED';
    else if(applicable.state==='OUTSIDE_RECORDED_SCOPE')assertionState='GRANT_OUTSIDE_RECORDED_ACTIVITY_LOCATION_OR_DATE';
    else if(applicable.state!=='MATCHES_HUMAN_RECORDED_FACETS')assertionState='GRANT_SCOPE_NOT_ESTABLISHED';
    else if(!related.length||related.some(x=>!x.active)||!connectingLinks.length)assertionState='GRANT_NOT_LINKED_TO_CURRENT_RESTRICTION';
    else if(conflictingLinks.length)assertionState='DOCUMENTARY_CONFLICT_NO_PRECEDENCE_INFERRED';
    else if(outstanding||operation?.openPrerequisites)assertionState='GRANT_PREREQUISITES_OUTSTANDING_OR_UNREVIEWED';
    else assertionState='DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED';
   } else if(c.kind==='RESTRICTION')assertionState=applicable.state==='OUTSIDE_RECORDED_SCOPE'?'RESTRICTION_RECORDED_OUTSIDE_SCOPE':'RESTRICTION_RECORDED_FOR_HUMAN_REVIEW';
   return {id:c.id,sceneId:scene.id,documentId:c.documentId,unitId:c.unitId,documentRole:doc?.metadata?.role??null,
    quote:c.quote,range:c.range,kind:c.kind,sourceState:c.sourceState,issuance:c.applicability?.issuance??'NOT_REVIEWED',
    assertionState,applicable,prerequisiteMode:c.applicability?.prerequisiteMode??'NOT_REVIEWED',linkedConditions:linked,
    relatedRestrictions:related,documentaryConnection,connectingLinkIds:connectingLinks.map(l=>l.id),conflictingLinkIds:conflictingLinks.map(l=>l.id),issuanceChronology,evidenceClass,modelHits,
    reviewer:c.reviewer,reason:c.reason,notClearance:true};
  });
  // Current Clocked-only tasks are separately visible: absence of a human scope
  // claim must never turn a model-positive result into a documented grant.
  const currentHumanUnits=new Set(current.map(x=>`${x.documentId}\u0000${x.unitId}`));
  const modelOnly=modelRecords.filter(t=>t.sceneId===scene.id&&t.modelState==='COMPLETE'&&t.model&&
    !currentHumanUnits.has(`${t.documentId}\u0000${t.unitId}`)).map(t=>({taskId:t.id,documentId:t.documentId,unitId:t.unitId,
     code:t.model.code,grant:t.model.grant??null,relevance:t.model.relevance??null,requestHash:t.requestHash,
     evidenceClass:'CLOCKED_ONLY_NO_HUMAN_DOCUMENTARY_ASSERTION',notAuthority:true}));
  const requestOnly=rows.filter(x=>x.assertionState==='REQUEST_NOT_ISSUED');
  const potentialIssued=rows.filter(x=>x.kind==='CONDITIONAL_GRANT_CLAIM'&&x.sourceState==='CURRENT_UNVERIFIED');
  const scopeBlocked=potentialIssued.filter(x=>x.assertionState!=='DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED');
  const qualified=potentialIssued.filter(x=>x.assertionState==='DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED');
  const open=operation?.openPrerequisites??0;
  const relatedConflicts=links.filter(l=>l.status==='HUMAN_ASSERTED_UNVERIFIED'&&l.kind==='CONFLICTS_WITH').filter(l=>current.some(c=>c.documentId===l.fromId||c.documentId===l.toId));
  const unresolved=restrictions.length||requests.length||requirements.length||conflicts.length||scopeBlocked.length||relatedConflicts.length||open;
  let state='NO_REVIEWED_CURRENT_DOCUMENTARY_SCOPE';
  if(restrictions.length&&qualified.length)state='RESTRICTION_AND_SCOPED_DOCUMENT_CLAIM_REQUIRES_VERIFICATION';
  else if(restrictions.length)state='RESTRICTIONS_UNRESOLVED_NO_APPLICABLE_GRANT_ESTABLISHED';
  else if(requestOnly.length)state='UNISSUED_REQUESTS_REQUIRE_REVIEW';
  else if(qualified.length)state='ISSUED_CLAIM_REQUIRES_AUTHENTICATION';
  else if(unresolved||potentialIssued.length)state='DOCUMENTARY_SCOPE_UNRESOLVED';
  // Zero outstanding claims never implies permission.
  return {sceneId:scene.id,state,originalActivity:scene.activity,originalLocation:scene.location,
   restrictions:rows.filter(x=>x.kind==='RESTRICTION'),requests:rows.filter(x=>x.kind==='REQUEST_NOT_GRANTED'||x.assertionState==='REQUEST_NOT_ISSUED'),
   amendments:rows.filter(x=>x.kind==='CONDITIONAL_GRANT_CLAIM'),requirements:rows.filter(x=>x.kind==='REQUIREMENT'),
   conflicts:rows.filter(x=>x.kind==='CONFLICT_OR_UNCERTAIN'),claims:rows,modelOnlyFindings:modelOnly,
   openPrerequisites:open,documentaryConflicts:relatedConflicts.length,
   humanRecordedIssuedClaims:qualified.length,unresolvedGrantClaims:scopeBlocked.length,
   clockedModelEvidenceCount:rows.reduce((n,r)=>n+r.modelHits.length,0),
   notClearance:true,notice:'A human-entered issued amendment is not authenticated, signatures and legal precedence are unverified, and model scores confer no permission.'};
 });
 const packet={schema:'beforeroll-documentary-reasoning-v1',workspaceId:w.id,workspaceRevision:w.revision,asOf,
  scenes,summary:{scenes:scenes.length,restrictions:scenes.reduce((n,s)=>n+s.restrictions.filter(r=>r.sourceState==='CURRENT_UNVERIFIED').length,0),
   requests:scenes.reduce((n,s)=>n+s.requests.filter(r=>r.sourceState==='CURRENT_UNVERIFIED').length,0),
   pendingGrantClaims:scenes.reduce((n,s)=>n+s.unresolvedGrantClaims,0),
   scenesWithReview:scenes.filter(s=>s.state!=='NO_REVIEWED_CURRENT_DOCUMENTARY_SCOPE').length,
   modelSupportedHumanClaims:scenes.reduce((n,s)=>n+s.clockedModelEvidenceCount,0),modelOnlyFindings:scenes.reduce((n,s)=>n+s.modelOnlyFindings.length,0)},
  notClearance:true,warning:'Deterministic comparison of human-recorded facets only; NOT a legal authority determination, cryptographic signature check, verified issuance, permission to film, or proof all source documents were supplied.'};
 return packet;
}
