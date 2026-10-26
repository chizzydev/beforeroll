import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {mkdtemp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {createProduction,applySourceImport,reviseDocument,recordReview} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution,planKey} from '../src/durable-execution.mjs';
import {productionView} from './helpers/ui-views.mjs';
import {createWorkspaceController} from '../public/workspace-desk.mjs';
import {createAppServer} from '../server.mjs';
const permit='Film at the station.\n\nNo drones.\n\nCamera crane movements require a written permit.';
const csv='Scene,Location,Start,End,Activity\n21,Station,09:00,09:25,Drone flyover\n22,Station,11:00,11:30,Crane sweep';
const answer={answers:{activity_link:{type:'noul',noul:0.965},granted_for_scene:{type:'noul',noul:0.012}}};
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const project=(id='bulk12')=>{const w=createProduction({id,title:'Owner station production'});applySourceImport(w,inspectImport({name:'perm.txt',kind:'permit',text:permit}),{documentId:'Perm'});applySourceImport(w,inspectImport({name:'schedule.csv',kind:'callSheet',text:csv}));return w;};
async function setup(){const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-s12-'));return {dir,repo:createWorkspaceStore({directory:dir}),engine:createDurableExecution({directory:dir}),cleanup:()=>rm(dir,{recursive:true,force:true})};}
const run=(s,w,plan,maxCalls,transport)=>s.engine.runBatch({workspace:w,plan,maxCalls,transport,operatorAuthorized:true});
const fake=async()=>({response:answer,credits:1});
test('durable execution records exact tasks, fingerprints, typed responses and reported credits',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);assert(p.tasks.length>=6);
 const a=await run(s,w,p,3,fake);assert.equal(a.executed,3);assert.equal(a.completed,3);assert.equal(a.attempts,3);assert.equal(a.knownCredits,3);
 assert.deepEqual(a.entries.slice(0,3).map(x=>x.status),['COMPLETE','COMPLETE','COMPLETE']);
 const saved=await s.engine.read(p);assert.equal(saved.checkpoint.entries[0].finding.requestHash,p.tasks[0].requestHash);
 assert.equal(saved.checkpoint.entries[0].finding.sourceQuote,p.tasks[0].sourceQuote);
 assert.equal(saved.checkpoint.entries[0].finding.documentHash,p.tasks[0].documentHash);
 assert.equal(saved.checkpoint.entries[0].finding.sceneHash,p.tasks[0].sceneHash);
 assert.equal(a.notClearance,true);
 }finally{await s.cleanup();}
});
test('restarting the durable store never duplicates completed provider requests; full large batch completes',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);const called=[];
 const transport=async(_,task)=>{called.push(task.id);return fake();};
 await run(s,w,p,2,transport);
 const restarted=createDurableExecution({directory:s.dir});await restarted.runBatch({workspace:w,plan:p,maxCalls:32,transport,operatorAuthorized:true});
 assert.equal(called.length,p.plannedCalls);assert.equal(new Set(called).size,called.length);
 const result=await restarted.status(p);assert.equal(result.state,'COMPLETE_FOR_PLANNED_UNITS_ONLY');assert.equal(result.completed,p.plannedCalls);
 const last=await restarted.runBatch({workspace:w,plan:p,maxCalls:8,transport,operatorAuthorized:true});assert.equal(last.executed,0);
 }finally{await s.cleanup();}
});
test('network failure halts billing-unknown and never retries even on a later fresh process',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);let count=0;
 const first=await run(s,w,p,7,async()=>{count++;throw Error('Timeout');});
 assert.equal(first.executed,1);assert.equal(first.state,'HALTED_UNKNOWN_BILLING');assert.equal(first.unknownBilling,1);
 const newProcess=createDurableExecution({directory:s.dir});
 const later=await newProcess.runBatch({workspace:w,plan:p,maxCalls:7,transport:async()=>{count++;return fake();},operatorAuthorized:true});
 assert.equal(later.executed,0);assert.equal(count,1);
 }finally{await s.cleanup();}
});
test('invalid typed provider response is halted without phantom model result',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);let count=0;
 const r=await run(s,w,p,10,async()=>{count++;return {response:{answers:{activity_link:{type:'noul',noul:1.2}}},credits:null};});
 assert.equal(r.completed,0);assert.equal(r.state,'HALTED_UNKNOWN_BILLING');assert.equal(r.unknownBilling,1);assert.equal(count,1);
 assert.equal((await s.engine.read(p)).checkpoint.entries[0].finding,null);
 }finally{await s.cleanup();}
});
test('source revision produces fresh plan while original run and original hashes remain recoverable',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);
 await run(s,w,p,2,fake);reviseDocument(w,'Perm',permit+'\n\nKeep all walkways clear.');const next=planIntelligence(w);
 assert.notEqual(planKey(next),planKey(p));const present=await s.engine.status(next);
 assert.equal(present.state,'READY');assert.equal(present.attempts,0);assert.equal(present.archivedRuns,1);
 const old=await s.engine.status(p);assert.equal(old.completed,2);
 assert.equal((await run(s,w,next,1,fake)).completed,1);
 }finally{await s.cleanup();}
});
test('human review revisions alone do not invalidate the original source-plan execution',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);await run(s,w,p,2,fake);
 recordReview(w,{evidenceId:p.tasks[0].id,reviewer:'Producer',reason:'Check permit',decision:'NEEDS_SOURCE'});
 const rerun=planIntelligence(w);assert.equal(planKey(rerun),planKey(p));assert.equal((await s.engine.status(rerun)).completed,2);
 }finally{await s.cleanup();}
});
test('source edit mid-batch stops future requests, preserves recorded original completion',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);let count=0;
 const result=await s.engine.runBatch({workspace:w,plan:p,maxCalls:8,operatorAuthorized:true,
  transport:async()=>{count++;return fake();},checkFresh:async()=>{if(count===1)reviseDocument(w,'Perm',permit+'\n\nNo unauthorized visitors.');return w;}});
 assert.equal(count,1);assert.equal(result.completed,1);assert.equal(result.state,'STALE_SOURCES');
 assert.equal((await s.engine.status(planIntelligence(w))).attempts,0);
 }finally{await s.cleanup();}
});
test('execution files reject journal corruption instead of relabeling results as verified',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);await run(s,w,p,1,fake);
 const file=path.join(s.engine.directory,w.id+'.'+planKey(p)+'.json');const rec=JSON.parse(await readFile(file,'utf8'));rec.run.checkpoint.entries[0].finding.grant=0.999;await writeFile(file,JSON.stringify(rec));
 await assert.rejects(s.engine.status(p),/SHA-256 integrity/);
 }finally{await s.cleanup();}
});
test('tampered valid-checksum checkpoint is rejected when source quote diverges',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);await run(s,w,p,1,fake);
 const file=path.join(s.engine.directory,w.id+'.'+planKey(p)+'.json');const rec=JSON.parse(await readFile(file,'utf8'));rec.run.checkpoint.entries[0].finding.sourceQuote='counterfeit';rec.hash=sha(rec.run);await writeFile(file,JSON.stringify(rec));
 await assert.rejects(s.engine.status(p),/matches exact sources/);
 }finally{await s.cleanup();}
});
test('stranded writer fence blocks concurrent and future execution rather than pretending a safe retry',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);let release;const gate=new Promise(r=>release=r);let entered;const begun=new Promise(r=>entered=r);
 const first=run(s,w,p,1,async()=>{entered();await gate;return fake();});await begun;
 await assert.rejects(run(s,w,p,1,fake),/active or a crashed lock/);
 release();await first;assert.equal((await s.engine.status(p)).completed,1);
 }finally{await s.cleanup();}
});
test('plan/status projections are paginated and distinguish model-positive general consent from scoped variation',async()=>{
 const s=await setup();try{
 const w=createProduction({id:'grant_scope',title:'Grant safety'});
 applySourceImport(w,inspectImport({name:'permit.txt',kind:'permit',text:'ISSUED PUBLIC CONSENT covers filming in the North Arcade.\n\nAPPROVED NOTE permits Scene 21 to use a stall.'}),{documentId:'doc'});
 applySourceImport(w,inspectImport({name:'scene.csv',kind:'callSheet',text:csv}));const p=planIntelligence(w);
 await run(s,w,p,32,async()=>({response:{answers:{activity_link:{type:'noul',noul:.97},granted_for_scene:{type:'noul',noul:.96}}},credits:1}));
 const status=await s.engine.status(p,{offset:0,limit:2});assert.equal(status.entries.length,2);assert.equal(status.pagination.hasMore,true);
 const all=await s.engine.status(p,{offset:0,limit:100});
 assert(all.entries.some(x=>x.finding==='MODEL_GRANT_SCOPE_UNVERIFIED'&&x.scopeReason));
 assert(all.entries.some(x=>x.sceneId==='S21'&&x.sourceQuote.includes('Scene 21')&&x.finding==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'));
 }finally{await s.cleanup();}
});
async function liveServer({enabled=true,cap=256,transport=null}={}){
 const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-s12-http-'));let calls=0;
 const repo=createWorkspaceStore({directory:dir});
 const fetchImpl=async(url,options)=>{calls++;if(transport)return transport(url,options);return {ok:true,json:async()=>answer,headers:new Headers({'x-clocked-credits':'1'})};};
 const server=createAppServer({enabled,apiKey:'fake-key',operatorToken:'separate-local-token',maxCallsPerHour:cap,fetchImpl,workspaceStore:repo});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const request=async(method,uri,body,headers={})=>{const r=await fetch(base+uri,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 const close=async()=>{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});};
 const importData=async()=>{
  await request('POST','/api/workspaces',{id:'station',title:'Station Project'});
  await request('POST','/api/workspaces/station/import',{expectedVersion:1,documentId:'permit',file:{name:'permit.txt',kind:'permit',text:permit}});
  await request('POST','/api/workspaces/station/import',{expectedVersion:2,file:{name:'sheet.csv',kind:'callSheet',text:csv}});
 };
 return {request,close,importData,fetchLocal:(uri,opts)=>fetch(base+uri,opts),calls:()=>calls};
}
test('live owner API executes durable 1-32 batch, reopens without repeating calls, rejects bad token',async()=>{
 const s=await liveServer();try{await s.importData();
 const path='/api/workspaces/station/execution';assert.equal((await s.request('GET',path)).data.state,'READY');
 assert.equal((await s.request('POST',path,{confirm:'RUN_PROJECT_CLOCKED',maxCalls:4})).status,401);assert.equal(s.calls(),0);
 assert.equal((await s.request('POST',path,{confirm:'WRONG',maxCalls:4},{'X-Operator-Token':'separate-local-token'})).status,400);
 const r=await s.request('POST',path,{confirm:'RUN_PROJECT_CLOCKED',maxCalls:4},{'X-Operator-Token':'separate-local-token'});
 assert.equal(r.status,200);assert.equal(r.data.completed,4);assert.equal(s.calls(),4);
 const next=await s.request('POST',path,{confirm:'RUN_PROJECT_CLOCKED',maxCalls:8},{'X-Operator-Token':'separate-local-token'});
 assert.equal(next.status,200);assert.equal(next.data.completed,next.data.planned);assert.equal(s.calls(),next.data.planned);
 const loaded=await s.request('GET',path);assert.equal(loaded.data.state,'COMPLETE_FOR_PLANNED_UNITS_ONLY');
 }finally{await s.close();}
});
test('offline server rejects project Clocked calls without spending credits while retaining source review',async()=>{
 const s=await liveServer({enabled:false});try{await s.importData();
 const r=await s.request('POST','/api/workspaces/station/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:4},{'X-Operator-Token':'separate-local-token'});
 assert.equal(r.status,503);assert.equal(s.calls(),0);
 assert.equal((await s.request('GET','/api/workspaces/station/overview')).status,200);
 }finally{await s.close();}
});
test('provider rejection returns halted journal on original task, not a fabricated success',async()=>{
 const s=await liveServer({transport:async()=>({ok:false,status:500,headers:new Headers()})});try{await s.importData();
 const r=await s.request('POST','/api/workspaces/station/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:8},{'X-Operator-Token':'separate-local-token'});
 assert.equal(r.data.state,'HALTED_UNKNOWN_BILLING');assert.equal(s.calls(),1);
 assert.equal((await s.request('GET','/api/workspaces/station/execution')).data.completed,0);
 }finally{await s.close();}
});
test('local hourly budget stops a batch before dispatch and preserves checkpoint for next authorized batch',async()=>{
 const s=await liveServer({cap:8});try{await s.importData();
 const replacement={expectedVersion:3,documentId:'permit',file:{name:'permit.txt',kind:'permit',text:permit+'\n\nNo parking.\n\nKeep doors clear.'}};
 const preview=await s.request('POST','/api/workspaces/station/impact',replacement);assert.equal(preview.status,200);
 const updated=await s.request('POST','/api/workspaces/station/import',{...replacement,previewSha256:preview.data.previewSha256});assert.equal(updated.status,200);
 const r=await s.request('POST','/api/workspaces/station/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:32},{'X-Operator-Token':'separate-local-token'});
 assert.equal(r.status,200);assert.equal(r.data.attempts,8);assert.equal(s.calls(),8);
 const refused=await s.request('POST','/api/workspaces/station/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:8},{'X-Operator-Token':'separate-local-token'});
 assert.equal(refused.status,429);assert.equal(s.calls(),8);
 }finally{await s.close();}
});
test('browser controller integrates actual execution progress and never persists API token in its model',async()=>{
 const s=await liveServer();try{await s.importData();
 const values={'project-operator-token':'separate-local-token','project-call-limit':'2'};
 const root={querySelector:q=>({value:values[q.slice(1)]||'',dataset:{},files:[]})};
 const ctrl=createWorkspaceController({fetchImpl:s.fetchLocal,root});await ctrl.load();
 await ctrl.click({id:'',dataset:{projectOpen:'station'}});
 assert.match(productionView(ctrl.model),/Durable Clocked analysis/);
 await ctrl.click({id:'project-run-clocked',dataset:{}});
 assert.equal(ctrl.model.execution.completed,2);assert.equal(s.calls(),2);
 assert(!JSON.stringify(ctrl.model).includes('separate-local-token'));
 const html=productionView(ctrl.model);assert.match(html,/CLOCKED RESULT RECORDED/);assert(!html.includes('style='));
 }finally{await s.close();}
});
test('simulated process death after persisted pre-send intent is recovered as unknown, without a second call',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);await run(s,w,p,1,fake);
 const file=path.join(s.engine.directory,w.id+'.'+planKey(p)+'.json');const rec=JSON.parse(await readFile(file,'utf8'));
 rec.run.checkpoint.entries[1].status='IN_FLIGHT';rec.run.checkpoint.attempts=2;rec.run.checkpoint.state='RUNNING';rec.hash=sha(rec.run);
 await writeFile(file,JSON.stringify(rec));let invoked=0;
 const result=await run(s,w,p,32,async()=>{invoked++;return fake();});
 assert.equal(result.executed,0);assert.equal(result.state,'HALTED_UNKNOWN_BILLING');assert.equal(result.completed,1);assert.equal(result.unknownBilling,1);assert.equal(invoked,0);
 }finally{await s.cleanup();}
});
test('project evidence export keeps exact recorded source/task identity and excludes server secrets',async()=>{
 const s=await setup();try{const w=project(),p=planIntelligence(w);await run(s,w,p,2,fake);
 const evidence=await s.engine.exportEvidence(p);assert.equal(evidence.confirmedCompleted,2);assert.equal(evidence.records.length,p.plannedCalls);
 assert.equal(evidence.sha256,sha(Object.fromEntries(Object.entries(evidence).filter(([k])=>k!=='sha256'))));
 assert.deepEqual(evidence.records[0].finding.modelAnswers,answer.answers);
 assert.equal(evidence.records[0].requestHash,p.tasks[0].requestHash);
 assert(!JSON.stringify(evidence).includes('Authorization'));
 }finally{await s.cleanup();}
});
test('local owner evidence export endpoint includes checksum and rejects cross-site reads',async()=>{
 const s=await liveServer();try{await s.importData();
 await s.request('POST','/api/workspaces/station/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:1},{'X-Operator-Token':'separate-local-token'});
 const exported=await s.request('GET','/api/workspaces/station/execution/export');assert.equal(exported.status,200);
 assert.equal(exported.data.confirmedCompleted,1);assert.equal(exported.data.notClearance,true);
 assert.equal((await s.request('GET','/api/workspaces/station/execution/export',undefined,{'Origin':'https://attacker.example'})).status,403);
 }finally{await s.close();}
});
test('multi-document multi-scene plan can cross batch boundaries and restart with no duplicate task IDs',async()=>{
 const s=await setup();try{
 const w=createProduction({id:'large_run',title:'Several scenes'});
 for(let i=0;i<3;i++)applySourceImport(w,inspectImport({name:`p${i}.txt`,kind:'permit',text:`No drones in location ${i}.\n\nAccess routes need a marshal for zone ${i}.`}),{documentId:`permit${i}`});
 const table='Scene,Location,Start,End,Activity\n'+Array.from({length:7},(_,i)=>`${i+1},Area ${i},09:00,09:30,Camera walk ${i}`).join('\n');
 applySourceImport(w,inspectImport({name:'call.csv',kind:'callSheet',text:table}));const plan=planIntelligence(w);
 assert.equal(plan.plannedCalls,42);const ids=[];const fakeTransport=async(_,task)=>{ids.push(task.id);return fake();};
 await run(s,w,plan,16,fakeTransport);const resumed=createDurableExecution({directory:s.dir});
 await resumed.runBatch({workspace:w,plan,maxCalls:32,operatorAuthorized:true,transport:fakeTransport});
 const result=await resumed.status(plan,{offset:35,limit:7});assert.equal(result.completed,42);assert.equal(result.entries.length,7);
 assert.equal(ids.length,42);assert.equal(new Set(ids).size,42);
 }finally{await s.cleanup();}
});
test('unified owner project overview reports true model attempts, scene coverage and per-task findings after execution',async()=>{
 const s=await liveServer();try{await s.importData();
 await s.request('POST','/api/workspaces/station/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:1},{'X-Operator-Token':'separate-local-token'});
 const r=await s.request('GET','/api/workspaces/station/overview?limit=40');assert.equal(r.status,200);
 assert.equal(r.data.modelRequests,1);assert.equal(r.data.tasks[0].status,'CLOCKED_EVALUATED');
 assert.equal(r.data.tasks[0].modelFinding,'CLOCKED_SEMANTIC_REVIEW');
 assert.equal(r.data.scenes[0].ai,'PARTIAL_EVALUATION');assert.equal(r.data.scenes[1].ai,'NOT_EVALUATED');
 }finally{await s.close();}
});
