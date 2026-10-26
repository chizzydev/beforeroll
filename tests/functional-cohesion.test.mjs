import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createAppServer} from '../server.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createProduction,addDocument,setCallSheet,reviseDocument,applySourceImport} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {recordAuthorityLink,projectAuthorityGraph} from '../src/document-authority.mjs';
import {recordSceneAuthority,projectSceneAuthority} from '../src/scene-authority.mjs';
import {recordSceneSchedule,recordCondition,decideCondition,projectOperations} from '../src/production-operations.mjs';
import {planIntelligence,assertPlanFresh} from '../src/intelligence-workflow.mjs';
import {createLifecycleBackup,verifyLifecycleBackup} from '../src/production-lifecycle.mjs';
import {encryptOwnerBackup} from '../src/secure-backup.mjs';
import {createWorkspaceController} from '../public/workspace-desk.mjs';
const sheet='Scene 1 | Fictional Hall | 09:00-10:00 | Dolly camera\nScene 2 | Fictional Hall | 11:00-12:00 | Handheld camera';
const changed=sheet.replace('Handheld camera','Drone camera');
const reply={answers:{activity_link:{type:'noul',noul:.95},granted_for_scene:{type:'noul',noul:.03}}};
const transport=async()=>({response:reply,credits:2});
function production(){const w=createProduction({id:'cohesion',title:'Fictional lifecycle'});addDocument(w,{id:'P',name:'Fictional permit',text:'No drones.\n\nKeep exits clear.'});setCallSheet(w,sheet);return w;}
async function lab(){
 const directory=await mkdtemp(path.join(os.tmpdir(),'br-cohesion-'));
 const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory});let calls=0;
 const server=createAppServer({workspaceStore:store,executionStore:execution,ownerToken:'fictional-owner-token-for-local-tests-only',enabled:true,apiKey:'fake',operatorToken:'fictional-operator',fetchImpl:async()=>{calls++;return {ok:true,headers:new Headers({'x-clocked-credits':'2'}),json:async()=>reply};}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
 const request=async(url,body,headers={})=>{const r=await fetch(base+url,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),headers:r.headers};};
 const unlock=async()=>{const r=await request('/api/owner/unlock',{token:'fictional-owner-token-for-local-tests-only'});cookie=r.headers.get('set-cookie').split(';')[0];};
 return {directory,store,execution,request,unlock,calls:()=>calls,close:async()=>{await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}};
}
async function run(ex,w,maxCalls=32,send=transport){return ex.runBatch({workspace:w,plan:planIntelligence(w),maxCalls,operatorAuthorized:true,transport:send});}

test('partial scene correction retains exact completed tasks, bills only changed tasks, exports and recovers the same lineage',async()=>{
 const l=await lab();try{
  const w=production();let calls=0;const send=async()=>{calls++;return transport();};
  await run(l.execution,w,32,send);assert.equal(calls,4);
  setCallSheet(w,changed);const plan=planIntelligence(w);
  const reopened=createDurableExecution({directory:l.directory});const snapshot=await reopened.snapshot(plan);
  assert.equal(snapshot.status.completed,2);assert.equal(snapshot.status.retainedAttempts,2);assert.equal(snapshot.status.remaining,2);
  assert(snapshot.evidence.records.filter(r=>r.status==='COMPLETE').every(r=>r.inheritedFromPlanKey));
  await run(reopened,w,32,send);assert.equal(calls,6,'unaffected tasks must never be billed again');
  const saved=await l.store.persist(w,{expectedVersion:0});
  const backup=await createLifecycleBackup(saved,reopened);assert.equal(verifyLifecycleBackup(backup,reopened).journalCount,2);
  assert.equal(backup.integrity.currentExecutionCompleted,4);
  setCallSheet(w,sheet);const reversed=await reopened.status(planIntelligence(w));
  assert.equal(reversed.completed,2,'returning scene cannot resurrect old completion');assert.equal(reversed.remaining,2);
 }finally{await l.close();}
});

test('unchanged uncertain request remains halted after a different scene changes, including backup verification',async()=>{
 const l=await lab();try{
  const w=production();let calls=0;
  await run(l.execution,w,1,async()=>{calls++;throw Error('network lost');});
  setCallSheet(w,changed);const ex=createDurableExecution({directory:l.directory});const status=await run(ex,w,32,async()=>{calls++;return transport();});
  assert.equal(calls,1);assert.equal(status.executed,0);assert.equal(status.unknownBilling,1);assert.equal(status.state,'HALTED_UNKNOWN_BILLING');
  const saved=await l.store.persist(w,{expectedVersion:0});const backup=await createLifecycleBackup(saved,ex);verifyLifecycleBackup(backup,ex);
  assert.equal(backup.integrity.currentExecutionUncertain,1);
 }finally{await l.close();}
});

test('A to B to A during execution invalidates an older plan even when source text hashes match again',()=>{
 const w=production(),before=planIntelligence(w);setCallSheet(w,changed);setCallSheet(w,sheet);
 assert.throws(()=>assertPlanFresh(w,before),/lineage changed/);
});

test('restored scene metadata cannot disagree with hashed original rows or hide unsupported material',()=>{
 const altered=production();altered.callSheet.scenes[1].activity='Approved activity';
 assert.throws(()=>planIntelligence(altered),/differs from original/);
 const omitted=production();omitted.callSheet.unsupported.push({text:'Hidden condition'});
 assert.throws(()=>planIntelligence(omitted),/differs from original/);
});

test('document and scene reversal never resurrects documentary links, scope, dated schedules or prerequisite confirmations',async()=>{
 const l=await lab();try{
  const w=production();addDocument(w,{id:'B',name:'Other fictional document',text:'Scene 2 requires stewards.'});
  const link=()=>recordAuthorityLink(w,{fromId:'P',toId:'B',kind:'REFERENCES',start:w.documents[0].units[0].start,end:w.documents[0].units[0].end,quote:w.documents[0].units[0].text,reviewer:'Test coordinator',reason:'Original cross-reference reviewed'});
  const claim=(sceneId,documentId)=>recordSceneAuthority(w,{sceneId,documentId,unitId:'U001',kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'Test coordinator',reason:'Original passage reviewed'});
  const schedule=sceneId=>recordSceneSchedule(w,{sceneId,date:'2026-11-08',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'Test coordinator',reason:'Fictional schedule reviewed'});
  link();claim('S1','P');claim('S2','B');schedule('S1');schedule('S2');
  for(const [sceneId,documentId] of [['S1','P'],['S2','B']]){
   recordCondition(w,{sceneId,documentId,unitId:'U001',title:'Fictional source prerequisite',reviewer:'Test coordinator',reason:'Source reviewed'});
   decideCondition(w,{conditionId:w.conditions.at(-1).id,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'Test coordinator',reason:'Fictional confirmation'});
  }
  const original=w.documents[0].text;reviseDocument(w,'P',original+'\n\nNo smoke.');reviseDocument(w,'P',original);
  assert.equal(projectAuthorityGraph(w).summary.currentLinks,0);
  assert.equal(projectSceneAuthority(w).summary.current,1,'only unaffected S2 claim remains current');
  let ops=projectOperations(w);assert.equal(ops.summary.dated,2);assert.equal(ops.conditions[0].decision,'STALE_REVIEW');assert.equal(ops.conditions[1].decision,'HUMAN_CONFIRMED_NOT_AUTHORITY');
  link();claim('S1','P');assert.equal(projectAuthorityGraph(w).summary.currentLinks,1,'fresh same-text link can be recorded');
  assert.equal(projectSceneAuthority(w).summary.current,2);
  setCallSheet(w,changed);setCallSheet(w,sheet);
  ops=projectOperations(w);assert.equal(ops.summary.dated,1);assert.equal(ops.scenes.find(s=>s.sceneId==='S2').scheduleState,'STALE_SCENE_SOURCE');
  assert.equal(ops.conditions[1].decision,'STALE_REVIEW');assert.equal(projectSceneAuthority(w).summary.current,1);
  schedule('S2');claim('S2','B');assert.equal(projectOperations(w).summary.dated,2);assert.equal(projectSceneAuthority(w).summary.current,2);
  const saved=await l.store.persist(w,{expectedVersion:0});verifyLifecycleBackup(await createLifecycleBackup(saved,l.execution),l.execution);
 }finally{await l.close();}
});

test('HTTP encrypted recovery verifies before restoring, rejects auth/origin/tamper/overwrite, and reopens evidence without dispatch',async()=>{
 const original=await lab(),target=await lab();try{
  const w=createProduction({id:'cohesion',title:'Fictional lifecycle'}),vault=createSourceOriginalVault({directory:original.directory});
  for(const [kind,name,text] of [['permit','fictional.txt','No drones.\n\nKeep exits clear.'],['callSheet','fictional-sheet.txt',sheet]]){
   const file={kind,name,text},envelope=inspectImport(file);applySourceImport(w,envelope,{documentId:kind==='permit'?'P':null});await vault.storeImport(file,envelope);
  }
  await run(original.execution,w);reviseDocument(w,'P','No drones.\n\nKeep exits clear.\n\nNo smoke.');
  await run(original.execution,w,1);const saved=await original.store.persist(w,{expectedVersion:0});
  const backup=await createLifecycleBackup(saved,original.execution,{sourceVault:vault}),passphrase='fictional recovery passphrase 2026';
  const encrypted=await encryptOwnerBackup(backup,passphrase),payload={backup:encrypted,passphrase};
  assert.equal((await target.request('/api/workspaces/recovery/verify',payload)).status,401);await target.unlock();
  assert.equal((await target.request('/api/workspaces/recovery/verify',payload,{Origin:'https://foreign.invalid'})).status,403);
  assert.equal((await target.request('/api/workspaces/recovery/verify',{...payload,passphrase:'wrong'})).status,422);
  assert.equal((await target.request('/api/workspaces/recovery/verify',{...payload,backup:{...encrypted,workspaceId:'forged'}})).status,422);
  const preview=await target.request('/api/workspaces/recovery/verify',payload);assert.equal(preview.status,200);assert.equal(preview.body.canRestore,true);
  assert.equal((await target.request('/api/workspaces/recovery/restore',{...payload,confirmId:w.id,previewSha256:'bad'})).status,422);
  const restored=await target.request('/api/workspaces/recovery/restore',{...payload,confirmId:w.id,previewSha256:preview.body.backupSha256});assert.equal(restored.status,201,restored.body.error);
  assert.equal(restored.body.restoredJournals,2);
  assert.equal(restored.body.restoredOriginals,2);
  const targetVault=createSourceOriginalVault({directory:target.directory});
  assert.equal((await targetVault.read(backup.originalSources.items[0].rawHash)).toString('base64'),backup.originalSources.items[0].contentBase64);
  const reopened=await target.request('/api/workspaces/cohesion/workflow');assert.equal(reopened.status,200);assert.equal(reopened.body.dossier.counts.completedModelChecks,1);
  assert.equal((await target.request('/api/workspaces/recovery/verify',payload)).body.canRestore,false);
  assert.equal((await target.request('/api/workspaces/recovery/restore',{...payload,confirmId:w.id,previewSha256:backup.sha256})).status,409);
  const pack=await target.request('/api/workspaces/cohesion/dossier/complete');assert.equal(pack.status,200,pack.body.error);
  assert.equal(pack.body.journals.length,2);assert.equal(pack.body.dossier.counts.archivedModelRuns,1);assert.equal(pack.body.secretsIncluded,false);
  assert.equal(target.calls(),0);assert.equal(original.calls(),0);
 }finally{await original.close();await target.close();}
});

test('large original replacement and human-transcribed call sheet use the same exact preview/commit path',async()=>{
 const l=await lab();try{
  await l.store.persist(production(),{expectedVersion:0});await l.unlock();
  const original=await readFile(new URL('../fixtures/testing/S25_IMAGE_ONLY_PAGE.pdf',import.meta.url));
  // Legal PDF comment padding preserves the original recognizable envelope and
  // exercises the former 280 kB commit ceiling without requiring model calls.
  const bytes=Buffer.concat([original.subarray(0,8),Buffer.from('\n%'+'.'.repeat(300000)+'\n'),original.subarray(8)]);
  const file={kind:'callSheet',name:'fictional-reviewed.pdf',contentBase64:bytes.toString('base64')};
  const transcription={rows:[{number:'1',location:'Fictional Hall',start:'09:00',end:'10:00',activity:'Dolly camera',reference:'Page 1'},
   {number:'2',location:'Fictional Hall',start:'11:05',end:'12:05',activity:'Handheld camera',reference:'Page 1'}],expectedSceneCount:2,reviewer:'Fictional Coordinator',reason:'Test transcription, not independently corroborated content',attestedComplete:true};
  const body={expectedVersion:1,file,transcription};
  const preview=await l.request('/api/workspaces/cohesion/impact',body);assert.equal(preview.status,200,preview.body.error);
  assert.deepEqual(preview.body.tasks,{retained:2,retired:2,added:2});assert.equal((await l.store.load('cohesion')).version,1);
  const mismatch=await l.request('/api/workspaces/cohesion/commit-source-change',{...body,transcription:{...transcription,reviewer:'Changed reviewer'},previewSha256:preview.body.previewSha256});
  // A different original/transcription is never allowed to reuse this preview.
  assert.equal(mismatch.status,422);
  const committed=await l.request('/api/workspaces/cohesion/commit-source-change',{...body,previewSha256:preview.body.previewSha256});assert.equal(committed.status,200,committed.body.error);
  assert.equal(committed.body.workspace.callSheet.importReceipt.sourceFormat,'PDF_HUMAN_CALL_SHEET_TRANSCRIPTION_V1');
  assert.equal(l.calls(),0);
 }finally{await l.close();}
});

test('second-scene workflow actions target that scene in authority, schedule and prerequisite forms',async()=>{
 const l=await lab();try{
  await l.store.persist(production(),{expectedVersion:0});await l.unlock();
  const ctl=createWorkspaceController({fetchImpl:async(url,options)=>{
   const r=await l.request(url,options?.body?JSON.parse(options.body):undefined);return {ok:r.status<400,status:r.status,json:async()=>r.body};
  },root:{querySelector:()=>null}});
  await ctl.load();await ctl.click({dataset:{projectOpen:'cohesion'}});
  await ctl.click({dataset:{workflowAction:'operations',actionScene:'S2'}});
  assert.equal(ctl.model.activeSceneId,'S2');assert.match(ctl.render(),/id="project-op-scene"><option value="S1" >[^]*?<option value="S2" selected>/);
  await ctl.click({dataset:{workflowAction:'scene-authority',actionScene:'S2',actionDocument:'P'}});
  assert.match(ctl.render(),/id="project-scene-auth-scene"><option value="S1" >[^]*?<option value="S2" selected>/);
  await ctl.click({dataset:{workflowOpen:'review'}});const html=ctl.render();
  assert.match(html,/data-workflow-action="operations" data-action-scene="S2"/);
  ctl.model.stagedReviews=[{evidenceId:'old-production'}];ctl.model.actionOffset=30;ctl.model.selectedCondition='old-condition';
  ctl.selectProduction(ctl.model.selected);
  assert.equal(ctl.model.workflowStage,'overview');assert.equal(ctl.model.activeSceneId,null);assert.equal(ctl.model.actionOffset,0);
  assert.equal(ctl.model.selectedCondition,null);assert.deepEqual(ctl.model.stagedReviews,[]);
  assert.equal(l.calls(),0);
 }finally{await l.close();}
});

test('large changed plan seals inherited baseline before appending new journal events',async()=>{
 const l=await lab();try{
  const w=production();reviseDocument(w,'P',Array.from({length:100},(_,i)=>`Rule ${i}: no smoke.`).join('\n\n'));
  setCallSheet(w,Array.from({length:32},(_,i)=>'Scene '+(i+1)+' | Fictional Hall | 09:00-10:00 | Camera').join('\n'));
  assert.equal(planIntelligence(w).plannedCalls,3200);await run(l.execution,w,1);
  setCallSheet(w,w.callSheet.text.replace('Scene 32 | Fictional Hall','Scene 32 | Fictional Yard'));const ex=createDurableExecution({directory:l.directory});
  const status=await run(ex,w,1);assert.equal(status.executed,1);assert.equal(status.completed,2);assert.equal(status.retainedAttempts,1);
  const reopened=await createDurableExecution({directory:l.directory}).status(planIntelligence(w));assert.equal(reopened.completed,2);
 }finally{await l.close();}
});
