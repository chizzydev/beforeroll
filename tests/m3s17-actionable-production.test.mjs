import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {createProduction,addDocument,setCallSheet,recordReview,applySourceImport,reviseDocument} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {buildProductionDossier} from '../src/production-dossier.mjs';
import {buildProductionActions} from '../src/production-actions.mjs';
import {previewSourceChange} from '../src/source-change-control.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createAppServer} from '../server.mjs';
import {recordSceneSchedule,recordCondition,decideCondition} from '../src/production-operations.mjs';
import {recordSceneAuthority} from '../src/scene-authority.mjs';
const SOURCE='No drones.\n\nAll pedestrian routes shall remain unobstructed.\n\nSigned exception for Scene 7 only.';
const SHEET='Scene 7 | North yard | 09:00-10:00 | Drone shot\nScene 8 | North yard | 12:00-13:00 | Steadicam';
const AT='2026-10-25T10:00:00.000Z';
const fixture=()=>{const w=createProduction({id:'action17',title:'Control center'});addDocument(w,{id:'P',name:'North Yard',text:SOURCE});setCallSheet(w,SHEET);return w;};
const dossier=(w,options={})=>buildProductionDossier(w,{persistedVersion:1,asOf:AT,...options});
const queue=(w,options={})=>buildProductionActions(dossier(w),options);
const codes=q=>q.actions.map(x=>x.code);
const fake=async()=>({response:{answers:{activity_link:{type:'noul',noul:0.93},granted_for_scene:{type:'noul',noul:0.07}}},credits:1});
const temp=async()=>{const directory=await mkdtemp(path.join(os.tmpdir(),'beforeroll-action17-'));return {directory,store:createWorkspaceStore({directory}),execution:createDurableExecution({directory}),clean:()=>rm(directory,{recursive:true,force:true})};};
test('empty production has explicit source import actions, never a permission action',()=>{
 const q=queue(createProduction({id:'empty17',title:'Empty'}));assert.deepEqual(codes(q),['IMPORT_CALL_SHEET','IMPORT_PERMIT']);assert.equal(q.notClearance,true);
 assert.equal(q.byCategory.SOURCE,2);assert.equal(q.total,2);
});
test('source document + call sheet create actionable per-task Clocked work and human review without false authorization',()=>{
 const q=queue(fixture(),{limit:100});assert.equal(codes(q).filter(x=>x==='RUN_UNEVALUATED_SOURCE_CHECK').length,6);
 assert.equal(codes(q).filter(x=>x==='REVIEW_EXACT_SOURCE_TASK').length,6);
 assert.equal(codes(q).filter(x=>x==='DATE_SCENE').length,2);
 assert.equal(codes(q).filter(x=>x==='REVIEW_SCENE_SCOPE').length,2);
 assert(codes(q).includes('RECORD_DOCUMENT_PROVENANCE'));
 assert(q.actions.every(a=>a.notClearance===true&&/^[a-f0-9]{64}$/.test(a.id)));
});
test('source-linked action carries exact quoted source and original hash',()=>{
 const w=fixture(),q=queue(w,{limit:100});const item=q.actions.find(x=>x.code==='REVIEW_EXACT_SOURCE_TASK');
 assert(w.documents.some(d=>d.sourceHash===item.sourceHash));assert(w.documents.some(d=>d.units.some(u=>u.text===item.sourceQuote)));
});
test('recorded source task human review is removed from pending queue when human resolves it, never clear scene',()=>{
 const w=fixture(),id=planIntelligence(w).tasks[0].id;recordReview(w,{evidenceId:id,decision:'RESOLVED_BY_HUMAN',reviewer:'Owner',reason:'Will check with permit issuer'});
 const q=queue(w,{limit:100});assert(!q.actions.some(a=>a.taskId===id&&a.code==='REVIEW_EXACT_SOURCE_TASK'));
 assert(q.actions.some(a=>a.taskId===id&&a.code==='RUN_UNEVALUATED_SOURCE_CHECK'));assert.equal(q.notClearance,true);
});
test('open human review is an explicit follow-up rather than a duplicate unreviewed task',()=>{
 const w=fixture(),id=planIntelligence(w).tasks[0].id;recordReview(w,{evidenceId:id,decision:'NEEDS_SOURCE',reviewer:'AD',reason:'Need addendum'});
 const q=queue(w,{limit:100});assert(q.actions.some(a=>a.taskId===id&&a.code==='FOLLOW_UP_HUMAN_REVIEW'));
 assert(!q.actions.some(a=>a.taskId===id&&a.code==='REVIEW_EXACT_SOURCE_TASK'));
});
test('changing original source retires current human review and requeues exact new task',()=>{
 const w=fixture(),id=planIntelligence(w).tasks[0].id;recordReview(w,{evidenceId:id,decision:'RESOLVED_BY_HUMAN',reviewer:'AD',reason:'Reviewed text'});
 reviseDocument(w,'P',SOURCE+'\n\nNo open flames.');const q=queue(w,{limit:100});
 assert(!q.actions.some(a=>a.taskId===id));assert(codes(q).filter(x=>x==='REVIEW_EXACT_SOURCE_TASK').length===8);
});
test('page and category filtering are deterministic, stable, nonoverlapping and bounded',()=>{
 const d=dossier(fixture()),full=buildProductionActions(d,{limit:100});const p1=buildProductionActions(d,{limit:7});const p2=buildProductionActions(d,{offset:7,limit:7});
 assert.deepEqual(p1.actions.map(a=>a.id),full.actions.slice(0,7).map(a=>a.id));
 assert.deepEqual(p2.actions.map(a=>a.id),full.actions.slice(7,14).map(a=>a.id));assert(p1.pagination.hasMore);
 const q=buildProductionActions(d,{kind:'EXECUTION'});assert(q.actions.every(a=>a.category==='EXECUTION'));assert.equal(q.filteredTotal,6);
 const scene=buildProductionActions(d,{sceneId:'S7'});assert(scene.actions.every(a=>a.sceneId==='S7'));
});
test('invalid page, kind, scene filter and modified dossier are rejected',()=>{
 const d=dossier(fixture());for(const opts of [{offset:-1},{offset:10001},{limit:0},{limit:101},{kind:'GRANTED'},{sceneId:99}])assert.throws(()=>buildProductionActions(d,opts));
 d.sceneTasks[0].sourceQuote='fake';assert.throws(()=>buildProductionActions(d),/altered dossier/);
});
test('queued action counts retain full >100 task inventory even when page displays 30',()=>{
 const w=fixture();reviseDocument(w,'P',Array.from({length:70},(_,i)=>`Rule ${i+1}: No unsupervised use of the location.`).join('\n\n'));
 const q=queue(w);assert.equal(q.pagination.limit,30);assert.equal(q.actions.length,30);assert.equal(q.filteredTotal,q.total);
 assert.equal(q.byCategory.EXECUTION,140);assert.equal(q.byCategory.HUMAN,141+2);assert(q.pagination.hasMore);
});
test('schedule and operational prerequisites are actionable; human condition resolution retires that action',()=>{
 const w=fixture();recordSceneSchedule(w,{sceneId:'S7',date:'2026-10-26',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'AD',reason:'Call sheet approved for planning'});
 recordCondition(w,{sceneId:'S7',title:'Confirm steward',reviewer:'AD',reason:'Source pending'});
 let q=queue(w,{limit:100});assert(!q.actions.some(x=>x.code==='DATE_SCENE'&&x.sceneId==='S7'));
 assert(q.actions.some(x=>x.code==='REVIEW_PREREQUISITE'&&x.sceneId==='S7'));
 decideCondition(w,{conditionId:w.conditions[0].id,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'AD',reason:'Confirmed owner reported'});
 q=queue(w,{limit:100});assert(!q.actions.some(x=>x.code==='REVIEW_PREREQUISITE'&&x.sceneId==='S7'));
});
test('scene scope mapping removes only its own review action, not a different scene',()=>{
 const w=fixture();const unit=w.documents[0].units[0];recordSceneAuthority(w,{sceneId:'S7',documentId:'P',unitId:unit.id,kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'AD',reason:'Relevant original sentence'});
 const q=queue(w,{limit:100});assert(!q.actions.some(x=>x.sceneId==='S7'&&x.code==='REVIEW_SCENE_SCOPE'));
 assert(q.actions.some(x=>x.sceneId==='S8'&&x.code==='REVIEW_SCENE_SCOPE'));
});
test('impact preview compares exact task identities and never mutates original workspace',()=>{
 const w=fixture(),snapshot=JSON.stringify(w),candidate=inspectImport({kind:'permit',name:'update.txt',text:SOURCE+'\n\nNo open flames.'});
 const result=previewSourceChange(w,candidate,{documentId:'P',persistedVersion:1});assert.equal(JSON.stringify(w),snapshot);
 assert.equal(result.changed,true);assert.equal(result.tasks.retained,0);assert.equal(result.tasks.retired,6);assert.equal(result.tasks.added,8);
 assert.equal(result.providerCalls,0);assert.equal(result.previewOnly,true);assert.equal(result.preservedHistory.reviewRecords,0);
});
test('impact preview for new permit leaves original project intact and increases task count',()=>{
 const w=fixture(),v=JSON.stringify(w),candidate=inspectImport({kind:'permit',name:'second.txt',text:'No generators.'});
 const result=previewSourceChange(w,candidate,{documentId:'SECOND',persistedVersion:1});assert.equal(result.changed,true);
 assert.equal(result.after.documents,2);assert.equal(result.tasks.retained,6);assert.equal(result.tasks.added,2);assert.equal(JSON.stringify(w),v);
});
test('call sheet impact preview retains source history but retires old task IDs if scene activities change',()=>{
 const w=fixture(),file=inspectImport({kind:'callSheet',name:'call.csv',text:'scene,location,start,end,activity\n7,North yard,09:00,10:00,Night flight\n8,North yard,12:00,13:00,Steadicam'});
 const result=previewSourceChange(w,file,{persistedVersion:1});assert.equal(result.after.scenes,2);
 assert.equal(result.tasks.retired,3);assert.equal(result.tasks.added,3);assert.equal(result.tasks.retained,3);assert.equal(result.before.planTasks,6);
});
test('same original source hash preview says no semantic changes; original remains unchanged',()=>{
 const w=createProduction({id:'same',title:'Same'}),file=inspectImport({kind:'permit',name:'P.txt',text:SOURCE});
 applySourceImport(w,file,{documentId:'P'});setCallSheet(w,SHEET);
 const p=previewSourceChange(w,file,{documentId:'P',persistedVersion:1});assert.equal(p.tasks.retained,6);assert.equal(p.tasks.retired,0);assert.equal(p.changed,false);
});
test('impact rejects invalid version and reimport of different raw bytes with same extracted text',()=>{
 const w=createProduction({id:'raw',title:'Raw'}),a=inspectImport({kind:'permit',name:'P.txt',text:SOURCE});
 assert.throws(()=>previewSourceChange(w,a,{documentId:'P',persistedVersion:0}),/version/);
 applySourceImport(w,a,{documentId:'P'});setCallSheet(w,SHEET);
 const b=inspectImport({kind:'permit',name:'P.txt',text:'\ufeff'+SOURCE});
 assert.throws(()=>previewSourceChange(w,b,{documentId:'P',persistedVersion:1}),/different original file provenance/);
});
test('existing task reviews preserve history in impact, but are counted retired on changed source',()=>{
 const w=fixture(),first=planIntelligence(w).tasks[0].id;recordReview(w,{evidenceId:first,decision:'OPEN',reviewer:'Owner',reason:'Review later'});
 const p=previewSourceChange(w,inspectImport({kind:'permit',name:'changed.txt',text:SOURCE+'\n\nNo fireworks.'}),{documentId:'P',persistedVersion:1});
 assert.equal(p.before.currentHumanReviewRecords,1);assert.equal(p.after.remainingCurrentHumanReviewRecords,0);assert.equal(p.preservedHistory.reviewRecords,1);
});
test('read-only production routes expose current queue and impact without changing the stored version',async()=>{
 const s=await temp();const w=fixture();await s.store.persist(w,{expectedVersion:0});const server=createAppServer({workspaceStore:s.store,executionStore:s.execution});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/workspaces/action17`;
 try{
  const response=await fetch(base+'/actions?offset=0&limit=5');const q=await response.json();assert.equal(response.status,200);assert.equal(q.actions.length,5);assert.equal(q.persistedVersion,1);
  const body={expectedVersion:1,documentId:'P',file:{kind:'permit',name:'new.txt',text:SOURCE+'\n\nNo fireworks.'}};
  const preview=await fetch(base+'/impact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal(preview.status,200);assert.equal((await preview.json()).previewOnly,true);
  assert.equal((await s.store.load('action17')).version,1);
  assert.equal((await fetch(base+'/actions?kind=INVALID')).status,422);
  assert.equal((await fetch(base+'/actions?offset=-1')).status,422);
  const stale=await fetch(base+'/impact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,expectedVersion:0})});assert.equal(stale.status,409);
  const cross=await fetch(base+'/impact',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://evil.test'},body:JSON.stringify(body)});
  assert.equal(cross.status,403);
 }finally{await new Promise(resolve=>server.close(resolve));await s.clean();}
});
test('owner recorded model work is removed from execution pending list but human review remains',async()=>{
 const s=await temp();try{const w=fixture(),p=planIntelligence(w);await s.execution.runBatch({workspace:w,plan:p,maxCalls:3,operatorAuthorized:true,transport:fake});
 const q=buildProductionActions(dossier(w,{modelEvidence:await s.execution.exportEvidence(p)}),{limit:100});
 assert.equal(codes(q).filter(x=>x==='RUN_UNEVALUATED_SOURCE_CHECK').length,3);
 assert.equal(codes(q).filter(x=>x==='REVIEW_EXACT_SOURCE_TASK').length,6);
 }finally{await s.clean();}
});
test('uncertain attempted provider call surfaces explicit no-retry action',async()=>{
 const s=await temp();try{const w=fixture(),p=planIntelligence(w);await s.execution.runBatch({workspace:w,plan:p,maxCalls:3,operatorAuthorized:true,transport:async()=>{throw Error('provider disconnected');}});
 const q=buildProductionActions(dossier(w,{modelEvidence:await s.execution.exportEvidence(p)}),{limit:100});
 assert(codes(q).includes('INVESTIGATE_PROVIDER_OUTCOME'));assert(q.actions.some(x=>x.priority===1&&x.category==='EXECUTION'));
 }finally{await s.clean();}
});
test('end-to-end: preview + committed source revision retires prior reviews while original audit history survives',async()=>{
 const s=await temp(),w=fixture(),oldTask=planIntelligence(w).tasks[0].id;
 recordReview(w,{evidenceId:oldTask,reviewer:'AD',reason:'Original source reviewed',decision:'RESOLVED_BY_HUMAN'});
 await s.store.persist(w,{expectedVersion:0});
 const server=createAppServer({workspaceStore:s.store,executionStore:s.execution});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const root=`http://127.0.0.1:${server.address().port}/api/workspaces/action17`,headers={'Content-Type':'application/json'};
 try{
  const file={kind:'permit',name:'revised.txt',text:SOURCE+'\n\nAdditional source text: no generators.'};
  const before=await (await fetch(root+'/actions')).json();assert(before.total>0);
  const preview=await (await fetch(root+'/impact',{method:'POST',headers,body:JSON.stringify({expectedVersion:1,documentId:'P',file})})).json();
  assert.equal(preview.tasks.retired,6);assert.equal((await s.store.load('action17')).version,1);
  const changed=await fetch(root+'/import',{method:'POST',headers,body:JSON.stringify({expectedVersion:1,documentId:'P',file,previewSha256:preview.previewSha256})});
  assert.equal(changed.status,200);assert.equal((await changed.json()).version,2);
  const after=await (await fetch(root+'/dossier/summary')).json();assert.equal(after.counts.staleHumanReviews,1);
  const newActions=await (await fetch(root+'/actions?kind=HUMAN&limit=100')).json();assert(newActions.actions.filter(x=>x.code==='REVIEW_EXACT_SOURCE_TASK').length===8);
  const versionConflict=await fetch(root+'/impact',{method:'POST',headers,body:JSON.stringify({expectedVersion:1,documentId:'P',file})});assert.equal(versionConflict.status,409);
 }finally{await new Promise(ok=>server.close(ok));await s.clean();}
});
test('presentation renders action filters, source quotations, safe HTML and explicit review before commit',async()=>{
 const {productionView}=await import('./helpers/ui-views.mjs');
 const w=fixture(),q=queue(w),preview=previewSourceChange(w,inspectImport({kind:'permit',name:'next.txt',text:SOURCE+'\n\nNo fireworks.'}),{documentId:'P',persistedVersion:1});
 const sample={items:[],selected:{version:1,workspace:{...w,title:'<script>alert("x")</script>'}},overview:{documents:[],scenes:[],plannedCalls:0,pagination:{offset:0,limit:40,shown:0,hasMore:false}},execution:{},authority:{},sceneAuthority:{},operations:{},dossier:{counts:{planTasks:6},outstanding:[],scenes:[]},actionQueue:q,impactPreview:preview,actionKind:'ALL',busy:false};
 const html=productionView(sample);
 assert.match(html,/project-action-apply/);assert.match(html,/project-action-next/);assert.match(html,/project-impact-commit/);
 assert.match(html,/Clocked source checks/);assert.match(html,/Import exact previewed file/);
 assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;'));
});
test('client action queue/controller never embeds Clocked API keys or triggers models to render work',async()=>{
 const {productionView}=await import('./helpers/ui-views.mjs');const w=fixture(),q=queue(w);
 const output=productionView({items:[],selected:{version:1,workspace:w},overview:null,execution:null,authority:null,sceneAuthority:null,operations:null,dossier:null,actionQueue:q,actionKind:'ALL',liveEnabled:false,busy:false});
 assert.match(output,/human work/);assert.match(output,/never establishes filming permission/);
 assert(!output.includes('CLOCKED_API_KEY'));assert(!output.includes('Authorization: Bearer'));
});
