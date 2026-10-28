/** Additive review suggestions. Existing source reviews/operations are never resolved here. */
import {decodeLiteralRequirements,strictUtf8,literalHash,literalTaskTitle} from './literal-requirements.mjs';
import {discoverSourceUnits} from './permit-intelligence.mjs';
import {sourcePointSlice,evaluatePreflight} from './engine.mjs';
export const RECORDED_LITERAL_BUNDLE_SHA256='9f561cf59dc00cb39ed87ce033adb229d958cf6cc009a4bcf990394e134457a8';
const PERMIT='6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c';
const verified=new WeakSet();
function immutable(value){if(value&&typeof value==='object'){Object.values(value).forEach(immutable);Object.freeze(value);}return value;}
const hash=x=>literalHash(JSON.stringify(x));
const from64=value=>{if(typeof value!=='string'||Buffer.from(value,'base64').toString('base64')!==value)throw Error('INVALID_RECORDED_BYTES');return Buffer.from(value,'base64');};
export function validateRecordedLiteralBundle(bytes,decideBytes){
 if(literalHash(bytes)!==RECORDED_LITERAL_BUNDLE_SHA256)throw Error('RECORDED_EXTRACT_BUNDLE_INTEGRITY_FAILED');
 const bundle=JSON.parse(strictUtf8(bytes));
 if(bundle.schema!=='beforeroll-u01-recorded-literal-evidence-v1'||bundle.permitSha256!==PERMIT||literalHash(decideBytes)!==bundle.decideRecordingSha256)throw Error('RECORDED_SOURCE_OR_DECIDE_INTEGRITY_FAILED');
 const permitBytes=from64(bundle.permitBase64),permit=strictUtf8(permitBytes),units=discoverSourceUnits(permit).units;
 if(literalHash(permitBytes)!==PERMIT||bundle.records.length!==3||new Set(bundle.records.map(r=>r.sourceUnit)).size!==3)throw Error('RECORDED_SOURCE_OR_DUPLICATE_RESPONSE');
 const facts=[],fieldStates=[];
 for(const record of bundle.records){
  const files=Object.fromEntries(Object.entries(record.files).map(([name,value])=>[name,from64(value)]));
  const manifest=JSON.parse(strictUtf8(files['evidence-manifest.json']));
  for(const name of ['intent.json','receipt.json','request.body.json','response.body.bin']){
   if(literalHash(files[name])!==manifest.files[name]?.sha256||files[name].length!==manifest.files[name]?.bytes)throw Error('RECORDED_RECEIPT_INTEGRITY_FAILED');
  }
  if(literalHash(files['owner-review.json'])!==record.importValidation.ownerReviewSha256||literalHash(files['evidence-manifest.json'])!==record.importValidation.evidenceManifestSha256)throw Error('RECORDED_REVIEW_INTEGRITY_FAILED');
  const intent=JSON.parse(strictUtf8(files['intent.json'])),receipt=JSON.parse(strictUtf8(files['receipt.json'])),review=JSON.parse(strictUtf8(files['owner-review.json']));
  const unit=units.find(u=>u.id===record.sourceUnit);
  if(!unit||intent.sourceUnit!==unit.id||JSON.stringify(intent.originalPermitRange)!==JSON.stringify([unit.start,unit.end])||intent.sourceSha256!==unit.hash||review.verdict!=='PASS'||review.id!==intent.id)throw Error('RECORDED_UNIT_OR_REVIEW_MISMATCH');
  const result=decodeLiteralRequirements({permitBytes,permitSha256:PERMIT,unit,requestBytes:files['request.body.json'],responseBytes:files['response.body.bin'],
   requestSha256:intent.requestSha256,responseSha256:receipt.responseSha256,receipt,provenance:'OWNER_RECORDED_CLOCKED_EXTRACT'});
  if(result.errors.length)throw Error(result.errors[0]);facts.push(...result.facts);fieldStates.push({unitId:unit.id,fields:result.fieldStates,responseSha256:receipt.responseSha256});
 }
 const evidence={permit,permitSha256:PERMIT,sceneRows:bundle.sceneRows,facts,fieldStates,decide:JSON.parse(strictUtf8(decideBytes)),
  sourceSelection:bundle.sourceSelection,bundleSha256:RECORDED_LITERAL_BUNDLE_SHA256};
 immutable(evidence);verified.add(evidence);return evidence;
}
export function projectCoordinatorTasks(w,{evidence=null,modelRecords=[],problem=null}={}){
 const projection={schema:'beforeroll-coordinator-suggestions-v1',state:'NO_MATCHING_RECORDED_LITERAL_EVIDENCE',candidates:[],warnings:[],fieldStates:[],reviewHistory:[],
  provenance:'OWNER_RECORDED_CLOCKED_EXTRACT',sourceSelection:'RESEARCHER_PRESELECTED_EXPOSED_U01_NOT_AUTONOMOUS',
  issuance:'UNKNOWN',notClearance:true,humanEffortSeconds:null,notice:'Literal facts become proposed human work, never issued permission or proof of fulfillment. Other clauses still require manual review.'};
 projection.reviewHistory=(w.coordinatorTaskReviews??[]).map(r=>{
  const {sha256,...body}=r;if(sha256!==hash(body)||r.decision!=='SUGGESTION_REVIEWED_NOT_FULFILLMENT'||r.notClearance!==true)throw Error('Coordinator review integrity failed');
  return {...r,sourceState:'HISTORICAL_SOURCE_CHANGED'};
 });
 const matching=w.documents.filter(d=>d.sourceHash===PERMIT);
 if(!matching.length)return projection;
 if(problem||!evidence||!verified.has(evidence))return {...projection,state:'PARTIAL_INCOMPLETE_REVIEW',problem:problem??'RECORDED_EXTRACT_EVIDENCE_UNAVAILABLE'};
 if(matching.length!==1)return {...projection,state:'PARTIAL_INCOMPLETE_REVIEW',problem:'AMBIGUOUS_MATCHING_SOURCE_DOCUMENTS'};
 const document=matching[0];
 if(document.revision!==1||(document.analysisEpoch??0)!==0)return {...projection,state:'HISTORICAL_SOURCE_REQUIRES_REASSESSMENT',problem:'Source text returned in a new revision; old suggestions cannot reactivate.'};
 const applicable=[];
 for(const scene of w.callSheet?.scenes??[]){
  const row=sourcePointSlice(w.callSheet.text,scene.source.start,scene.source.end);
  if(!evidence.sceneRows.includes(row)||(scene.sourceEpoch??0)!==0)continue;
  const originalScene=evidence.decide.scenes.find(s=>s.sceneId===scene.id&&s.sceneRow===row);
  if(!originalScene)continue;
  for(const fact of evidence.facts){
   if(fact.unitId==='U003'&&scene.id!=='S47')continue;
   if(fact.unitId!=='U002'&&fact.unitId!=='U003')continue;
   const t=modelRecords.find(t=>t.sceneId===scene.id&&t.documentId===document.id&&t.unitId===fact.unitId&&t.documentHash===PERMIT&&t.sceneHash===literalHash(row));
   const prior=originalScene.scan.results.find(r=>r.clause===fact.sourceSentence);
   if(t?.modelState!=='COMPLETE'||t.modelOrigin!=='OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT'||t.model?.legacyRequestHash!==prior?.requestHash||!(t.model.relevance>=0.8))continue;
   const binding={productionId:w.id,sceneId:scene.id,sceneHash:literalHash(row),sceneEpoch:scene.sourceEpoch??0,documentId:document.id,documentRevision:document.revision,documentEpoch:document.analysisEpoch??0,
    permitSha256:PERMIT,unitId:fact.unitId,field:fact.field,unitRange:fact.unitRange,permitRange:fact.permitRange,requestSha256:fact.requestSha256,responseSha256:fact.responseSha256};
   const candidate={...fact,...binding,id:hash(binding),title:literalTaskTitle(fact),sourceTaskId:t.id,sourceReviewState:'HUMAN_VERIFICATION_REQUIRED',
    applicability:'FIXED_ACCEPTED_U01_ROUTING_WITH_RECORDED_DECIDE_NOT_GENERAL_AUTONOMY',supportCoverage:'INCOMPLETE_OR_UNASSESSED',bundleSha256:evidence.bundleSha256};
   applicable.push(candidate);
  }
  if(scene.id==='S48'){
   const unit=document.units.find(u=>u.id==='U004'),task=modelRecords.find(t=>t.sceneId===scene.id&&t.documentId===document.id&&t.unitId==='U004');
   if(unit&&task?.modelState==='COMPLETE'&&task.modelOrigin==='OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT')projection.warnings.push({sceneId:scene.id,documentId:document.id,unitId:unit.id,quote:unit.text,permitRange:[unit.start,unit.end],sourceTaskId:task.id,
    id:hash([scene.id,document.id,unit.id,PERMIT]),permitSha256:PERMIT,
    state:'UNISSUED_EXTENSION_REQUIRES_DOCUMENTARY_REVIEW',message:'This particular request to extend Scene 47’s exception to Scene 48 was not issued as a signed amendment. Verify whether any other applicable issued authorization exists.',notClearance:true});
  }
 }
 const seen=new Set();projection.candidates=applicable.filter(c=>{const key=JSON.stringify([c.sceneId,c.permitSha256,c.unitId,c.field,c.unitRange]);if(seen.has(key))return false;seen.add(key);return true;});
 projection.reviewHistory=projection.reviewHistory.map(r=>({...r,sourceState:projection.candidates.some(c=>c.id===r.candidateId)?'CURRENT_REVIEW_ONLY':'HISTORICAL_SOURCE_CHANGED'}));
 for(const candidate of projection.candidates)candidate.humanReview=projection.reviewHistory.filter(r=>r.candidateId===candidate.id).at(-1)??null;
 projection.state=projection.candidates.length?'VALIDATED_RECORDED_SUGGESTIONS_NOT_AUTHORITY':'NO_CURRENT_RECORDED_SCENE_APPLICABILITY';
 const deterministic=evaluatePreflight({permitText:evidence.permit,callSheetText:evidence.sceneRows.join('\n'),fields:{}}).findings;
 const clocked=evidence.decide.scenes.flatMap(scene=>scene.scan.results.filter(r=>r.finding.code!=='NO_SEMANTIC_LINK_DETECTED').map(r=>({sceneId:scene.sceneId,
  ...r.finding,quote:r.clause,requestSha256:r.requestHash,provenance:'OWNER_RECORDED_CLOCKED_DECIDE_EARLIER_CONTRACT'})));
 projection.historicalComparison={originalDecideCalls:8,clockedFindings:clocked,aiOffFindings:deterministic,
  originalOpenReviewQuestions:[...deterministic.map(f=>({...f,lane:'AI_OFF'})),...clocked.map(f=>({...f,lane:'RECORDED_DECIDE'}))],
  status:'HISTORICAL_COMPARISON_NOT_CURRENT_DECISION_STATUS',humanEffortSeconds:null,sourceSelectionAutonomyDemonstrated:false};
 projection.fieldStates=evidence.fieldStates;return projection;
}
export function recordCoordinatorSuggestionReview(w,projection,{candidateId,sceneId,reviewer,reason,attestedReview}){
 const c=projection?.candidates.find(c=>c.id===candidateId&&c.sceneId===sceneId);
 if(!c||attestedReview!==true||typeof reviewer!=='string'||!reviewer.trim()||reviewer.length>150||typeof reason!=='string'||!reason.trim()||reason.length>3000)throw Error('Current source suggestion, named reviewer, rationale and affirmative review required');
 const record={sequence:(w.coordinatorTaskReviews?.length??0)+1,candidateId:c.id,sceneId:c.sceneId,source:structuredClone(c),reviewer:reviewer.trim(),reason:reason.trim(),
  decision:'SUGGESTION_REVIEWED_NOT_FULFILLMENT',at:new Date().toISOString(),workspaceRevision:w.revision,notClearance:true};
 // Do not nest earlier human history inside each new source reference.
 delete record.source.humanReview;
 w.coordinatorTaskReviews??=[];w.coordinatorTaskReviews.push({...record,sha256:hash(record)});w.revision++;return w;
}
