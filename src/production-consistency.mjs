/** M3-S28: a fail-closed, read-only reconciliation of one source-bound production.
 * No separate mutable state. This is a consistency audit of recorded evidence,
 * not a legal-authorization engine and not proof of supplied document completeness.
 */
import {createHash} from 'node:crypto';
import {sourcePointSlice} from './engine.mjs';
import {planIntelligence} from './intelligence-workflow.mjs';
import {referencedOriginals} from './source-originals.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const requireEqual=(a,b,message)=>{if(a!==b)throw Error(`Production consistency failure: ${message}`);};
const fail=s=>{throw Error(`Production consistency failure: ${s}`);};
const count=(rows,predicate)=>rows.filter(predicate).length;
const sum=(rows,key)=>rows.reduce((n,r)=>n+r[key],0);
const statuses=new Set(['COMPLETE','NOT_ATTEMPTED','IN_FLIGHT','BILLING_UNKNOWN']);
const toMap=(rows,key,description)=>{
 const m=new Map();for(const r of rows){const k=r[key];if(m.has(k))fail(`duplicate ${description}: ${k}`);m.set(k,r);}return m;
};
/** Works on a fully source-validated dossier; references are independently checked
 * against the immutable source rows rather than trusting cached UI counters. */
export function certifyProductionConsistency(workspace,dossier,{persistedVersion,executionStatus=null,overview=null,queue=null,workbench=null,journey=null,originals=null}={}){
 if(dossier?.schema!=='beforeroll-integrated-production-dossier-v1'||dossier.notClearance!==true)fail('audited dossier missing');
 const {sha256:claimed,...unsigned}=dossier;
 requireEqual(claimed,sha(unsigned),'dossier fingerprint mismatch');
 requireEqual(dossier.productionId,workspace.id,'production identity mismatch');
 requireEqual(dossier.workspaceRevision,workspace.revision,'workspace revision mismatch');
 requireEqual(dossier.persistedVersion,persistedVersion,'persisted version mismatch');
 if(!Number.isSafeInteger(persistedVersion)||persistedVersion<1)fail('persisted version invalid');
 const docs=toMap(workspace.documents,'id','document identity');
 const sourceDocs=toMap(dossier.sourceDocuments,'id','dossier document identity');
 const scenes=toMap(workspace.callSheet?.scenes??[],'id','scene identity');
 const sceneRows=toMap(dossier.scenes,'sceneId','dossier scene identity');
 requireEqual(docs.size,sourceDocs.size,'document inventory differs');
 requireEqual(scenes.size,sceneRows.size,'scene inventory differs');
 requireEqual(dossier.counts.documents,docs.size,'document count diverges');
 requireEqual(dossier.counts.scenes,scenes.size,'scene count diverges');
 requireEqual(dossier.callSheet.sha256,workspace.callSheet?.sourceHash??null,'call-sheet source SHA differs');
 for(const [id,doc] of docs){const record=sourceDocs.get(id);if(!record)fail(`document ${id} absent from dossier`);
  requireEqual(record.sourceSha256,doc.sourceHash,`document ${id} changed SHA`);
  requireEqual(record.originalBytesSha256,doc.importReceipt?.rawHash??null,`document ${id} original provenance`);
  requireEqual(record.units,doc.units.length,`document ${id} unit count`);
  requireEqual(record.requiresPdfTextReview,Boolean(doc.importReceipt?.requiresHumanTextReview&&!doc.pdfTranscriptionReview),`document ${id} transcription flag`);
 }
 let plan=null;
 const blocked=dossier.outstanding.some(o=>o.code==='PLAN_BLOCKED');
 if(!blocked&&docs.size&&scenes.size){plan=planIntelligence(workspace);}
 if(plan){
  requireEqual(plan.taskIds.length,dossier.sceneTasks.length,'plan / dossier task count');
  for(let i=0;i<plan.tasks.length;i++){
   const t=plan.tasks[i],r=dossier.sceneTasks[i];
   for(const key of ['id','sceneId','documentId','documentHash','sceneHash','unitId','requestHash'])requireEqual(r[key],t[key],`plan task ${i} ${key}`);
   requireEqual(r.quote,t.sourceQuote,`plan task ${i} source quotation`);
   requireEqual(JSON.stringify(r.sourceRange),JSON.stringify(t.sourceRange),`plan task ${i} source range`);
  }
 }else if(dossier.sceneTasks.length)fail('tasks shown without an evaluable source plan');
 const units=new Map([...docs].map(([id,doc])=>[id,toMap(doc.units,'id',`unit in ${id}`)]));
 const lastRecordedReview=new Map();for(const review of workspace.reviewActions??[])lastRecordedReview.set(review.evidenceId,review);
 const tasks=toMap(dossier.sceneTasks,'id','current source task');
 const reviews=toMap(dossier.currentTaskReviews,'evidenceId','current review');
 const byScene=new Map([...scenes.keys()].map(id=>[id,{planned:0,complete:0,uncertain:0,notAttempted:0,reviewed:0,taskIds:[]}]));
 for(const t of tasks.values()){
  if(!statuses.has(t.modelState)||t.notClearance!==true)fail(`unrecognized task state ${t.id}`);
  const s=byScene.get(t.sceneId);if(!s)fail(`orphan task scene ${t.sceneId}`);
  const doc=docs.get(t.documentId);if(!doc||doc.sourceHash!==t.documentHash)fail(`orphan task document ${t.id}`);
  const u=units.get(t.documentId).get(t.unitId);if(!u||u.text!==t.quote||u.start!==t.sourceRange[0]||u.end!==t.sourceRange[1])fail(`source passage mismatch ${t.id}`);
  s.planned++;s.taskIds.push(t.id);if(t.modelState==='COMPLETE')s.complete++;else if(t.modelState==='NOT_ATTEMPTED')s.notAttempted++;else s.uncertain++;
  if(t.modelState!=='COMPLETE'&&t.model!==null)fail(`uncompleted task carries model finding ${t.id}`);
  if(t.modelState==='COMPLETE'&&!t.model?.notClearance)fail(`completed task has no valid model finding ${t.id}`);
  if(reviews.has(t.id))s.reviewed++;
 }
 for(const review of reviews.values()){
  if(!tasks.has(review.evidenceId))fail('historical review exposed as current');
  const last=lastRecordedReview.get(review.evidenceId);
  if(!last||JSON.stringify(last)!==JSON.stringify(review))fail('current review is not the latest recorded decision');
 }
 for(const [id,scene] of sceneRows){const row=scenes.get(id);if(!row)fail(`scene ${id} not in call sheet`);
  requireEqual(scene.originalRow,sourcePointSlice(workspace.callSheet.text,row.source.start,row.source.end),`scene ${id} original row`);
  requireEqual(scene.planned,byScene.get(id).planned,`scene ${id} planned`);
  requireEqual(scene.modelComplete,byScene.get(id).complete,`scene ${id} model completed`);
  requireEqual(scene.neverAttempted,byScene.get(id).notAttempted,`scene ${id} pending`);
  requireEqual(scene.interruptedOrBillingUnknown,byScene.get(id).uncertain,`scene ${id} uncertain`);
  requireEqual(scene.humanReviewed,byScene.get(id).reviewed,`scene ${id} reviewed`);
  requireEqual(JSON.stringify(scene.taskIds),JSON.stringify(byScene.get(id).taskIds),`scene ${id} task identity order`);
 }
 const c=dossier.counts;
 requireEqual(c.planTasks,tasks.size,'total planned tasks');
 requireEqual(c.completedModelChecks,sum([...byScene.values()],'complete'),'completed task total');
 requireEqual(c.uncertainModelChecks,sum([...byScene.values()],'uncertain'),'uncertain task total');
 requireEqual(c.unattemptedChecks,sum([...byScene.values()],'notAttempted'),'not attempted total');
 requireEqual(c.currentReviewedTasks,reviews.size,'current review total');
 requireEqual(c.staleHumanReviews,count(workspace.reviewActions,r=>!tasks.has(r.evidenceId)),'historical human review total');
 requireEqual(c.currentUnresolvedHumanReviews,count([...reviews.values()],r=>r.decision!=='RESOLVED_BY_HUMAN'),'unresolved human review total');
 requireEqual(c.unresolvedPdfTranscriptions,count([...sourceDocs.values()],r=>r.requiresPdfTextReview),'unverified transcription count');
 requireEqual(c.openPrerequisites,dossier.operations.summary.openPrerequisites,'open operational prerequisites');
 requireEqual(c.pastDuePrerequisites,dossier.operations.summary.pastDuePrerequisites,'overdue operational prerequisites');
 requireEqual(c.unverifiedDocumentConflicts,dossier.documentaryReasoning.summary.unresolvedConflicts??c.unverifiedDocumentConflicts,'document conflict count');
 if(executionStatus){
  requireEqual(executionStatus.projectId,workspace.id,'execution project differs');
  if(plan){
   requireEqual(executionStatus.planned,tasks.size,'execution planned count');
   requireEqual(executionStatus.completed,c.completedModelChecks,'execution completed count');
   const ongoing=[...tasks.values()].filter(t=>t.modelState==='IN_FLIGHT'||t.modelState==='BILLING_UNKNOWN');
   requireEqual(executionStatus.unknownBilling,count(ongoing,x=>x.modelState==='BILLING_UNKNOWN'),'execution unknown billing count');
   if(executionStatus.byScene)for(const [id,s] of byScene){const e=executionStatus.byScene[id];if(!e)fail(`execution scene ${id} missing`);
    requireEqual(e.planned,s.planned,`execution scene ${id} planned`);requireEqual(e.complete,s.complete,`execution scene ${id} completed`);
    requireEqual(e.uncertain,s.uncertain,`execution scene ${id} uncertain`);
   }
  }else if(executionStatus.completed>0)fail('completed model checks with blocked source plan');
 }
 if(originals){
  requireEqual(originals.productionId,workspace.id,'source custody project differs');
  requireEqual(originals.persistedVersion,persistedVersion,'source custody version differs');
  const references=referencedOriginals(workspace),referenceIds=new Set(references.map(r=>r.rawHash));
  const missing=originals.missingOriginalSha256??[];
  requireEqual(originals.referenced,references.length,'source custody referenced originals');
  requireEqual(originals.preserved+missing.length,references.length,'source custody preserved + missing');
  if(new Set(missing).size!==missing.length||missing.some(hash=>!referenceIds.has(hash)))fail('source custody lists unrelated/multiple missing originals');
  const held=originals.files??[];
  requireEqual(held.length,originals.preserved,'source custody preserved file list');
  const found=new Set();for(const ref of held){const expected=references.find(r=>r.rawHash===ref.rawHash);
   if(!expected||found.has(ref.rawHash)||expected.byteCount!==ref.byteCount||missing.includes(ref.rawHash))fail('source custody original-file mismatch');
   found.add(ref.rawHash);
  }
 }
 if(overview){requireEqual(overview.version,persistedVersion,'overview version differs');
  requireEqual(overview.plannedCalls,tasks.size,'overview plan total differs');
  requireEqual(overview.reviewedCount,reviews.size,'overview current reviews differ');
  if(overview.pagination?.shown!==overview.tasks?.length)fail('overview page size inconsistent');
  for(const t of overview.tasks??[]){if(!tasks.has(t.id))fail(`overview exposes a historical task ${t.id}`);
   const source=tasks.get(t.id),expected=source.modelState==='COMPLETE'?'CLOCKED_EVALUATED':source.modelState==='NOT_ATTEMPTED'?'NOT_AI_EVALUATED':source.modelState;
   if(!(t.status===expected||(source.modelState==='NOT_ATTEMPTED'&&t.status==='NOT_ATTEMPTED')))fail(`overview model state for ${t.id}`);
   requireEqual(t.humanReview?.evidenceId??null,reviews.get(t.id)?.evidenceId??null,`overview human state for ${t.id}`);
  }
 }
 if(queue){
  requireEqual(queue.dossierSha256,dossier.sha256,'action queue dossier differs');
  requireEqual(queue.persistedVersion,persistedVersion,'action queue version differs');
  if(queue.pagination?.offset+queue.actions.length>queue.filteredTotal)fail('action queue pagination inconsistent');
  for(const a of queue.actions){if(a.taskId&&!tasks.has(a.taskId))fail(`action queue exposes historical task ${a.taskId}`);
   if(a.documentId&&!docs.has(a.documentId))fail(`action queue refers to missing document ${a.documentId}`);
   if(a.sceneId&&!scenes.has(a.sceneId))fail(`action queue refers to missing scene ${a.sceneId}`);
  }
 }
 if(workbench){requireEqual(workbench.dossierSha256,dossier.sha256,'workbench dossier differs');
  requireEqual(workbench.persistedVersion,persistedVersion,'workbench version differs');
  if(!scenes.has(workbench.scene.sceneId))fail('workbench scene missing');
  const expected=byScene.get(workbench.scene.sceneId);
  requireEqual(workbench.summary.planned,expected.planned,'workbench scene total');
  requireEqual(workbench.summary.completedModelChecks,expected.complete,'workbench current model total');
  requireEqual(workbench.summary.currentTaskReviews,expected.reviewed,'workbench current human total');
  for(const t of workbench.tasks){const source=tasks.get(t.id);if(!source||source.sceneId!==workbench.scene.sceneId)fail('workbench exposes historical/other-scene task');
   requireEqual(t.modelState,source.modelState,'workbench task status differs');
  }
 }
 if(journey){requireEqual(journey.dossierSha256,dossier.sha256,'journey dossier differs');
  requireEqual(journey.persistedVersion,persistedVersion,'journey version differs');
  const analysis=journey.checkpoints.find(x=>x.id==='analysis');if(!analysis)fail('analysis checkpoint missing');
  if(c.uncertainModelChecks>0&&analysis.status!=='STOPPED'&&analysis.status!=='BLOCKED')fail('uncertain requests not blocked in journey');
 }
 const summary={schema:'beforeroll-production-consistency-v1',productionId:workspace.id,
  persistedVersion,workspaceRevision:workspace.revision,asOf:dossier.asOf,dossierSha256:dossier.sha256,
  currentSourceInventory:{documents:docs.size,scenes:scenes.size,sourcePlanTasks:tasks.size},
  currentEvidence:{modelComplete:c.completedModelChecks,modelPending:c.unattemptedChecks,modelUncertain:c.uncertainModelChecks,
   humanReviewed:c.currentReviewedTasks,openHumanReviews:c.currentUnresolvedHumanReviews},
  historicalEvidence:{humanReviews:c.staleHumanReviews,archivedModelRuns:c.archivedModelRuns,staleScopeClaims:c.staleSceneScopeAssertions},
  originals:originals?{referenced:originals.referenced,preserved:originals.preserved,missing:originals.missingOriginalSha256.length}:null,
  checks:['ORIGINAL_SOURCE_REFERENCES','PLAN_TO_DOSSIER_TASKS','SCENE_TOTALS','CURRENT_VS_HISTORICAL_REVIEWS',
   'MODEL_ATTEMPT_ACCOUNTING','OPERATIONS_COUNTS','ORIGINAL_FILE_CUSTODY','ACTION_AND_WORKBENCH_ALIGNMENT','JOURNEY_ALIGNMENT'],
  state:'INTERNAL_RECONCILIATION_PASS_NOT_SOURCE_AUTHENTICATION',notClearance:true,
  limitation:'Checks internal source and recorded evidence consistency only; not external document authenticity, comprehensive permit coverage, model accuracy, legal authority or filming clearance.'};
 return {...summary,sha256:sha(summary)};
}
