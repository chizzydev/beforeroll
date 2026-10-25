/** One coherent source -> scene -> Clocked task -> auditable finding pipeline.
 * This new contract intentionally does not mutate frozen M3-S6 request fingerprints.
 */
import {createHash} from 'node:crypto';
import {assertWorkspaceSources} from './production-workspace.mjs';
import {contextForUnit,verifySourceUnit,sourceFingerprint} from './permit-intelligence.mjs';
import {conservativeSemanticFinding} from './semantic.mjs';
import {sourcePointSlice} from './engine.mjs';
export const MAX_PLAN_TASKS=50000; // bounded, source-complete 50k ceiling; never silently truncated
const sha=s=>createHash('sha256').update(s,'utf8').digest('hex');
const QUESTIONS=Object.freeze({
 activity_link:{type:'noul',instructions:'Does the exact quoted source passage state a restriction, prerequisite, or conditional activity permission materially applicable to this scene? Surrounding passages are context only, not independent grants.',criteria:{true:'Exact passage concerns the proposed scene activity, even when terminology differs.',false:'Exact passage is unrelated or general location overlap alone is insufficient.'}},
 granted_for_scene:{type:'noul',instructions:'Does the exact quoted source passage explicitly issue permission for this specific scene activity and authorized scope? A request, generic location consent, grant for a different scene, or prerequisite that has not been evidenced is not scene-specific permission.',criteria:{true:'Quoted passage explicitly grants the specified scene/activity within stated scope, subject to human validation.',false:'No issued, sufficiently scoped permission is stated in this exact passage.'}}
});
export function sourceBoundDecidePayload({unit,document,scene,context}){
 if(!verifySourceUnit(document.text,unit))throw Error('Source unit must exactly match document Unicode span');
 if(typeof scene.row!=='string'||!scene.row.startsWith('Scene '))throw Error('Unsupported scene row');
 const notes=[...(context.before||[]).map(x=>`BEFORE (${x.id}): ${x.text}`),...(context.after||[]).map(x=>`AFTER (${x.id}): ${x.text}`)].join('\n');
 const state=`PERMIT DOCUMENT ${document.id} (unverified; do not authenticate):\nEXACT PASSAGE ${unit.id} [${unit.start},${unit.end}):\n${unit.text}\n\nNEIGHBOR CONTEXT ONLY (cannot itself supply permission):\n${notes||'(none)'}\n\nPROPOSED SCENE (exact call-sheet row):\n${scene.row}\n\nAssess the exact passage with its context. Do not treat a general location consent as permission to override a more specific activity restriction. No filming-clearance conclusions.`;
 return {state,questions:QUESTIONS};
}
export function planIntelligence(workspace,{maxTasks=MAX_PLAN_TASKS}={}){
 if(!Number.isSafeInteger(maxTasks)||maxTasks<1||maxTasks>MAX_PLAN_TASKS)throw Error(`Analysis capacity must be 1-${MAX_PLAN_TASKS} tasks`);
 assertWorkspaceSources(workspace);
 if(!workspace.callSheet||!workspace.callSheet.scenes.length||!workspace.documents.length)throw Error('Need source documents and at least one supported scene');
 if(workspace.callSheet.unsupported.length)throw Error('Unsupported call-sheet rows require review before comprehensive analysis');
 if(workspace.callSheet.scenes.some(s=>s.needsReview))throw Error('Invalid scene rows require review');
 const forecast=workspace.callSheet.scenes.length*workspace.documents.reduce((n,d)=>n+d.units.length,0);
 if(!Number.isSafeInteger(forecast)||forecast>maxTasks)throw Error(`Document-scene plan requires more than ${maxTasks} requests. Split analysis into reviewed production phases; no silent truncation.`);
 const tasks=[];
 for(const document of workspace.documents){
  if(!document.coverage.represented||document.coverage.gaps.length)throw Error('Document coverage has unresolved gaps');
  if(document.importReceipt?.requiresHumanTextReview&&!document.pdfTranscriptionReview)throw Error(`PDF ${document.id} requires human verification of the extracted transcription before model planning`);
  for(const scene of workspace.callSheet.scenes){
   const row=sourcePointSlice(workspace.callSheet.text,scene.source.start,scene.source.end);
   for(const [i,unit] of document.units.entries()){
    const context=contextForUnit(document.units,i);
    const payload=sourceBoundDecidePayload({document,unit,scene:{row},context});
    const requestHash=sha(JSON.stringify(payload));
    const identity=sha(JSON.stringify({documentId:document.id,documentHash:document.sourceHash,sceneId:scene.id,sceneHash:sha(row),unitHash:unit.hash,range:[unit.start,unit.end],requestHash,
     ...(document.analysisEpoch>0?{documentSourceEpoch:document.analysisEpoch}:{}),
     ...(scene.sourceEpoch>0?{sceneSourceEpoch:scene.sourceEpoch}:{})}));
    tasks.push({id:identity,documentId:document.id,documentHash:document.sourceHash,documentRevision:document.revision,
     sceneId:scene.id,sceneHash:sha(row),sourceRange:[unit.start,unit.end],sourceQuote:unit.text,unitId:unit.id,
     contextUnitIds:[...context.before,...context.after].map(x=>x.id),payload,requestHash,status:'NOT_EVALUATED',notClearance:true});
    if(tasks.length>maxTasks)throw Error(`Document-scene plan requires more than ${maxTasks} requests. Split analysis into reviewed production phases; no silent truncation.`);
   }
  }
 }
 return {schema:'beforeroll-intelligence-plan-v1',workspaceId:workspace.id,workspaceRevision:workspace.revision,
  callSheetHash:workspace.callSheet.sourceHash,documents:workspace.documents.map(d=>({id:d.id,hash:d.sourceHash,revision:d.revision,unitCount:d.units.length})),
  plannedCalls:tasks.length,taskIds:tasks.map(t=>t.id),tasks,complete:false,sourceCompleteClaim:false,
  note:'Source text covered by the candidate plan; no claim of legal completeness or authorization.'};
}
export function assertPlanFresh(workspace,plan){
 assertWorkspaceSources(workspace);
 if(!plan||plan.schema!=='beforeroll-intelligence-plan-v1'||workspace.id!==plan.workspaceId||workspace.callSheet?.sourceHash!==plan.callSheetHash||JSON.stringify(plan.documents)!==JSON.stringify(workspace.documents.map(d=>({id:d.id,hash:d.sourceHash,revision:d.revision,unitCount:d.units.length}))))throw Error('Plan is stale or does not match current original sources');
 return true;
}
const checkpointIndexes=new WeakMap();
function checkpointIndex(cp){
 let index=checkpointIndexes.get(cp);
 if(!index){index=new Map(cp.entries.map((e,i)=>[e.id,i]));checkpointIndexes.set(cp,index);}
 return index;
}
const checkpointCursors=new WeakMap();
export function createCheckpoint(plan){
 if(plan?.schema!=='beforeroll-intelligence-plan-v1'||!Array.isArray(plan.tasks)||plan.tasks.length!==plan.plannedCalls)throw Error('Invalid plan');
 return {schema:'beforeroll-checkpoint-v1',workspaceId:plan.workspaceId,planIdentity:sha(JSON.stringify(plan.taskIds)),
  callsPlanned:plan.plannedCalls,entries:plan.tasks.map(t=>({id:t.id,requestHash:t.requestHash,status:'NOT_ATTEMPTED',finding:null,credits:null,error:null})),
  attempts:0,confirmedCompleted:0,unknownBilling:0,state:'READY',notClearance:true};
}
function checked(checkpoint,task){
 if(checkpoint.schema!=='beforeroll-checkpoint-v1')throw Error('Invalid checkpoint');
 const index=checkpointIndex(checkpoint).get(task.id);const entry=index===undefined?null:checkpoint.entries[index];
 if(!entry||entry.requestHash!==task.requestHash)throw Error('Checkpoint task fingerprint mismatch');return entry;
}
/** Called BEFORE sending to provider: unknown billing never becomes eligible for automatic retry. */
export function markAttempt(checkpoint,task){
 const entry=checked(checkpoint,task);
 if(checkpoint.state==='HALTED_UNKNOWN_BILLING')throw Error('Checkpoint halted after unknown billing');
 if(entry.status!=='NOT_ATTEMPTED')throw Error('This request was already attempted; refusing a duplicate');
 entry.status='IN_FLIGHT';checkpoint.attempts++;checkpoint.state='RUNNING';return entry;
}
export function commitAnswer(checkpoint,task,response,{credits=null,replayOrigin=null,legacyRequestHash=null}={}){
 const entry=checked(checkpoint,task);
 if(entry.status!=='IN_FLIGHT')throw Error('Unattempted or completed task cannot accept model evidence');
 const a=response?.answers;
 const valid=['activity_link','granted_for_scene'].every(k=>a?.[k]?.type==='noul'&&typeof a[k].noul==='number'&&Number.isFinite(a[k].noul)&&a[k].noul>=0&&a[k].noul<=1);
 if(!valid){return haltUnknown(checkpoint,task,'Clocked typed response unavailable; billing may be unknown');}
 entry.finding={...conservativeSemanticFinding(a),modelAnswers:{activity_link:a.activity_link,granted_for_scene:a.granted_for_scene},
  sourceRange:task.sourceRange,sourceQuote:task.sourceQuote,documentHash:task.documentHash,sceneHash:task.sceneHash,
  requestHash:task.requestHash,notClearance:true};
 if(replayOrigin!==null){
  if(replayOrigin!=='OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT'||typeof legacyRequestHash!=='string'||!/^[a-f0-9]{64}$/.test(legacyRequestHash))throw Error('Invalid recorded replay provenance');
  entry.finding.replayOrigin=replayOrigin;entry.finding.legacyRequestHash=legacyRequestHash;
 }
 entry.credits=Number.isSafeInteger(credits)&&credits>=0?credits:null;
 entry.status='COMPLETE';checkpoint.confirmedCompleted++;
 if(checkpoint.confirmedCompleted===checkpoint.callsPlanned)checkpoint.state='COMPLETE_FOR_PLANNED_UNITS_ONLY';
 return entry;
}
export function haltUnknown(checkpoint,task,reason){
 const entry=checked(checkpoint,task);if(entry.status!=='IN_FLIGHT')throw Error('Only in-flight tasks may be halted');
 entry.status='BILLING_UNKNOWN';entry.error=String(reason).slice(0,400);checkpoint.unknownBilling++;checkpoint.state='HALTED_UNKNOWN_BILLING';return entry;
}
export function nextPlannedTask(plan,checkpoint){
 if(checkpoint.state==='HALTED_UNKNOWN_BILLING')return null;
 if(checkpoint.planIdentity!==sha(JSON.stringify(plan.taskIds)))throw Error('Checkpoint does not belong to plan');
 let cursor=checkpointCursors.get(checkpoint)??0;
 while(cursor<plan.tasks.length){
  const task=plan.tasks[cursor];
  const entry=checkpoint.entries[cursor];
  if(!entry||entry.id!==task.id||entry.requestHash!==task.requestHash)throw Error('Checkpoint task fingerprint mismatch');
  if(entry.status==='NOT_ATTEMPTED'){checkpointCursors.set(checkpoint,cursor);return task;}
  cursor++;
 }
 checkpointCursors.set(checkpoint,cursor);return null;
}
export async function executeOne({plan,checkpoint,transport}){
 if(typeof transport!=='function')throw Error('Explicit Clocked transport required');
 const task=nextPlannedTask(plan,checkpoint);if(!task)return {task:null,checkpoint};
 markAttempt(checkpoint,task);
 try{
  const receipt=await transport(task.payload,task);
  if(!receipt||!receipt.response)throw Error('No provider response');
  commitAnswer(checkpoint,task,receipt.response,{credits:receipt.credits??null});
 }catch(e){if(checked(checkpoint,task).status==='IN_FLIGHT')haltUnknown(checkpoint,task,'Provider rejected/failed/timed out; no retry, billing unknown');}
 return {task,checkpoint};
}
