import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import {createAppServer} from '../server.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createProduction,applySourceImport,reviseDocument,recordReview} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {productionReview,verifyTaskForReview} from '../src/production-review.mjs';
import {productionView,createWorkspaceController} from '../public/workspace-desk.mjs';
const permit='LOCATION PERMIT covers area B.\n\nNo drones.\n\nCrane movements require an issued marshal plan.';
const csv='Scene,Location,Start,End,Activity\n11,Area B,09:00,09:30,Drone flyover\n12,Area B,12:00,12:30,Crane sweep';
function project(){const w=createProduction({id:'film_11',title:'Film with <mark>Danger</mark>'});applySourceImport(w,inspectImport({name:'permit.txt',kind:'permit',text:permit}),{documentId:'Permit1'});applySourceImport(w,inspectImport({name:'sheet.csv',kind:'callSheet',text:csv}));return w;}
async function localServer(){
 const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-m3s11-'));
 const server=createAppServer({enabled:false,workspaceStore:createWorkspaceStore({directory:dir})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const fetchLocal=(uri,options)=>fetch(base+uri,options);
 async function call(method,uri,body,headers={}){const r=await fetchLocal(uri,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
 async function close(){await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
 return {call,close,fetchLocal,base};
}
test('production projection joins original source units, scene identities, exact tasks and no fake AI results',()=>{
 const w=project();const projection=productionReview(w);
 assert.equal(projection.state,'READY_FOR_HUMAN_SOURCE_REVIEW');assert.equal(projection.scenes.length,2);
 assert(projection.tasks.some(t=>t.sourceQuote==='No drones.'));assert.equal(projection.plannedCalls,planIntelligence(w).plannedCalls);
 assert(projection.tasks.every(t=>t.status==='NOT_AI_EVALUATED'));assert.equal(projection.modelRequests,0);
 assert.equal(projection.documents[0].sourceHash,w.documents[0].sourceHash);assert.equal(projection.pagination.hasMore,false);
});
test('human review is bound to exact current source task and retains its reason across presentation',()=>{
 const w=project(),task=planIntelligence(w).tasks.find(t=>t.sourceQuote==='No drones.');
 verifyTaskForReview(w,task.id);recordReview(w,{evidenceId:task.id,reviewer:'Operator 1',reason:'Get regulator signature',decision:'NEEDS_SOURCE'});
 let projection=productionReview(w);assert.equal(projection.reviewedCount,1);
 assert.equal(projection.tasks.find(x=>x.id===task.id).humanReview.reason,'Get regulator signature');
 reviseDocument(w,'Permit1',permit+'\n\nKeep access open.');
 assert.throws(()=>verifyTaskForReview(w,task.id),/does not belong/);
 projection=productionReview(w);assert.equal(projection.reviewedCount,0);assert.equal(w.reviewActions.length,1);
});
test('projection paginates all tasks without truncated or falsely evaluated output',()=>{
 const w=createProduction({id:'wide',title:'Wide'});
 applySourceImport(w,inspectImport({name:'a.txt',kind:'permit',text:Array.from({length:14},(_,i)=>`Clause ${i+1}: restriction ${i+1} must be checked.`).join('\n\n')}),{documentId:'A'});
 const rows=Array.from({length:12},(_,i)=>`${i+1},Hall,09:00,09:30,Walk ${i}`);
 applySourceImport(w,inspectImport({name:'calls.csv',kind:'callSheet',text:'Scene,Location,Start,End,Activity\n'+rows.join('\n')}));
 const p1=productionReview(w,{offset:0,limit:40}),p2=productionReview(w,{offset:40,limit:40});
 assert(p1.plannedCalls>=100);assert.equal(p1.tasks.length,40);assert.equal(p1.pagination.hasMore,true);
 assert.equal(p2.tasks.length,40);assert.notEqual(p1.tasks[0].id,p2.tasks[0].id);
 assert.throws(()=>productionReview(w,{offset:-1}),/offset/);assert.throws(()=>productionReview(w,{limit:101}),/page size/);
});
test('browser projection escapes untrusted project and source content and never promotes manual review into AI evidence',()=>{
 const w=project(),p=productionReview(w),html=productionView({items:[{id:w.id,title:w.title,documentCount:1,sceneCount:2,version:3}],selected:{version:3,workspace:w},overview:p});
 assert(html.includes('&lt;mark&gt;Danger&lt;/mark&gt;'));assert(!html.includes('<mark>Danger</mark>'));
 assert(html.includes('No drones.'));assert(html.includes('MODEL: NOT EVALUATED'));
 assert(html.includes('NOT AI EVALUATED'));assert(html.includes('IMPORT CALL SHEET'));assert(html.includes('CREATE PRODUCTION'));
 assert(!html.includes('OWNER-RECORDED CLOCKED'));assert(!html.includes('style='));
});
test('integrated local owner API: create, import, source plan, review, persist, replay with zero Clocked calls',async()=>{
 const s=await localServer();try{
  const health=await s.call('GET','/api/health');assert.equal(health.body.workspacesEnabled,true);
  const created=await s.call('POST','/api/workspaces',{id:'browser_film',title:'Browser Film'});assert.equal(created.status,201);
  const perm=await s.call('POST','/api/workspaces/browser_film/import',{expectedVersion:1,documentId:'permit1',file:{name:'permit.txt',kind:'permit',text:permit}});assert.equal(perm.status,200);
  const sheet=await s.call('POST','/api/workspaces/browser_film/import',{expectedVersion:2,file:{name:'calls.csv',kind:'callSheet',text:csv}});assert.equal(sheet.status,200);
  const overview=await s.call('GET','/api/workspaces/browser_film/overview?limit=2');assert.equal(overview.status,200);
  assert.equal(overview.body.tasks.length,2);assert(overview.body.plannedCalls>=6);assert.equal(overview.body.modelRequests,0);
  const first=overview.body.tasks[0].id;
  const bad=await s.call('POST','/api/workspaces/browser_film/review-task',{expectedVersion:3,evidenceId:'0'.repeat(64),reviewer:'owner',decision:'NEEDS_SOURCE',reason:'Need evidence'});assert.equal(bad.status,422);
  const saved=await s.call('POST','/api/workspaces/browser_film/review-task',{expectedVersion:3,evidenceId:first,reviewer:'owner',decision:'NEEDS_SOURCE',reason:'Verify original signed sheet'});assert.equal(saved.status,200);
  const conflict=await s.call('POST','/api/workspaces/browser_film/review-task',{expectedVersion:3,evidenceId:first,reviewer:'owner',decision:'OPEN',reason:'Stale update'});assert.equal(conflict.status,409);
  const after=await s.call('GET','/api/workspaces/browser_film/overview?limit=2');assert.equal(after.body.tasks[0].humanReview.reason,'Verify original signed sheet');assert.equal(after.body.version,4);
  assert.equal((await s.call('GET','/api/workspaces')).body.items.length,1);
 }finally{await s.close();}
});
test('project routes deny foreign web origin and cannot retrieve arbitrary file paths',async()=>{
 const s=await localServer();try{
  const foreign=await s.call('GET','/api/workspaces',undefined,{'Origin':'https://other.example'});assert.equal(foreign.status,403);
  const traversal=await s.call('GET','/api/workspaces/..%2f..%2fsecrets/overview');assert.notEqual(traversal.status,200);
  const script=await s.fetchLocal('/workspace-desk.mjs');assert.equal(script.status,200);assert.match(await script.text(),/productionView/);
 }finally{await s.close();}
});
test('browser controller reload uses same versioned API and stays model-free',async()=>{
 const s=await localServer();try{
  const controller=createWorkspaceController({fetchImpl:s.fetchLocal,root:{querySelector:()=>null}});await controller.load();assert.equal(controller.model.items.length,0);
  await s.call('POST','/api/workspaces',{id:'one',title:'One'});await controller.load();assert.equal(controller.model.items[0].title,'One');
  assert.equal(controller.model.selected,null);assert.match(controller.render(),/CREATE PRODUCTION/);
 }finally{await s.close();}
});
test('browser module and markup preserve strict CSP with no inline event handlers',async()=>{
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const app=await readFile(path.join(root,'public/app.js'),'utf8');const module=await readFile(path.join(root,'public/workspace-desk.mjs'),'utf8');
 assert.match(app,/state.tab==='projects'/);assert.match(app,/createWorkspaceController/);
 assert(!/<[^>]+on(?:click|change|submit|load)\s*=/i.test(module));assert(!/<[^>]+style\s*=/i.test(module));
});
test('browser controller full owner workflow: create -> import permit -> import sheet -> choose task -> record review -> reopen',async()=>{
 const s=await localServer();try{
  const values={'project-id':'from_ui','project-title':'UI Workspace','project-doc-id':'permit_ui','project-reviewer':'Shift supervisor','project-decision':'NEEDS_SOURCE','project-reason':'Confirm original signed permit'};
  const permFile={name:'permit.txt',size:Buffer.byteLength(permit),arrayBuffer:async()=>Uint8Array.from(Buffer.from(permit)).buffer};
  const csvFile={name:'calls.csv',size:Buffer.byteLength(csv),arrayBuffer:async()=>Uint8Array.from(Buffer.from(csv)).buffer};
  const element=id=>({value:values[id]??'',dataset:id==='project-save-review'?{taskId:controller.model.overview.tasks[0].id}:{},files:id==='project-permit-file'?[permFile]:id==='project-call-file'?[csvFile]:[]});
  const controller=createWorkspaceController({fetchImpl:s.fetchLocal,root:{querySelector:q=>element(q.slice(1))}});
  await controller.load();
  await controller.click({id:'project-create',dataset:{}});
  assert.equal(controller.model.selected.version,1);
  await controller.click({id:'project-import-permit',dataset:{}});
  assert.equal(controller.model.selected.workspace.documents.length,1);
  await controller.click({id:'project-import-call',dataset:{}});
  assert.equal(controller.model.overview.plannedCalls,6);
  await controller.click({id:'project-save-review',dataset:{}});
  assert.equal(controller.model.selected.version,4);
  assert.equal(controller.model.overview.reviewedCount,1);
  await controller.click({dataset:{projectOpen:'from_ui'},id:''});
  assert.equal(controller.model.selected.version,4);
  assert.equal(controller.model.overview.reviewedCount,1);
  assert.match(controller.render(),/Confirm original signed permit/);
 }finally{await s.close();}
});
