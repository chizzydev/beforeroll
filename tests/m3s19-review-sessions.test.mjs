import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createProduction,addDocument,setCallSheet,recordReview,reviseDocument} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {buildProductionDossier} from '../src/production-dossier.mjs';
import {previewReviewSession,commitReviewSession} from '../src/review-session.mjs';
import {buildSceneWorkbench} from '../src/scene-workbench.mjs';
import {buildProductionActions} from '../src/production-actions.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createAppServer} from '../server.mjs';
import {productionView,createWorkspaceController} from '../public/workspace-desk.mjs';
const at='2026-10-25T14:00:00.000Z';
function fixture(){const w=createProduction({id:'review19',title:'Coordinated source review'});
 addDocument(w,{id:'permit',name:'Original permit',text:'No drones.\n\nNo open flames.\n\nThe crew must keep the exit clear.'});
 addDocument(w,{id:'addendum',name:'Later letter',text:'Scene 1 has a signed exception to camera gear only.\n\nScene 2 has requested but not received an exemption.'});
 setCallSheet(w,'Scene 1 | Hall | 09:00-10:00 | Drone\nScene 2 | Hall | 11:00-12:00 | Moving trolley');return w;}
const dossier=(w,v=1)=>buildProductionDossier(w,{persistedVersion:v,asOf:at});
const edit=(t,decision='ACKNOWLEDGED',reason='Original clause evaluated; requires follow-up')=>({evidenceId:t.id,decision,reviewer:'Coordinator',reason});
const preview=(w,edits,version=1)=>previewReviewSession(w,dossier(w,version),{expectedVersion:version,edits});
const commit=(w,p,edits,version=1)=>commitReviewSession(w,dossier(w,version),{expectedVersion:version,asOf:at,edits,previewSha256:p.sha256});
const plan=w=>planIntelligence(w).tasks;
async function lab(){const directory=await mkdtemp(path.join(os.tmpdir(),'beforeroll-review19-'));return {directory,store:createWorkspaceStore({directory}),execution:createDurableExecution({directory}),clean:()=>rm(directory,{recursive:true,force:true})};}
async function start(l){const server=createAppServer({workspaceStore:l.store,executionStore:l.execution,enabled:false,fetchImpl:()=>{throw Error('Unexpected live Clocked API call')}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,base:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};}
async function http(base,route,body){const res=await fetch(base+route,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};}
test('preview links multiple individual tasks to exact documents, scenes, quotes and requests',()=>{const w=fixture(),p=preview(w,[edit(plan(w)[0]),edit(plan(w)[5])]);assert.equal(p.items.length,2);assert.equal(p.summary.selected,2);assert.equal(p.summary.newReviews,2);assert.equal(p.summary.unchanged,0);assert.equal(p.expectedVersion,1);assert.equal(p.notClearance,true);assert.match(p.sha256,/^[a-f0-9]{64}$/);assert(p.items.every(x=>x.quote&&x.documentHash&&x.sceneHash&&x.requestHash));assert(p.summary.documents.length>=1);assert.equal(w.reviewActions.length,0);});
test('same preview and same source edits produce identical SHA',()=>{const w=fixture(),edits=[edit(plan(w)[0]),edit(plan(w)[2])];assert.equal(preview(w,edits).sha256,preview(w,edits).sha256);});
test('empty session is rejected, as is the 65th decision',()=>{const w=fixture();assert.throws(()=>preview(w,[]),/1-64/);assert.throws(()=>preview(w,Array(65).fill(edit(plan(w)[0]))),/1-64/);});
test('duplicate task entries are refused without changing the project',()=>{const w=fixture(),e=edit(plan(w)[0]);assert.throws(()=>preview(w,[e,e]),/duplicate/);assert.equal(w.reviewActions.length,0);});
test('foreign and malformed source IDs cannot be reviewed',()=>{const w=fixture();for(const e of [{...edit(plan(w)[0]),evidenceId:'f'.repeat(64)},{...edit(plan(w)[0]),evidenceId:'x'}])assert.throws(()=>preview(w,[e]),/source task|evidence ID/);});
test('an invalid decision, missing reason or reviewer is rejected',()=>{const w=fixture(),e=edit(plan(w)[0]);for(const patch of [{decision:'CLEARED'},{reason:''},{reviewer:''},{reason:'x'.repeat(3001)},{reviewer:'A'.repeat(151)}])assert.throws(()=>preview(w,[{...e,...patch}]),/needs its own/);});
test('input injection through unknown fields is rejected',()=>{const w=fixture();assert.throws(()=>preview(w,[{...edit(plan(w)[0]),clearance:true}]),/unsupported edit/);});
test('tampered dossier, fake no-clearance and version mismatch fail before preview',()=>{const w=fixture(),d=dossier(w),e=edit(plan(w)[0]);const broken=structuredClone(d);broken.sceneTasks[0].quote='Fake permit';assert.throws(()=>previewReviewSession(w,broken,{expectedVersion:1,edits:[e]}),/altered dossier/);const grant=structuredClone(d);grant.notClearance=false;assert.throws(()=>previewReviewSession(w,grant,{expectedVersion:1,edits:[e]}));assert.throws(()=>previewReviewSession(w,d,{expectedVersion:2,edits:[e]}),/stale/);});
test('preview is read-only, commit applies all staged decisions to clone atomically',()=>{const w=fixture(),ps=plan(w),edits=[edit(ps[0]),edit(ps[5],'NEEDS_SOURCE','Await original issued amendment')],p=preview(w,edits);const output=commit(w,p,edits);assert.equal(w.reviewActions.length,0);assert.equal(output.applied,2);assert.equal(output.workspace.reviewActions.length,2);assert.equal(output.workspace.revision,w.revision+2);assert.equal(output.workspace.reviewActions[0].evidenceId,ps[0].id);assert.equal(output.workspace.reviewActions[1].decision,'NEEDS_SOURCE');assert(output.workspace.reviewActions.every(x=>x.notClearance===true));});
test('a changed decision, reviewer or reason invalidates signed preview with no mutation',()=>{const w=fixture(),edits=[edit(plan(w)[0])],p=preview(w,edits);for(const patch of [{reason:'Different'},{reviewer:'Other'},{decision:'OPEN'}])assert.throws(()=>commit(w,p,[{...edits[0],...patch}]),/invalidated/);assert.equal(w.reviewActions.length,0);});
test('changed source invalidates old preview and cannot resurrect previous reviews',()=>{const w=fixture(),edits=[edit(plan(w)[0])],p=preview(w,edits);reviseDocument(w,'permit','New restriction.\n\nNo drone permitted.');assert.throws(()=>commit(w,p,edits),/stale|foreign|altered|invalidated/);assert.equal(w.reviewActions.length,0);});
test('a current prior decision is updated but its history is preserved',()=>{const w=fixture(),t=plan(w)[0];recordReview(w,edit(t));const edits=[edit(t,'NEEDS_SOURCE','Need to see signed issuer copy')],p=preview(w,edits),out=commit(w,p,edits);assert.equal(p.summary.updatedReviews,1);assert.equal(out.applied,1);assert.equal(out.workspace.reviewActions.length,2);assert.equal(out.workspace.reviewActions[0].decision,'ACKNOWLEDGED');assert.equal(out.workspace.reviewActions[1].decision,'NEEDS_SOURCE');});
test('identical repeated review is a no-op, no phantom workspace revision',()=>{const w=fixture(),e=edit(plan(w)[0]);recordReview(w,e);const p=preview(w,[e]);assert.equal(p.summary.unchanged,1);const out=commit(w,p,[e]);assert.equal(out.applied,0);assert.equal(out.workspace.revision,w.revision);assert.equal(out.workspace.reviewActions.length,1);});
test('once applied, human reviews reconcile the same scene workbench and action queue',()=>{const w=fixture(),t=plan(w)[0],e=edit(t,'RESOLVED_BY_HUMAN','Original text reviewed; human task recorded'),p=preview(w,[e]);const next=commit(w,p,[e]).workspace,d=dossier(next);assert.equal(d.counts.currentReviewedTasks,1);assert.equal(buildSceneWorkbench(d,{sceneId:t.sceneId}).summary.currentTaskReviews,1);assert(!buildProductionActions(d).actions.some(a=>a.taskId===t.id&&a.code==='REVIEW_EXACT_SOURCE_TASK'));assert(buildProductionActions(d).actions.some(a=>a.taskId===t.id&&a.code==='RUN_UNEVALUATED_SOURCE_CHECK'));});
test('review session does not turn recorded human tasks into scene filming permission',()=>{const w=fixture(),edits=plan(w).map(t=>edit(t,'RESOLVED_BY_HUMAN','Human source quote reviewed, not permit clearance')),p=preview(w,edits);const d=dossier(commit(w,p,edits).workspace);assert.equal(d.notClearance,true);assert(d.scenes.every(s=>s.readiness==='OUTSTANDING_REVIEW'));assert.equal(d.counts.completedModelChecks,0);});
test('HTTP preview and commit persist both decisions in one workspace version',async()=>{const l=await lab(),app=await start(l);try{const w=fixture();await l.store.persist(w,{expectedVersion:0});const t=plan(w),edits=[edit(t[0]),edit(t[6])],root=`/api/workspaces/${w.id}/review-session`;const a=await http(app.base,root+'/preview',{expectedVersion:1,edits});assert.equal(a.status,200);assert.equal(a.data.summary.selected,2);assert.equal((await l.store.load(w.id)).version,1);const b=await http(app.base,root+'/commit',{expectedVersion:1,edits,asOf:a.data.asOf,previewSha256:a.data.sha256});assert.equal(b.status,200);assert.equal(b.data.applied,2);assert.equal(b.data.version,2);const after=await l.store.load(w.id);assert.equal(after.workspace.reviewActions.length,2);const d=(await http(app.base,`/api/workspaces/${w.id}/dossier`)).data;assert.equal(d.counts.currentReviewedTasks,2);assert.equal(d.notClearance,true);}finally{await app.close();await l.clean();}});
test('HTTP stale project version conflicts without modifying a newer project',async()=>{const l=await lab(),app=await start(l);try{const w=fixture();await l.store.persist(w,{expectedVersion:0});const edits=[edit(plan(w)[0])];const p=(await http(app.base,`/api/workspaces/${w.id}/review-session/preview`,{expectedVersion:1,edits})).data;const later=await l.store.load(w.id);recordReview(later.workspace,{...edits[0],reason:'Another human updated project'});await l.store.persist(later.workspace,{expectedVersion:1});const r=await http(app.base,`/api/workspaces/${w.id}/review-session/commit`,{expectedVersion:1,edits,previewSha256:p.sha256,asOf:p.asOf});assert.equal(r.status,409);assert.equal((await l.store.load(w.id)).workspace.reviewActions.length,1);}finally{await app.close();await l.clean();}});
test('HTTP edited commit payload and counterfeit SHA cannot change project version',async()=>{const l=await lab(),app=await start(l);try{const w=fixture();await l.store.persist(w,{expectedVersion:0});const edits=[edit(plan(w)[0])];const p=(await http(app.base,`/api/workspaces/${w.id}/review-session/preview`,{expectedVersion:1,edits})).data;for(const patch of [{previewSha256:'a'.repeat(64)},{edits:[{...edits[0],decision:'OPEN'}]}]){const res=await http(app.base,`/api/workspaces/${w.id}/review-session/commit`,{expectedVersion:1,edits,asOf:p.asOf,previewSha256:p.sha256,...patch});assert.equal(res.status,422);}assert.equal((await l.store.load(w.id)).version,1);}finally{await app.close();await l.clean();}});
test('HTTP no-op commit preserves exact storage version and review history',async()=>{const l=await lab(),app=await start(l);try{const w=fixture(),e=edit(plan(w)[0]);recordReview(w,e);await l.store.persist(w,{expectedVersion:0});const p=(await http(app.base,`/api/workspaces/${w.id}/review-session/preview`,{expectedVersion:1,edits:[e]})).data;const c=await http(app.base,`/api/workspaces/${w.id}/review-session/commit`,{expectedVersion:1,edits:[e],previewSha256:p.sha256,asOf:p.asOf});assert.equal(c.status,200);assert.equal(c.data.applied,0);assert.equal(c.data.version,1);assert.equal((await l.store.load(w.id)).workspace.reviewActions.length,1);}finally{await app.close();await l.clean();}});
test('browser renders staged source decisions, session preview and a guarded commit',()=>{const w=fixture(),d=dossier(w),t=d.sceneTasks[0],e=edit(t),p=preview(w,[e]);const render=productionView({items:[{id:w.id,title:w.title,documentCount:2,sceneCount:2,version:1}],selected:{workspace:w,version:1},overview:{scenes:[{id:'S1',location:'Hall'}],tasks:[],pagination:{offset:0}},sceneWorkbench:buildSceneWorkbench(d,{sceneId:'S1'}),activeSceneId:'S1',selectedTask:t.id,stagedReviews:[{...e,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,quote:t.quote}],reviewSessionPreview:p,execution:{},operations:{},dossier:{},actionQueue:{}});assert.match(render,/COMMIT VERIFIED REVIEW SESSION/);assert.match(render,/VERIFY STAGED SOURCE REVIEWS/);assert.match(render,/ORIGINAL CALL-SHEET ROW/);assert.match(render,/STAGE THIS INDIVIDUAL REVIEW/);assert.match(render,/review session \/ exact sources/i);});
test('controller initializes with empty versioned staging, no phantom preview or requests',()=>{const fakeRoot={querySelector:()=>null};const c=createWorkspaceController({root:fakeRoot,fetchImpl:()=>{throw Error('Unexpected network call')}});assert.deepEqual(c.model.stagedReviews,[]);assert.equal(c.model.reviewSessionPreview,null);assert.equal(c.model.stagingVersion,null);});
test('browser controller can stage, preview and commit source reviews across API and durable store',async()=>{
 const l=await lab(),app=await start(l);
 try{
  const w=fixture();await l.store.persist(w,{expectedVersion:0});const t=plan(w)[0];
  const fields={
   'project-scene-review-stage':{dataset:{taskId:t.id}},
   'project-scene-reviewer':{value:'Location coordinator'},
   'project-scene-reason':{value:'Reviewed the exact original restriction; site coordinator still needs to verify authority.'},
   'project-scene-decision':{value:'ACKNOWLEDGED'}
  };
  const root={querySelector:sel=>fields[sel.replace(/^#/,'')]??null};
  const c=createWorkspaceController({root,fetchImpl:(url,opts)=>fetch(app.base+url,opts)});
  await c.load();
  c.model.selected=await (await fetch(app.base+'/api/workspaces/review19')).json();
  c.model.activeSceneId=t.sceneId;c.model.selectedTask=t.id;
  await c.load();
  assert.equal(c.model.sceneWorkbench.scene.sceneId,t.sceneId);
  await c.click({id:'project-scene-review-stage',dataset:{}});
  assert.equal(c.model.stagedReviews.length,1);
  assert.equal((await l.store.load(w.id)).workspace.reviewActions.length,0);
  await c.click({id:'project-review-session-preview',dataset:{}});
  assert.equal(c.model.reviewSessionPreview.summary.selected,1);
  await c.click({id:'project-review-session-commit',dataset:{}});
  assert.equal(c.model.stagedReviews.length,0);
  assert.equal(c.model.reviewSessionPreview,null);
  const saved=await l.store.load(w.id);
  assert.equal(saved.version,2);
  assert.equal(saved.workspace.reviewActions[0].evidenceId,t.id);
  assert.equal(c.model.sceneWorkbench.summary.currentTaskReviews,1);
 }finally{await app.close();await l.clean();}
});
test('HTTP review sessions are not accepted from a foreign Origin',async()=>{
 const l=await lab(),app=await start(l);
 try{const w=fixture();await l.store.persist(w,{expectedVersion:0});const res=await fetch(app.base+'/api/workspaces/review19/review-session/preview',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://forged.example'},body:JSON.stringify({expectedVersion:1,edits:[edit(plan(w)[0])]})});assert.equal(res.status,403);assert.equal((await l.store.load(w.id)).version,1);}finally{await app.close();await l.clean();}
});
