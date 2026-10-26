import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp} from 'node:fs/promises';
import {createAppServer} from '../server.mjs';
import {makeEvaluationRuntime,EVALUATION_NOTICE} from '../src/evaluation-mode.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createProduction} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';

async function fixture(){const dir=await mkdtemp(path.join(os.tmpdir(),'br-s30-owner-test-'));
 const owner=createWorkspaceStore({directory:dir});await owner.persist(createProduction({id:'private_original',title:'PRIVATE OWNER SECRET'}),{expectedVersion:0});
 const e=await makeEvaluationRuntime();let providerCalls=0;
 const server=createAppServer({evaluationMode:true,evaluationRuntime:e,workspaceStore:e.store,executionStore:e.execution,sourceVault:e.vault,
  enabled:true,apiKey:'FAKE_KEY_PRESENT_BUT_FORBIDDEN',operatorToken:'FAKE_OPERATOR_PRESENT_BUT_FORBIDDEN',fetchImpl:async()=>{providerCalls++;throw Error('NO PROVIDER');}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base='http://127.0.0.1:'+server.address().port;
 const req=async(route,method='GET',body=null,extra={})=>{const r=await fetch(base+route,{method,headers:{...(body!==null?{'Content-Type':'application/json'}:{}),...extra},body:body!==null?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 return {e,owner,server,req,base,dir,calls:()=>providerCalls,close:async()=>{await new Promise(done=>server.close(done));await e.dispose();await fs.rm(dir,{recursive:true,force:true});}};
}
test('evaluation sandbox is a distinct temporary directory; it never contains or reads private owner data',async()=>{const x=await fixture();try{
 assert.notEqual(x.e.directory,x.owner.directory);assert(!x.e.directory.includes('private_original'));
 const list=await x.req('/api/workspaces');assert.equal(list.status,200);assert.deepEqual(list.data.items.map(y=>y.id),['eval_arcade','eval_archive']);
 assert.equal((await x.req('/api/workspaces/private_original')).status,404);
 assert.equal((await x.owner.load('private_original')).workspace.title,'PRIVATE OWNER SECRET');
 const h=await x.req('/api/health');assert.equal(h.data.evaluationMode,true);assert.equal(h.data.mode,'LOCAL_EVALUATION_SANDBOX');assert.equal(h.data.liveEnabled,false);assert.equal(h.data.ownerAccessRequired,false);
 assert.equal(JSON.stringify(h.data).includes('FAKE_KEY'),false);assert.equal(x.calls(),0);
 }finally{await x.close();}});
test('isolated workspace is immediately usable without unlocking or operator credentials',async()=>{const x=await fixture();try{
 const page=await x.req('/api/workspaces/eval_archive/workflow');assert.equal(page.status,200,JSON.stringify(page.data).slice(0,700));
 assert.equal(page.data.workspace.callSheet.scenes.length,2);assert.equal((await x.e.execution.exportEvidence(planIntelligence((await x.e.store.load('eval_archive')).workspace))).origin,'OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT');
 assert.equal(page.data.dossier.counts.completedModelChecks,8);
 assert.equal(page.data.consistency.notClearance,true);
 const detail=await x.req('/api/workspaces/eval_archive/originals');assert.equal(detail.status,200);assert.equal(detail.data.preserved,2);
 assert.equal(x.calls(),0);
 }finally{await x.close();}});
test('recorded-only U02 replay is explicit, source-matched, and idempotent without live API calls',async()=>{const x=await fixture();try{
 const initial=await x.req('/api/workspaces/eval_arcade/workflow');assert.equal(initial.data.dossier.counts.completedModelChecks,0);
 const answer=await x.req('/api/evaluation/replay','POST',{projectId:'eval_arcade'});
 assert.equal(answer.status,200);assert.equal(answer.data.checksReplayed,8);assert.equal(answer.data.liveCalls,0);assert.equal(answer.data.originalCalls,8);
 const done=await x.req('/api/workspaces/eval_arcade/workflow');assert.equal(done.status,200);assert.equal(done.data.dossier.counts.completedModelChecks,8);
 assert.equal((await x.e.execution.exportEvidence(planIntelligence((await x.e.store.load('eval_arcade')).workspace))).origin,'OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT');
 const records=await x.e.execution.exportEvidence(planIntelligence((await x.e.store.load('eval_arcade')).workspace));
 assert(records.records.every(r=>r.finding?.replayOrigin==='OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT'&&/^[a-f0-9]{64}$/.test(r.finding.legacyRequestHash)));
 assert.equal((await x.req('/api/evaluation/replay','POST',{projectId:'eval_arcade'})).data.alreadyReplayed,true);
 assert.equal(x.calls(),0);
 }finally{await x.close();}});
test('sandbox changes and reset never modify the owner project or original recorded source fixtures',async()=>{const x=await fixture();try{
 const created=await x.req('/api/workspaces','POST',{id:'evaluation_experiment',title:'Disposable fictional exercise'});assert.equal(created.status,201);
 const reset=await x.req('/api/evaluation/reset','POST');assert.equal(reset.status,200);
 assert.deepEqual((await x.req('/api/workspaces')).data.items.map(y=>y.id),['eval_arcade','eval_archive']);
 assert.equal((await x.req('/api/workspaces/eval_archive/workflow')).data.dossier.counts.completedModelChecks,8);
 assert.equal((await x.owner.load('private_original')).workspace.title,'PRIVATE OWNER SECRET');
 assert.equal(x.calls(),0);
 }finally{await x.close();}});
test('evaluation API cannot be reached from owner mode or from cross-origin/forwarded hosts',async()=>{const x=await fixture();try{
 assert.equal((await x.req('/api/evaluation/replay','POST',{projectId:'eval_arcade'},{Origin:'https://attacker.example'})).status,403);
 assert.equal((await x.req('/api/evaluation/reset','POST',null,{'X-Forwarded-Host':'attacker.example'})).status,403);
 assert.equal((await x.req('/api/evaluation/replay','POST',{projectId:'private_original'})).status,422);
 assert.equal((await x.req('/api/semantic','POST',{text:'This is a fictional test of Clocked without API key','profile':'standard'})).status,503);
 assert.equal((await x.req('/api/extract','POST',{text:'This is a fictional test of Clocked without API key','profile':'standard'})).status,503);
 assert.equal(x.calls(),0);
 assert.throws(()=>createAppServer({evaluationMode:true}),/isolated sandbox/);
 }finally{await x.close();}});
test('evaluation replay rejects document revisions rather than rebind old scores to new words',async()=>{const x=await fixture();try{
 const old=await x.e.store.load('eval_arcade');const w=structuredClone(old.workspace);
 // Deliberately mutate the source to an unrelated restriction: source provenance must fail before replay.
 const {reviseDocument}=await import('../src/production-workspace.mjs');
 reviseDocument(w,'U02_PERMIT',w.documents[0].text+'\nAdditional unidentified rule.');await x.e.store.persist(w,{expectedVersion:old.version});
 const rejected=await x.req('/api/evaluation/replay','POST',{projectId:'eval_arcade'});assert.equal(rejected.status,422);assert.match(rejected.data.error,/does not match the frozen fictional recording/);
 const saved=await x.e.store.load('eval_arcade');const p=planIntelligence(saved.workspace);assert.equal((await x.e.execution.status(p)).attempts,0);
 assert.equal(x.calls(),0);
 }finally{await x.close();}});
test('browser assets expose a clear evaluation notice and real browser actions, never Clocked secrets',async()=>{
 const files=await Promise.all(['public/app.js','public/workspace/shell.mjs','scripts/Launch-Evaluation.ps1','Start-BeforeRoll-Evaluation.cmd'].map(f=>fs.readFile(new URL('../'+f,import.meta.url),'utf8')));
 assert.match(files[1],/Fictional evaluation/);assert.match(files[0],/evaluation-reset/);assert.match(files[0],/evaluation-replay/);
 assert.match(files[2],/Start-Process/);assert.match(files[3],/Launch-Evaluation\.ps1/);
 assert.match(EVALUATION_NOTICE,/No new API calls/);
});
