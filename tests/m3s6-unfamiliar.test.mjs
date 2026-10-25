import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {createAppServer} from '../server.mjs';
import {sha256} from '../src/semantic.mjs';
import {sentenceCandidates,previewSourceCoverage} from '../src/semantic-source.mjs';
import {planMultiSceneBatch} from '../src/multi-scene.mjs';
import {parseCallSheet} from '../src/engine.mjs';
import {sceneAuthoritySummary} from '../src/authority-summary.mjs';
const fixture=JSON.parse(readFileSync(new URL('../fixtures/M3S6_UNFAMILIAR_CASES.json',import.meta.url),'utf8'));
const gold=JSON.parse(readFileSync(new URL('../research/M3S6_FROZEN_PREREGISTERED_GOLD.json',import.meta.url),'utf8'));
const two=fixture.cases.filter(c=>!c.offline_only);
function input(c){return {permitText:c.permit,scenes:c.scenes.map(r=>({sceneId:'S'+/^Scene (\d+)/.exec(r)[1],sceneRow:r}))};}
test('new synthetic scenario inputs are fingerprinted, pre-frozen and contain zero provider answer values',()=>{
 assert.equal(fixture.api_results.startsWith('NONE'),true);assert.equal(gold.modelResultsAtFreeze,'NONE');assert.equal(two.length,2);
 for(const c of fixture.cases){assert.equal(sha256(c.permit),c.permitSha256);assert.deepEqual(c.scenes.map(sha256),c.sceneSha256);}
 assert.ok(!JSON.stringify(fixture).includes('modelAnswers'));assert.ok(!JSON.stringify(fixture).includes('operatorToken'));
});
test('U01 newly worded archive case plans 8 distinct exact real-model requests, no preselected clause',()=>{
 const c=two[0],p=planMultiSceneBatch(input(c));assert.equal(p.totalCalls,8);
 assert.deepEqual(p.scenes.map(v=>v.clauses.length),[4,4]);
 assert.notEqual(p.scenes[0].sceneHash,p.scenes[1].sceneHash);
 assert.ok(p.scenes[0].clauses[1].payload.state.includes('tesserae'));
 assert.ok(p.scenes[0].clauses[1].payload.state.includes('wheeled dolly'));
 assert.ok(p.scenes[1].clauses[2].payload.state.includes('Scene 48'));
 assert.equal(p.scenes[0].clauses[2].requestHash.length,64);
});
test('U02 public passage case independently uses 8 bounded calls; edited scene scope cannot silently masquerade',()=>{
 const c=two[1],p=planMultiSceneBatch(input(c));assert.equal(p.totalCalls,8);
 const bad=input(c);bad.scenes[1].sceneRow=bad.scenes[1].sceneRow.replace('Scene 63','Scene 62');
 assert.throws(()=>planMultiSceneBatch(bad),/Duplicated/);
 const x=parseCallSheet(c.scenes.join('\n'));assert.equal(x.scenes.length,2);assert.equal(x.unsupported.length,0);
});
test('new short No drones clause is unsegmented but source preview reports contiguous exact words',()=>{
 const c=fixture.cases.find(x=>x.id==='U03'),v=previewSourceCoverage(c.permit);
 assert.equal(v.candidatesDetected,2);assert.equal(v.hasUncovered,true);
 assert.ok(v.uncovered.some(x=>x.text.includes('No drones.')));
 assert.ok(!sentenceCandidates(c.permit).some(x=>x.text.includes('No drones.')));
});
test('unfamiliar source coverage checks use Unicode codepoints and original slices',()=>{
 const c=two[0],v=previewSourceCoverage(c.permit);
 assert.equal(v.candidatesDetected,4);assert.equal(v.hasUncovered,false);
 for(const item of v.uncovered)assert.equal(Array.from(c.permit).slice(item.start,item.end).join(''),item.text);
});
test('new challenges have frozen model-independent expected relations, not automatic judge approval',()=>{
 assert.equal(gold.caseRubric.length,2);
 for(const c of two){const r=gold.caseRubric.find(x=>x.id===c.id);assert.equal(r.permitSha256,c.permitSha256);assert.equal(r.assertions.length,5);assert.ok(r.assertions.every(a=>['high','low'].includes(a.band)));}
 assert.equal(sceneAuthoritySummary(null).notClearance,true);
});
test('server exposes only source cases, not private gold; offline requests are rejected without spending credits',async()=>{
 let calls=0;const server=createAppServer({enabled:false,apiKey:'SECRET_NOT_USED',operatorToken:'TOKEN_NOT_USED',fetchImpl:async()=>{calls++;throw Error('unexpected external request');}});
 server.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 try {
  const r=await fetch(base+'/fixtures/M3S6_UNFAMILIAR_CASES');assert.equal(r.status,200);const body=await r.json();assert.equal(body.cases.length,3);
  const goldResult=await fetch(base+'/research/M3S6_FROZEN_PREREGISTERED_GOLD.json');assert.equal(goldResult.status,404);
  const x=await fetch(base+'/api/semantic-batch',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':'TOKEN_NOT_USED'},body:JSON.stringify(input(two[0]))});assert.equal(x.status,503);
  assert.equal(calls,0);
 }finally{await new Promise(r=>server.close(r));}
});
test('read-only offline preflight validates frozen hashes and does not call the network',()=>{
 const result=execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/evaluate_m3s6.mjs',import.meta.url)),'--preflight'],{encoding:'utf8'});
 assert.match(result,/M3S6_SOURCE_PREFLIGHT=PASS/);assert.match(result,/NO_CLOCKED_CALLS/);assert.match(result,/FROZEN=U03/);
});
test('M3-S4 evidence cannot be mislabelled as an unseen U01 win',()=>{
 assert.throws(()=>execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/evaluate_m3s6.mjs',import.meta.url)),'--case','U01','--input',fileURLToPath(new URL('../fixtures/audit/M3S4_OWNER_TWO_SCENE_LIVE.json',import.meta.url))],{encoding:'utf8',stdio:'pipe'}),/Command failed/);
});
test('browser source references new zero-credit inputs, provenance corrections and run controls',()=>{
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(app,/data-unfamiliar="U01"/);assert.match(app,/data-unfamiliar="U02"/);
 assert.match(app,/CLOCKED INTELLIGENCE \/ SOURCE-LINKED EVIDENCE/);
 assert.doesNotMatch(app,/CLOCKED \+ VERIFIED SOURCE/);
 assert.doesNotMatch(app,/SCENES COMPLETELY ASSESSED/);
 assert.match(app,/async function loadUnfamiliarChallenge/);
 assert.match(app,/No model outcomes simulated/);
 assert.doesNotMatch(app,/function challengeDate\(\)\{[^}]*:challengeDate\(\)/);
});
