import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createProduction,reviseDocument,setCallSheet,exportWorkspace,importWorkspace} from '../src/production-workspace.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createAppServer} from '../server.mjs';
import {recordSceneSchedule,recordCondition,decideCondition,projectOperations,resolveLocalTime,assertProductionOperationsIntegrity} from '../src/production-operations.mjs';
import {productionView} from './helpers/ui-views.mjs';
import {createWorkspaceController} from '../public/workspace-desk.mjs';

const call='Shoot 25 October 2026\nScene 12 | North Arcade | 22:15-02:30 | Night street filming\nScene 13 | North Arcade | 08:00-11:30 | Handheld dialogue';
const permit='Do not obstruct the two-metre public route.\n\nStewards must confirm pedestrian egress before first take.\n\nNo drones.';
const scene='S12';
function workspace(){return createProduction({id:'night',title:'Night unit',documents:[{id:'permit',name:'issued.txt',text:permit}],callSheetText:call});}
const schedule={sceneId:scene,date:'2026-10-25',timeZone:'Europe/London',endsNextDay:true,reviewer:'Location lead',reason:'Crew date confirmed from original production calendar'};
function scheduled(){const w=workspace();recordSceneSchedule(w,schedule);return w;}
const condition={sceneId:scene,title:'Confirm the stewards before first take',documentId:'permit',unitId:'U002',dueLocal:'2026-10-25T20:30',reviewer:'Production coordinator',reason:'Signed off in field after reviewing source clause'};

test('IANA resolution supports half-hour and quarter-hour offsets without treating local clocks as UTC',()=>{
 assert.equal(resolveLocalTime('2026-10-25','22:00','Africa/Lagos'),'2026-10-25T21:00:00.000Z');
 assert.equal(resolveLocalTime('2026-01-01','00:00','Asia/Kathmandu'),'2025-12-31T18:15:00.000Z');
 assert.equal(resolveLocalTime('2026-07-01','12:00','America/New_York'),'2026-07-01T16:00:00.000Z');
 assert.equal(resolveLocalTime('2026-01-01','12:00','America/New_York'),'2026-01-01T17:00:00.000Z');
});
test('DST local gaps and overlaps require explicit correction, not guessed timestamps',()=>{
 assert.throws(()=>resolveLocalTime('2026-03-08','02:30','America/New_York'),/Nonexistent local time/);
 assert.throws(()=>resolveLocalTime('2026-11-01','01:30','America/New_York'),/Ambiguous local time/);
 assert.throws(()=>resolveLocalTime('2026-10-25','01:30','Europe/London'),/Ambiguous local time/);
 assert.throws(()=>resolveLocalTime('2026-03-29','01:30','Europe/London'),/Nonexistent local time/);
});
test('ISO calendar, clock and IANA timezone validation rejects invalid inputs',()=>{
 for(const date of ['2026-02-29','2026-13-12','2025-04-31','26-10-25','2026-00-01'])assert.throws(()=>resolveLocalTime(date,'10:00','Africa/Lagos'),/actual ISO date/);
 assert.equal(resolveLocalTime('2028-02-29','10:00','Africa/Lagos'),'2028-02-29T09:00:00.000Z');
 assert.throws(()=>resolveLocalTime('2026-10-25','24:00','Africa/Lagos'),/actual ISO date/);
 assert.throws(()=>resolveLocalTime('2026-10-25','10:00','Definitely/NotAZone'),/IANA timezone/);
});
test('explicit overnight scene becomes UTC dated interval, across DST shift',()=>{
 const w=scheduled();const s=projectOperations(w,{asOf:'2026-10-24T00:00:00.000Z'});
 assert.equal(s.summary.dated,1);assert.equal(s.scenes[0].startUtc,'2026-10-25T22:15:00.000Z');
 assert.equal(s.scenes[0].endUtc,'2026-10-26T02:30:00.000Z');assert.equal(s.schedules[0].durationMinutes,255);
 assert.equal(s.scenes[1].scheduleState,'UNDATED_NO_AUTHORITY');assert.equal(s.notClearance,true);
});
test('cross-midnight must be explicit and daytime flag cannot invent next-day continuation',()=>{
 const w=workspace();
 assert.throws(()=>recordSceneSchedule(w,{...schedule,endsNextDay:false}),/rollover/);
 assert.throws(()=>recordSceneSchedule(w,{...schedule,endsNextDay:'true'}),/Explicit endsNextDay/);
 assert.throws(()=>recordSceneSchedule(w,{...schedule,sceneId:'S13',endsNextDay:true}),/rollover/);
 assert.throws(()=>recordSceneSchedule(w,{...schedule,sceneId:'S99'}),/complete original/);
 assert.equal(w.revision,2);
});
test('conditions bind exact source-unit hash, scene row and selected schedule; never claim clearance',()=>{
 const w=scheduled();recordCondition(w,condition);
 const p=projectOperations(w,{asOf:'2026-10-25T19:00:00.000Z'});
 assert.equal(p.conditions.length,1);assert.equal(p.conditions[0].quote,'Stewards must confirm pedestrian egress before first take.');
 assert.equal(p.conditions[0].deadlineState,'DUE_BEFORE_SCENE');assert.equal(p.conditions[0].decision,'OPEN');
 assert.equal(p.scenes[0].openPrerequisites,1);assert.equal(p.scenes[0].operationsState,'PREREQUISITES_OUTSTANDING');
 assert.equal(p.notice.includes('NOT verified filming authorization'),true);assertProductionOperationsIntegrity(w);
});
test('deadline states are reproducible with an explicit UTC asOf, not process-local time',()=>{
 const w=scheduled();recordCondition(w,condition);
 assert.equal(projectOperations(w,{asOf:'2026-10-25T21:00:00.000Z'}).conditions[0].deadlineState,'PAST_DUE');
 assert.equal(projectOperations(w,{asOf:'2026-10-25T21:00:00.000Z'}).summary.pastDuePrerequisites,1);
 assert.throws(()=>projectOperations(w,{asOf:'2026-10-25'}),/canonical UTC/);
});
test('human decisions append immutable chronology and retain strict non-clearance semantics',()=>{
 const w=scheduled();recordCondition(w,condition);const id=w.conditions[0].id;
 decideCondition(w,{conditionId:id,decision:'BLOCKED',reviewer:'AD',reason:'Crew unavailable'});
 decideCondition(w,{conditionId:id,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'AD',reason:'Steward confirmation noted, not legal clearance'});
 const p=projectOperations(w);assert.equal(p.conditionDecisions.length,2);assert.equal(p.conditions[0].decision,'HUMAN_CONFIRMED_NOT_AUTHORITY');
 assert.equal(p.scenes[0].operationsState,'HUMAN_PREREQUISITES_RECORDED_NOT_CLEARANCE');assert.equal(p.scenes[1].operationsState,'SCHEDULE_REVIEW_REQUIRED');
 assert.equal(p.notClearance,true);assert.equal(w.conditionDecisions[0].decision,'BLOCKED');
 assert.throws(()=>decideCondition(w,{conditionId:id,decision:'CLEARED_TO_FILM',reviewer:'AD',reason:'No'}),/allowed state/);
});
test('source change invalidates human prerequisite decisions without destroying chronological evidence',()=>{
 const w=scheduled();recordCondition(w,condition);const id=w.conditions[0].id;
 decideCondition(w,{conditionId:id,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'AD',reason:'Human review noted'});
 reviseDocument(w,'permit','No drones.\n\nStewards required on site.');const p=projectOperations(w);
 assert.equal(p.conditions[0].sourceState,'STALE_SOURCE_OR_SCENE');assert.equal(p.conditions[0].decision,'STALE_REVIEW');assert.equal(p.conditionDecisions.length,1);
 assert.throws(()=>decideCondition(w,{conditionId:id,decision:'OPEN',reviewer:'AD',reason:'Reaffirm'}),/source\/scene changed/);
});
test('independent call-sheet scene edit stales only matching scene schedule and related conditions',()=>{
 const w=scheduled();recordSceneSchedule(w,{sceneId:'S13',date:'2026-10-26',timeZone:'Europe/London',endsNextDay:false,reviewer:'AD',reason:'Next day'});
 recordCondition(w,condition);
 setCallSheet(w,call.replace('22:15-02:30','22:30-02:30'));
 const p=projectOperations(w);assert.equal(p.scenes[0].scheduleState,'STALE_SCENE_SOURCE');assert.equal(p.scenes[1].scheduleState,'DATED_HUMAN_PLAN_NOT_AUTHORITY');
 assert.equal(p.conditions[0].sourceState,'STALE_SOURCE_OR_SCENE');assert.equal(p.summary.staleConditions,1);
});
test('date or timezone rescheduling retires schedule-bound conditions even for unchanged scene text',()=>{
 const w=scheduled();recordCondition(w,condition);
 recordSceneSchedule(w,{...schedule,date:'2026-10-26',reason:'Weather shift confirmed by production'});
 const p=projectOperations(w);assert.equal(p.schedules[0].sourceState,'SUPERSEDED_SCHEDULE');
 assert.equal(p.conditions[0].sourceState,'STALE_SOURCE_OR_SCENE');assert.equal(p.scenes[0].startUtc,'2026-10-26T22:15:00.000Z');
});
test('unsupported scene removal retains old evidence, never silently transfers authority to new scenes',()=>{
 const w=scheduled();recordCondition(w,condition);
 setCallSheet(w,'Scene 13 | North Arcade | 08:00-11:30 | Handheld dialogue');
 assertProductionOperationsIntegrity(w);const p=projectOperations(w);
 assert.equal(p.scenes.length,1);assert.equal(p.schedules[0].sourceState,'STALE_SCENE_SOURCE');
 assert.equal(p.conditions[0].sourceState,'STALE_SOURCE_OR_SCENE');
});
test('manual prerequisite has explicit missing source, not invented documented authority',()=>{
 const w=scheduled();recordCondition(w,{sceneId:'S12',title:'Check backup generator',reviewer:'AD',reason:'Crew checklist',dueLocal:null});
 const c=projectOperations(w).conditions[0];assert.equal(c.documentId,null);assert.equal(c.quote,null);assert.equal(c.deadlineState,'NO_DOCUMENTED_DEADLINE');
 assert.throws(()=>recordCondition(w,{...condition,unitId:null}),/Both source document/);
 assert.throws(()=>recordCondition(w,{...condition,unitId:'U090'}),/Exact original source/);
});
test('history identity tampering, clock tampering and forged review entries are rejected at persistence boundary',()=>{
 const make=()=>{const w=scheduled();recordCondition(w,condition);decideCondition(w,{conditionId:w.conditions[0].id,decision:'OPEN',reviewer:'A',reason:'Pending'});return w;};
 let w=make();w.sceneSchedules[0].endUtc='2026-10-25T13:00:00.000Z';assert.throws(()=>assertProductionOperationsIntegrity(w),/tampered|identity|Corrupt/);
 w=make();w.conditions[0].quote='Camera permission granted';assert.throws(()=>assertProductionOperationsIntegrity(w),/identity|corrupted/);
 w=make();w.conditionDecisions[0].decision='CLEARED_TO_FILM';assert.throws(()=>assertProductionOperationsIntegrity(w),/corrupted/);
});
test('complete operations persist atomically and round-trip to a separate loaded workspace; expectedVersion fencing works',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'br-s15-store-'));
 try{const store=createWorkspaceStore({directory:dir}),w=scheduled();recordCondition(w,condition);
  const a=await store.persist(w,{expectedVersion:0});assert.equal(a.version,1);
  const loaded=await store.load(w.id);assert.equal(projectOperations(loaded.workspace).conditions.length,1);
  assert.equal(projectOperations(importWorkspace(exportWorkspace(w))).conditions[0].sourceState,'CURRENT_HUMAN_CLAIM');
  decideCondition(loaded.workspace,{conditionId:loaded.workspace.conditions[0].id,decision:'BLOCKED',reviewer:'A',reason:'No supporting authority'});
  const saved=await store.persist(loaded.workspace,{expectedVersion:1});assert.equal(saved.version,2);
  await assert.rejects(()=>store.persist(w,{expectedVersion:1}),/Version conflict/);
  assert.equal(projectOperations((await store.load(w.id)).workspace).conditions[0].decision,'BLOCKED');
 }finally{await rm(dir,{force:true,recursive:true});}
});
async function browser(){const dir=await mkdtemp(path.join(os.tmpdir(),'br-s15-api-'));const store=createWorkspaceStore({directory:dir});
 const server=createAppServer({enabled:false,workspaceStore:store});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const req=async(method,uri,body)=>{const resp=await fetch(base+uri,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:resp.status,body:await resp.json()};};
 return {req,fetchImpl:(uri,init)=>fetch(base+uri,init),close:async()=>{await new Promise(r=>server.close(r));await rm(dir,{force:true,recursive:true});}};
}
test('HTTP production operations enforces versions, persists condition and generates comprehensive source-bound JSON export',async()=>{
 const b=await browser();try{
  let r=await b.req('POST','/api/workspaces',{id:'unit',title:'Night shoot'});assert.equal(r.status,201);
  r=await b.req('POST','/api/workspaces/unit/import',{expectedVersion:1,documentId:'permit',file:{name:'permit.txt',kind:'permit',text:permit}});assert.equal(r.status,200);
  r=await b.req('POST','/api/workspaces/unit/import',{expectedVersion:2,file:{name:'call.txt',kind:'callSheet',text:call}});assert.equal(r.status,200);
  r=await b.req('POST','/api/workspaces/unit/scene-schedule',{expectedVersion:3,...schedule});assert.equal(r.status,200);
  r=await b.req('POST','/api/workspaces/unit/condition',{expectedVersion:3,...condition});assert.equal(r.status,409);
  r=await b.req('POST','/api/workspaces/unit/condition',{expectedVersion:4,...condition});assert.equal(r.status,200);
  const conditionId=r.body.workspace.conditions[0].id;
  r=await b.req('POST','/api/workspaces/unit/condition-decision',{expectedVersion:5,conditionId,decision:'BLOCKED',reviewer:'Coordinator',reason:'Awaiting steward confirmation'});assert.equal(r.status,200);
  r=await b.req('GET','/api/workspaces/unit/operations?asOf=2026-10-25T21%3A00%3A00.000Z');assert.equal(r.status,200);
  assert.equal(r.body.version,6);assert.equal(r.body.summary.pastDuePrerequisites,1);assert.equal(r.body.conditions[0].decision,'BLOCKED');
  r=await b.req('GET','/api/workspaces/unit/overview');assert.equal(r.status,200);assert.equal(r.body.operations.openPrerequisites,1);
  r=await b.req('GET','/api/workspaces/unit/operations/export');assert.equal(r.status,200);
  assert.equal(r.body.schema,'beforeroll-production-operations-evidence-v1');assert.equal(r.body.sourceDocuments[0].sha256.length,64);
  assert.equal(r.body.operations.conditions.length,1);assert.equal(r.body.notClearance,true);
  assert.equal((await b.req('GET','/api/workspaces/unit/execution')).body.attempts,0);
 }finally{await b.close();}
});
test('HTTP operations refuse invalid times and forged decisions without altering persisted version',async()=>{
 const b=await browser();try{
  await b.req('POST','/api/workspaces',{id:'reject',title:'DST invalid'});
  await b.req('POST','/api/workspaces/reject/import',{expectedVersion:1,file:{name:'call.txt',kind:'callSheet',text:call}});
  const before=(await b.req('GET','/api/workspaces/reject')).body.version;assert.equal(before,2);
  const bad=await b.req('POST','/api/workspaces/reject/scene-schedule',{expectedVersion:2,...schedule,endsNextDay:false});assert.equal(bad.status,422);
  assert.equal((await b.req('GET','/api/workspaces/reject')).body.version,2);
  assert.equal((await b.req('POST','/api/workspaces/reject/condition-decision',{expectedVersion:2,conditionId:'bad',decision:'CLEARED_TO_FILM',reviewer:'A',reason:'Unsafe'})).status,422);
 }finally{await b.close();}
});
test('browser workspace controller can record schedule and documented condition without live API access',async()=>{
 const b=await browser();try{
  await b.req('POST','/api/workspaces',{id:'web',title:'Web unit'});
  await b.req('POST','/api/workspaces/web/import',{expectedVersion:1,documentId:'permit',file:{name:'permit.txt',kind:'permit',text:permit}});
  await b.req('POST','/api/workspaces/web/import',{expectedVersion:2,file:{name:'call.txt',kind:'callSheet',text:call}});
  const values={'project-op-scene':'S12','project-op-date':'2026-10-25','project-op-zone':'Europe/London','project-op-overnight':'true',
   'project-op-reviewer':'Crew manager','project-op-reason':'Date verified with calendar','project-condition-scene':'S12','project-condition-title':'Confirm stewards',
   'project-condition-document':'permit','project-condition-unit':'U002','project-condition-due':'2026-10-25T20:30',
   'project-condition-reviewer':'Crew manager','project-condition-reason':'Exact document clause'};
  const root={querySelector:q=>({value:values[q.slice(1)]??'',files:[],dataset:{}})};
  const c=createWorkspaceController({fetchImpl:b.fetchImpl,root});await c.load();await c.click({dataset:{projectOpen:'web'},id:''});
  assert.match(productionView(c.model),/Scene operations and prerequisites/);
  await c.click({dataset:{},id:'project-op-save'});assert.equal(c.model.operations.summary.dated,1);
  await c.click({dataset:{},id:'project-condition-save'});assert.equal(c.model.operations.conditions.length,1);
  assert.match(productionView(c.model),/Confirm stewards/);assert.equal(c.model.liveEnabled,false);
 }finally{await b.close();}
});
