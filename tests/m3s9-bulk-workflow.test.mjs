import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppServer} from '../server.mjs';
import {discoverSourceUnits,verifySourceUnit,contextForUnit,sourceFingerprint} from '../src/permit-intelligence.mjs';
import {createProduction,addDocument,reviseDocument,setCallSheet,exportWorkspace,importWorkspace,recordReview,assertWorkspaceSources} from '../src/production-workspace.mjs';
import {planIntelligence,createCheckpoint,assertPlanFresh,markAttempt,commitAnswer,haltUnknown,nextPlannedTask,executeOne} from '../src/intelligence-workflow.mjs';
const permit='ISSUED LOCATION CONSENT LP-12 covers the courtyard.\n\nNo drones.\n\nRestriction: A crane may operate only with a spotter and written supervision.\nA separate signed exception for Scene 9 permits overhead rigging when marshals supervise.';
const calls='Scene 9 | Courtyard | 10:05-10:30 | Follow a moving crane above the set.\nScene 10 | Courtyard | 11:00-11:30 | Film the same crane without permission.\nScene 11 | Courtyard | 12:00-12:10 | Fly a drone across the yard.';
const doc={id:'P1',name:'Courtyard location packet',text:permit};
const make=()=>createProduction({id:'production-pilot',title:'The Courtyard',documents:[doc],callSheetText:calls});
test('complete exact source coverage includes short conditions, paragraph text and Unicode ranges',()=>{
 const source='📜 Consent granted.\n\nNo drones.\n\n• Crew must not fly above the museum.\n• Route plan\ncontinues with a steward on every shift.\n\nFINAL NOTE';
 const p=discoverSourceUnits(source);
 assert.equal(p.allNonWhitespaceRepresented,true);
 assert.deepEqual(p.unrepresented,[]);
 assert(p.units.some(x=>x.text==='No drones.'));
 assert(p.units.some(x=>x.text.includes('steward on every shift')));
 for(const x of p.units)assert(verifySourceUnit(source,x));
 const no=p.units.findIndex(x=>x.text==='No drones.');assert(contextForUnit(p.units,no).before.length);
});
test('long unsplittable block stops before any calls, no silent truncation',()=>{
 assert.throws(()=>discoverSourceUnits('A'.repeat(1800)),/exceeds/);
 assert.throws(()=>discoverSourceUnits('A'.repeat(40001)),/40,000/);
 assert.throws(()=>discoverSourceUnits(''),/Nonempty/);
});
test('one cohesive workspace creates exact multi-scene task plan, no semantic prefilter',()=>{
 const w=make(),plan=planIntelligence(w);
 assert.equal(w.callSheet.scenes.length,3);
 assert.equal(plan.plannedCalls,w.documents[0].units.length*3);
 assert(plan.tasks.some(x=>x.sourceQuote==='No drones.'));
 assert(plan.tasks.filter(x=>x.sceneId==='S11').length===w.documents[0].units.length);
 assert(plan.tasks.every(x=>x.documentHash===sourceFingerprint(permit)&&x.requestHash.length===64));
 assert(plan.tasks.every(x=>x.payload.questions.granted_for_scene.type==='noul'));
 assert.equal(assertPlanFresh(w,plan),true);
 assert.equal(plan.sourceCompleteClaim,false);
});
test('workspace editing invalidates only document-specific outcomes while preserving review history',()=>{
 const w=make();addDocument(w,{id:'P2',name:'Amendment',text:'No overhead lights.'});
 w.assessments=[{documentId:'P1',status:'COMPLETE'},{documentId:'P2',status:'COMPLETE'}];
 recordReview(w,{evidenceId:'P1:S9',decision:'ACKNOWLEDGED',reason:'Need signed variation',reviewer:'coordinator'});
 const before=exportWorkspace(w);const recovered=importWorkspace(before);assert.equal(recovered.reviewActions.length,1);
 reviseDocument(w,'P1',permit+'\n\nNo smoke.');
 assert.equal(w.assessments[0].status,'STALE_SOURCE_CHANGED');assert.equal(w.assessments[1].status,'COMPLETE');
 assert.equal(w.reviewActions[0].evidenceId,'P1:S9');
 assert.equal(w.documents[0].coverage.represented,true);
});
test('scene revisions invalidate all source-bound model assessments and stale plans',()=>{
 const w=make(),plan=planIntelligence(w);
 w.assessments=[{documentId:'P1',status:'COMPLETE'}];
 setCallSheet(w,calls+'\nScene 12 | Courtyard | 14:00-14:20 | Additional scene.');
 assert.equal(w.assessments[0].status,'STALE_SOURCE_CHANGED');
 assert.throws(()=>assertPlanFresh(w,plan),/stale/);
});
test('an incomplete or unsupported call-sheet row blocks comprehensive plan',()=>{
 const w=make();setCallSheet(w,'Scene 9 | Court | no-time | Some activity.');
 assert.throws(()=>planIntelligence(w),/Invalid scene rows/);
 setCallSheet(w,'Scene 9 - Not pipe delimited');
 assert.throws(()=>planIntelligence(w),/at least one supported scene/);
});
test('no automatic re-send for known or unknown outcomes',()=>{
 const plan=planIntelligence(make()),checkpoint=createCheckpoint(plan),first=nextPlannedTask(plan,checkpoint);
 markAttempt(checkpoint,first);assert.throws(()=>markAttempt(checkpoint,first),/already attempted/);
 commitAnswer(checkpoint,first,{answers:{activity_link:{type:'noul',noul:0.91},granted_for_scene:{type:'noul',noul:0.03}}},{credits:1});
 assert.equal(checkpoint.confirmedCompleted,1);assert.equal(checkpoint.entries[0].finding.notClearance,true);
 assert.throws(()=>markAttempt(checkpoint,first),/already attempted/);
 const second=nextPlannedTask(plan,checkpoint);markAttempt(checkpoint,second);haltUnknown(checkpoint,second,'timeout');
 assert.equal(checkpoint.unknownBilling,1);assert.equal(checkpoint.state,'HALTED_UNKNOWN_BILLING');
 assert.equal(nextPlannedTask(plan,checkpoint),null);
});
test('malformed response halts without fabricated semantic score',()=>{
 const plan=planIntelligence(make()),checkpoint=createCheckpoint(plan),first=nextPlannedTask(plan,checkpoint);
 markAttempt(checkpoint,first);commitAnswer(checkpoint,first,{answers:{activity_link:{type:'noul',noul:2}}});
 assert.equal(checkpoint.unknownBilling,1);assert.equal(checkpoint.entries[0].finding,null);
});
test('controlled transport executes at most one queued request, no automatic retry',async()=>{
 const plan=planIntelligence(make()),checkpoint=createCheckpoint(plan);
 let calls=0;
 await executeOne({plan,checkpoint,transport:async()=>{calls++;throw Error('offline timeout');}});
 await executeOne({plan,checkpoint,transport:async()=>{calls++;throw Error('not reachable');}});
 assert.equal(calls,1);assert.equal(checkpoint.attempts,1);
});
test('candidates are not silently dropped at task budget',()=>{
 const w=make();assert.throws(()=>planIntelligence(w,{maxTasks:1}),/no silent truncation/);
});
test('tampered source text, source offset, or untrusted workspace import is rejected',()=>{
 const w=make();w.documents[0].units[0].text='forged';assert.throws(()=>assertWorkspaceSources(w),/integrity/);
 const other=make();other.documents[0].text='No drones.';assert.throws(()=>importWorkspace(JSON.stringify(other)),/hash mismatch/);
});
test('offline API generates one cohesive production plan without provider calls or secrets',async()=>{
 const server=createAppServer({enabled:false});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const url=`http://127.0.0.1:${server.address().port}/api/production/plan`;
  const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'p',title:'Movie',documents:[doc],callSheetText:calls})});
  assert.equal(res.status,200);const data=await res.json();
  assert.equal(data.workspace.sceneCount,3);assert(data.plannedCalls>=6);
  assert.equal(data.documents[0].coverage.represented,true);
  assert.match(data.warning,/No Clocked calls/);
  const bad=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'p',title:'Movie',documents:[{...doc,text:'X'.repeat(1801)}],callSheetText:calls})});
  assert.equal(bad.status,422);
 }finally{await new Promise(r=>server.close(r));}
});
