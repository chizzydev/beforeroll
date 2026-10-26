import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createProduction,applySourceImport,reviseDocument,recordReview} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution,planKey} from '../src/durable-execution.mjs';
import {recordSceneSchedule,recordCondition,decideCondition} from '../src/production-operations.mjs';
import {recordSceneAuthority} from '../src/scene-authority.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from '../src/production-lifecycle.mjs';
import {createAppServer} from '../server.mjs';
const permit='The station filming request was received.\n\nNo drones.\n\nAny camera crane movements require a separate written permit.';
const csv='Scene,Location,Start,End,Activity\n21,Station,09:00,09:25,Drone flyover\n22,Station,11:00,11:30,Camera crane sweep';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const answer={answers:{activity_link:{type:'noul',noul:.95},granted_for_scene:{type:'noul',noul:.01}}};
function project(id='lifecycle_s20'){
 const w=createProduction({id,title:'Station Owner Scene Review'});
 applySourceImport(w,inspectImport({name:'permit.txt',kind:'permit',text:permit}),{documentId:'P1'});
 applySourceImport(w,inspectImport({name:'calls.csv',kind:'callSheet',text:csv}));
 return w;
}
async function setup(){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-s20-'));
 const directory=path.join(root,'primary');const store=createWorkspaceStore({directory});const execution=createDurableExecution({directory});
 const w=project();const saved=await store.persist(w,{expectedVersion:0});
 const cleanup=()=>fs.rm(root,{recursive:true,force:true});
 return {root,store,execution,saved,cleanup};
}
async function run(s,w,plan,n=2,transport=async()=>({response:answer,credits:1})){
 return s.execution.runBatch({workspace:w,plan,maxCalls:n,operatorAuthorized:true,transport});
}
async function capture(s,saved=s.saved){return createLifecycleBackup(saved,s.execution,{asOf:'2026-10-25T13:00:00.000Z'});}
function verify(bundle,engine){return verifyLifecycleBackup(bundle,engine);}
async function recover(s,bundle,destination=path.join(s.root,'recover')){
 const target=createWorkspaceStore({directory:destination}),engine=createDurableExecution({directory:destination});
 const receipt=await restoreLifecycleBackup(bundle,{workspaceStore:target,execution:engine,ownerConfirmed:true});
 return {receipt,store:target,engine};
}
test('lifecycle backup of imported but unevaluated production verifies source and derived work queue',async()=>{
 const s=await setup();try{
  const bundle=await capture(s);const result=verify(bundle,s.execution);
  assert.equal(bundle.schema,'beforeroll-owner-lifecycle-backup-v1');assert.equal(result.journalCount,0);
  assert.equal(result.currentRun,0);assert.equal(result.sourceTasks,6);assert(bundle.integrity.workItems>0);
  assert.equal(bundle.originalBytesIncluded,false);assert.equal(bundle.secretsIncluded,false);
  assert.equal(bundle.workspaceSha256,sha(bundle.workspace));assert.equal(bundle.integrity.dossierSha256,bundle.integrity.actionQueueEvidenceSha256);
 }finally{await s.cleanup();}
});
test('one exact execution journal read is shared by model status and evidence',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,2);
  const snap=await s.execution.snapshot(p,{offset:0,limit:1});
  assert.equal(snap.status.completed,2);assert.equal(snap.evidence.confirmedCompleted,2);
  assert.equal(snap.evidence.records.filter(x=>x.status==='COMPLETE').length,2);
  const archived=await s.execution.exportAllRuns(p);assert.equal(archived.length,1);
  assert.equal(archived[0].sourceValidation,'CURRENT_EXACT_PLAN');
  assert.equal(s.execution.verifyAllRuns(p,archived).current,1);
 }finally{await s.cleanup();}
});
test('backup preserves journal attempts and human decisions, restoration avoids duplicate provider requests',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,2);
  recordReview(s.saved.workspace,{evidenceId:p.tasks[0].id,decision:'NEEDS_SOURCE',reason:'Original document request is not permission to fly.',reviewer:'Line producer'});
  const latest=await s.store.persist(s.saved.workspace,{expectedVersion:1});
  const bundle=await capture(s,latest);const verified=verify(bundle,s.execution);assert.equal(verified.currentRun,1);
  const recovery=await recover(s,bundle);assert.equal(recovery.receipt.restoredJournals,1);
  const copy=await recovery.store.load(s.saved.workspace.id);
  assert.equal(copy.version,1);assert.equal(copy.workspace.reviewActions.length,1);
  const rep=planIntelligence(copy.workspace);assert.equal(planKey(rep),planKey(p));
  let called=0;const later=await recovery.engine.runBatch({workspace:copy.workspace,plan:rep,maxCalls:32,operatorAuthorized:true,
   transport:async()=>{called++;return {response:answer,credits:1};}});
  assert.equal(called,p.plannedCalls-2);assert.equal(later.completed,p.plannedCalls);
  assert.equal((await recovery.engine.status(rep)).state,'COMPLETE_FOR_PLANNED_UNITS_ONLY');
 }finally{await s.cleanup();}
});
test('source revision archives original journal; restored current does not relabel past decisions',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,3);
  recordReview(s.saved.workspace,{evidenceId:p.tasks[0].id,decision:'OPEN',reason:'Inspection required',reviewer:'Manager'});
  reviseDocument(s.saved.workspace,'P1',permit+'\n\nAdditional generators require approval.');
  const updated=await s.store.persist(s.saved.workspace,{expectedVersion:1});
  const bundle=await capture(s,updated);const report=verify(bundle,s.execution);
  assert.equal(report.archivedRuns,1);assert.equal(report.currentRun,0);assert.equal(bundle.integrity.staleHumanReviews,1);
  assert.equal(bundle.journals[0].sourceValidation,'ARCHIVED_NOT_SOURCE_REVALIDATED');
  const recovery=await recover(s,bundle);const copy=await recovery.store.load(s.saved.workspace.id);
  assert.equal((await recovery.engine.status(planIntelligence(copy.workspace))).attempts,0);
  const rows=await recovery.engine.exportAllRuns(planIntelligence(copy.workspace));assert.equal(rows.length,1);
  assert.equal(rows[0].run.checkpoint.confirmedCompleted,3);
 }finally{await s.cleanup();}
});
test('billing-unknown disposition survives archive, new process and restore without any retry',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);let called=0;
  await run(s,s.saved.workspace,p,32,async()=>{called++;throw Error('Timeout');});
  const bundle=await capture(s);const recovery=await recover(s,bundle);
  const copy=await recovery.store.load(s.saved.workspace.id);const cp=planIntelligence(copy.workspace);
  const resumed=await recovery.engine.runBatch({workspace:copy.workspace,plan:cp,maxCalls:32,operatorAuthorized:true,
   transport:async()=>{called++;return {response:answer,credits:1};}});
  assert.equal(called,1);assert.equal(resumed.executed,0);assert.equal(resumed.state,'HALTED_UNKNOWN_BILLING');
  assert.equal(verify(bundle,recovery.engine).currentRun,1);
 }finally{await s.cleanup();}
});
test('backup includes scene scope, human schedule and source-linked prerequisite history',async()=>{
 const s=await setup();try{
  const w=s.saved.workspace;
  recordSceneSchedule(w,{sceneId:'S21',date:'2026-10-28',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'Scheduler',reason:'Reviewed daily schedule'});
  recordSceneAuthority(w,{sceneId:'S21',documentId:'P1',unitId:w.documents[0].units[1].id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'Producer',reason:'Drone activity is specifically restricted'});
  recordCondition(w,{sceneId:'S21',title:'Obtain separate written authorization',documentId:'P1',unitId:w.documents[0].units[1].id,dueLocal:'2026-10-27T12:00',reviewer:'Coordinator',reason:'Prior to shooting'});
  decideCondition(w,{conditionId:w.conditions[0].id,decision:'OPEN',reviewer:'Coordinator',reason:'Waiting for permit'});
  const saved=await s.store.persist(w,{expectedVersion:1});const bundle=await capture(s,saved);
  assert.equal(verify(bundle,s.execution).journalCount,0);
  const r=await recover(s,bundle);const w2=(await r.store.load(w.id)).workspace;
  assert.equal(w2.sceneAuthority.length,1);assert.equal(w2.sceneSchedules.length,1);assert.equal(w2.conditions.length,1);
  assert.equal(w2.conditionDecisions.length,1);
 }finally{await s.cleanup();}
});
test('incomplete production with no source plan can still be verified and recovered',async()=>{
 const s=await setup();try{
  const ws=createProduction({id:'incomplete',title:'Unopened production'});
  const saved=await s.store.persist(ws,{expectedVersion:0});const bundle=await capture(s,saved);
  assert.equal(bundle.integrity.sourcePlan,'BLOCKED');assert.equal(bundle.journals.length,0);
  const target=await recover(s,bundle,path.join(s.root,'bare'));
  assert.equal((await target.store.load('incomplete')).workspace.title,'Unopened production');
 }finally{await s.cleanup();}
});
test('recovery requires explicit opt-in, refuses overwrites, refuses wrong execution location',async()=>{
 const s=await setup();try{
  const bundle=await capture(s);await assert.rejects(restoreLifecycleBackup(bundle,{workspaceStore:s.store,execution:s.execution}),/authorization/);
  await assert.rejects(restoreLifecycleBackup(bundle,{workspaceStore:s.store,execution:s.execution,ownerConfirmed:true}),/overwrite/);
  const dir=path.join(s.root,'separate'),foreign=createDurableExecution({directory:path.join(s.root,'foreign')});
  await assert.rejects(restoreLifecycleBackup(bundle,{workspaceStore:createWorkspaceStore({directory:dir}),execution:foreign,ownerConfirmed:true}),/share a data directory/);
 }finally{await s.cleanup();}
});
test('archive detects workspace tampering including recomputed outer checksum but unrecomputed inner receipt',async()=>{
 const s=await setup();try{
  const bundle=await capture(s),changed=structuredClone(bundle);
  changed.workspace.documents[0].text+=' Fake override.';
  assert.throws(()=>verify(changed,s.execution),/checksum mismatch/);
  changed.sha256=sha(Object.fromEntries(Object.entries(changed).filter(([k])=>k!=='sha256')));
  assert.throws(()=>verify(changed,s.execution),/Source hash mismatch|Source coverage integrity/);
 }finally{await s.cleanup();}
});
test('archive detects forged provider score even if outer file checksum recomputed',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,1);
  const bundle=await capture(s),changed=structuredClone(bundle);
  changed.journals[0].run.checkpoint.entries[0].finding.grant=.99;
  changed.sha256=sha(Object.fromEntries(Object.entries(changed).filter(([k])=>k!=='sha256')));
  assert.throws(()=>verify(changed,s.execution),/Recovery journal checksum/);
 }finally{await s.cleanup();}
});
test('archive detects fabricated status accounting even if journal and outer checksums recomputed',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,1);
  const changed=structuredClone(await capture(s));changed.journals[0].run.checkpoint.confirmedCompleted=5;
  changed.journals[0].sha256=sha(changed.journals[0].run);
  changed.sha256=sha(Object.fromEntries(Object.entries(changed).filter(([k])=>k!=='sha256')));
  assert.throws(()=>verify(changed,s.execution),/checkpoint accounting mismatch/);
 }finally{await s.cleanup();}
});
test('cross-system projection digest catches altered summaries, including with outer checksum refreshed',async()=>{
 const s=await setup();try{
  const changed=structuredClone(await capture(s));changed.integrity.workItems+=20;
  changed.sha256=sha(Object.fromEntries(Object.entries(changed).filter(([k])=>k!=='sha256')));
  assert.throws(()=>verify(changed,s.execution),/cross-system state differs/);
 }finally{await s.cleanup();}
});
test('existing historical execution journal stops restore without replacing any project',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,1);
  const backup=await capture(s),target=path.join(s.root,'existingjournal');
  const exec=createDurableExecution({directory:target});await exec.restoreAllRuns(p,backup.journals);
  const store=createWorkspaceStore({directory:target});
  await assert.rejects(restoreLifecycleBackup(backup,{workspaceStore:store,execution:exec,ownerConfirmed:true}),/existing project execution journal/);
  assert.equal(await store.load(s.saved.workspace.id),null);
 }finally{await s.cleanup();}
});
test('production lifecycle GET/backup HTTP routes require private workspace and are read-only',async()=>{
 const s=await setup();let server;try{
  server=createAppServer({enabled:false,workspaceStore:s.store,executionStore:s.execution});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const base='http://127.0.0.1:'+server.address().port;
  const get=async uri=>{const res=await fetch(base+uri);return {status:res.status,body:await res.json()};};
  const audit=await get('/api/workspaces/lifecycle_s20/lifecycle');assert.equal(audit.status,200);
  assert.equal(audit.body.schema,'beforeroll-lifecycle-audit-v1');assert.equal(audit.body.persistedVersion,1);
  const exported=await get('/api/workspaces/lifecycle_s20/lifecycle/backup');assert.equal(exported.status,200);
  assert.equal(verify(exported.body,s.execution).workspaceId,'lifecycle_s20');
  assert.equal((await s.store.load(s.saved.workspace.id)).version,1);
  const absent=await get('/api/workspaces/absent/lifecycle');assert.equal(absent.status,404);
  const bad=await get('/api/workspaces/lifecycle_s20/lifecycle?asOf=tomorrow');assert.notEqual(bad.status,200);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await s.cleanup();}
});
test('archived journal checksum corruption blocks making a misleading complete backup',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,1);
  reviseDocument(s.saved.workspace,'P1',permit+'\n\nKeep roads clear.');
  const updated=await s.store.persist(s.saved.workspace,{expectedVersion:1});
  const filename=path.join(s.execution.directory,s.saved.workspace.id+'.'+planKey(p)+'.json');
  const raw=JSON.parse(await fs.readFile(filename,'utf8'));raw.hash='0'.repeat(64);await fs.writeFile(filename,JSON.stringify(raw));
  await assert.rejects(capture(s,updated),/checksum mismatch/);
 }finally{await s.cleanup();}
});
test('in-flight journal remains non-retryable after a crash-conservative restored process',async()=>{
 const s=await setup();let release;try{
  const p=planIntelligence(s.saved.workspace);let reached;const entered=new Promise(resolve=>reached=resolve);
  const held=new Promise(resolve=>release=resolve);let oldProviderCalls=0;
  const pending=run(s,s.saved.workspace,p,1,async()=>{oldProviderCalls++;reached();await held;return {response:answer,credits:1};});
  await entered;
  const archive=await capture(s);assert.equal(archive.integrity.currentExecutionUncertain,1);
  assert.equal(archive.journals[0].run.checkpoint.entries[0].status,'IN_FLIGHT');
  const recovered=await recover(s,archive);const copy=await recovered.store.load(s.saved.workspace.id);
  let newProviderCalls=0;
  const resumed=await recovered.engine.runBatch({workspace:copy.workspace,plan:planIntelligence(copy.workspace),maxCalls:32,operatorAuthorized:true,
   transport:async()=>{newProviderCalls++;return {response:answer,credits:1};}});
  assert.equal(oldProviderCalls,1);assert.equal(newProviderCalls,0);assert.equal(resumed.executed,0);
  assert.equal(resumed.unknownBilling,1);assert.equal(resumed.state,'HALTED_UNKNOWN_BILLING');
  release();await pending;
 }finally{release?.();await s.cleanup();}
});
test('multiple historic source-plan journals survive portable recovery with their original attempts',async()=>{
 const s=await setup();try{
  const w=s.saved.workspace;const p1=planIntelligence(w);await run(s,w,p1,2);
  reviseDocument(w,'P1',permit+'\n\nVehicle parking prohibited.');const p2=planIntelligence(w);await run(s,w,p2,3);
  reviseDocument(w,'P1',permit+'\n\nVehicle parking prohibited.\n\nAdditional safety cones required.');const p3=planIntelligence(w);await run(s,w,p3,1);
  const saved=await s.store.persist(w,{expectedVersion:1}),backup=await capture(s,saved);
  const verified=verify(backup,s.execution);assert.equal(verified.currentRun,1);assert.equal(verified.archivedRuns,2);
  const recovered=await recover(s,backup);const restoredWorkspace=(await recovered.store.load(w.id)).workspace;
  const all=await recovered.engine.exportAllRuns(planIntelligence(restoredWorkspace));
  assert.equal(all.length,3);
  assert.equal(all.find(r=>r.planKey===planKey(p1)).run.checkpoint.confirmedCompleted,2);
  assert.equal(all.find(r=>r.planKey===planKey(p2)).run.checkpoint.confirmedCompleted,3);
  assert.equal(all.find(r=>r.planKey===planKey(p3)).run.checkpoint.confirmedCompleted,1);
  assert.equal((await recovered.engine.status(planIntelligence(restoredWorkspace))).completed,1);
 }finally{await s.cleanup();}
});
test('archived journal still rejects task/finding inconsistency after all outer hashes are recomputed',async()=>{
 const s=await setup();try{
  const old=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,old,1);
  reviseDocument(s.saved.workspace,'P1',permit+'\n\nNew revision.');
  const saved=await s.store.persist(s.saved.workspace,{expectedVersion:1});
  const copy=structuredClone(await capture(s,saved));
  copy.journals[0].run.checkpoint.entries[0].requestHash='f'.repeat(64);
  copy.journals[0].sha256=sha(copy.journals[0].run);
  copy.sha256=sha(Object.fromEntries(Object.entries(copy).filter(([k])=>k!=='sha256')));
  // Previous documents are missing, but an archived journal must still
  // refuse contradictions between its own attempted request and model receipt.
  assert.throws(()=>verify(copy,s.execution),/Historical journal entry identity mismatch/);
 }finally{await s.cleanup();}
});
test('refuses wrong archived journal project identity even with all outer checksums recomputed',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,1);
  reviseDocument(s.saved.workspace,'P1',permit+'\n\nNew revision.');
  const saved=await s.store.persist(s.saved.workspace,{expectedVersion:1});
  const copy=structuredClone(await capture(s,saved));
  copy.journals[0].run.projectId='unrelated';copy.journals[0].sha256=sha(copy.journals[0].run);
  copy.sha256=sha(Object.fromEntries(Object.entries(copy).filter(([k])=>k!=='sha256')));
  assert.throws(()=>verify(copy,s.execution),/Historical journal identity/);
 }finally{await s.cleanup();}
});
test('malformed recovered journal collection cannot create files, even with matching outer hash',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,1);
  const copy=structuredClone(await capture(s));copy.journals.push(structuredClone(copy.journals[0]));
  copy.sha256=sha(Object.fromEntries(Object.entries(copy).filter(([k])=>k!=='sha256')));
  assert.throws(()=>verify(copy,s.execution),/duplicate mismatch/);
  const output=path.join(s.root,'invalid-destination'),store=createWorkspaceStore({directory:output}),engine=createDurableExecution({directory:output});
  await assert.rejects(restoreLifecycleBackup(copy,{workspaceStore:store,execution:engine,ownerConfirmed:true}),/duplicate mismatch/);
  assert.equal(await store.load(copy.workspaceId),null);
 }finally{await s.cleanup();}
});
test('recovery rejects and does not overwrite an existing DIFFERENT workspace using same ID',async()=>{
 const s=await setup();try{
  const backup=await capture(s),target=path.join(s.root,'other'),store=createWorkspaceStore({directory:target}),execution=createDurableExecution({directory:target});
  const w=createProduction({id:s.saved.workspace.id,title:'Different valuable production'});await store.persist(w,{expectedVersion:0});
  await assert.rejects(restoreLifecycleBackup(backup,{workspaceStore:store,execution,ownerConfirmed:true}),/overwrite/);
  assert.equal((await store.load(w.id)).workspace.title,'Different valuable production');
 }finally{await s.cleanup();}
});
test('same source preservation after backup is independent of later live storage changes',async()=>{
 const s=await setup();try{
  const bundle=await capture(s);const first=structuredClone(bundle.workspace);
  reviseDocument(s.saved.workspace,'P1',permit+'\n\nA revised source note.');
  const saved=await s.store.persist(s.saved.workspace,{expectedVersion:1});
  assert.notEqual(saved.workspace.documents[0].sourceHash,bundle.workspace.documents[0].sourceHash);
  assert.deepEqual(bundle.workspace,first);assert.equal(verify(bundle,s.execution).originalVersion,1);
  assert.equal((await recover(s,bundle)).receipt.recoveredVersion,1);
 }finally{await s.cleanup();}
});
test('lifecycle route and export never dispatch Clocked provider even when live mode configured',async()=>{
 const s=await setup();let server;let calls=0;try{
  server=createAppServer({enabled:true,apiKey:'fake',operatorToken:'owner',workspaceStore:s.store,executionStore:s.execution,
   fetchImpl:async()=>{calls++;throw Error('Unexpected billable request');}});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const base='http://127.0.0.1:'+server.address().port;
  const urls=['/api/workspaces/lifecycle_s20/lifecycle','/api/workspaces/lifecycle_s20/lifecycle/backup'];
  for(const url of urls){const r=await fetch(base+url);assert.equal(r.status,200);assert.equal((await r.json()).notClearance,true);}
  assert.equal(calls,0);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await s.cleanup();}
});
test('unified production browser exposes one private owner backup action without a new workflow database',async()=>{
 const {productionView}=await import('./helpers/ui-views.mjs');
 const s=await setup();try{
  const html=productionView({selected:{version:1,workspace:s.saved.workspace},overview:{scenes:[],tasks:[],pagination:{}},dossier:{counts:{},outstanding:[],scenes:[]}});
  assert.match(html,/id="project-lifecycle-backup"/);
  assert.match(html,/Export private lifecycle backup/);
  assert.match(html,/Export complete evidence pack/);
  assert.doesNotMatch(html,/<script[^>]*>/i);
 }finally{await s.cleanup();}
});
test('same pinned version, instant and journal produce deterministic lifecycle proof and backup digest',async()=>{
 const s=await setup();try{
  const p=planIntelligence(s.saved.workspace);await run(s,s.saved.workspace,p,1);
  const a=await capture(s),b=await capture(s);
  assert.equal(a.sha256,b.sha256);assert.equal(a.integrity.sha256,b.integrity.sha256);
  assert.equal(verify(a,s.execution).backupSha256,verify(b,s.execution).backupSha256);
 }finally{await s.cleanup();}
});
