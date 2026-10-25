import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {mkdtemp,rm} from 'node:fs/promises';
import {createProduction,addDocument,setCallSheet,recordReview,reviseDocument} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {buildProductionDossier} from '../src/production-dossier.mjs';
import {buildSceneWorkbench} from '../src/scene-workbench.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {recordSceneAuthority} from '../src/scene-authority.mjs';
import {recordSceneSchedule,recordCondition,decideCondition} from '../src/production-operations.mjs';
import {createAppServer} from '../server.mjs';
import {productionView,createWorkspaceController} from '../public/workspace-desk.mjs';
const AT='2026-10-25T10:00:00.000Z';
const permitA='No drones.\n\nOnly Scene 7 may fly a tethered drone after an issued exception.\n\nNo open flames.';
const permitB='The west exit must remain unobstructed.\n\nStewards must be present during camera movement.';
const sheet='Scene 7 | West Exit | 09:00-10:00 | Tethered drone\nScene 8 | West Exit | 11:00-12:00 | Camera dolly';
const fixture=()=>{const w=createProduction({id:'scene18',title:'Scene field packet'});addDocument(w,{id:'P',name:'Original permit',text:permitA});addDocument(w,{id:'E',name:'Egress addendum',text:permitB});setCallSheet(w,sheet);return w;};
const dossier=(w,extras={})=>buildProductionDossier(w,{persistedVersion:1,asOf:AT,...extras});
const scene=(w,opts={})=>buildSceneWorkbench(dossier(w),{sceneId:'S7',...opts});
const request=async(base,path,{method='GET',body,token,origin}={})=>{const res=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{'X-Operator-Token':token}:{}),...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,json:await res.json()};};
async function lab(){const directory=await mkdtemp(path.join(os.tmpdir(),'beforeroll-scene18-'));return {directory,store:createWorkspaceStore({directory}),execution:createDurableExecution({directory}),clean:()=>rm(directory,{recursive:true,force:true})};}
async function start(l,options={}){const server=createAppServer({workspaceStore:l.store,executionStore:l.execution,...options});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,base:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};}
const fake=async()=>({response:{answers:{activity_link:{type:'noul',noul:0.93},granted_for_scene:{type:'noul',noul:0.05}}},credits:1});
test('one scene packet contains every document, scoped row, exact source tasks, and no guessed Clocked decisions',()=>{
 const w=fixture(),p=scene(w);assert.equal(p.schema,'beforeroll-scene-workbench-v1');assert.equal(p.scene.sceneId,'S7');assert.match(p.scene.originalRow,/Scene 7/);
 assert.equal(p.documents.length,2);assert.equal(p.summary.planned,5);assert.equal(p.tasks.length,5);assert.equal(p.summary.completedModelChecks,0);
 assert(p.tasks.every(x=>x.sceneId==='S7'&&x.evidenceClass==='NOT_AI_EVALUATED'&&x.model===null));
 assert(p.documents.some(x=>x.id==='P'&&x.plannedSceneChecks===3));assert(p.documents.some(x=>x.id==='E'&&x.plannedSceneChecks===2));
 assert.equal(p.notClearance,true);assert.match(p.notice,/NOT a filming clearance/);assert.match(p.sha256,/^[a-f0-9]{64}$/);
});
test('exact task navigation retains global plan offsets across multiple documents and scenes',()=>{
 const w=fixture(),p=scene(w);const planned=planIntelligence(w);for(const x of p.tasks){assert.equal(planned.tasks[x.globalTaskIndex].id,x.id);}
 assert.deepEqual(p.tasks.map(x=>x.globalTaskIndex),[0,1,2,6,7]);
 assert(p.actions.actions.filter(x=>x.globalTaskIndex!==null).every(a=>planned.tasks[a.globalTaskIndex].id===a.taskId));
});
test('one-scene action inventory excludes unrelated scene work but stays linked to same dossier',()=>{
 const w=fixture(),p=scene(w);assert.equal(p.actions.dossierSha256,p.dossierSha256);assert.equal(p.actions.filter.sceneId,'S7');
 assert(p.actions.actions.every(x=>x.sceneId==='S7'));assert.equal(p.summary.actionCount,p.actions.filteredTotal);
 assert(!JSON.stringify(p).includes('CLOCKED_API_KEY'));
});
test('task and action pagination are stable, contiguous, bounded and independently controlled',()=>{
 const w=fixture();const a=scene(w,{taskLimit:2,actionLimit:3}),b=scene(w,{taskOffset:2,taskLimit:2,actionOffset:3,actionLimit:3});
 assert.equal(a.tasks.length,2);assert.equal(b.tasks.length,2);assert(a.taskPagination.hasMore);assert.deepEqual(a.tasks.map(t=>t.id).concat(b.tasks.map(t=>t.id)),scene(w).tasks.slice(0,4).map(t=>t.id));
 assert(!a.actions.actions.some(t=>b.actions.actions.some(s=>s.id===t.id)));
 for(const opts of [{taskOffset:-1},{taskOffset:3001},{taskLimit:0},{taskLimit:101},{actionOffset:-1},{actionLimit:101}])assert.throws(()=>scene(w,opts),/pagination/);
});
test('missing scenes, wrong dossier fingerprint, counterfeit clearance status and invalid IDs fail closed',()=>{
 const d=dossier(fixture());for(const sceneId of ['S777','','__absent',null,3])assert.throws(()=>buildSceneWorkbench(d,{sceneId}));
 const corrupt=structuredClone(d);corrupt.sceneTasks[0].quote='manufactured';assert.throws(()=>buildSceneWorkbench(corrupt,{sceneId:'S7'}),/altered dossier/);
 const grant=structuredClone(d);grant.notClearance=false;assert.throws(()=>buildSceneWorkbench(grant,{sceneId:'S7'}));
});
test('source-bound human decisions appear only in their current task; unrelated scene stays unreviewed',()=>{
 const w=fixture(),plan=planIntelligence(w),id=plan.tasks.find(t=>t.sceneId==='S7').id;recordReview(w,{evidenceId:id,decision:'RESOLVED_BY_HUMAN',reviewer:'Coordinator',reason:'Original permit read, follow conditions'});
 const a=scene(w),b=buildSceneWorkbench(dossier(w),{sceneId:'S8'});
 assert.equal(a.summary.currentTaskReviews,1);assert(a.tasks.find(t=>t.id===id).currentHumanReview);assert.equal(b.summary.currentTaskReviews,0);
 assert(!a.actions.actions.some(x=>x.taskId===id&&x.code==='REVIEW_EXACT_SOURCE_TASK'));assert(a.actions.actions.some(x=>x.taskId===id&&x.code==='RUN_UNEVALUATED_SOURCE_CHECK'));
});
test('scene authority, dates and operational prerequisites are reconciled inside scene packet',()=>{
 const w=fixture(),source=w.documents[0].units[0];recordSceneAuthority(w,{sceneId:'S7',documentId:'P',unitId:source.id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'AD',reason:'Drone rule applies'});
 recordSceneSchedule(w,{sceneId:'S7',date:'2026-10-26',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'AD',reason:'Production schedule'});
 recordCondition(w,{sceneId:'S7',title:'Hire steward',documentId:'E',unitId:w.documents[1].units[1].id,reviewer:'AD',reason:'West exit requires staff'});
 const a=scene(w);assert.equal(a.summary.currentScopeClaims,1);assert.equal(a.summary.currentPrerequisites,1);assert.equal(a.summary.openPrerequisites,1);assert.equal(a.scene.schedule.scheduleState,'DATED_HUMAN_PLAN_NOT_AUTHORITY');
 assert(a.scopeClaims.some(x=>x.kind==='RESTRICTION'));assert(a.conditions.some(x=>x.title==='Hire steward'));assert(a.actions.actions.some(x=>x.code==='REVIEW_PREREQUISITE'));
 decideCondition(w,{conditionId:w.conditions[0].id,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'AD',reason:'Human recorded evidence'});
 const b=scene(w);assert.equal(b.summary.openPrerequisites,0);assert(!b.actions.actions.some(x=>x.code==='REVIEW_PREREQUISITE'));assert.equal(b.notClearance,true);
});
test('changed source deactivates prior exact scene authority and review without deleting their history',()=>{
 const w=fixture(),p=planIntelligence(w),first=p.tasks[0];recordReview(w,{evidenceId:first.id,decision:'RESOLVED_BY_HUMAN',reviewer:'AD',reason:'Original verified'});
 recordSceneAuthority(w,{sceneId:'S7',documentId:'P',unitId:w.documents[0].units[0].id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'AD',reason:'Original quote'});
 reviseDocument(w,'P',permitA+'\n\nNo special effects.');const q=scene(w);
 assert.equal(q.summary.currentTaskReviews,0);assert.equal(q.summary.currentScopeClaims,0);assert.equal(q.summary.staleScopeClaims,1);
 assert.equal(w.reviewActions.length,1);assert.equal(w.sceneAuthority.length,1);
 assert(q.actions.actions.some(a=>a.code==='REVIEW_EXACT_SOURCE_TASK'));
});
test('simulated provider results remain source-specific and do not become a scene grant',async()=>{
 const l=await lab();try{const w=fixture(),plan=planIntelligence(w);
  await l.execution.runBatch({workspace:w,plan,maxCalls:3,operatorAuthorized:true,transport:fake});
  const packet=buildSceneWorkbench(dossier(w,{modelEvidence:await l.execution.exportEvidence(plan)}),{sceneId:'S7'});
  assert.equal(packet.summary.completedModelChecks,3);assert(packet.tasks.some(t=>t.model?.code&&t.evidenceClass==='OWNER_RECORDED_MODEL_NOT_AUTHORITY'));
  assert.equal(packet.scene.readiness,'OUTSTANDING_REVIEW');assert(packet.actions.actions.some(a=>a.code==='RUN_UNEVALUATED_SOURCE_CHECK'));
 }finally{await l.clean();}
});
test('interrupted attempted provider call is shown as uncertain rather than eligible for replay',async()=>{
 const l=await lab();try{const w=fixture(),plan=planIntelligence(w);
  await l.execution.runBatch({workspace:w,plan,maxCalls:2,operatorAuthorized:true,transport:async()=>{throw Error('transport disconnected');}});
  const packet=buildSceneWorkbench(dossier(w,{modelEvidence:await l.execution.exportEvidence(plan)}),{sceneId:'S7'});
  assert.equal(packet.summary.uncertainModelChecks,1);assert(packet.tasks.some(t=>t.evidenceClass==='PROVIDER_OUTCOME_UNCERTAIN'));
  assert(packet.actions.actions.some(t=>t.code==='INVESTIGATE_PROVIDER_OUTCOME'));assert.equal(packet.notClearance,true);
 }finally{await l.clean();}
});
test('API scene-workbench is read-only, rejects invalid filters, and blocks cross-origin data reads',async()=>{
 const l=await lab();const w=fixture();await l.store.persist(w,{expectedVersion:0});const s=await start(l);try{const base='/api/workspaces/scene18';
  const v=await request(s.base,base+'/scene-workbench?sceneId=S7&taskLimit=2');assert.equal(v.status,200);assert.equal(v.json.tasks.length,2);assert.equal(v.json.scene.sceneId,'S7');
  assert.equal((await l.store.load('scene18')).version,1);
  assert.equal((await request(s.base,base+'/scene-workbench?sceneId=S9')).status,422);
  assert.equal((await request(s.base,base+'/scene-workbench?sceneId=S7&taskLimit=999')).status,422);
  assert.equal((await request(s.base,base+'/scene-workbench?sceneId=S7&actionOffset=-1')).status,422);
  assert.equal((await request(s.base,base+'/scene-workbench?sceneId=S7',{origin:'https://evil.test'})).status,403);
 }finally{await s.close();await l.clean();}
});
test('cold-start lifecycle: source import, checkpointed model, human review and server restart keep one scene state',async()=>{
 const l=await lab();let s=await start(l,{enabled:true,apiKey:'test-only',operatorToken:'local-test-token',fetchImpl:async()=>new Response(JSON.stringify({answers:{activity_link:{type:'noul',noul:0.93},granted_for_scene:{type:'noul',noul:0.05}}}),{status:200,headers:{'Content-Type':'application/json','x-clocked-credits':'1'}})});
 const api='/api/workspaces/scene18';let calls=0;
 try{
  let r=await request(s.base,'/api/workspaces',{method:'POST',body:{id:'scene18',title:'Scene field packet'}});assert.equal(r.status,201);let version=r.json.version;
  for(const [id,text] of [['P',permitA],['E',permitB]]){r=await request(s.base,api+'/import',{method:'POST',body:{expectedVersion:version,documentId:id,file:{kind:'permit',name:id+'.txt',text}}});assert.equal(r.status,200);version=r.json.version;}
  r=await request(s.base,api+'/import',{method:'POST',body:{expectedVersion:version,file:{kind:'callSheet',name:'scenes.txt',text:sheet}}});assert.equal(r.status,200);version=r.json.version;
  r=await request(s.base,api+'/scene-workbench?sceneId=S7');assert.equal(r.status,200);const initial=r.json;assert.equal(initial.summary.planned,5);assert(initial.tasks.every(t=>t.model===null));
  r=await request(s.base,api+'/execution',{method:'POST',token:'local-test-token',body:{confirm:'RUN_PROJECT_CLOCKED',maxCalls:3}});assert.equal(r.status,200);assert.equal(r.json.completed,3);
  await s.close();s=await start(l);
  r=await request(s.base,api+'/scene-workbench?sceneId=S7');assert.equal(r.status,200);assert.equal(r.json.summary.completedModelChecks,3);
  const first=r.json.tasks[0].id;
  r=await request(s.base,api+'/review-task',{method:'POST',body:{expectedVersion:version,evidenceId:first,decision:'RESOLVED_BY_HUMAN',reviewer:'AD',reason:'Original source reviewed'}});
  assert.equal(r.status,200);version=r.json.version;
  r=await request(s.base,api+'/scene-workbench?sceneId=S7');assert.equal(r.status,200);assert.equal(r.json.summary.currentTaskReviews,1);
  const preview=await request(s.base,api+'/impact',{method:'POST',body:{expectedVersion:version,documentId:'P',file:{kind:'permit',name:'P_changed.txt',text:permitA+'\n\nNo amplified sound.'}}});assert.equal(preview.status,200);assert.equal(preview.json.previewOnly,true);
  r=await request(s.base,api+'/import',{method:'POST',body:{expectedVersion:version,documentId:'P',file:{kind:'permit',name:'P_changed.txt',text:permitA+'\n\nNo amplified sound.'}}});assert.equal(r.status,200);
  r=await request(s.base,api+'/scene-workbench?sceneId=S7');assert.equal(r.status,200);assert.equal(r.json.summary.currentTaskReviews,0);assert.equal(r.json.summary.completedModelChecks,0);assert.equal(r.json.summary.planned,6);
  const dossier=await request(s.base,api+'/dossier/summary');assert.equal(dossier.status,200);assert.equal(dossier.json.counts.staleHumanReviews,1);
  assert.equal((await l.store.load('scene18')).version,version+1);
 }finally{await s.close();await l.clean();}
});
test('HTML scene packet escapes injected source text and carries operable exact-scene buttons',()=>{
 const w=fixture();reviseDocument(w,'P',permitA+'\n\n<script>alert("unsafe")</script>');const packet=scene(w);
 const state={items:[],selected:{version:1,workspace:w},overview:{scenes:[{id:'S7',location:'West Exit'},{id:'S8',location:'West Exit'}],documents:[],pagination:{}},
  execution:{},authority:{},sceneAuthority:{},operations:{},dossier:{counts:{},outstanding:[],scenes:[]},sceneWorkbench:packet,activeSceneId:'S7',actionQueue:null,busy:false};
 const html=productionView(state);assert.match(html,/data-scene-focus="S7"/);assert.match(html,/data-scene-open-task=/);
 assert.match(html,/project-scene-task-next/);assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;'));
});
test('browser controller opens exact source task at its true global plan position, without model calls',async()=>{
 const l=await lab();await l.store.persist(fixture(),{expectedVersion:0});const s=await start(l);
 try{let calls=0;const fetchImpl=async(url,options)=>{calls++;if((options?.method??'GET')!=='GET')throw Error('Navigation must be read only');return fetch(s.base+url,options);};
  const controller=createWorkspaceController({fetchImpl,root:{querySelector:()=>null}});await controller.load();
  await controller.click({dataset:{projectOpen:'scene18'}});assert.equal(controller.model.activeSceneId,'S7');
  const task=controller.model.sceneWorkbench.tasks.find(t=>t.globalTaskIndex===6);assert(task);
  await controller.click({dataset:{sceneOpenTask:task.id,taskPosition:String(task.globalTaskIndex),sceneTaskPosition:String(task.sceneTaskIndex)}});
  assert.equal(controller.model.selectedTask,task.id);assert(controller.model.overview.tasks.some(t=>t.id===task.id));
  await controller.click({dataset:{sceneFocus:'S8'}});assert.equal(controller.model.sceneWorkbench.scene.sceneId,'S8');assert.equal(controller.model.sceneTaskOffset,0);
  assert(calls>0);assert.equal((await l.store.load('scene18')).version,1);
 }finally{await s.close();await l.clean();}
});

test('large source inventories retain stable scene-local and global coordinates over multiple pages',()=>{
 const w=createProduction({id:'large18',title:'Source pagination'});
 addDocument(w,{id:'L',name:'Long source',text:Array.from({length:75},(_,i)=>`Rule ${i+1}: No unsafe activity at station ${i+1}.`).join('\n\n')});
 setCallSheet(w,sheet);
 const d=dossier(w),p=buildSceneWorkbench(d,{sceneId:'S8',taskOffset:40,taskLimit:40,actionOffset:60,actionLimit:30});
 assert.equal(p.taskPagination.total,75);assert.equal(p.tasks.length,35);
 assert.deepEqual(p.tasks.map(t=>t.sceneTaskIndex),Array.from({length:35},(_,i)=>40+i));
 assert.deepEqual(p.tasks.map(t=>t.globalTaskIndex),Array.from({length:35},(_,i)=>115+i));
 assert.equal(p.actions.filter.sceneId,'S8');
 assert(p.actions.actions.every(x=>x.sceneId==='S8'));
});
test('browser operator records exact scene source review using same server mutation, not a shadow state',async()=>{
 const l=await lab();await l.store.persist(fixture(),{expectedVersion:0});const s=await start(l);
 try{
  let requestedId=null;
  const fields=new Map();const root={querySelector:(selector)=>fields.get(selector)||null};
  const controller=createWorkspaceController({fetchImpl:(uri,options)=>fetch(s.base+uri,options),root});await controller.load();
  await controller.click({dataset:{projectOpen:'scene18'}});
  const task=controller.model.sceneWorkbench.tasks[0];requestedId=task.id;
  await controller.click({dataset:{sceneOpenTask:requestedId,taskPosition:String(task.globalTaskIndex),sceneTaskPosition:String(task.sceneTaskIndex)}});
  fields.set('#project-scene-review-save',{dataset:{taskId:requestedId}});
  fields.set('#project-scene-reviewer',{value:'Coordinator'});
  fields.set('#project-scene-reason',{value:'Original quote reviewed, awaiting issued document'});
  fields.set('#project-scene-decision',{value:'NEEDS_SOURCE'});
  await controller.click({dataset:{},id:'project-scene-review-save'});
  assert.equal((await l.store.load('scene18')).version,2);
  assert.equal(controller.model.sceneWorkbench.tasks.find(t=>t.id===requestedId)?.currentHumanReview?.decision,'NEEDS_SOURCE');
  assert(controller.model.sceneWorkbench.actions.actions.some(a=>a.taskId===requestedId&&a.code==='FOLLOW_UP_HUMAN_REVIEW'));
 }finally{await s.close();await l.clean();}
});
test('document authority links are included only as unverified source-level context',async()=>{
 const {recordAuthorityLink}=await import('../src/document-authority.mjs');
 const w=fixture(),source=w.documents[0].units[1];recordAuthorityLink(w,{fromId:'P',toId:'E',kind:'REFERENCES',start:source.start,end:source.end,quote:source.text,reviewer:'Producer',reason:'Mentions addendum'});
 const p=scene(w);assert.equal(p.documentaryLinks.length,1);assert.equal(p.documentaryLinks[0].kind,'REFERENCES');
 assert.equal(p.documentaryLinks[0].status,'HUMAN_ASSERTED_UNVERIFIED');assert.equal(p.notClearance,true);
 const html=productionView({items:[],selected:{version:1,workspace:w},overview:{scenes:[{id:'S7',location:'West Exit'}],documents:[],pagination:{}},sceneWorkbench:p,activeSceneId:'S7',dossier:{counts:{},outstanding:[],scenes:[]}});
 assert.match(html,/SOURCE-LEVEL CLAIM, NOT AUTOMATIC SCENE PERMISSION/);
});
test('read-only workbench never discloses operator token or experimental API secrets',async()=>{
 const l=await lab();await l.store.persist(fixture(),{expectedVersion:0});const s=await start(l,{apiKey:'SHOULD_NOT_LEAK_SECRET',operatorToken:'NEVER_LEAK_TOKEN',enabled:true});
 try{const a=await request(s.base,'/api/workspaces/scene18/scene-workbench?sceneId=S7');assert.equal(a.status,200);
  assert(!JSON.stringify(a.json).includes('SHOULD_NOT_LEAK_SECRET'));assert(!JSON.stringify(a.json).includes('NEVER_LEAK_TOKEN'));assert.equal(a.json.notClearance,true);
 }finally{await s.close();await l.clean();}
});
