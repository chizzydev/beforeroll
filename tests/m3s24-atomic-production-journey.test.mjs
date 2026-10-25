import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {mkdtemp,rm} from 'node:fs/promises';
import {createAppServer} from '../server.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createProduction,addDocument,setCallSheet} from '../src/production-workspace.mjs';
import {buildProductionDossier} from '../src/production-dossier.mjs';
import {buildProductionJourney} from '../src/production-journey.mjs';
import {productionView,createWorkspaceController} from '../public/workspace-desk.mjs';
const PERMIT='No drones.\n\nThe public walkway must remain unobstructed.\n\nIssued Scene 7 exception requires safety marshals.';
const AMEND='Scene 8 extension requested but not issued.\n\nAny scene-specific variation must be signed.';
const SHEET='Scene 7 | West Gate | 09:00-09:30 | Drone overhead\nScene 8 | West Gate | 10:00-10:30 | Handheld tracking across walkway';
const sheetChanged='Scene 7 | West Gate | 09:00-09:30 | Drone overhead\nScene 9 | East Gate | 10:00-10:30 | Camera in public lane';
const file=(kind,name,text)=>({kind,name,text});
const data={id:'journey_s24',title:'One unified shoot'};
const noModel=()=>({status:'NOT_EVALUATED'});
const fakeClocked=async()=>({ok:true,headers:new Headers({'x-clocked-credits':'1'}),json:async()=>({answers:{activity_link:{type:'noul',noul:.95},granted_for_scene:{type:'noul',noul:.04}}})});
const postJson=(base,url,body,headers={})=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
async function lab({live=false}={}){
 const directory=await mkdtemp(path.join(os.tmpdir(),'br-s24-'));
 const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory});
 let calls=0;
 const server=createAppServer({workspaceStore:store,executionStore:execution,enabled:live,apiKey:'test-key',operatorToken:'test-token',fetchImpl:async()=>{calls++;return fakeClocked();}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base=`http://127.0.0.1:${server.address().port}`;
 const get=async(route)=>{const r=await fetch(base+route);return {status:r.status,body:await r.json()};};
 const post=async(route,body,headers={})=>{const r=await postJson(base,route,body,headers);return {status:r.status,body:await r.json()};};
 return {base,get,post,store,directory,requests:()=>calls,close:async()=>{await new Promise(ok=>server.close(ok));await rm(directory,{force:true,recursive:true});}};
}
const end='/api/workspaces/journey_s24';
const wf=(l,q='')=>l.get(end+'/workflow'+q);
function status(j,id){return j.checkpoints.find(x=>x.id===id);}
async function initiate(l){const c=await l.post('/api/workspaces',data);assert.equal(c.status,201);return c.body.version;}
async function importSources(l){
 let v=await initiate(l);
 let r=await l.post(end+'/import',{expectedVersion:v,documentId:'PERMIT',file:file('permit','main.txt',PERMIT)});assert.equal(r.status,200,r.body.error);v=r.body.version;
 r=await l.post(end+'/import',{expectedVersion:v,documentId:'ADDENDUM',file:file('permit','amendment.txt',AMEND)});assert.equal(r.status,200,r.body.error);v=r.body.version;
 r=await l.post(end+'/import',{expectedVersion:v,file:file('callSheet','callsheet.txt',SHEET)});assert.equal(r.status,200,r.body.error);v=r.body.version;
 return v;
}
test('empty production shows explicit source blockers without fabricating a model result or permission',async()=>{
 const l=await lab();try{
  await initiate(l);const response=await wf(l);assert.equal(response.status,200,response.body.error);const b=response.body;
  assert.equal(b.schema,'beforeroll-atomic-production-workflow-v1');assert.equal(b.version,1);assert.equal(b.notClearance,true);
  assert.equal(b.journey.suggestedStage,'sources');assert.equal(b.journey.allCheckpointsCurrent,false);
  assert.equal(status(b.journey,'sources').status,'BLOCKED');assert(status(b.journey,'sources').blockers.length>=2);
  assert.equal(b.execution.attempts,0);assert.equal(b.dossier.counts.planTasks,0);assert.equal(b.actionQueue.dossierSha256,b.journey.dossierSha256);
  assert.equal(b.sceneWorkbench,null);assert.equal(l.requests(),0);
 }finally{await l.close();}
});
test('one atomic workflow response uses the same evidence fingerprint and persisted project version everywhere',async()=>{
 const l=await lab();try{
  const version=await importSources(l);const {status:code,body:b}=await wf(l);
  assert.equal(code,200,b.error);assert.equal(b.version,version);assert.equal(b.journey.persistedVersion,version);
  assert.equal(b.workspace.id,data.id);assert.equal(b.sceneWorkbench.scene.sceneId,'S7');
  for(const item of [b.journey,b.actionQueue,b.sceneWorkbench])assert.equal(item.dossierSha256,b.dossierSha256);
  for(const item of [b.overview,b.authority,b.sceneAuthority,b.operations])assert.equal(item.version,version);
  assert.equal(b.originals.persistedVersion,version);assert.equal(b.originals.preserved,3);
  assert.equal(b.dossier.counts.documents,2);assert.equal(b.dossier.counts.scenes,2);
  assert.equal(b.execution.attempts,0);assert.equal(status(b.journey,'sources').status,'CURRENT');
  assert.equal(status(b.journey,'scope').status,'ATTENTION');assert.equal(status(b.journey,'analysis').status,'ATTENTION');
  assert.equal(status(b.journey,'review').status,'ATTENTION');assert.equal(status(b.journey,'operations').status,'ATTENTION');
  assert.equal(status(b.journey,'evidence').status,'ATTENTION');assert.equal(b.journey.allCheckpointsCurrent,false);
  assert.equal(l.requests(),0);
 }finally{await l.close();}
});
test('project creation to model execution, human review, prerequisites, revisions and evidence exports remains one coherent versioned lifecycle',async()=>{
 const l=await lab({live:true});try{
  let version=await importSources(l);let a=await wf(l),b=a.body;
  const firstDoc=b.workspace.documents[0],u=firstDoc.units[0];
  for(const [doc,role] of [['PERMIT','PERMIT'],['ADDENDUM','REQUEST']]){
   const result=await l.post(end+'/authority-document',{expectedVersion:version,documentId:doc,role,reference:doc,issuer:'Human-reported issuing party',reviewer:'Assistant director',reason:'Compared document header with original'});
   assert.equal(result.status,200,result.body.error);version=result.body.version;
  }
  let result=await l.post(end+'/scene-authority',{expectedVersion:version,sceneId:'S7',documentId:'PERMIT',unitId:u.id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'Assistant director',reason:'Drone restriction recorded for original scene'});
  assert.equal(result.status,200,result.body.error);version=result.body.version;
  result=await l.post(end+'/scene-authority',{expectedVersion:version,sceneId:'S8',documentId:'ADDENDUM',unitId:b.workspace.documents[1].units[0].id,kind:'REQUEST_NOT_GRANTED',scope:'SCOPE_UNRESOLVED',reviewer:'Assistant director',reason:'A request is not an issued exception'});
  assert.equal(result.status,200,result.body.error);version=result.body.version;
  for(const sceneId of ['S7','S8']){
   result=await l.post(end+'/scene-schedule',{expectedVersion:version,sceneId,date:'2026-10-28',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'Coordinator',reason:'Schedule confirmed from owner call sheet'});
   assert.equal(result.status,200,result.body.error);version=result.body.version;
  }
  result=await l.post(end+'/condition',{expectedVersion:version,sceneId:'S7',title:'Safety marshal must confirm coverage',documentId:'PERMIT',unitId:u.id,reviewer:'Coordinator',reason:'Original Scene 7 restriction'});
  assert.equal(result.status,200,result.body.error);version=result.body.version;
  b=(await wf(l)).body;assert.equal(status(b.journey,'scope').status,'CURRENT');
  assert.equal(status(b.journey,'operations').status,'ATTENTION');
  assert.equal(b.operations.summary.openPrerequisites,1);
  const conditionId=b.operations.conditions[0].id;
  result=await l.post(end+'/condition-decision',{expectedVersion:version,conditionId,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'Coordinator',reason:'Human record only, external clearance still required'});
  assert.equal(result.status,200,result.body.error);version=result.body.version;
  b=(await wf(l)).body;assert.equal(status(b.journey,'operations').status,'CURRENT');
  assert.equal(b.dossier.counts.currentReviewedTasks,0);
  assert.equal(l.requests(),0,'all source and human steps must be unbilled');
  // Real HTTP route with mock provider, NOT live sponsor credits.
  const batch=await l.post(end+'/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:32},{'X-Operator-Token':'test-token'});
  assert.equal(batch.status,200,batch.body.error);assert.equal(batch.body.completed,b.dossier.counts.planTasks);
  assert.equal(l.requests(),batch.body.completed);
  b=(await wf(l)).body;assert.equal(status(b.journey,'analysis').status,'CURRENT');
  assert.equal(b.dossier.counts.completedModelChecks,b.dossier.counts.planTasks);
  assert.equal(b.sceneWorkbench.summary.completedModelChecks,b.sceneWorkbench.summary.planned);
  assert.equal(status(b.journey,'review').status,'ATTENTION');
  const plan=(await l.get(end+'/plan')).body;assert.equal(plan.plannedCalls,b.dossier.counts.planTasks);
  for(const t of plan.tasks){
   result=await l.post(end+'/review-task',{expectedVersion:version,evidenceId:t.id,decision:'RESOLVED_BY_HUMAN',reviewer:'Coordinator',reason:'Source passage reviewed; not evidence of filming approval'});
   assert.equal(result.status,200,result.body.error);version=result.body.version;
  }
  b=(await wf(l)).body;assert.equal(status(b.journey,'review').status,'CURRENT');
  assert.equal(b.dossier.counts.currentReviewedTasks,b.dossier.counts.planTasks);
  assert.equal(b.journey.allCheckpointsCurrent,true,'all current checkpoints means recorded workflow, not clearance');
  assert.equal(b.journey.notClearance,true);
  const markdown=await fetch(l.base+end+'/dossier/markdown');assert.equal(markdown.status,200);const text=await markdown.text();
  assert.match(text,/NOT FILMING CLEARANCE/);assert.match(text,/Source-bound/);
  const auditedQuery=`?asOf=${encodeURIComponent(b.asOf)}&expectedVersion=${version}&expectedDossierSha256=${b.dossierSha256}`;
  const exported=await l.get(end+'/dossier'+auditedQuery);assert.equal(exported.status,200);assert.equal(exported.body.sha256,b.dossierSha256);
  // Revision preview must not mutate the workspace, journal or review history.
  const newPermit=PERMIT+'\n\nNo pyrotechnics.';
  const changed=file('permit','main-updated.txt',newPermit);
  const preview=await l.post(end+'/impact',{expectedVersion:version,documentId:'PERMIT',file:changed});
  assert.equal(preview.status,200,preview.body.error);assert.equal(preview.body.previewOnly,true);
  assert.equal((await wf(l)).body.version,version);
  const bad=await l.post(end+'/commit-source-change',{expectedVersion:version,documentId:'PERMIT',file:changed,previewSha256:'f'.repeat(64)});
  assert.equal(bad.status,422);
  result=await l.post(end+'/commit-source-change',{expectedVersion:version,documentId:'PERMIT',file:changed,previewSha256:preview.body.previewSha256});
  assert.equal(result.status,200,result.body.error);version=result.body.version;
  b=(await wf(l)).body;assert.equal(b.version,version);
  assert.equal(status(b.journey,'analysis').status,'ATTENTION');
  assert.equal(status(b.journey,'scope').status,'ATTENTION');
  assert.equal(status(b.journey,'review').status,'ATTENTION');
  assert(b.dossier.counts.staleHumanReviews>0);assert(b.dossier.counts.archivedModelRuns>=1);
  assert.equal(b.dossier.counts.completedModelChecks,0,'historical model answers are not current source results');
  assert.equal(b.journey.notClearance,true);
  const updated=await l.get(end+`/dossier?asOf=${encodeURIComponent(b.asOf)}&expectedVersion=${version}&expectedDossierSha256=${b.dossierSha256}`);assert.equal(updated.status,200);assert.equal(updated.body.sha256,b.dossierSha256);
  assert.equal((await l.get(end+'/dossier'+auditedQuery)).status,409,'stale evidence export cannot reuse former version');
 }finally{await l.close();}
});
test('atomic workflow denies cross-origin requests, prevents side effects in read mode and rejects bad pagination',async()=>{
 const l=await lab({live:true});try{
  await importSources(l);const before=(await l.store.load(data.id)).version;
  const x=await l.get(end+'/workflow?offset=-1');assert.equal(x.status,400);
  const wrong=await fetch(l.base+end+'/workflow',{headers:{Origin:'https://external.invalid'}});assert.equal(wrong.status,403);
  const other=await l.get('/api/workspaces/unavailable/workflow');assert.equal(other.status,404);
  const r=await wf(l,'?sceneId=not-a-current-scene');assert.equal(r.status,200);assert.equal(r.body.sceneWorkbench.scene.sceneId,'S7');
  assert.equal((await l.store.load(data.id)).version,before);assert.equal(l.requests(),0);
 }finally{await l.close();}
});
test('document revisions do not strand the operator on deleted scene after an atomic refresh',async()=>{
 const l=await lab();try{
  let version=await importSources(l);
  const fileNew=file('callSheet','later.txt',sheetChanged);
  const p=await l.post(end+'/impact',{expectedVersion:version,documentId:null,file:fileNew});assert.equal(p.status,200,p.body.error);
  const r=await l.post(end+'/commit-source-change',{expectedVersion:version,documentId:null,file:fileNew,previewSha256:p.body.previewSha256});assert.equal(r.status,200,r.body.error);
  const x=await wf(l,'?sceneId=S8');assert.equal(x.status,200,x.body.error);
  assert.equal(x.body.sceneWorkbench.scene.sceneId,'S7');assert(x.body.overview.scenes.some(s=>s.id==='S9'));
  assert.equal(x.body.dossierSha256,x.body.sceneWorkbench.dossierSha256);
 }finally{await l.close();}
});
test('pure journey rejects altered dossier and mismatched source register instead of reporting confidence',()=>{
 const w=createProduction({id:'pure',title:'Pure'});addDocument(w,{id:'P',name:'Permit',text:PERMIT});setCallSheet(w,SHEET);
 const d=buildProductionDossier(w,{persistedVersion:1,asOf:'2026-10-25T10:00:00.000Z'});
 const j=buildProductionJourney(d);assert.equal(j.notClearance,true);assert.match(j.sha256,/^[a-f0-9]{64}$/);
 assert.equal(j.checkpoints.length,7);assert.equal(j.checkpoints[0].id,'sources');
 const bad=structuredClone(d);bad.counts.completedModelChecks=99;assert.throws(()=>buildProductionJourney(bad),/altered/);
 const originals={schema:'beforeroll-original-source-register-v1',productionId:'another_project',persistedVersion:1,missingOriginalSha256:[]};
 assert.throws(()=>buildProductionJourney(d,{originals}),/version disagree/);
});
test('workflow controls reveal the selected stage, contain no duplicate shadow workflows and escape untrusted records',()=>{
 const w=createProduction({id:'ui_flow',title:'<script>not real</script>'});addDocument(w,{id:'P',name:'Permit',text:PERMIT});setCallSheet(w,SHEET);
 const dossier=buildProductionDossier(w,{persistedVersion:1,asOf:'2026-10-25T10:00:00.000Z'});
 const journey=buildProductionJourney(dossier);
 const base={selected:{workspace:w,version:1},items:[],overview:{scenes:[],tasks:[],documents:[],plannedCalls:0},journey};
 for(const stage of journey.checkpoints.map(c=>c.id)){
  const html=productionView({...base,workflowStage:stage});
  assert.match(html,/data-workflow-open="sources"/);assert.match(html,/data-workflow-open="evidence"/);
  assert.match(html,/one continuous workspace/i);assert(!html.includes('<script>not real</script>'));
  assert.match(html,/&lt;script&gt;not real&lt;\/script&gt;/);
  assert.match(html,new RegExp(`data-workflow-open="${stage}" aria-current="step"`));
  assert(!html.includes('CLOCKED_API_KEY'));
 }
 const evidence=productionView({...base,workflowStage:'evidence'});
 assert.match(evidence,/production-box workflow-pane-hidden" aria-label="Source-bound production action queue"/);
 assert(!/style\s*=|onclick\s*=|onchange\s*=/i.test(evidence));
});
test('browser controller uses one atomic read per selected project refresh and navigates by action without creating shadow review state',async()=>{
 const l=await lab();try{
  await importSources(l);const calls=[];
  const controller=createWorkspaceController({fetchImpl:(uri,options)=>{calls.push(uri);return fetch(l.base+uri,options);},root:{querySelector:()=>({value:'',dataset:{},files:[]})},notify:()=>{}});
  await controller.load();await controller.click({dataset:{projectOpen:data.id},id:''});
  assert.equal(controller.model.workflowStage,'sources');assert.equal(controller.model.selected.workspace.id,data.id);
  assert(calls.some(x=>x.includes('/workflow?')));assert(!calls.some(x=>x.includes('/dossier/summary')||x.includes('/scene-workbench?')));
  const beforeVersion=controller.model.selected.version;
  await controller.click({dataset:{workflowOpen:'scope'},id:''});assert.equal(controller.model.workflowStage,'scope');
  await controller.click({dataset:{workflowOpen:'analysis'},id:''});assert.equal(controller.model.workflowStage,'analysis');
  await controller.click({dataset:{workflowAction:'operations',actionScene:'S8'},id:''});
  assert.equal(controller.model.workflowStage,'operations');assert.equal(controller.model.activeSceneId,'S8');
  assert.equal(controller.model.selected.version,beforeVersion);
  assert.equal((await l.store.load(data.id)).version,beforeVersion,'navigation must never mutate persisted production');
  assert.match(controller.render(),/Production workflow/);
 }finally{await l.close();}
});
test('production action queue opens exact source task beyond first plan page without misrouting scene or model evidence',async()=>{
 const l=await lab();try{
  const w=createProduction({id:'wide_s24',title:'Large location day'});
  const text=Array.from({length:38},(_,i)=>`Rule ${i+1}: filming may not obstruct public passage in corridor ${i+1}.`).join('\n\n');
  addDocument(w,{id:'P',name:'Large permit',text});
  setCallSheet(w,'Scene 11 | Mall | 09:00-10:00 | Camera cart\nScene 12 | Mall | 10:00-11:00 | Tracking crane');
  await l.store.persist(w,{expectedVersion:0});
  const calls=[];const ctl=createWorkspaceController({fetchImpl:(uri,opts)=>{calls.push(uri);return fetch(l.base+uri,opts);},
   root:{querySelector:()=>({value:'',dataset:{},files:[]})},notify:()=>{}});
  await ctl.load();await ctl.click({dataset:{projectOpen:'wide_s24'},id:''});
  assert(ctl.model.overview.plannedCalls>60);
  ctl.model.actionKind='EXECUTION';ctl.model.actionOffset=40;await ctl.load();
  const target=ctl.model.actionQueue.actions.find(a=>a.taskId&&a.globalTaskIndex>=40);
  assert(target,'must find a source-bound task beyond the first page');
  const btn={id:'',dataset:{workflowAction:target.route,actionScene:target.sceneId,actionTask:target.taskId,
   actionGlobal:String(target.globalTaskIndex),actionLocal:String(target.sceneTaskIndex),actionCondition:''}};
  await ctl.click(btn);
  assert.equal(ctl.model.workflowStage,'analysis');
  assert.equal(ctl.model.offset,Math.floor(target.globalTaskIndex/40)*40);
  assert.equal(ctl.model.sceneTaskOffset,Math.floor(target.sceneTaskIndex/40)*40);
  assert.equal(ctl.model.activeSceneId,target.sceneId);
  assert.equal(ctl.model.selectedTask,target.taskId);
  assert(ctl.model.overview.tasks.some(t=>t.id===target.taskId));
  assert(ctl.model.sceneWorkbench.tasks.some(t=>t.id===target.taskId));
  assert(!calls.some(uri=>uri.includes('/api/semantic')||uri.includes('/api/extract')));
 }finally{await l.close();}
});
test('version-bound integrated exports refuse a changed workspace and never emit mixed-review evidence',async()=>{
 const l=await lab();try{
  let version=await importSources(l),b=(await wf(l)).body;
  const query=`?asOf=${encodeURIComponent(b.asOf)}&expectedVersion=${version}&expectedDossierSha256=${b.dossierSha256}`;
  let res=await fetch(l.base+end+'/dossier/markdown'+query);
  assert.equal(res.status,200);assert.match(await res.text(),/NOT FILMING CLEARANCE/);
  const changed=await l.post(end+'/authority-document',{expectedVersion:version,documentId:'PERMIT',role:'PERMIT',reference:'Owner review',issuer:'Human claimed location office',reviewer:'Supervisor',reason:'Review original print'});
  assert.equal(changed.status,200,changed.body.error);version=changed.body.version;
  for(const route of ['/dossier','/dossier/markdown']){
   const x=await l.get(end+route+query);assert.equal(x.status,409,x.body.error);
  }
  b=(await wf(l)).body;
  res=await fetch(l.base+end+`/dossier/markdown?asOf=${encodeURIComponent(b.asOf)}&expectedVersion=${version}&expectedDossierSha256=${b.dossierSha256}`);
  assert.equal(res.status,200);assert.match(await res.text(),/NOT FILMING CLEARANCE/);
 }finally{await l.close();}
});
