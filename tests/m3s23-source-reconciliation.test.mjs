import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createProduction,addDocument,setCallSheet,recordReview,applySourceImport,reviseDocument} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {recordAuthorityLink} from '../src/document-authority.mjs';
import {recordSceneAuthority} from '../src/scene-authority.mjs';
import {recordSceneSchedule,recordCondition,projectOperations} from '../src/production-operations.mjs';
import {previewSourceChange,verifySourceChangeCommit} from '../src/source-change-control.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createAppServer} from '../server.mjs';
import {productionView} from './helpers/ui-views.mjs';
import {createWorkspaceController} from '../public/workspace-desk.mjs';
const PERMIT='No drones.\n\nFilming must leave the pedestrian lane clear.\n\nStewards are required during public access.';
const AMEND='Written filming request only.\n\nThis addendum is specific to Scene 7.';
const SHEET='Scene 7 | North yard | 09:00-10:00 | Aerial tracking\nScene 8 | North yard | 12:00-13:00 | Walking camera';
const CHANGED_PERMIT=PERMIT+'\n\nTemporary roadway closure is prohibited.';
const CHANGED_SHEET='Scene 7 | North yard | 09:00-10:00 | Aerial tracking\nScene 9 | East gate | 18:00-19:00 | Crowd tracking';
const source=(kind,text,name='original.txt')=>({kind,name,text});
const envelope=(kind,text,name)=>inspectImport(source(kind,text,name));
function fixture(){
 const w=createProduction({id:'revision_s23',title:'Whole production'});
 addDocument(w,{id:'permit',name:'permit',text:PERMIT});addDocument(w,{id:'amend',name:'addendum',text:AMEND});setCallSheet(w,SHEET);
 return w;
}
function enriched(){
 const w=fixture(),u=w.documents[0].units[0];
 recordAuthorityLink(w,{fromId:'permit',toId:'amend',kind:'REFERENCES',start:u.start,end:u.end,quote:u.text,reviewer:'Unit lead',reason:'Original cross-reference'});
 recordSceneAuthority(w,{sceneId:'S7',documentId:'permit',unitId:u.id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'AD',reason:'Activity applies to this scene'});
 recordSceneSchedule(w,{sceneId:'S7',date:'2026-10-25',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'AD',reason:'Owner inspected production date'});
 recordCondition(w,{sceneId:'S7',title:'Confirm aerial work is lawful',documentId:'permit',unitId:u.id,reviewer:'AD',reason:'Original restrictive clause'});
 const task=planIntelligence(w).tasks.find(t=>t.sceneId==='S7'&&t.documentId==='permit');recordReview(w,{evidenceId:task.id,reviewer:'AD',decision:'NEEDS_SOURCE',reason:'Await amended authorization'});
 return w;
}
const before=w=>JSON.stringify(w);
const preview=(w,kind,text,documentId=null,v=1)=>previewSourceChange(w,envelope(kind,text),{documentId,persistedVersion:v});
test('preview fingerprint is SHA-256 and is stable for identical immutable source input',()=>{
 const w=enriched(),a=preview(w,'permit',CHANGED_PERMIT,'permit'),b=preview(w,'permit',CHANGED_PERMIT,'permit');
 assert.match(a.previewSha256,/^[a-f0-9]{64}$/);assert.equal(a.previewSha256,b.previewSha256);assert.equal(a.previewOnly,true);assert.equal(a.providerCalls,0);assert.equal(a.notClearance,true);
});
test('preview does not modify source, revisions, human reviews, documentary links or operations',()=>{
 const w=enriched(),raw=before(w);preview(w,'permit',CHANGED_PERMIT,'permit');assert.equal(before(w),raw);
});
test('one permit revision counts affected plan tasks and exact per-scene changes without hiding archives',()=>{
 const w=enriched(),p=preview(w,'permit',CHANGED_PERMIT,'permit');
 assert(p.tasks.retired>0&&p.tasks.added>0);assert.equal(p.tasks.retired,p.tasks.added-2);
 assert.equal(p.reconciliation.exactModelTasks.retiredByScene.S7,3);assert.equal(p.reconciliation.exactModelTasks.addedByScene.S7,4);
 assert.equal(p.reconciliation.exactModelTasks.retiredReviewed,1);
 assert.equal(p.reconciliation.sceneAuthorityClaims.becomingHistorical,1);
 assert.equal(p.reconciliation.documentaryLinks.becomingHistorical,1);
 assert.equal(p.reconciliation.prerequisites.becomingHistorical,1);
 assert.equal(p.reconciliation.schedules.requireReconfirmation.length,0);
 assert.equal(p.preservedHistory.reviewRecords,1);
});
test('scene removal identifies source-dependent schedules for reconfirmation rather than counting them current',()=>{
 const w=enriched();const p=preview(w,'callSheet',CHANGED_SHEET);
 assert.deepEqual(p.reconciliation.scenes.added,['S9']);assert.deepEqual(p.reconciliation.scenes.removed,['S8']);
 assert.deepEqual(p.reconciliation.scenes.retained,['S7']);assert.equal(p.reconciliation.schedules.requireReconfirmation.length,0);
 assert.equal(p.reconciliation.sceneAuthorityClaims.currentAfter,1);
});
test('scene textual revision changes schedule authority even when scene ID remains identical',()=>{
 const w=enriched();const p=preview(w,'callSheet',SHEET.replace('Aerial tracking','Drone movement'));
 assert.deepEqual(p.reconciliation.scenes.removed,[]);
 assert.deepEqual(p.reconciliation.schedules.requireReconfirmation,['S7']);
 assert.equal(p.reconciliation.prerequisites.becomingHistorical,1);
 assert.equal(p.reconciliation.sceneAuthorityClaims.becomingHistorical,1);
});
test('source additions preserve unrelated permit task hashes and per-scene reviews',()=>{
 const w=enriched(),p=preview(w,'permit',CHANGED_PERMIT,'permit');
 assert.equal(p.tasks.retained,4);assert.equal(p.reconciliation.exactModelTasks.retiredByScene.S7,3);
 assert.equal(p.reconciliation.exactModelTasks.retiredByScene.S8,3);
 assert.equal(p.reconciliation.documentaryLinks.currentAfter,0);
});
test('preview identifies unchanged original bytes without falsely claiming a new revision',()=>{
 const w=createProduction({id:'unchanged_s23',title:'Unchanged original'});const e=envelope('permit',PERMIT);applySourceImport(w,e,{documentId:'permit'});
 const p=previewSourceChange(w,e,{documentId:'permit',persistedVersion:1});assert.equal(p.changed,false);
 assert.throws(()=>verifySourceChangeCommit(w,e,{documentId:'permit',persistedVersion:1,previewSha256:p.previewSha256}),/No source-identity change/);
});
test('commit verification rejects missing, truncated, malformed and altered preview fingerprints',()=>{
 const w=enriched(),e=envelope('permit',CHANGED_PERMIT),p=preview(w,'permit',CHANGED_PERMIT,'permit');
 for(const hash of [undefined,null,'bad','0'.repeat(63),'0'.repeat(64)])assert.throws(()=>verifySourceChangeCommit(w,e,{documentId:'permit',persistedVersion:1,previewSha256:hash}),/fingerprint|differs/);
 assert.equal(verifySourceChangeCommit(w,e,{documentId:'permit',persistedVersion:1,previewSha256:p.previewSha256}).previewSha256,p.previewSha256);
});
test('same preview cannot commit another document, another binary, or another version',()=>{
 const w=enriched(),p=preview(w,'permit',CHANGED_PERMIT,'permit');
 for(const config of [{documentId:'amend',envelope:envelope('permit',CHANGED_PERMIT),version:1},
  {documentId:'permit',envelope:envelope('permit',CHANGED_PERMIT+'\nChanged again.'),version:1},
  {documentId:'permit',envelope:envelope('permit',CHANGED_PERMIT),version:2}])
  assert.throws(()=>verifySourceChangeCommit(w,config.envelope,{documentId:config.documentId,persistedVersion:config.version,previewSha256:p.previewSha256}),/differs/);
});
test('invalid replacement call sheet is rejected at strict intake before any workspace modification',()=>{
 const w=enriched(),old=before(w);
 assert.throws(()=>envelope('callSheet','Noise that is not a valid scene row.'),/unsupported rows|invalid times/);
 assert.equal(before(w),old);
});
test('preview samples are bounded, per-scene counts remain exact, original quotation detail stays out of action samples',()=>{
 const w=enriched(),p=preview(w,'permit',CHANGED_PERMIT,'permit');
 assert(p.reconciliation.exactModelTasks.addedSample.length<=40);
 assert(p.reconciliation.exactModelTasks.addedSample.every(x=>!('quote' in x)));
 assert.equal(Object.values(p.reconciliation.exactModelTasks.retiredByScene).reduce((a,b)=>a+b,0),p.tasks.retired);
});
test('actual preview and commit preserve original file bytes and previously recorded human evidence',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'before-s23-'));let server;
 try{
  const store=createWorkspaceStore({directory}),vault=createSourceOriginalVault({directory}),exec=createDurableExecution({directory});
  await store.persist(enriched(),{expectedVersion:0});server=createAppServer({workspaceStore:store,sourceVault:vault,executionStore:exec,enabled:false});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const base=`http://127.0.0.1:${server.address().port}/api/workspaces/revision_s23`;
  const post=(route,data,headers={})=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
  const original={kind:'permit',name:'new-original.txt',text:CHANGED_PERMIT};
  const pr=await post('/impact',{expectedVersion:1,documentId:'permit',file:original});assert.equal(pr.status,200);
  const p=await pr.json();assert.equal(p.reconciliation.prerequisites.becomingHistorical,1);
  assert.equal((await post('/commit-source-change',{expectedVersion:1,documentId:'permit',file:original,previewSha256:'f'.repeat(64)})).status,422);
  assert.equal((await store.load('revision_s23')).version,1);
  assert.equal((await post('/commit-source-change',{expectedVersion:1,documentId:'permit',file:original,previewSha256:p.previewSha256},{Origin:'https://evil.invalid'})).status,403);
  const saved=await post('/commit-source-change',{expectedVersion:1,documentId:'permit',file:original,previewSha256:p.previewSha256});assert.equal(saved.status,200,JSON.stringify(await saved.clone().json()));
  const w=(await saved.json()).workspace;assert.equal(w.documents.find(x=>x.id==='permit').text,CHANGED_PERMIT);assert.equal(w.reviewActions.length,1);assert.equal(w.authorityLinks.length,1);
  const inventory=await (await fetch(base+'/originals')).json();assert.equal(inventory.preserved,1);
  const actual=await vault.read(envelope('permit',CHANGED_PERMIT,'new-original.txt').rawHash);assert.equal(actual.toString(),CHANGED_PERMIT);
  assert.equal((await post('/commit-source-change',{expectedVersion:1,documentId:'permit',file:original,previewSha256:p.previewSha256})).status,409);
 }finally{if(server)await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}
});
test('reconciliation preview never dispatches any model calls even when live provider is configured',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'before-s23-live-'));let server,calls=0;
 try{const store=createWorkspaceStore({directory});await store.persist(fixture(),{expectedVersion:0});
  server=createAppServer({workspaceStore:store,enabled:true,apiKey:'fake',operatorToken:'fake',fetchImpl:async()=>{calls++;throw Error('Transport must remain untouched');}});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const url=`http://127.0.0.1:${server.address().port}/api/workspaces/revision_s23/impact`;
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion:1,documentId:'permit',file:source('permit',CHANGED_PERMIT)})});
  assert.equal(res.status,200);assert.equal((await res.json()).providerCalls,0);assert.equal(calls,0);
 }finally{if(server)await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}
});
test('owner browser exposes cross-domain consequences and preview hash without source HTML injection',()=>{
 const w=enriched();w.title='<img src=x onerror=alert(1)>';
 const p=preview(w,'permit',CHANGED_PERMIT,'permit');const html=productionView({items:[],selected:{version:1,workspace:w},impactPreview:p,overview:null,execution:null,authority:null,sceneAuthority:null,operations:null,dossier:null,actionQueue:null,busy:false});
 assert.match(html,/Reconciliation across the whole production/);assert.match(html,/Preview fingerprint/);
 assert.match(html,/project-impact-commit/);assert(!html.includes('<img src=x onerror'));assert(html.includes('&lt;img'));
});
test('invalid unsupported document import leaves preview code unable to create a model result',()=>{
 const w=enriched();assert.throws(()=>previewSourceChange(w,{schema:'wrong'}, {persistedVersion:1}),/Invalid imported source/);
 assert.throws(()=>previewSourceChange(w,envelope('permit',CHANGED_PERMIT),{documentId:'permit',persistedVersion:0}),/persisted/);
});
test('preview applies an amendment as an additional document, keeping existing model task identities',()=>{
 const w=fixture(),p=preview(w,'permit','Only signed written scene overrides are admissible.','additional');
 assert.equal(p.after.documents,p.before.documents+1);assert.equal(p.tasks.retired,0);assert(p.tasks.added>0);
 assert.equal(p.reconciliation.documentaryLinks.becomingHistorical,0);
});
test('browser owner workflow previews cross-domain consequences and commits exactly that original source',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'before-s23-browser-'));let server;
 try{
  const store=createWorkspaceStore({directory});await store.persist(enriched(),{expectedVersion:0});
  server=createAppServer({workspaceStore:store,executionStore:createDurableExecution({directory}),enabled:false});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const rootUrl='http://127.0.0.1:'+server.address().port;
  const bytes=Buffer.from(CHANGED_PERMIT);const selected={name:'source-revised.txt',size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
  const dom={querySelector(selector){const name=selector.slice(1);return {value:name==='project-doc-id'?'permit':'',files:name==='project-permit-file'?[selected]:[]};}};
  const errors=[];const controller=createWorkspaceController({fetchImpl:(url,options)=>fetch(rootUrl+url,options),root:dom,notify:(msg,isError)=>{if(isError)errors.push(msg);}});
  await controller.load();await controller.click({id:'',dataset:{projectOpen:'revision_s23'}});
  await controller.click({id:'project-impact-permit',dataset:{}});
  assert.equal(controller.model.impactPreview.reconciliation.sceneAuthorityClaims.becomingHistorical,1);
  assert.match(controller.model.impactPreview.previewSha256,/^[a-f0-9]{64}$/);
  assert.equal((await store.load('revision_s23')).version,1);
  await controller.click({id:'project-impact-commit',dataset:{}});
  assert.equal(controller.model.selected.version,2);assert.equal(controller.model.impactPreview,null);
  assert.equal(controller.model.selected.workspace.documents.find(d=>d.id==='permit').text,CHANGED_PERMIT);
  assert.deepEqual(errors,[]);
 }finally{if(server)await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}
});
test('browser rejects a source file changed after preview and leaves owner original untouched',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'before-s23-swap-'));let server;
 try{
  const store=createWorkspaceStore({directory});await store.persist(enriched(),{expectedVersion:0});
  server=createAppServer({workspaceStore:store,executionStore:createDurableExecution({directory}),enabled:false});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const rootUrl='http://127.0.0.1:'+server.address().port,oldBytes=Buffer.from(CHANGED_PERMIT),altered=Buffer.from(CHANGED_PERMIT.replace('roadway','highway'));
  let changed=false;const selected={name:'original.txt',size:oldBytes.length,arrayBuffer:async()=>Uint8Array.from(changed?altered:oldBytes).buffer};
  const dom={querySelector(selector){const name=selector.slice(1);return {value:name==='project-doc-id'?'permit':'',files:name==='project-permit-file'?[selected]:[]};}};
  const errors=[];const controller=createWorkspaceController({fetchImpl:(url,options)=>fetch(rootUrl+url,options),root:dom,notify:(msg,isError)=>{if(isError)errors.push(msg);}});
  await controller.load();await controller.click({id:'',dataset:{projectOpen:'revision_s23'}});
  await controller.click({id:'project-impact-permit',dataset:{}});changed=true;
  await controller.click({id:'project-impact-commit',dataset:{}});
  assert.equal((await store.load('revision_s23')).version,1);
  assert(errors.some(x=>/preview differs|source file/i.test(x)));
 }finally{if(server)await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}
});
test('guided browser refuses to overwrite old permit source without a verified preview',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'before-s23-guided-'));let server;
 try{const store=createWorkspaceStore({directory});await store.persist(enriched(),{expectedVersion:0});
  server=createAppServer({workspaceStore:store,executionStore:createDurableExecution({directory}),enabled:false});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const rootUrl='http://127.0.0.1:'+server.address().port,b=Buffer.from(CHANGED_PERMIT);
  const dom={querySelector(selector){const name=selector.slice(1);return {value:name==='project-doc-id'?'permit':'',files:name==='project-permit-file'?[{name:'source.txt',size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer}]:[]};}};
  const errors=[];const controller=createWorkspaceController({fetchImpl:(url,opts)=>fetch(rootUrl+url,opts),root:dom,notify:(msg,failed)=>{if(failed)errors.push(msg);}});
  await controller.load();await controller.click({id:'',dataset:{projectOpen:'revision_s23'}});
  await controller.click({id:'project-import-permit',dataset:{}});
  assert.equal((await store.load('revision_s23')).version,1);assert(errors.some(e=>/requires PREVIEW first/.test(e)));
 }finally{if(server)await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}
});
test('source reversal retires current authority claims without revalidating earlier same-text history',()=>{
 const w=fixture();const mark=()=>{
  const u=w.documents[0].units[0];recordAuthorityLink(w,{fromId:'permit',toId:'amend',kind:'REFERENCES',start:u.start,end:u.end,quote:u.text,reviewer:'AD',reason:'Linked source'});
  recordSceneAuthority(w,{sceneId:'S7',documentId:'permit',unitId:u.id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'AD',reason:'Exact scene restriction'});
 };
 mark();reviseDocument(w,'permit',CHANGED_PERMIT);mark();
 const sourceBefore=JSON.stringify(w),p=preview(w,'permit',PERMIT,'permit');
 assert.equal(p.reconciliation.documentaryLinks.currentBefore,1);
 assert.equal(p.reconciliation.documentaryLinks.currentAfter,0);
 assert.equal(p.reconciliation.documentaryLinks.becomingHistorical,1);
 assert.equal(p.reconciliation.documentaryLinks.revalidatedHistoric,0);
 assert.equal(p.reconciliation.sceneAuthorityClaims.currentBefore,1);
 assert.equal(p.reconciliation.sceneAuthorityClaims.currentAfter,0);
 assert.equal(p.reconciliation.sceneAuthorityClaims.becomingHistorical,1);
 assert.equal(p.reconciliation.sceneAuthorityClaims.revalidatedHistoric,0);
 assert.equal(sourceBefore,JSON.stringify(w));
});
test('retirement fingerprint lists deterministic source-bound IDs with no stale model scores fabricated',()=>{
 const w=enriched(),p=preview(w,'permit',CHANGED_PERMIT,'permit');
 assert(p.reconciliation.documentaryLinks.retiredIdSample.every(x=>/^[a-f0-9]{64}$/.test(x)));
 assert(p.reconciliation.sceneAuthorityClaims.retiredIdSample.every(x=>/^[a-f0-9]{64}$/.test(x)));
 assert.equal(p.reconciliation.effect,'READ_ONLY_RECONCILIATION_NOT_CLEARANCE');
 assert(!JSON.stringify(p.reconciliation).includes('modelScore'));
});
