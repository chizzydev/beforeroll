import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {createAppServer} from '../server.mjs';
import {auditDeskSweep} from '../src/desk-semantic.mjs';
import {sceneAuthoritySummary} from '../src/authority-summary.mjs';
import {sha256} from '../src/semantic.mjs';
const cases=JSON.parse(readFileSync(new URL('../fixtures/M3S6_UNFAMILIAR_CASES.json',import.meta.url))).cases;
const evidence=id=>JSON.parse(readFileSync(new URL(`../fixtures/audit/M3S6_${id}_OWNER_LIVE_EVIDENCE.json`,import.meta.url)));
for(const id of ['U01','U02'])test(`M3-S8 ${id} untouched live owner recording re-audits with correct identity & scope labels`,async()=>{
 const original=cases.find(c=>c.id===id),batch=evidence(id);
 assert.equal(batch.permitHash,sha256(original.permit));assert.equal(batch.attempts,8);assert.equal(batch.complete,true);
 for(let i=0;i<2;i++){
  const c=batch.scenes[i];assert.equal(c.sceneRow,original.scenes[i]);
  const b=await auditDeskSweep({permitText:original.permit,sceneRow:c.sceneRow,sceneId:c.sceneId,scan:c.scan,hash:async s=>sha256(s),origin:'recorded'});
  assert.equal(b.checked.length,4);assert.equal(b.complete,true);assert.equal(b.origin,'recorded');
  const summary=sceneAuthoritySummary(b);
  assert.equal(summary.notClearance,true);
  if(i===0){assert.equal(summary.status,'RESTRICTION_AND_CONDITIONAL_GRANT');assert.equal(summary.grant.index,3);}
  else {assert.equal(summary.status,'CONDITION_REVIEW_NO_GRANT');assert.equal(summary.grant,null);}
  const general=b.findings.find(f=>f.clocked.index===1);
  if(general?.clocked.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'){
   assert.match(general.title,/scope unverified/);assert.match(general.detail,/not an exception/);
   assert.equal(general.clocked.finding.code,'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW');
  }
 }
});
test('M3-S8 judge replay assets only exposed as allowlisted synthetic JSON',async()=>{
 const srv=createAppServer({enabled:false});srv.listen(0,'127.0.0.1');await once(srv,'listening');
 const base='http://127.0.0.1:'+srv.address().port;
 try{
  for(const id of ['U01','U02']){
   const r=await fetch(base+`/fixtures/M3S6_${id}_OWNER_RECORDED`);
   assert.equal(r.status,200);const data=await r.json();assert.equal(data.attempts,8);
  }
  assert.equal((await (await fetch(base+'/api/health')).json()).liveEnabled,false);
 }finally{await new Promise(resolve=>srv.close(resolve));}
});
test('M3-S8 judge page includes distinct AI-off and owner-recorded case actions',()=>{
 const s=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 for(const id of ['U01','U02'])assert.match(s,new RegExp('data-owner-replay="'+id+'"'));
 assert.match(s,/async function loadFrozenOwnerReplay/);assert.match(s,/origin:'recorded'/);
 assert.match(s,/verified U01/i);assert.match(readFileSync(new URL('../src/desk-semantic.mjs',import.meta.url),'utf8'),/modelGrantScope/);
});
