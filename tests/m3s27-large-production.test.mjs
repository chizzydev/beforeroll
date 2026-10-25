import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import {createProduction,addDocument,setCallSheet,reviseDocument} from '../src/production-workspace.mjs';
import {MAX_PLAN_TASKS,planIntelligence} from '../src/intelligence-workflow.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {buildProductionDossier} from '../src/production-dossier.mjs';
import {buildProductionActions} from '../src/production-actions.mjs';
import {buildSceneWorkbench} from '../src/scene-workbench.mjs';
import {productionReview} from '../src/production-review.mjs';
import {createAppServer} from '../server.mjs';
import {productionView} from '../public/workspace-desk.mjs';
const response={answers:{activity_link:{type:'noul',noul:0.94},granted_for_scene:{type:'noul',noul:0.02}}};
const make=(scenes=140,units=36,documents=1)=>{
 const w=createProduction({id:'S27large',title:'Large production review'});
 for(let j=0;j<documents;j++)addDocument(w,{id:`permit${j}`,name:`Permit ${j}`,text:Array.from({length:units},(_,i)=>`Clause ${i+1}: Written consent required for activity ${i+1}.`).join('\n\n')});
 setCallSheet(w,Array.from({length:scenes},(_,i)=>`Scene ${i+1} | NORTH ARCADE | 09:00-10:00 | Activity ${i+1}`).join('\n'));
 return w;
};
const lab=async()=>{const directory=await fs.mkdtemp(path.join(os.tmpdir(),'br-s27-'));return {directory,engine:createDurableExecution({directory}),store:createWorkspaceStore({directory}),close:()=>fs.rm(directory,{recursive:true,force:true})};};
const simulated=async()=>({response,credits:2});
test('large original-source plan exceeds old 3000 limit without silent omission or altered source identities',()=>{
 const w=make(),t=Date.now(),p=planIntelligence(w);
 assert.equal(p.plannedCalls,5040);assert.equal(p.tasks.length,5040);assert.equal(new Set(p.taskIds).size,5040);
 assert.equal(new Set(p.tasks.map(x=>x.sceneId)).size,140);assert.equal(p.tasks.filter(x=>x.sceneId==='S140').length,36);
 assert.equal(p.tasks.at(-1).sceneId,'S140');assert(p.tasks.every(t=>t.payload.questions.activity_link&&t.requestHash.length===64));
 assert(Date.now()-t<15000,'Planning must remain usable for large shoots');
});
test('capacity forecast rejects oversized plans before constructing incomplete task subsets',()=>{
 const w=make(200,251);
 assert.equal(MAX_PLAN_TASKS,50000);
 assert.throws(()=>planIntelligence(w),/more than 50000 requests.*no silent truncation/i);
 assert.throws(()=>planIntelligence(make(1,1),{maxTasks:MAX_PLAN_TASKS+1}),/capacity/);
 assert.throws(()=>planIntelligence(make(2,2),{maxTasks:2}),/no silent truncation/);
});
test('durable 5040-check journal exposes paginated work, all-scene counts, and unknown-cost state before dispatch',async()=>{
 const l=await lab();try{
  const p=planIntelligence(make()),r=await l.engine.status(p,{offset:4010,limit:30});
  assert.equal(r.planned,5040);assert.equal(r.remaining,5040);assert.equal(r.completionPercent,0);
  assert.equal(r.entries.length,30);assert.equal(r.entries[0].id,p.tasks[4010].id);
  assert.equal(r.byScene.S140.planned,36);assert.equal(r.byDocument.permit0.planned,5040);
  assert.equal(r.knownCredits,0);assert.equal(r.creditProjection,null);assert.equal(r.pagination.hasMore,true);
  assert.equal(r.unknownCreditEntries,0);
 }finally{await l.close();}
});
test('large-production resumable execution preserves exactly once dispatch and observed credit accounting after restart',async()=>{
 const l=await lab();try{
  const w=make(),p=planIntelligence(w),seen=[];
  const call=async(_payload,task)=>{seen.push(task.id);return simulated();};
  const first=await l.engine.runBatch({workspace:w,plan:p,maxCalls:20,transport:call,operatorAuthorized:true});
  assert.equal(first.executed,20);assert.equal(first.knownCredits,40);assert.equal(first.remaining,5020);
  assert.equal(first.creditProjection.sampleCount,20);assert.equal(first.creditProjection.remainingCreditsAtObservedMean,10040);
  const restart=createDurableExecution({directory:l.directory});
  const next=await restart.runBatch({workspace:w,plan:p,maxCalls:32,transport:call,operatorAuthorized:true});
  assert.equal(next.executed,32);assert.equal(next.completed,52);assert.equal(next.knownCredits,104);
  assert.equal(next.completionPercent,Number((52/5040*100).toFixed(2)));
  assert.equal(new Set(seen).size,52);assert.equal(next.byScene.S1.complete,36);assert.equal(next.byScene.S2.complete,16);
  const page=await restart.snapshot(p,{offset:36,limit:3});
  assert.deepEqual(page.status.entries.map(x=>x.status),['COMPLETE','COMPLETE','COMPLETE']);
  assert.equal(page.evidence.records.length,p.plannedCalls);assert.equal(page.evidence.records[52].status,'NOT_ATTEMPTED');
 }finally{await l.close();}
});
test('unknown provider outcome stops large shoot globally without replaying a dispatched request',async()=>{
 const l=await lab();try{
  const w=make(),p=planIntelligence(w);let calls=0;
  const outcome=await l.engine.runBatch({workspace:w,plan:p,maxCalls:32,operatorAuthorized:true,transport:async()=>{calls++;throw Error('Socket lost after dispatch');}});
  assert.equal(calls,1);assert.equal(outcome.executed,1);assert.equal(outcome.state,'HALTED_UNKNOWN_BILLING');assert.equal(outcome.unknownBilling,1);
  const restarted=createDurableExecution({directory:l.directory});
  const again=await restarted.runBatch({workspace:w,plan:p,maxCalls:32,operatorAuthorized:true,transport:async()=>{calls++;return simulated();}});
  assert.equal(again.executed,0);assert.equal(calls,1);assert.equal(again.remaining,5039);
 }finally{await l.close();}
});
test('historical journal recovery accepts an archived source plan with more than 3000 checks',async()=>{
 const l=await lab();try{
  const w=make(),p=planIntelligence(w);
  await l.engine.runBatch({workspace:w,plan:p,maxCalls:1,transport:simulated,operatorAuthorized:true});
  const updated=structuredClone(w);reviseDocument(updated,'permit0',w.documents[0].text+'\n\nNo drones.');const p2=planIntelligence(updated);
  const original=await l.engine.exportAllRuns(p2);assert.equal(original.length,1);assert.equal(original[0].run.checkpoint.entries.length,5040);
  assert.equal(original[0].sourceValidation,'ARCHIVED_NOT_SOURCE_REVALIDATED');assert.equal(l.engine.verifyAllRuns(p2,original).archived,1);
  const recovered=await lab();try{await recovered.engine.restoreAllRuns(p2,original);const check=await recovered.engine.exportAllRuns(p2);assert.equal(check.length,1);assert.equal(check[0].sha256,original[0].sha256);}finally{await recovered.close();}
 }finally{await l.close();}
});
test('production dossier, work queue and page navigation remain complete beyond old limits',()=>{
 const w=make(),d=buildProductionDossier(w,{persistedVersion:1,asOf:'2026-10-25T16:00:00.000Z'});
 assert.equal(d.counts.planTasks,5040);assert.equal(d.scenes.length,140);
 assert.equal(d.scenes.at(-1).planned,36);
 const p=productionReview(w,{offset:4000,limit:35});assert.equal(p.tasks.length,35);assert.equal(p.tasks[0].id,d.sceneTasks[4000].id);
 const queue=buildProductionActions(d,{offset:10001,limit:20});assert(queue.total>10000);assert(queue.actions.length>0);
 const scene=buildSceneWorkbench(d,{sceneId:'S140',taskOffset:3001,taskLimit:10});assert.equal(scene.tasks.length,0);
});
test('owner-facing execution display distinguishes estimates, reported credits and unfinished task counts',()=>{
 const html=productionView({items:[],selected:{version:1,workspace:make(2,2)},overview:{plannedCalls:4,documents:[],scenes:[],tasks:[],pagination:{offset:0,shown:0}},execution:{planned:4,attempts:1,completed:1,remaining:3,completionPercent:25,knownCredits:2,unknownCreditEntries:0,archivedRuns:0,state:'RUNNING',creditProjection:{sampleCount:1,averageCreditsPerReportedCall:2,remainingCreditsAtObservedMean:6},hourlyAllowance:{remaining:255,configured:256},byDocument:{permit0:{complete:1,planned:4,uncertain:0}}},workflowStage:'analysis',liveEnabled:true});
 assert.match(html,/25% complete/);assert.match(html,/remaining 6 at observed mean/);assert.match(html,/NOT a quote/);assert.match(html,/owner-authorized run/);assert.match(html,/255\/256/);
});
test('large HTTP plan has bounded pages, progress has large offsets, and unknown server capacity is not mistaken for provider quota',async()=>{
 const l=await lab();let server;try{
  const w=make(),saved=await l.store.persist(w,{expectedVersion:0});assert.equal(saved.version,1);
  server=createAppServer({workspaceStore:l.store,executionStore:l.engine,enabled:false});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/workspaces/S27large`;
  const get=async route=>{const r=await fetch(base+route);return {status:r.status,body:await r.json()};};
  const page=await get('/plan?offset=4000&limit=20');assert.equal(page.status,200,JSON.stringify(page.body).slice(0,400));assert.equal(page.body.plannedCalls,5040);assert.equal(page.body.tasks.length,20);assert.equal(page.body.pagination.hasMore,true);
  const status=await get('/execution?offset=4500&limit=40');assert.equal(status.status,200);assert.equal(status.body.entries.length,40);
  assert.equal(status.body.hourlyAllowance.notProviderQuota,true);
  const bad=await get('/plan?offset=0&limit=501');assert.equal(bad.status,400);
  assert.equal((await get('/plan?offset=5040&limit=20')).body.tasks.length,0);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await l.close();}
});
test('large execution uses fsynced append-only attempt/settlement events instead of 5000-entry rewrites',async()=>{
 const l=await lab();try{
  const w=make(),p=planIntelligence(w);
  await l.engine.runBatch({workspace:w,plan:p,maxCalls:4,transport:simulated,operatorAuthorized:true});
  const dir=path.join(l.directory,'.clocked-execution'),names=await fs.readdir(dir);
  const baseline=JSON.parse(await fs.readFile(path.join(dir,names.find(x=>x.endsWith('.json'))),'utf8'));
  const events=(await fs.readFile(path.join(dir,names.find(x=>x.endsWith('.events'))),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
  assert.equal(baseline.run.checkpoint.attempts,0,'Large journal baseline must not be rewritten on every request');
  assert.equal(baseline.run.checkpoint.entries.length,5040);
  assert.equal(events.length,8);assert.equal(events.filter(x=>x.event.kind==='INTENT').length,4);
  assert.equal(events.filter(x=>x.event.kind==='SETTLE').length,4);
  const restored=await createDurableExecution({directory:l.directory}).status(p);assert.equal(restored.completed,4);
 }finally{await l.close();}
});
test('tampered large journal hash chain fails closed before contacting provider',async()=>{
 const l=await lab();try{
  const w=make(),p=planIntelligence(w);
  await l.engine.runBatch({workspace:w,plan:p,maxCalls:1,transport:simulated,operatorAuthorized:true});
  const dir=path.join(l.directory,'.clocked-execution'),filename=(await fs.readdir(dir)).find(x=>x.endsWith('.events'));
  const file=path.join(dir,filename),rows=(await fs.readFile(file,'utf8')).trim().split('\n');
  const modified=JSON.parse(rows[0]);modified.event.requestHash='0'.repeat(64);rows[0]=JSON.stringify(modified);await fs.writeFile(file,rows.join('\n')+'\n');
  const engine=createDurableExecution({directory:l.directory});let calls=0;
  await assert.rejects(()=>engine.status(p),/checksum chain mismatch/);
  await assert.rejects(()=>engine.runBatch({workspace:w,plan:p,maxCalls:1,operatorAuthorized:true,transport:async()=>{calls++;return simulated();}}),/checksum chain mismatch/);
  assert.equal(calls,0);
 }finally{await l.close();}
});
test('crash between large-journal dispatch intent and settlement becomes BILLING_UNKNOWN, not an automatic retry',async()=>{
 const l=await lab();try{
  const w=make(),p=planIntelligence(w);
  await l.engine.runBatch({workspace:w,plan:p,maxCalls:1,transport:simulated,operatorAuthorized:true});
  const dir=path.join(l.directory,'.clocked-execution'),filename=(await fs.readdir(dir)).find(x=>x.endsWith('.events'));
  const file=path.join(dir,filename),rows=(await fs.readFile(file,'utf8')).trim().split('\n');
  assert.equal(rows.length,2);
  // Simulate the process being killed after the persisted dispatch intent,
  // before the provider outcome could be fsynced (NO fabricated response).
  await fs.writeFile(file,rows[0]+'\n');
  let calls=0;const r=await createDurableExecution({directory:l.directory}).runBatch({workspace:w,plan:p,maxCalls:4,operatorAuthorized:true,transport:async()=>{calls++;return simulated();}});
  assert.equal(calls,0);assert.equal(r.executed,0);assert.equal(r.state,'HALTED_UNKNOWN_BILLING');assert.equal(r.unknownBilling,1);
  const rest=await createDurableExecution({directory:l.directory}).status(p);
  assert.equal(rest.state,'HALTED_UNKNOWN_BILLING');assert.equal(rest.entries[0].status,'BILLING_UNKNOWN');
 }finally{await l.close();}
});
test('truncated large journal is never silently ignored or retried',async()=>{
 const l=await lab();try{
  const w=make(),p=planIntelligence(w);await l.engine.runBatch({workspace:w,plan:p,maxCalls:1,transport:simulated,operatorAuthorized:true});
  const dir=path.join(l.directory,'.clocked-execution'),file=path.join(dir,(await fs.readdir(dir)).find(x=>x.endsWith('.events')));
  await fs.appendFile(file,'{');let calls=0;
  await assert.rejects(()=>createDurableExecution({directory:l.directory}).runBatch({workspace:w,plan:p,maxCalls:1,operatorAuthorized:true,transport:async()=>{calls++;return simulated();}}),/Truncated large execution event log/);
  assert.equal(calls,0);
 }finally{await l.close();}
});
