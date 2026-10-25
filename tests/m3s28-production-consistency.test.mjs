import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
import {createAppServer} from '../server.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createProduction,addDocument,setCallSheet,recordReview,reviseDocument} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {buildProductionDossier} from '../src/production-dossier.mjs';
import {buildProductionActions} from '../src/production-actions.mjs';
import {buildSceneWorkbench} from '../src/scene-workbench.mjs';
import {buildProductionJourney} from '../src/production-journey.mjs';
import {certifyProductionConsistency} from '../src/production-consistency.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const PERMIT='No drones.\n\nKeep the fire exit clear.\n\nA specific issued variation would require separate verification.';
const SHEET='Scene 1 | West Gate | 09:00-10:00 | Remote drone\nScene 2 | Main Hall | 11:00-12:00 | Camera on wheeled dolly';
const REVISED=PERMIT+'\n\nNo wheeled cameras on historic floors.';
const asOf='2026-10-25T13:00:00.000Z';
const make=()=>{const w=createProduction({id:'S28prod',title:'Unified evidence'});addDocument(w,{id:'PERMIT',name:'Signed original claimed',text:PERMIT});setCallSheet(w,SHEET);return w;};
const cert=(w,d,extra={})=>certifyProductionConsistency(w,d,{persistedVersion:1,...extra});
const fakeClocked=()=>({ok:true,headers:new Headers({'x-clocked-credits':'2'}),json:async()=>({answers:{activity_link:{type:'noul',noul:.96},granted_for_scene:{type:'noul',noul:.03}}})});
const lab=async()=>{const directory=await mkdtemp(path.join(os.tmpdir(),'beforeroll-s28-'));
 const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory});let calls=0;
 const server=createAppServer({workspaceStore:store,executionStore:execution,enabled:true,apiKey:'test-fixture-not-real',operatorToken:'test-token',fetchImpl:async()=>{calls++;return fakeClocked();}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base=`http://127.0.0.1:${server.address().port}`;
 const get=async route=>{const r=await fetch(base+route);return {code:r.status,body:await r.json(),headers:r.headers};};
 const post=async(route,body,headers={})=>{const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});return {code:r.status,body:await r.json()};};
 return {store,execution,calls:()=>calls,get,post,close:async()=>{await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}};
};
async function imported(l){let r=await l.post('/api/workspaces',{id:'S28prod',title:'Unified evidence'});assert.equal(r.code,201);let version=r.body.version;
 r=await l.post('/api/workspaces/S28prod/import',{expectedVersion:version,documentId:'PERMIT',file:{kind:'permit',name:'original.txt',text:PERMIT}});assert.equal(r.code,200,r.body.error);version=r.body.version;
 r=await l.post('/api/workspaces/S28prod/import',{expectedVersion:version,file:{kind:'callSheet',name:'schedule.txt',text:SHEET}});assert.equal(r.code,200,r.body.error);return r.body.version;}
const endpoint='/api/workspaces/S28prod';
test('a single current source plan reconciles original quotes, scene totals and human/model partitions',()=>{
 const w=make(),d=buildProductionDossier(w,{persistedVersion:1,asOf});const c=cert(w,d);
 assert.equal(c.currentSourceInventory.sourcePlanTasks,6);assert.equal(c.currentEvidence.modelPending,6);
 assert.equal(c.currentEvidence.humanReviewed,0);assert.equal(c.historicalEvidence.humanReviews,0);
 assert.equal(c.notClearance,true);assert.match(c.sha256,/^[0-9a-f]{64}$/);
});
test('an altered source identity is rejected even when the dossier SHA-256 is recomputed',()=>{
 const w=make(),d=buildProductionDossier(w,{persistedVersion:1,asOf});const changed=structuredClone(d);
 changed.sceneTasks[1].quote='No authorizations required.';const {sha256,...rest}=changed;changed.sha256=sha(rest);
 assert.throws(()=>cert(w,changed),/consistency failure: plan task 1 source quotation/);
});
test('forged current review and stale history cannot be reclassified as a current decision',()=>{
 const w=make(),plan=planIntelligence(w);recordReview(w,{evidenceId:plan.taskIds[0],decision:'OPEN',reason:'Still waiting for film coordinator',reviewer:'Human'});
 const d=buildProductionDossier(w,{persistedVersion:1,asOf});assert.equal(cert(w,d).currentEvidence.humanReviewed,1);
 const malformed=structuredClone(d);malformed.currentTaskReviews[0].decision='RESOLVED_BY_HUMAN';const {sha256,...rest}=malformed;malformed.sha256=sha(rest);
 assert.throws(()=>cert(w,malformed),/current review is not the latest recorded decision/);
 reviseDocument(w,'PERMIT',REVISED);
 const stale=buildProductionDossier(w,{persistedVersion:1,asOf});const c=cert(w,stale);
 assert.equal(c.currentEvidence.humanReviewed,0);assert.equal(c.historicalEvidence.humanReviews,1);
});
test('cross-view reconciliation rejects inconsistent action, scene, journey and overview projections',()=>{
 const w=make(),d=buildProductionDossier(w,{persistedVersion:1,asOf});
 const queue=buildProductionActions(d),workbench=buildSceneWorkbench(d,{sceneId:'S1'}),journey=buildProductionJourney(d);
 assert.equal(cert(w,d,{queue,workbench,journey}).currentSourceInventory.scenes,2);
 const brokenQ=structuredClone(queue);brokenQ.actions[0].sceneId='FORGED_SCENE';assert.throws(()=>cert(w,d,{queue:brokenQ}),/action queue refers to missing scene/);
 const brokenW=structuredClone(workbench);brokenW.summary.planned++;assert.throws(()=>cert(w,d,{workbench:brokenW}),/workbench scene total/);
 const brokenJ=structuredClone(journey);brokenJ.dossierSha256='0'.repeat(64);assert.throws(()=>cert(w,d,{journey:brokenJ}),/journey dossier differs/);
 const forgedOverview={version:1,plannedCalls:6,reviewedCount:0,pagination:{shown:1},tasks:[{id:d.sceneTasks[0].id,status:'CLOCKED_EVALUATED',humanReview:null}]};
 assert.throws(()=>cert(w,d,{overview:forgedOverview}),/overview model state/);
});
test('original source custody refuses forged missing/preserved counts and unrelated binary identities',()=>{
 const w=make(),d=buildProductionDossier(w,{persistedVersion:1,asOf});const originals={productionId:w.id,persistedVersion:1,referenced:0,preserved:0,missingOriginalSha256:[],files:[]};
 assert.equal(cert(w,d,{originals}).originals.referenced,0);
 assert.throws(()=>cert(w,d,{originals:{...originals,preserved:1}}),/custody preserved \+ missing/);
});
test('the HTTP workflow, separate certificate and reviewed evidence export have an identical source version and dossier SHA',async()=>{
 const l=await lab();try{const version=await imported(l);const flow=await l.get(endpoint+'/workflow');assert.equal(flow.code,200,flow.body.error);
  const x=flow.body;assert.equal(x.consistency.dossierSha256,x.dossierSha256);assert.equal(x.consistency.persistedVersion,version);
  assert.equal(x.consistency.originals.referenced,2);assert.equal(x.consistency.originals.missing,0);
  assert.equal(x.consistency.currentEvidence.modelPending,6);
  const p=`?asOf=${encodeURIComponent(x.asOf)}&expectedVersion=${version}&expectedDossierSha256=${x.dossierSha256}`;
  const independent=await l.get(endpoint+'/consistency'+p);assert.equal(independent.code,200,independent.body.error);
  assert.equal(independent.body.sha256,x.consistency.sha256);
  const dossier=await l.get(endpoint+'/dossier'+p);assert.equal(dossier.code,200,dossier.body.error);
  assert.equal(dossier.body.sha256,x.dossierSha256);
  assert.equal(dossier.headers.get('x-beforeroll-consistency-sha256'),x.consistency.sha256);
  assert.equal(l.calls(),0);
 }finally{await l.close();}
});
test('a Clocked settlement and subsequent human review reconcile without changing the underlying source plan',async()=>{
 const l=await lab();try{let version=await imported(l);const before=(await l.get(endpoint+'/workflow')).body;
  const run=await l.post(endpoint+'/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:2},{'X-Operator-Token':'test-token'});
  assert.equal(run.code,200,run.body.error);assert.equal(run.body.completed,2);
  const mid=(await l.get(endpoint+'/workflow')).body;
  assert.equal(mid.consistency.currentEvidence.modelComplete,2);assert.equal(mid.consistency.currentEvidence.modelPending,4);
  assert.equal(mid.consistency.persistedVersion,version);assert.notEqual(before.dossierSha256,mid.dossierSha256);
  const task=mid.overview.tasks[0];const r=await l.post(endpoint+'/review-task',{expectedVersion:version,evidenceId:task.id,decision:'OPEN',reason:'Verify original restriction with the location manager',reviewer:'Coordinator'});
  assert.equal(r.code,200,r.body.error);version=r.body.version;
  const after=(await l.get(endpoint+'/workflow')).body;
  assert.equal(after.consistency.currentEvidence.modelComplete,2);assert.equal(after.consistency.currentEvidence.humanReviewed,1);
  assert.equal(after.consistency.currentEvidence.openHumanReviews,1);assert.equal(after.consistency.currentEvidence.modelPending,4);
  assert.equal(after.consistency.persistedVersion,version);assert.equal(l.calls(),2);
  assert.equal((await l.get(endpoint+'/consistency?expectedDossierSha256='+before.dossierSha256)).code,409);
 }finally{await l.close();}
});
test('source replacement atomically reclassifies current model and human evidence as historical without deleting records',async()=>{
 const l=await lab();try{let version=await imported(l);
  const started=await l.post(endpoint+'/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:6},{'X-Operator-Token':'test-token'});assert.equal(started.code,200,started.body.error);
  const b=(await l.get(endpoint+'/workflow')).body;assert.equal(b.consistency.currentEvidence.modelComplete,6);
  const first=b.overview.tasks[0];const review=await l.post(endpoint+'/review-task',{expectedVersion:version,evidenceId:first.id,decision:'RESOLVED_BY_HUMAN',reason:'Recorded source review only; not a clearance',reviewer:'Coordinator'});
  assert.equal(review.code,200,review.body.error);version=review.body.version;
  const reviewed=(await l.get(endpoint+'/workflow')).body;assert.equal(reviewed.consistency.currentEvidence.humanReviewed,1);
  const changed={kind:'permit',name:'revised.txt',text:REVISED};
  const preview=await l.post(endpoint+'/impact',{expectedVersion:version,documentId:'PERMIT',file:changed});assert.equal(preview.code,200,preview.body.error);
  const commit=await l.post(endpoint+'/commit-source-change',{expectedVersion:version,documentId:'PERMIT',file:changed,previewSha256:preview.body.previewSha256});assert.equal(commit.code,200,commit.body.error);version=commit.body.version;
  const after=(await l.get(endpoint+'/workflow')).body;
  assert.equal(after.version,version);assert.equal(after.consistency.currentEvidence.modelComplete,0);
  assert.equal(after.consistency.currentEvidence.humanReviewed,0);assert.equal(after.consistency.historicalEvidence.humanReviews,1);
  assert.equal(after.consistency.historicalEvidence.archivedModelRuns,1);
  assert.equal(after.consistency.originals.referenced,3);assert.equal(after.consistency.originals.preserved,3);
  assert.equal(after.execution.completed,0);assert.equal(after.journey.checkpoints.find(x=>x.id==='analysis').status,'ATTENTION');
  assert.equal(l.calls(),6,'revision and all consistency checks have zero new Clocked calls');
  const stale=await l.get(endpoint+'/consistency?asOf='+encodeURIComponent(reviewed.asOf)+'&expectedVersion='+reviewed.version+'&expectedDossierSha256='+reviewed.dossierSha256);
  assert.equal(stale.code,409);
  const current=await l.get(endpoint+`/consistency?asOf=${encodeURIComponent(after.asOf)}&expectedVersion=${version}&expectedDossierSha256=${after.dossierSha256}`);
  assert.equal(current.code,200,current.body.error);assert.equal(current.body.sha256,after.consistency.sha256);
 }finally{await l.close();}
});
test('changed source evidence is never returned as a silently current reviewed export',async()=>{
 const l=await lab();try{let version=await imported(l);const b=(await l.get(endpoint+'/workflow')).body;
  const newCallSheet={kind:'callSheet',name:'rescheduled.txt',text:'Scene 1 | West Gate | 15:00-16:00 | Remote drone\nScene 2 | Main Hall | 11:00-12:00 | Camera on wheeled dolly'};
  const preview=await l.post(endpoint+'/impact',{expectedVersion:version,documentId:null,file:newCallSheet});assert.equal(preview.code,200,preview.body.error);
  const r=await l.post(endpoint+'/commit-source-change',{expectedVersion:version,documentId:null,file:newCallSheet,previewSha256:preview.body.previewSha256});assert.equal(r.code,200,r.body.error);version=r.body.version;
  const q=`?asOf=${encodeURIComponent(b.asOf)}&expectedVersion=${b.version}&expectedDossierSha256=${b.dossierSha256}`;
  assert.equal((await l.get(endpoint+'/dossier'+q)).code,409);
  assert.equal((await l.get(endpoint+'/consistency'+q)).code,409);
  const now=(await l.get(endpoint+'/workflow')).body;assert.equal(now.consistency.currentSourceInventory.scenes,2);
  assert.notEqual(now.dossierSha256,b.dossierSha256);assert.equal(l.calls(),0);
 }finally{await l.close();}
});
test('reverting a revised permit never resurrects previously closed human decisions or Clocked task identities',()=>{
 const w=make(),first=planIntelligence(w);recordReview(w,{evidenceId:first.taskIds[0],decision:'RESOLVED_BY_HUMAN',reason:'Human checked old signed text only',reviewer:'Coordinator'});
 reviseDocument(w,'PERMIT',REVISED);const middle=planIntelligence(w);
 assert.notEqual(middle.taskIds[0],first.taskIds[0]);
 reviseDocument(w,'PERMIT',PERMIT);const returned=planIntelligence(w);
 assert.notEqual(returned.taskIds[0],first.taskIds[0],'returning to byte-identical normalized permit text is a distinct source revision');
 assert.notEqual(returned.taskIds[0],middle.taskIds[0]);
 const dossier=buildProductionDossier(w,{persistedVersion:1,asOf});const c=cert(w,dossier);
 assert.equal(c.currentEvidence.humanReviewed,0);assert.equal(c.historicalEvidence.humanReviews,1);
});
test('editing one call-sheet row retires only its source tasks, and returning the row does not revive old reviews',()=>{
 const w=make(),first=planIntelligence(w),original1=first.tasks.filter(t=>t.sceneId==='S1').map(t=>t.id),original2=first.tasks.filter(t=>t.sceneId==='S2').map(t=>t.id);
 recordReview(w,{evidenceId:original1[0],decision:'RESOLVED_BY_HUMAN',reason:'Previous schedule only',reviewer:'Coordinator'});
 recordReview(w,{evidenceId:original2[0],decision:'RESOLVED_BY_HUMAN',reason:'Unchanged scene reviewed',reviewer:'Coordinator'});
 const changed='Scene 1 | West Gate | 15:00-16:00 | Remote drone\nScene 2 | Main Hall | 11:00-12:00 | Camera on wheeled dolly';
 setCallSheet(w,changed);const after=planIntelligence(w);
 assert.notDeepEqual(after.tasks.filter(t=>t.sceneId==='S1').map(t=>t.id),original1);
 assert.deepEqual(after.tasks.filter(t=>t.sceneId==='S2').map(t=>t.id),original2,'unaffected scene should retain task identity');
 assert.equal(buildProductionDossier(w,{persistedVersion:1,asOf}).counts.currentReviewedTasks,1);
 setCallSheet(w,SHEET);const restored=planIntelligence(w);
 assert.notDeepEqual(restored.tasks.filter(t=>t.sceneId==='S1').map(t=>t.id),original1);
 assert.deepEqual(restored.tasks.filter(t=>t.sceneId==='S2').map(t=>t.id),original2);
 const c=cert(w,buildProductionDossier(w,{persistedVersion:1,asOf}));
 assert.equal(c.currentEvidence.humanReviewed,1);assert.equal(c.historicalEvidence.humanReviews,1);
});
test('restoring an omitted scene ID after a call-sheet removal is a distinct source-identity lifecycle',()=>{
 const w=make(),old=planIntelligence(w).tasks.filter(t=>t.sceneId==='S2').map(t=>t.id);
 setCallSheet(w,'Scene 1 | West Gate | 09:00-10:00 | Remote drone');
 setCallSheet(w,SHEET);const returned=planIntelligence(w).tasks.filter(t=>t.sceneId==='S2').map(t=>t.id);
 assert.notDeepEqual(returned,old);
 assert.equal(cert(w,buildProductionDossier(w,{persistedVersion:1,asOf})).currentSourceInventory.scenes,2);
});
test('legacy workspaces retain their existing source task identities until a real document or scene revision',()=>{
 const w=make(),before=planIntelligence(w).taskIds;
 for(const d of w.documents)delete d.analysisEpoch;
 for(const scene of w.callSheet.scenes)delete scene.sourceEpoch;
 delete w.callSheet.historicalSceneEpochs;
 assert.deepEqual(planIntelligence(w).taskIds,before);
 recordReview(w,{evidenceId:before[0],decision:'OPEN',reason:'Legacy current review preserved',reviewer:'Person'});
 assert.equal(cert(w,buildProductionDossier(w,{persistedVersion:1,asOf})).currentEvidence.humanReviewed,1);
});
test('HTTP revise-and-revert keeps old completed provider journal archived instead of reviving it as current',async()=>{
 const l=await lab();try{let version=await imported(l);
  const first=await l.post(endpoint+'/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:6},{'X-Operator-Token':'test-token'});
  assert.equal(first.code,200,first.body.error);assert.equal(first.body.completed,6);
  let baseline=(await l.get(endpoint+'/workflow')).body;assert.equal(baseline.consistency.currentEvidence.modelComplete,6);
  const firstTask=baseline.overview.tasks[0].id;
  let r=await l.post(endpoint+'/review-task',{expectedVersion:version,evidenceId:firstTask,decision:'OPEN',reason:'Requires additional original evidence',reviewer:'Coordinator'});
  assert.equal(r.code,200,r.body.error);version=r.body.version;
  for(const [text,name] of [[REVISED,'revision.txt'],[PERMIT,'return-to-original.txt']]){
   const file={kind:'permit',name,text};
   const preview=await l.post(endpoint+'/impact',{expectedVersion:version,documentId:'PERMIT',file});assert.equal(preview.code,200,preview.body.error);
   r=await l.post(endpoint+'/commit-source-change',{expectedVersion:version,documentId:'PERMIT',file,previewSha256:preview.body.previewSha256});assert.equal(r.code,200,r.body.error);version=r.body.version;
  }
  const now=(await l.get(endpoint+'/workflow')).body;
  assert.equal(now.consistency.currentEvidence.modelComplete,0);
  assert.equal(now.consistency.currentEvidence.humanReviewed,0);
  assert.equal(now.consistency.historicalEvidence.humanReviews,1);
  assert.equal(now.consistency.historicalEvidence.archivedModelRuns,1);
  assert.notEqual(now.overview.tasks[0].id,firstTask);
  assert.equal(l.calls(),6,'no hidden Clocked replay on source reversion');
 }finally{await l.close();}
});
