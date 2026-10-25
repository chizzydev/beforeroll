/** M3-S17: deterministic human work queue, derived ONLY from the integrated dossier.
 * No duplicate mutable task state, no provider requests, no legal/filming clearance.
 */
import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const priorities={SOURCE_BLOCKED:0,UNCERTAIN_EXECUTION:1,SAFETY_SCOPE:2,REVIEW_REQUIRED:3,MODEL_PENDING:4,HISTORICAL:5};
const validPage=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const allowedKinds=new Set(['ALL','SOURCE','EXECUTION','HUMAN','OPERATIONS','HISTORY']);
function assertDossier(d){
 if(d?.schema!=='beforeroll-integrated-production-dossier-v1'||d.notClearance!==true||!Array.isArray(d.sceneTasks)||!Array.isArray(d.scenes)||!Array.isArray(d.sourceDocuments)||!Array.isArray(d.outstanding))throw Error('An integrated source-bound dossier is required');
 const {sha256,...unsigned}=d;
 if(sha256!==digest(unsigned))throw Error('Work queue refuses altered dossier evidence');
}
export function buildProductionActions(d,{offset=0,limit=30,kind='ALL',sceneId=null}={}){
 assertDossier(d);
 if(!validPage(offset,Math.max(10000,d.sceneTasks.length*4))||!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('Action queue pagination invalid');
 if(!allowedKinds.has(kind)||!(sceneId===null||typeof sceneId==='string'&&sceneId.length<=80))throw Error('Action queue filter invalid');
 const tasks=[];
 // Derive exact global and per-scene pagination offsets once, from this same
 // audited dossier. A task in scene 199 must be reachable even if not on page 1.
 const indices=new Map(),sceneCounts=new Map();
 d.sceneTasks.forEach((t,globalTaskIndex)=>{const sceneTaskIndex=sceneCounts.get(t.sceneId)??0;
  indices.set(t.id,{globalTaskIndex,sceneTaskIndex});sceneCounts.set(t.sceneId,sceneTaskIndex+1);});
 function push(category,priority,code,subject,detail,{sceneId=null,documentId=null,taskId=null,conditionId=null,unitId=null,sourceHash=null,sourceQuote=null,route=null}={}){
  const core={category,priority,code,subject,sceneId,documentId,taskId,conditionId,unitId,sourceHash};
  tasks.push({...core,id:digest(core),detail,sourceQuote,route,...(taskId?indices.get(taskId)??{}:{}),notClearance:true});
 }
 if(!d.sourceDocuments.length)push('SOURCE',0,'IMPORT_PERMIT','Import original permits','The production has no original location permit or source conditions.',{route:'sources'});
 if(!d.callSheet.sceneCount)push('SOURCE',0,'IMPORT_CALL_SHEET','Import shooting call sheet','No accepted source-linked scene rows exist.',{route:'sources'});
 if(d.callSheet.unsupportedRows?.length)push('SOURCE',0,'UNSUPPORTED_CALL_SHEET','Correct call-sheet rows',`${d.callSheet.unsupportedRows.length} unsupported scene row(s) block full source planning.`,{route:'sources'});
 for(const doc of d.sourceDocuments){
  if(doc.requiresPdfTextReview)push('SOURCE',0,'VERIFY_PDF_TEXT',`Review ${doc.id} transcription`,'Compare extracted text against every original PDF page before using the source in Clocked.',{documentId:doc.id,sourceHash:doc.sourceSha256,route:'sources'});
  if(!doc.authorityMetadata)push('HUMAN',3,'RECORD_DOCUMENT_PROVENANCE',`Review document ${doc.id}`,'Record claimed issuer, document role and reference from the original source; do not assume authenticity.',{documentId:doc.id,sourceHash:doc.sourceSha256,route:'authority'});
  if(doc.sourceCoverageGaps.length)push('SOURCE',0,'SOURCE_COVERAGE_GAP',`Review uncovered source ${doc.id}`,`${doc.sourceCoverageGaps.length} original text spans are not represented.`,{documentId:doc.id,sourceHash:doc.sourceSha256,route:'sources'});
 }
 for(const issue of d.outstanding){
  if(issue.code==='PLAN_BLOCKED'&&d.sourceDocuments.length&&d.callSheet.sceneCount)push('SOURCE',0,'FIX_SOURCE_PLAN','Repair source analysis plan',String(issue.detail??'Full source plan is blocked.'),{route:'sources'});
  if(issue.code==='UNVERIFIED_DOCUMENT_CONFLICTS')push('HUMAN',2,'REVIEW_DOCUMENT_CONFLICTS','Review conflicting authority',`${issue.count} unverified documentary conflict(s). Neither Clocked nor the app establishes legal precedence.`,{route:'authority'});
  if(issue.code==='ARCHIVED_MODEL_RUNS_FROM_OTHER_SOURCE_PLAN')push('HISTORY',5,'HISTORICAL_MODEL_RUNS','Inspect historical Clocked runs',`${issue.count} archived execution run(s) belong to other source revisions. They must not be treated as current.`,{route:'execution'});
 }
 const reviews=new Map(d.currentTaskReviews.map(r=>[r.evidenceId,r]));
 for(const t of d.sceneTasks){
  const ref={sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,taskId:t.id,sourceHash:t.documentHash,sourceQuote:t.quote,route:'review'};
  if(t.modelState==='IN_FLIGHT'||t.modelState==='BILLING_UNKNOWN')push('EXECUTION',1,'INVESTIGATE_PROVIDER_OUTCOME',`${t.sceneId}: uncertain Clocked request`,'An attempted provider request has an unknown outcome or billing. Inspect records; do not automatically retry.',{...ref,route:'execution'});
  else if(t.modelState==='NOT_ATTEMPTED')push('EXECUTION',4,'RUN_UNEVALUATED_SOURCE_CHECK',`${t.sceneId}: source check not evaluated`,'A Clocked comparison has not been sent for this exact passage and scene.',{...ref,route:'execution'});
  if(t.modelState==='COMPLETE'&&t.model?.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'&&t.model?.scope?.matched!==true){
   push('HUMAN',2,'VERIFY_MODEL_GRANT_SCOPE',`${t.sceneId}: model grant scope unverified`,'Clocked identified a possible grant, but the exact original quotation has not established a sufficiently scoped scene authorization.',ref);
  }
  const review=reviews.get(t.id);
  if(!review)push('HUMAN',3,'REVIEW_EXACT_SOURCE_TASK',`${t.sceneId}: source finding awaits human review`,t.modelState==='COMPLETE'?'Inspect the original passage, model result and documentary scope. Human review is not clearance.':'Review the original source passage independently; no model finding is available yet.',ref);
  else if(review.decision!=='RESOLVED_BY_HUMAN')push('HUMAN',3,'FOLLOW_UP_HUMAN_REVIEW',`${t.sceneId}: human follow-up ${review.decision}`,`Current reviewer: ${review.reviewer}. Latest rationale: ${review.reason}`,ref);
 }
 const claimsByScene=new Map();for(const c of d.sceneScopeClaims){if(c.sourceState!=='CURRENT_UNVERIFIED')continue;const l=claimsByScene.get(c.sceneId)||[];l.push(c);claimsByScene.set(c.sceneId,l);}
 for(const s of d.scenes){
  if(!s.schedule||s.schedule.scheduleState!=='DATED_HUMAN_PLAN_NOT_AUTHORITY')push('OPERATIONS',3,'DATE_SCENE',`${s.sceneId}: confirm scene schedule`,'Record a source-linked date, timezone and overnight decision before evaluating time-bound conditions.',{sceneId:s.sceneId,route:'operations'});
  if(!s.currentHumanClaims)push('HUMAN',3,'REVIEW_SCENE_SCOPE',`${s.sceneId}: map permit to scene`,'Record relevant exact source clauses and review their applicability to this scene.',{sceneId:s.sceneId,route:'scene-authority'});
  if(claimsByScene.get(s.sceneId)?.some(c=>['REQUEST_NOT_GRANTED','CONFLICT_OR_UNCERTAIN'].includes(c.kind)))push('HUMAN',2,'REVIEW_SCENE_AUTHORITY_CONFLICT',`${s.sceneId}: unresolved documentary scope`,'A current human claim identifies a request without a grant or conflicting authority; resolve outside automated scoring.',{sceneId:s.sceneId,route:'scene-authority'});
 }
 for(const scene of d.documentaryReasoning?.scenes??[]){
  for(const claim of scene.amendments){
   if(claim.sourceState!=='CURRENT_UNVERIFIED'||claim.assertionState==='DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED')continue;
   push('HUMAN',2,'RESOLVE_DOCUMENTARY_GRANT_SCOPE',`${scene.sceneId}: documentary variation requires review`,
    `${claim.assertionState}. Activity, location, date, issuance, current original restriction, document link or conditions need accountable review. No permission inferred.`,
    {sceneId:scene.sceneId,documentId:claim.documentId,unitId:claim.unitId,sourceQuote:claim.quote,route:'scene-authority'});
  }
  for(const r of scene.modelOnlyFindings)if(r.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW')
   push('HUMAN',2,'MODEL_ONLY_NEEDS_DOCUMENTARY_SCOPE',`${scene.sceneId}: model-positive claim without human documentary basis`,
    'Clocked model score is not an issued grant; establish exact original source scene/activities/dates and documentary provenance.',
    {sceneId:scene.sceneId,documentId:r.documentId,unitId:r.unitId,route:'scene-authority'});
 }
 for(const c of d.operations.conditions){
  if(c.sourceState!=='CURRENT_HUMAN_CLAIM')continue;
  if(c.decision!=='HUMAN_CONFIRMED_NOT_AUTHORITY')push('OPERATIONS',c.deadlineState==='PAST_DUE'?2:3,c.deadlineState==='PAST_DUE'?'PAST_DUE_PREREQUISITE':'REVIEW_PREREQUISITE',`${c.sceneId}: ${c.title}`,
   `${c.decision} · ${c.deadlineState} · source: ${c.documentId??'manual reviewer assertion'}. Human confirmation is not authority to film.`,{sceneId:c.sceneId,documentId:c.documentId,unitId:c.unitId,conditionId:c.id,sourceHash:c.documentHash,sourceQuote:c.quote,route:'operations'});
 }
 const ordered=tasks.sort((a,b)=>a.priority-b.priority||a.code.localeCompare(b.code)||String(a.sceneId??'').localeCompare(String(b.sceneId??''))||String(a.documentId??'').localeCompare(String(b.documentId??''))||a.id.localeCompare(b.id));
 const filtered=ordered.filter(a=>(kind==='ALL'||a.category===kind)&&(sceneId===null||a.sceneId===sceneId));
 const countByCategory={SOURCE:0,EXECUTION:0,HUMAN:0,OPERATIONS:0,HISTORY:0};for(const a of ordered)countByCategory[a.category]++;
 const countByPriority={BLOCKED:0,UNCERTAIN:0,SCOPE:0,REVIEW:0,PENDING:0,HISTORY:0};for(const a of ordered)countByPriority[Object.keys(countByPriority)[a.priority]]++;
 return {schema:'beforeroll-production-action-queue-v1',productionId:d.productionId,workspaceRevision:d.workspaceRevision,persistedVersion:d.persistedVersion,dossierSha256:d.sha256,
  total:ordered.length,filteredTotal:filtered.length,byCategory:countByCategory,byPriority:countByPriority,
  pagination:{offset,limit,hasMore:offset+limit<filtered.length},filter:{kind,sceneId},actions:filtered.slice(offset,offset+limit),
  notClearance:true,notice:'Prioritized human work list derived from the same current original sources and model journal. Never evidence of permission to film.'};
}
