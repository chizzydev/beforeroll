/** M3-S18 — unified scene operator packet. Read only: one scene's original row,
 * exact current source tasks, provider journal, human decisions, scoped document
 * claims, dated prerequisites and next actions. No parallel mutable state.
 */
import {createHash} from 'node:crypto';
import {MAX_PLAN_TASKS} from './intelligence-workflow.mjs';
import {buildProductionActions} from './production-actions.mjs';
const digest=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const validPage=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
function validated(d){
 if(d?.schema!=='beforeroll-integrated-production-dossier-v1'||d.notClearance!==true||!Array.isArray(d.sceneTasks)||!Array.isArray(d.scenes))throw Error('Verified integrated dossier required');
 const {sha256,...body}=d;if(sha256!==digest(body))throw Error('Scene workbench refuses altered dossier evidence');
}
/** One deterministic projection for API, browser review, and audit tests. */
export function buildSceneWorkbench(d,{sceneId,taskOffset=0,taskLimit=40,actionOffset=0,actionLimit=30}={}){
 validated(d);
 if(typeof sceneId!=='string'||!sceneId||sceneId.length>80)throw Error('Select a valid source-linked scene');
 if(!validPage(taskOffset,Math.max(3000,d.sceneTasks.length))||!Number.isSafeInteger(taskLimit)||taskLimit<1||taskLimit>100||
    !validPage(actionOffset,Math.max(10000,d.sceneTasks.length*4))||!Number.isSafeInteger(actionLimit)||actionLimit<1||actionLimit>100)throw Error('Scene workbench pagination invalid');
 const scene=d.scenes.find(s=>s.sceneId===sceneId);if(!scene)throw Error('Scene not present in current original call sheet');
 const taskIndexes=d.sceneTasks.map((t,i)=>({t,i})).filter(({t})=>t.sceneId===sceneId);
 const reviews=new Map(d.currentTaskReviews.map(r=>[r.evidenceId,r]));
 const selected=taskIndexes.slice(taskOffset,taskOffset+taskLimit);
 const localPositions=new Map(taskIndexes.map((x,i)=>[x.t.id,i]));
 const tasks=selected.map(({t,i})=>({...t,globalTaskIndex:i,sceneTaskIndex:localPositions.get(t.id),currentHumanReview:reviews.get(t.id)??null,
  evidenceClass:t.modelState==='COMPLETE'?'OWNER_RECORDED_MODEL_NOT_AUTHORITY':t.modelState==='NOT_ATTEMPTED'?'NOT_AI_EVALUATED':'PROVIDER_OUTCOME_UNCERTAIN',notClearance:true}));
 const documents=d.sourceDocuments.map(doc=>{
  const matches=taskIndexes.filter(x=>x.t.documentId===doc.id);
  return {id:doc.id,name:doc.name,sourceSha256:doc.sourceSha256,originalBytesSha256:doc.originalBytesSha256,
   sourceFormat:doc.sourceFormat,requiresPdfTextReview:doc.requiresPdfTextReview,sourceCoverageGaps:doc.sourceCoverageGaps,
   authorityMetadata:doc.authorityMetadata,plannedSceneChecks:matches.length,
   evaluatedSceneChecks:matches.filter(x=>x.t.modelState==='COMPLETE').length,
   reviewedSceneChecks:matches.filter(x=>reviews.has(x.t.id)).length,
   notClearance:true};
 });
 const scopeClaims=d.sceneScopeClaims.filter(c=>c.sceneId===sceneId);
 const conditions=d.operations.conditions.filter(c=>c.sceneId===sceneId);
 const schedules=d.operations.schedules.filter(c=>c.sceneId===sceneId);
 const documentIds=new Set(documents.map(x=>x.id));
 const documentaryLinks=d.documentaryLinks.filter(l=>documentIds.has(l.fromId)||documentIds.has(l.toId));
 const queue=buildProductionActions(d,{sceneId,offset:actionOffset,limit:actionLimit});
 const positions=new Map(taskIndexes.map(x=>[x.t.id,x.i]));
 const actions={...queue,actions:queue.actions.map(x=>({...x,globalTaskIndex:x.taskId&&positions.has(x.taskId)?positions.get(x.taskId):null,sceneTaskIndex:x.taskId&&localPositions.has(x.taskId)?localPositions.get(x.taskId):null}))};
 const packet={schema:'beforeroll-scene-workbench-v1',productionId:d.productionId,title:d.title,
  workspaceRevision:d.workspaceRevision,persistedVersion:d.persistedVersion,asOf:d.asOf,dossierSha256:d.sha256,
  scene:{...scene,notClearance:true},documents,scopeClaims,documentaryLinks,schedules,conditions,
  tasks,taskPagination:{offset:taskOffset,limit:taskLimit,total:taskIndexes.length,hasMore:taskOffset+tasks.length<taskIndexes.length},
  actions,documentaryReasoning:d.documentaryReasoning?.scenes.find(x=>x.sceneId===sceneId)??null,
  summary:{planned:taskIndexes.length,completedModelChecks:taskIndexes.filter(x=>x.t.modelState==='COMPLETE').length,
   uncertainModelChecks:taskIndexes.filter(x=>['IN_FLIGHT','BILLING_UNKNOWN'].includes(x.t.modelState)).length,
   currentTaskReviews:taskIndexes.filter(x=>reviews.has(x.t.id)).length,
   currentScopeClaims:scopeClaims.filter(c=>c.sourceState==='CURRENT_UNVERIFIED').length,
   staleScopeClaims:scopeClaims.filter(c=>c.sourceState!=='CURRENT_UNVERIFIED').length,
   currentPrerequisites:conditions.filter(c=>c.sourceState==='CURRENT_HUMAN_CLAIM').length,
   openPrerequisites:conditions.filter(c=>c.sourceState==='CURRENT_HUMAN_CLAIM'&&c.decision!=='HUMAN_CONFIRMED_NOT_AUTHORITY').length,
   actionCount:queue.filteredTotal},
  sceneReviewState:scene.readiness,notClearance:true,
  notice:'Single source-linked scene review, NOT a filming clearance, legal interpretation, authenticated permit or fulfilled condition.'};
 return {...packet,sha256:digest(packet)};
}
