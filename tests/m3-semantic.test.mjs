import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import {createAppServer} from '../server.mjs';
import {sentenceCandidates,excerptFromRange,slicePoints} from '../src/semantic-source.mjs';
import {decideSemanticPayload,conservativeSemanticFinding,parseNoul,sha256} from '../src/semantic.mjs';
const fixtures=JSON.parse(await fs.readFile(new URL('../fixtures/M3_SEMANTIC_PAIRS.json',import.meta.url),'utf8')).cases;
const c02=fixtures.find(x=>x.id==='C02'),c06=fixtures.find(x=>x.id==='C06');
function operativeClause(p,term){const c=sentenceCandidates(p);const choice=c.find(x=>x.text.includes(term));assert.ok(choice,'expected clause missing');return choice;}
const c02Clause=operativeClause(c02.permit,'aerosol');
const c06Clause=operativeClause(c06.permit,'SIGNED CONSERVATOR CLEARANCE');
function inputFor(doc,clause){return {permitText:doc.permit,sceneRow:doc.scene,start:clause.start,end:clause.end};}
async function serve(srv){srv.listen(0,'127.0.0.1');await once(srv,'listening');return `http://127.0.0.1:${srv.address().port}`;}
async function close(srv){await new Promise((resolve,reject)=>srv.close(e=>e?reject(e):resolve()));}
test('frozen R8 synthetic packets are source-identical, not fabricated Decide responses',()=>{
 assert.match(c02.permit,/aerosol, mist, vapor/);assert.match(c02.scene,/Dry-ice vapor/);
 assert.match(c06.permit,/SIGNED CONSERVATOR CLEARANCE CC-21/);
 assert.equal(Object.hasOwn(c02,'decideResult'),false);
});
test('candidate source ranges are exact Unicode codepoints',()=>{
 const s='📸 A first paragraph with vapors and mist.\nSIGNED CLEARANCE CC-21 allows dry ice in Scene 08.';
 for(const x of sentenceCandidates(s))assert.equal(excerptFromRange(s,x.start,x.end),x.text);
 assert.equal(sentenceCandidates(s)[1].start,s.indexOf('SIGNED')-1);
 assert.equal(slicePoints(s,0,1),'📸');
});
test('Decide question performs semantic link, not hard-coded dry-ice mapping',()=>{
 const payload=decideSemanticPayload(c02Clause.text,c02.scene);
 assert.equal(payload.questions.activity_link.type,'noul');
 assert.equal(payload.questions.granted_for_scene.type,'noul');
 assert.ok(payload.state.includes(c02Clause.text));assert.ok(payload.state.includes(c02.scene));
 assert.doesNotMatch(JSON.stringify(payload.questions),/dry.ice|vapor|conservator/i);
});
test('thresholds only create REVIEW, never authorized/cleared',()=>{
 const answer=(rel,grant)=>({activity_link:{noul:rel},granted_for_scene:{noul:grant}});
 const review=conservativeSemanticFinding(answer(.98,.03));assert.equal(review.code,'CLOCKED_SEMANTIC_REVIEW');assert.equal(review.status,'review');
 const granted=conservativeSemanticFinding(answer(.99,.96));assert.equal(granted.code,'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW');assert.equal(granted.status,'review');assert.match(granted.explanation,/Never treat this as clearance/);
 const absent=conservativeSemanticFinding(answer(.09,.05));assert.equal(absent.code,'NO_SEMANTIC_LINK_DETECTED');assert.equal(absent.status,'unresolved');
 const uncertain=conservativeSemanticFinding(answer(.57,.27));assert.equal(uncertain.status,'unresolved');
});
test('invalid or unexpected API probabilities fail closed',()=>{
 for(const v of ['0.98',true,null,Infinity,-1,1.2,undefined])assert.equal(parseNoul({noul:v}),null);
 assert.equal(conservativeSemanticFinding({activity_link:{noul:true},granted_for_scene:{noul:.9}}).code,'FORMAT_UNVERIFIED');
 assert.equal(conservativeSemanticFinding({}).status,'unresolved');
});
test('invalid source ranges, incomplete quotes and bad sizes blocked',()=>{
 assert.throws(()=>excerptFromRange(c02.permit,-1,30));
 assert.throws(()=>excerptFromRange(c02.permit,0,100000));
 assert.throws(()=>excerptFromRange(c02.permit,3,5));
 assert.throws(()=>decideSemanticPayload('too short',c02.scene));
});
test('semantic endpoint is disabled in recorded mode and cannot spend credits',async()=>{
 const srv=createAppServer({enabled:false,apiKey:'fake',operatorToken:'operator'});const base=await serve(srv);
 try{const r=await fetch(base+'/api/semantic',{method:'POST',headers:{'content-type':'application/json','x-operator-token':'operator'},body:JSON.stringify(inputFor(c02,c02Clause))});assert.equal(r.status,503);}
 finally{await close(srv);}
});
test('operator-gated live semantic route makes exactly one correctly scoped Clocked Decide request',async()=>{
 let calls=0;let request;
 const mocked=async(url,options)=>{
  calls++;request={url,headers:options.headers,payload:JSON.parse(options.body)};
  return new Response(JSON.stringify({answers:{activity_link:{type:'noul',noul:.981},granted_for_scene:{type:'noul',noul:.017}}}),{status:200,headers:{'x-clocked-credits':'4'}});
 };
 const srv=createAppServer({enabled:true,apiKey:'NEVER_SHARE_THIS_TEST_KEY',operatorToken:'operator-test',fetchImpl:mocked});const base=await serve(srv);
 try {
  const input=inputFor(c02,c02Clause);
  const unauthorized=await fetch(base+'/api/semantic',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
  assert.equal(unauthorized.status,401);assert.equal(calls,0);
  const r=await fetch(base+'/api/semantic',{method:'POST',headers:{'content-type':'application/json','x-operator-token':'operator-test'},body:JSON.stringify(input)});
  assert.equal(r.status,200);const b=await r.json();assert.equal(calls,1);assert.equal(b.finding.code,'CLOCKED_SEMANTIC_REVIEW');
  assert.equal(b.notClearance,true);assert.equal(b.reportedCredits,4);
  assert.equal(b.clause.text,c02Clause.text);assert.equal(b.scene.text,c02.scene);
  assert.equal(b.permitHash,sha256(c02.permit));assert.equal(b.sceneHash,sha256(c02.scene));
  assert.equal(request.url,'https://clocked.rezolve.ai/clocked/decide');
  assert.equal(request.headers.Authorization,'Bearer NEVER_SHARE_THIS_TEST_KEY');
  assert.equal(request.payload.questions.activity_link.type,'noul');
  assert.ok(request.payload.state.includes(c02Clause.text));
  assert.doesNotMatch(JSON.stringify(b),/NEVER_SHARE_THIS_TEST_KEY|operator-test/);
 } finally {await close(srv);}
});
test('mock granted contrast remains human review; invalid API body abstains',async()=>{
 const replies=[{answers:{activity_link:{noul:.98},granted_for_scene:{noul:.94}}},{answers:{activity_link:{noul:true},granted_for_scene:{noul:false}}}];
 let n=0;const mock=async()=>new Response(JSON.stringify(replies[n++]),{status:200,headers:{'x-clocked-credits':'3'}});
 const srv=createAppServer({enabled:true,apiKey:'dummy',operatorToken:'secret',fetchImpl:mock});const base=await serve(srv);
 try{
  const make=async()=>{const r=await fetch(base+'/api/semantic',{method:'POST',headers:{'content-type':'application/json','x-operator-token':'secret'},body:JSON.stringify(inputFor(c06,c06Clause))});return r.json();};
  const a=await make();assert.equal(a.finding.code,'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW');assert.equal(a.finding.status,'review');
  const b=await make();assert.equal(b.finding.code,'FORMAT_UNVERIFIED');assert.equal(b.finding.status,'unresolved');
 }finally{await close(srv);}
});
test('synthetic source packet and browser-safe module are served without authentication secrets',async()=>{
 const srv=createAppServer({enabled:false});const base=await serve(srv);
 try{
  let r=await fetch(base+'/fixtures/M3');assert.equal(r.status,200);const c=await r.json();assert.equal(c.cases.length,7);
  r=await fetch(base+'/src/semantic-source.mjs');assert.equal(r.status,200);assert.match(await r.text(),/sentenceCandidates/);
  r=await fetch(base+'/src/semantic.mjs');assert.equal(r.status,404); // Node/server code not exposed
  r=await fetch(base+'/app.js');assert.equal(r.status,200);assert.match(await r.text(),/Clocked intelligence/);
 }finally{await close(srv);}
});

test('held-out M3 demonstrator contains no hard-coded hazard identifier in Decide instructions',()=>{
 const p=fixtures.find(x=>x.id==='M3A');
 const clause=sentenceCandidates(p.permit).find(v=>v.text.includes('airborne particulate'));
 assert.ok(clause);assert.ok(p.scene.includes('solid carbon dioxide'));
 assert.doesNotMatch(clause.text,/carbon dioxide/i);
 const req=decideSemanticPayload(clause.text,p.scene);
 assert.doesNotMatch(req.questions.activity_link.instructions,/carbon dioxide|pyrotechnic|dry.ice/i);
});
