import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createAppServer} from '../server.mjs';
import {sweepCandidatePlan,parseSweepReply,uncoveredSourceSpans,MAX_SWEEP_CLAUSES} from '../src/semantic-sweep.mjs';
import {sha256} from '../src/semantic.mjs';
const fixture={permit:'ISSUED AGREEMENT TEST-21. Pyrotechnic flames need fire marshal review before filming. Conservation staff must approve manufactured vapor before deployment.',scene:'Scene 12 | GALLERY | 14:00-14:30 | Use solid carbon dioxide pellets to create vapor effects.'};
async function open(server){server.listen(0,'127.0.0.1');await once(server,'listening');return `http://127.0.0.1:${server.address().port}`;}
async function close(server){await new Promise(done=>server.close(done));}
async function query(url,body,token='auth'){const r=await fetch(url+'/api/semantic-sweep',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify(body)});return {status:r.status,json:await r.json()};}
test('scan enumerates all detected clauses without semantic hardcoded hazard filters',()=>{
 const p=sweepCandidatePlan(fixture.permit,fixture.scene);
 assert.equal(p.length,3);
 assert.deepEqual(p.map(x=>x.index),[1,2,3]);
 assert.ok(p.every(x=>x.text===Array.from(fixture.permit).slice(x.start,x.end).join('')));
 assert.ok(p.every(x=>x.payload.questions.activity_link.type==='noul'));
 assert.ok(p.every(x=>x.payload.state.includes(fixture.scene)));
 assert.ok(p.every(x=>x.requestHash===sha256(JSON.stringify(x.payload))));
 assert.doesNotMatch(JSON.stringify(p.map(x=>x.payload.questions)),/dry.?ice|carbon dioxide/i);
});
test('rejects oversize scans before any billable call; never truncates silently',async()=>{
 const perm=Array.from({length:MAX_SWEEP_CLAUSES+2},(_,i)=>`Condition ${i} requires specific location coordination before any filming activity is scheduled.`).join(' ');
 assert.throws(()=>sweepCandidatePlan(perm,fixture.scene),/at most 8/);
 let calls=0;const srv=createAppServer({enabled:true,apiKey:'dummy',operatorToken:'auth',fetchImpl:async()=>{calls++;return new Response('{}');}});const base=await open(srv);
 try{let r=await query(base,{permitText:perm,sceneRow:fixture.scene});assert.equal(r.status,422);assert.equal(calls,0);}finally{await close(srv);}
});
test('operator required and offline scan is nonbillable',async()=>{
 let calls=0;const mock=async()=>{calls++;throw Error('must never call');};
 const off=createAppServer({enabled:false,apiKey:'dummy',operatorToken:'auth',fetchImpl:mock});const b1=await open(off);
 try{const r=await query(b1,{permitText:fixture.permit,sceneRow:fixture.scene});assert.equal(r.status,503);assert.equal(calls,0);}finally{await close(off);}
 const on=createAppServer({enabled:true,apiKey:'dummy',operatorToken:'auth',fetchImpl:mock});const b2=await open(on);
 try{const r=await query(b2,{permitText:fixture.permit,sceneRow:fixture.scene},'wrong');assert.equal(r.status,401);assert.equal(calls,0);}finally{await close(on);}
});
test('each segmented clause receives one Clocked decision with exact evidence, no clearance',async()=>{
 const p=sweepCandidatePlan(fixture.permit,fixture.scene);let calls=0;const packets=[];
 const mocked=async(url,opts)=>{calls++;packets.push({url,payload:JSON.parse(opts.body),headers:opts.headers});
  const prob=[.04,.03,.97][calls-1];return new Response(JSON.stringify({answers:{activity_link:{type:'noul',noul:prob},granted_for_scene:{type:'noul',noul:.001}}}),{status:200,headers:{'x-clocked-credits':'2'}});
 };
 const srv=createAppServer({enabled:true,apiKey:'DUMMY_NOT_SHARED',operatorToken:'auth',fetchImpl:mocked});const base=await open(srv);
 try{
  const r=await query(base,{permitText:fixture.permit,sceneRow:fixture.scene});assert.equal(r.status,200);
  assert.equal(calls,p.length);assert.equal(r.json.complete,true);assert.equal(r.json.attempts,3);assert.equal(r.json.candidatesEvaluated,3);assert.equal(r.json.reportedCredits,6);
  assert.equal(r.json.results[2].finding.code,'CLOCKED_SEMANTIC_REVIEW');assert.equal(r.json.results[0].finding.code,'NO_SEMANTIC_LINK_DETECTED');
  for(let i=0;i<p.length;i++){const rec=r.json.results[i];assert.deepEqual(rec.range,[p[i].start,p[i].end]);assert.equal(rec.clause,p[i].text);assert.equal(rec.requestHash,p[i].requestHash);assert.equal(rec.notClearance,true);assert.equal(packets[i].url,'https://clocked.rezolve.ai/clocked/decide');assert.equal(packets[i].payload.state,p[i].payload.state);}
  assert.equal(r.json.interpretationScope,'ONLY_SEGMENTED_CLAUSES_NOT_ENTIRE_PERMIT_AUTHORITY');
  assert.doesNotMatch(JSON.stringify(r.json),/DUMMY_NOT_SHARED|"auth"/);
 }finally{await close(srv);}
});
test('failure stops later requests and represents partial incomplete result',async()=>{
 let calls=0;const mock=async()=>{calls++;if(calls===2)return new Response('Forbidden',{status:403});return new Response(JSON.stringify({answers:{activity_link:{type:'noul',noul:.1},granted_for_scene:{type:'noul',noul:.01}}}),{status:200,headers:{'x-clocked-credits':'3'}});};
 const srv=createAppServer({enabled:true,apiKey:'dummy',operatorToken:'auth',fetchImpl:mock});const base=await open(srv);
 try{const r=await query(base,{permitText:fixture.permit,sceneRow:fixture.scene});assert.equal(r.status,200);assert.equal(r.json.complete,false);assert.equal(r.json.attempts,2);assert.equal(r.json.candidatesEvaluated,1);assert.equal(r.json.reportedCredits,null);assert.equal(r.json.observedKnownCredits,3);assert.equal(r.json.results.length,1);assert.match(r.json.error,/HTTP 403/);assert.equal(calls,2);}finally{await close(srv);}
});
test('invalid model scores stop the sweep and are not treated as clearance',async()=>{
 let calls=0;const mock=async()=>{calls++;return new Response(JSON.stringify({answers:{activity_link:{noul:'0.99'},granted_for_scene:{noul:.99}}}),{status:200,headers:{'x-clocked-credits':'1'}});};
 const srv=createAppServer({enabled:true,apiKey:'dummy',operatorToken:'auth',fetchImpl:mock});const base=await open(srv);
 try{const r=await query(base,{permitText:fixture.permit,sceneRow:fixture.scene});assert.equal(r.json.complete,false);assert.equal(r.json.results[0].finding.code,'FORMAT_UNVERIFIED');assert.equal(r.json.results[0].finding.status,'unresolved');assert.equal(r.json.attempts,1);assert.equal(calls,1);}finally{await close(srv);}
});

test('short omitted clause stays visible as unscanned source, never silently treated as clearance',()=>{
 const permit='Issued agreement permits normal filming. No drones. Fog requires signed approval before use.';
 const plan=sweepCandidatePlan(permit,fixture.scene);
 const missing=uncoveredSourceSpans(permit,plan);
 assert.ok(missing.some(x=>x.text.includes('No')));
 assert.ok(missing.some(x=>x.text.includes('drones')));
});
