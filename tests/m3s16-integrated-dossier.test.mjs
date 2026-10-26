import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {createProduction,addDocument,setCallSheet,reviseDocument,recordReview} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {buildProductionDossier,dossierMarkdown} from '../src/production-dossier.mjs';
import {annotateAuthorityDocument,recordAuthorityLink} from '../src/document-authority.mjs';
import {recordSceneAuthority} from '../src/scene-authority.mjs';
import {recordSceneSchedule,recordCondition,decideCondition} from '../src/production-operations.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createAppServer} from '../server.mjs';
const NOW='2026-10-25T12:00:00.000Z';
const source='No drones.\n\nTwo licensed stewards must remain at the west exit.\n\nScene 7 only: signed drone permission on protective conditions.';
const sheet='Scene 7 | West Exit | 08:00-09:30 | Drone sweep\nScene 8 | West Exit | 11:00-12:00 | Dolly pass';
const fixture=()=>{const w=createProduction({id:'project16',title:'West exit production'});addDocument(w,{id:'P',name:'West exit permit',text:source});setCallSheet(w,sheet);return w;};
const dossier=(w,modelEvidence=null)=>buildProductionDossier(w,{persistedVersion:1,asOf:NOW,modelEvidence});
const fake=async()=>({response:{answers:{activity_link:{type:'noul',noul:0.965},granted_for_scene:{type:'noul',noul:0.015}}},credits:1});
async function setup(){const directory=await mkdtemp(path.join(os.tmpdir(),'beforeroll-s16-'));return {directory,repo:createWorkspaceStore({directory}),engine:createDurableExecution({directory}),clean:()=>rm(directory,{force:true,recursive:true})};}
test('empty project becomes a blocked, explicitly not-cleared evidence inventory rather than a false success',()=>{
 const w=createProduction({id:'empty16',title:'Empty'});const d=dossier(w);
 assert.equal(d.productionState,'OPEN_REVIEW_ITEMS');assert.equal(d.counts.planTasks,0);assert.equal(d.outstanding[0].code,'PLAN_BLOCKED');
 assert.equal(d.notClearance,true);assert.match(dossierMarkdown(d),/NOT FILMING CLEARANCE/);
});
test('multi-scene dossier includes every discovered clause, exact original scene row, and unattempted model statuses',()=>{
 const w=fixture(),d=dossier(w);assert.equal(d.scenes.length,2);assert.equal(d.counts.planTasks,6);
 assert.equal(d.counts.unattemptedChecks,6);assert.equal(d.counts.currentReviewedTasks,0);
 assert.match(d.scenes[0].originalRow,/Scene 7/);assert.equal(d.scenes[0].taskIds.length,3);
 assert.equal(d.sourceDocuments[0].sourceSha256.length,64);assert.equal(d.sceneTasks[0].quote,'No drones.');
 assert.equal(d.sceneTasks[0].modelOrigin,'NO_MODEL_RECORDING');
});
test('human review actions are task-bound; editing a source retires previous human decisions from current status',()=>{
 const w=fixture(),p=planIntelligence(w);recordReview(w,{evidenceId:p.tasks[0].id,decision:'ACKNOWLEDGED',reviewer:'Producer',reason:'Must verify permit'});
 let d=dossier(w);assert.equal(d.counts.currentReviewedTasks,1);assert.equal(d.counts.staleHumanReviews,0);
 reviseDocument(w,'P',source+'\n\nNo pyrotechnics.');d=dossier(w);
 assert.equal(d.counts.currentReviewedTasks,0);assert.equal(d.counts.staleHumanReviews,1);
 assert.equal(d.reviewActions.length,1);assert(d.outstanding.some(x=>x.code==='STALE_HISTORICAL_EVIDENCE_PRESENT'));
});
test('scene-specific human scope claims and dated operational prerequisites are joined without elevating them to permission',()=>{
 const w=fixture();recordSceneSchedule(w,{sceneId:'S7',date:'2026-10-26',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'AD',reason:'Production schedule'});
 recordSceneAuthority(w,{sceneId:'S7',documentId:'P',unitId:w.documents[0].units[0].id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'AD',reason:'Relevant drone clause'});
 recordCondition(w,{sceneId:'S7',documentId:'P',unitId:w.documents[0].units[1].id,title:'Confirm stewards',reviewer:'AD',reason:'Pending staffing'});
 const id=w.conditions[0].id;decideCondition(w,{conditionId:id,decision:'BLOCKED',reviewer:'AD',reason:'Steward not booked'});
 const d=dossier(w);assert.equal(d.counts.currentSceneScopeAssertions,1);assert.equal(d.counts.openPrerequisites,1);
 assert.equal(d.scenes[0].schedule.scheduleState,'DATED_HUMAN_PLAN_NOT_AUTHORITY');
 assert(d.scenes[0].issues.includes('OPERATIONAL_PREREQUISITES_OPEN'));assert.equal(d.sceneScopeClaims[0].quote,'No drones.');
 assert.equal(d.operations.conditions[0].decision,'BLOCKED');assert.equal(d.notClearance,true);
});
test('documentary amendments and conflicts remain human-recorded unverified source assertions',()=>{
 const w=fixture();addDocument(w,{id:'A',name:'Addendum',text:'This addendum conflicts with prior west exit rules.'});
 annotateAuthorityDocument(w,{documentId:'P',role:'PERMIT',reference:'WR-1',issuer:'Site',reviewer:'AD',reason:'Entered from document'});
 const unit=w.documents.find(d=>d.id==='A').units[0];recordAuthorityLink(w,{fromId:'A',toId:'P',kind:'CONFLICTS_WITH',start:unit.start,end:unit.end,quote:unit.text,reviewer:'AD',reason:'Explicit conflict'});
 const d=dossier(w);assert.equal(d.documentaryLinks[0].status,'HUMAN_ASSERTED_UNVERIFIED');
 assert.equal(d.counts.unverifiedDocumentConflicts,1);assert(d.outstanding.some(x=>x.code==='UNVERIFIED_DOCUMENT_CONFLICTS'));
});
test('provider-recorded project checkpoints feed a complete model evidence packet but never become authorization',async()=>{
 const s=await setup();try{
  const w=fixture(),p=planIntelligence(w);await s.engine.runBatch({workspace:w,plan:p,maxCalls:32,operatorAuthorized:true,transport:fake});
  const modelEvidence=await s.engine.exportEvidence(p),d=dossier(w,modelEvidence);
  assert.equal(d.counts.completedModelChecks,p.plannedCalls);assert.equal(d.counts.unattemptedChecks,0);
  assert.equal(d.modelExecution.attempts,p.plannedCalls);assert.equal(d.modelExecution.knownSourceEvidenceOnly,true);
  assert.equal(d.sceneTasks[0].modelState,'COMPLETE');assert.equal(d.sceneTasks[0].modelOrigin,'LOCAL_OWNER_RUN_NOT_CRYPTOGRAPHICALLY_ATTESTED');
  assert(d.scenes[0].issues.includes('SOURCE_TASKS_AWAIT_HUMAN_REVIEW'));assert.equal(d.notClearance,true);
  assert.match(dossierMarkdown(d),/Clocked result:/);
 }finally{await s.clean();}
});
test('partial execution shows unanswered tasks; no result is fabricated for the rest',async()=>{
 const s=await setup();try{
  const w=fixture(),p=planIntelligence(w);await s.engine.runBatch({workspace:w,plan:p,maxCalls:2,operatorAuthorized:true,transport:fake});
  const d=dossier(w,await s.engine.exportEvidence(p));assert.equal(d.counts.completedModelChecks,2);
  assert.equal(d.counts.unattemptedChecks,4);assert.equal(d.sceneTasks[2].modelState,'NOT_ATTEMPTED');
  assert(d.outstanding.some(x=>x.code==='MODEL_SOURCE_CHECKS_OUTSTANDING'));
 }finally{await s.clean();}
});
test('billing-unknown record is retained, visible and never mislabeled as not attempted',async()=>{
 const s=await setup();try{
  const w=fixture(),p=planIntelligence(w);
  await s.engine.runBatch({workspace:w,plan:p,maxCalls:3,operatorAuthorized:true,transport:async()=>{throw Error('Provider timed out');}});
  const d=dossier(w,await s.engine.exportEvidence(p));assert.equal(d.counts.uncertainModelChecks,1);
  assert.equal(d.counts.completedModelChecks,0);assert.equal(d.sceneTasks[0].modelState,'BILLING_UNKNOWN');
  assert(d.scenes[0].issues.includes('MODEL_EXECUTION_BILLING_OR_RESPONSE_UNCERTAIN'));
 }finally{await s.clean();}
});
test('mismatched model evidence is rejected instead of being rebased onto a changed source',async()=>{
 const s=await setup();try{
  const w=fixture(),p=planIntelligence(w);await s.engine.runBatch({workspace:w,plan:p,maxCalls:1,operatorAuthorized:true,transport:fake});
  const evidence=await s.engine.exportEvidence(p);reviseDocument(w,'P',source+'\n\nNo stunts.');
  assert.throws(()=>dossier(w,evidence),/does not bind the current source plan/);
 }finally{await s.clean();}
});
test('dossier rejects corrupted version, noncanonical asOf, and mutated fingerprint before Markdown',()=>{
 const w=fixture();assert.throws(()=>buildProductionDossier(w,{persistedVersion:0,asOf:NOW}),/version/);
 assert.throws(()=>buildProductionDossier(w,{persistedVersion:1,asOf:'Oct 25'}),/asOf/);
 const d=dossier(w);d.counts.planTasks=9999;assert.throws(()=>dossierMarkdown(d),/fingerprint/);
});
test('dossier carries every task beyond pagination 100; no silent omission in complete JSON or Markdown',()=>{
 const w=fixture();const many=Array.from({length:52},(_,i)=>`Original rule ${i}: Access conditions must be checked for activity.`).join('\n\n');
 reviseDocument(w,'P',many);const d=dossier(w);assert.equal(d.counts.planTasks,104);assert.equal(d.sceneTasks.length,104);
 assert.equal(d.scenes[1].taskIds.length,52);assert.equal(dossierMarkdown(d).split('SHA-256').length>100,true);
});
test('local-owner HTTP routes return full JSON, concise summary and actual Markdown, all no clearance',async()=>{
 const s=await setup();const w=fixture();await s.repo.persist(w,{expectedVersion:0});
 const server=createAppServer({workspaceStore:s.repo,executionStore:s.engine});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/workspaces/project16/dossier`;
 try{
  const full=await fetch(base),d=await full.json();assert.equal(full.status,200);assert.equal(d.counts.planTasks,6);
  assert.equal(d.notClearance,true);assert.match(full.headers.get('content-disposition'),/INTEGRATED_EVIDENCE/);
  const summary=await (await fetch(base+'/summary')).json();assert.equal(summary.counts.planTasks,6);assert.equal(summary.scenes.length,2);assert.equal('sceneTasks' in summary,false);
  const md=await fetch(base+'/markdown');assert.equal(md.status,200);assert.match(md.headers.get('content-type'),/text\/markdown/);
  assert.match(await md.text(),/NO filming clearance inferred/);
  const missing=await fetch(base+'?asOf=bad');assert.equal(missing.status,422);
  const privateAttempt=await fetch(base,{headers:{Origin:'https://not-before-roll.example'}});assert.equal(privateAttempt.status,403);
 }finally{await new Promise(resolve=>server.close(resolve));await s.clean();}
});
test('the unified desk exposes review counts and two export actions without publishing secret or source evidence',async()=>{
 const {productionView,createWorkspaceController}=await import('../public/workspace-desk.mjs');
 const html=productionView({workflowStage:'evidence',selected:{version:1,workspace:fixture()},items:[],dossier:{counts:{completedModelChecks:2,planTasks:6,currentReviewedTasks:1},outstanding:[{code:'MODEL_SOURCE_CHECKS_OUTSTANDING',count:4}],scenes:[]}});
 assert.match(html,/Export complete evidence pack/);assert.match(html,/Export human-readable review/);
 assert.match(html,/2\/6/);assert.match(html,/Source analysis remains/);
 assert.doesNotMatch(html,/CLOCKED_API_KEY|BEFOREROLL_OPERATOR_TOKEN/);
 assert.equal(typeof createWorkspaceController,'function');
});
test('archived Clocked runs are counted but their results never appear as current after source replacement',async()=>{
 const s=await setup();try{
  const w=fixture(),original=planIntelligence(w);await s.engine.runBatch({workspace:w,plan:original,maxCalls:2,operatorAuthorized:true,transport:fake});
  reviseDocument(w,'P',source+'\n\nNo smoke machines.');const next=planIntelligence(w),status=await s.engine.status(next,{offset:0,limit:1});
  assert.equal(status.archivedRuns,1);assert.equal(status.attempts,0);
  const d=buildProductionDossier(w,{persistedVersion:3,asOf:NOW,executionSummary:status});
  assert.equal(d.counts.archivedModelRuns,1);assert.equal(d.counts.completedModelChecks,0);
  assert(d.outstanding.some(x=>x.code==='ARCHIVED_MODEL_RUNS_FROM_OTHER_SOURCE_PLAN'));
  assert.equal(d.modelExecution.origin,'NO_CURRENT_MODEL_RECORDING');
 }finally{await s.clean();}
});
test('pending PDF transcription blocks all current source-scene planning and cannot become assumed model completion',()=>{
 const w=fixture(),doc=w.documents[0];
 doc.importReceipt={sourceFormat:'PDF_CONSERVATIVE_TYPE1_TEXT_V1',requiresHumanTextReview:true,rawHash:'a'.repeat(64),normalizedHash:doc.sourceHash,sourceHash:doc.sourceHash};
 const d=dossier(w);assert.equal(d.counts.unresolvedPdfTranscriptions,1);assert.equal(d.counts.planTasks,0);
 assert(d.outstanding.some(x=>x.code==='PDF_TRANSCRIPTION_UNREVIEWED'));
 assert(d.outstanding.some(x=>x.code==='PLAN_BLOCKED'));
 assert.equal(d.scenes[0].readiness,'OUTSTANDING_REVIEW');
});
test('stale human scene claims retain history but do not count as current activity permission',()=>{
 const w=fixture();const sourceUnit=w.documents[0].units[0];
 recordSceneAuthority(w,{sceneId:'S7',documentId:'P',unitId:sourceUnit.id,kind:'CONDITIONAL_GRANT_CLAIM',scope:'EXACT_SCENE',reviewer:'AD',reason:'Requires signature audit'});
 assert.equal(dossier(w).counts.currentSceneScopeAssertions,1);
 setCallSheet(w,sheet.replace('Drone sweep','Revised drone sweep'));
 const d=dossier(w);assert.equal(d.counts.currentSceneScopeAssertions,0);assert.equal(d.counts.staleSceneScopeAssertions,1);
 assert.equal(d.sceneScopeClaims[0].sourceState,'STALE_SOURCE_OR_SCENE');assert.equal(d.notClearance,true);
});

test('OPEN/ACKNOWLEDGED/NEEDS_SOURCE human states never make outstanding review disappear',()=>{
 const w=fixture(),p=planIntelligence(w);
 recordReview(w,{evidenceId:p.tasks[0].id,reviewer:'AD',decision:'NEEDS_SOURCE',reason:'Not signed'});
 recordReview(w,{evidenceId:p.tasks[1].id,reviewer:'AD',decision:'ACKNOWLEDGED',reason:'Saw original'});
 let d=dossier(w);assert.equal(d.counts.currentReviewedTasks,2);assert.equal(d.counts.currentUnresolvedHumanReviews,2);
 assert(d.scenes[0].issues.includes('HUMAN_REVIEW_DECISIONS_STILL_OPEN'));
 recordReview(w,{evidenceId:p.tasks[0].id,reviewer:'AD',decision:'RESOLVED_BY_HUMAN',reason:'Separately resolved, not clearance'});
 d=dossier(w);assert.equal(d.counts.currentUnresolvedHumanReviews,1);
 assert.equal(d.notClearance,true);
});
