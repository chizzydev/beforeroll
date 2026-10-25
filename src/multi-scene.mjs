// M3-S4: bounded, source-identity-preserving multi-scene planning.
// This module DOES NOT infer semantic links or fabricate model answers.
import {sweepCandidatePlan} from './semantic-sweep.mjs';
import {sha256} from './semantic.mjs';
export const MAX_MULTI_SCENES = 2;
export const MAX_MULTI_CALLS = 8;
export function planMultiSceneBatch(input){
 if(!input || typeof input.permitText!=='string'||!Array.isArray(input.scenes))throw Error('Provide permitText and an explicit scene list');
 if(input.scenes.length<2||input.scenes.length>MAX_MULTI_SCENES)throw Error('Multi-scene pilot requires exactly two original scene rows');
 const seen=new Set();let total=0;
 const planned=input.scenes.map((scene)=>{
  if(!scene||typeof scene.sceneId!=='string'||typeof scene.sceneRow!=='string')throw Error('Each scene requires id and exact source row');
  const m=/^\s*Scene\s+(\d+)\s*\|/.exec(scene.sceneRow);
  if(!m||scene.sceneId!==`S${m[1]}`||seen.has(scene.sceneId))throw Error('Duplicated, unsupported or mismatched scene identity');
  seen.add(scene.sceneId);
  const clauses=sweepCandidatePlan(input.permitText,scene.sceneRow);
  total+=clauses.length;
  return {sceneId:scene.sceneId,sceneRow:scene.sceneRow,sceneHash:sha256(scene.sceneRow),clauses};
 });
 if(total>MAX_MULTI_CALLS)throw Error(`This bounded multi-scene pilot allows up to ${MAX_MULTI_CALLS} calls, not ${total}. No truncated scan was sent.`);
 return {permitText:input.permitText,permitHash:sha256(input.permitText),scenes:planned,totalCalls:total};
}
export function validateBatchEnvelopeShape(envelope,plan){
 if(!envelope || envelope.source!=='live-clocked-decide-multi-scene'||envelope.endpoint!=='decide'||envelope.notClearance!==true||envelope.interpretationScope!=='SEGMENTED_CLAUSES_PER_SCENE_NOT_COMPLETE_PERMIT_AUTHORITY')throw Error('Unexpected multi-scene response contract');
 if(envelope.permitHash!==plan.permitHash||!Array.isArray(envelope.scenes)||envelope.scenes.length!==plan.scenes.length)throw Error('Batch identity mismatch');
 if(!Number.isInteger(envelope.attempts)||envelope.attempts<0||envelope.attempts>plan.totalCalls||envelope.totalPlannedCalls!==plan.totalCalls)throw Error('Batch request count invalid');
 if(!Number.isInteger(envelope.observedKnownCredits)||envelope.observedKnownCredits<0||envelope.reportedCredits!==null&&(!Number.isInteger(envelope.reportedCredits)||envelope.reportedCredits<0))throw Error('Batch credits invalid');
 let complete=0,processed=0,unattempted=false;
 for(let i=0;i<plan.scenes.length;i++){
  const actual=envelope.scenes[i],expected=plan.scenes[i];
  if(!actual||actual.sceneId!==expected.sceneId||actual.sceneRow!==expected.sceneRow||actual.sceneHash!==expected.sceneHash)throw Error('Batch scene identity/order mismatch');
  if(actual.scan===null){unattempted=true; if(actual.status!=='NOT_EVALUATED')throw Error('Missing scan must say not evaluated');continue;}
  if(unattempted||!['COMPLETE','PARTIAL'].includes(actual.status))throw Error('Batch results skipped a scene or invalid status');
  if(actual.scan.sceneHash!==expected.sceneHash||actual.scan.permitHash!==plan.permitHash)throw Error('Nested source hashes mismatch');
  processed+=actual.scan.attempts;
  if(actual.status==='COMPLETE'){if(!actual.scan.complete)throw Error('Scene falsely marked complete');complete++;}
  else {if(actual.scan.complete)throw Error('Partial scene falsely marked complete');unattempted=true;}
 }
 if(processed!==envelope.attempts||Boolean(envelope.complete)!==(complete===plan.scenes.length))throw Error('Batch completeness/counts invalid');
 if(envelope.complete&&envelope.error!==null)throw Error('Completed batch cannot contain an error');
 return true;
}
