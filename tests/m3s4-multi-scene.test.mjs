import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createAppServer} from '../server.mjs';
import {planMultiSceneBatch,validateBatchEnvelopeShape,MAX_MULTI_CALLS} from '../src/multi-scene.mjs';
import {auditDeskSweep} from '../src/desk-semantic.mjs';
import {sha256} from '../src/semantic.mjs';
import {uncoveredSourceSpans} from '../src/semantic-sweep.mjs';
const permit='ISSUED AGREEMENT C-20 for North Glass Gallery. The venue requires signed permission for every introduced vapor effect. SIGNED VARIATION V-4 authorizes carbon dioxide effects for Scene 31 only if floor mats and supervisor are present.';
const scenes=[
 {sceneId:'S31',sceneRow:'Scene 31 | NORTH GLASS GALLERY | 14:00-14:30 | Release frozen carbon dioxide pellets to create swirling white wisps.'},
 {sceneId:'S32',sceneRow:'Scene 32 | NORTH GLASS GALLERY | 15:00-15:30 | Create an atmospheric cloud by sublimating frozen carbon dioxide near the stage.'}
];
const input=()=>({permitText:permit,scenes:structuredClone(scenes)});
async function open(server){server.listen(0,'127.0.0.1');await once(server,'listening');return `http://127.0.0.1:${server.address().port}`;}
async function close(server){await new Promise(ok=>server.close(ok));}
async function call(url,data,token='auth'){
 const r=await fetch(url+'/api/semantic-batch',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify(data)});
 return {status:r.status,data:await r.json()};
}
const answer=(r,g)=>new Response(JSON.stringify({answers:{activity_link:{type:'noul',noul:r},granted_for_scene:{type:'noul',noul:g}}}),{status:200,headers:{'x-clocked-credits':'1'}});
test('multi-scene plan keeps original source rows and creates exact per-scene x clause plan',()=>{
 const plan=planMultiSceneBatch(input());assert.equal(plan.scenes.length,2);assert.equal(plan.totalCalls,6);assert.ok(plan.totalCalls<=MAX_MULTI_CALLS);
 assert.equal(plan.permitHash,sha256(permit));
 for(const scene of plan.scenes){assert.equal(scene.sceneHash,sha256(scene.sceneRow));assert.equal(scene.clauses.length,3);assert.ok(scene.clauses.every(c=>c.payload.state.includes(scene.sceneRow)));}
 assert.notEqual(plan.scenes[0].sceneHash,plan.scenes[1].sceneHash);
});
test('identity mismatch, duplicate scene IDs, excessive scenes and too many calls reject before billing',async()=>{
 const mismatch=input();mismatch.scenes[1].sceneId='S31';assert.throws(()=>planMultiSceneBatch(mismatch),/Duplicated/);
 const changed=input();changed.scenes[1].sceneId='S33';assert.throws(()=>planMultiSceneBatch(changed),/mismatched/);
 const one=input();one.scenes.pop();assert.throws(()=>planMultiSceneBatch(one),/exactly two/);
 const three=input();three.scenes.push({sceneId:'S33',sceneRow:'Scene 33 | HALL | 14:00-14:30 | General work.'});assert.throws(()=>planMultiSceneBatch(three),/exactly two/);
 const long={permitText:Array.from({length:5},(_,i)=>`Restriction ${i}: Venue management must be contacted before any altered operational activity begins.`).join('\n'),scenes};
 assert.throws(()=>planMultiSceneBatch(long),/allows up to 8/);
 let calls=0;const srv=createAppServer({enabled:true,apiKey:'DUMMY',operatorToken:'auth',fetchImpl:async()=>{calls++;return answer(.9,.01);}});const base=await open(srv);
 try{let r=await call(base,long);assert.equal(r.status,422);assert.equal(calls,0);}finally{await close(srv);}
});
test('offline mode and missing/wrong operator token never spend credits',async()=>{
 let calls=0;const mock=async()=>{calls++;return answer(.9,.01);};
 const offline=createAppServer({enabled:false,apiKey:'dummy',operatorToken:'auth',fetchImpl:mock});let base=await open(offline);
 try{const r=await call(base,input());assert.equal(r.status,503);}finally{await close(offline);}
 const online=createAppServer({enabled:true,apiKey:'dummy',operatorToken:'auth',fetchImpl:mock});base=await open(online);
 try{const r=await call(base,input(),'wrong');assert.equal(r.status,401);}finally{await close(online);}
 assert.equal(calls,0);
});
test('independent scene assessments: scene 31 conditional grant, scene 32 restriction; no clearance',async()=>{
 const seen=[];let count=0;
 const fake=async(_url,opts)=>{count++;const payload=JSON.parse(opts.body);seen.push(payload.state);
  // Deterministic mock tests the APPLICATION ROUTE only. Not an actual Clocked inference.
  const for32=payload.state.includes('Scene 32');
  const restriction=payload.state.includes('The venue requires');
  const grant=payload.state.includes('SIGNED VARIATION');
  return answer(restriction||grant?.99:.01,grant&&!for32?.99:.001);
 };
 const srv=createAppServer({enabled:true,apiKey:'DUMMY_SERVER_SECRET',operatorToken:'auth',fetchImpl:fake});const base=await open(srv);
 try{
  const r=await call(base,input());assert.equal(r.status,200);assert.equal(count,6);assert.equal(r.data.attempts,6);
  const plan=planMultiSceneBatch(input());assert.equal(validateBatchEnvelopeShape(r.data,plan),true);
  assert.equal(r.data.complete,true);assert.equal(r.data.reportedCredits,6);assert.equal(r.data.notClearance,true);
  assert.deepEqual(r.data.scenes.map(s=>s.status),['COMPLETE','COMPLETE']);
  const a=await auditDeskSweep({permitText:permit,sceneRow:scenes[0].sceneRow,sceneId:'S31',scan:r.data.scenes[0].scan,hash:async s=>sha256(s),origin:'live'});
  const b=await auditDeskSweep({permitText:permit,sceneRow:scenes[1].sceneRow,sceneId:'S32',scan:r.data.scenes[1].scan,hash:async s=>sha256(s),origin:'live'});
  assert.ok(a.findings.some(f=>f.clocked.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'));
  assert.ok(!b.findings.some(f=>f.clocked.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'));
  assert.ok(b.findings.some(f=>f.clocked.finding.code==='CLOCKED_SEMANTIC_REVIEW'));
  assert.ok(a.findings.every(f=>f.sceneId==='S31'&&f.clocked.sceneRow===scenes[0].sceneRow));
  assert.ok(b.findings.every(f=>f.sceneId==='S32'&&f.clocked.sceneRow===scenes[1].sceneRow));
  assert.ok(seen.slice(0,3).every(s=>s.includes('Scene 31'))&&seen.slice(3).every(s=>s.includes('Scene 32')));
  assert.doesNotMatch(JSON.stringify(r.data),/DUMMY_SERVER_SECRET|"auth"/);
 }finally{await close(srv);}
});
test('network rejection stops all later calls; other scene explicitly not evaluated',async()=>{
 let count=0;const fake=async()=>{count++;return count===2?new Response('Forbidden',{status:403}):answer(.95,.001);};
 const srv=createAppServer({enabled:true,apiKey:'DUMMY',operatorToken:'auth',fetchImpl:fake});const base=await open(srv);
 try{const r=await call(base,input());assert.equal(r.status,200);assert.equal(count,2);
  assert.equal(r.data.complete,false);assert.equal(r.data.attempts,2);assert.equal(r.data.reportedCredits,null);assert.equal(r.data.observedKnownCredits,1);
  assert.deepEqual(r.data.scenes.map(v=>v.status),['PARTIAL','NOT_EVALUATED']);assert.equal(r.data.scenes[1].scan,null);
  assert.equal(validateBatchEnvelopeShape(r.data,planMultiSceneBatch(input())),true);
  assert.match(r.data.error,/HTTP 403/);
 }finally{await close(srv);}
});
test('invalid typed Decide result never promotes permission; later scenes not touched',async()=>{
 let count=0;const fake=async()=>{count++;return new Response(JSON.stringify({answers:{activity_link:{noul:'0.9'},granted_for_scene:{noul:1}}}),{status:200,headers:{'x-clocked-credits':'1'}});};
 const srv=createAppServer({enabled:true,apiKey:'DUMMY',operatorToken:'auth',fetchImpl:fake});const base=await open(srv);
 try{const r=await call(base,input());assert.equal(r.status,200);assert.equal(count,1);assert.equal(r.data.scenes[0].scan.results[0].finding.code,'FORMAT_UNVERIFIED');assert.equal(r.data.scenes[0].scan.results[0].finding.status,'unresolved');assert.equal(r.data.scenes[1].status,'NOT_EVALUATED');}
 finally{await close(srv);}
});
test('batch envelope rejects scene substitution, false COMPLETE, and accounting tampering',async()=>{
 const plan=planMultiSceneBatch(input());const good={source:'live-clocked-decide-multi-scene',endpoint:'decide',notClearance:true,interpretationScope:'SEGMENTED_CLAUSES_PER_SCENE_NOT_COMPLETE_PERMIT_AUTHORITY',permitHash:plan.permitHash,scenes:plan.scenes.map(v=>({sceneId:v.sceneId,sceneRow:v.sceneRow,sceneHash:v.sceneHash,status:'NOT_EVALUATED',scan:null})),totalPlannedCalls:plan.totalCalls,attempts:0,complete:false,reportedCredits:0,observedKnownCredits:0,error:'Not attempted'};
 assert.equal(validateBatchEnvelopeShape(good,plan),true);
 const a=structuredClone(good);a.scenes[1].sceneRow+=' tampered';assert.throws(()=>validateBatchEnvelopeShape(a,plan),/identity/);
 const b=structuredClone(good);b.complete=true;assert.throws(()=>validateBatchEnvelopeShape(b,plan),/completeness/);
 const c=structuredClone(good);c.attempts=1;assert.throws(()=>validateBatchEnvelopeShape(c,plan),/completeness/);
});
test('unsegmented short safety clause remains visible as source coverage gap',()=>{
 const text=permit+'\nNo drones.';const plan=planMultiSceneBatch({permitText:text,scenes});const misses=uncoveredSourceSpans(text,plan.scenes[0].clauses);
 assert.ok(misses.some(x=>x.text.includes('No')));assert.ok(misses.some(x=>x.text.includes('drones')));
});
