import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {createAppServer} from '../server.mjs';
import {auditDeskSweep} from '../src/desk-semantic.mjs';
import {sceneAuthoritySummary,authoritySummaryForDossier} from '../src/authority-summary.mjs';
import {sha256} from '../src/semantic.mjs';

const evidence=JSON.parse(readFileSync(new URL('../fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json',import.meta.url),'utf8'));
const cases=JSON.parse(readFileSync(new URL('../fixtures/M3S6_UNFAMILIAR_CASES.json',import.meta.url),'utf8')).cases;
async function summary(i){
 const scene=evidence.scenes[i];
 const b=await auditDeskSweep({permitText:cases.find(x=>x.id==='U01').permit,sceneRow:scene.sceneRow,sceneId:scene.sceneId,scan:scene.scan,hash:async s=>sha256(s),origin:'recorded'});
 return sceneAuthoritySummary(b);
}
test('M3-S7 original frozen U01 scores remain source-bound; Scene 47 retains conditional variation',async()=>{
 const a=await summary(0);assert.equal(a.status,'RESTRICTION_AND_CONDITIONAL_GRANT');assert.equal(a.restriction.index,2);assert.equal(a.grant.index,3);assert.equal(a.notClearance,true);
 assert.equal(a.modelOrigin,'RECORDED');assert.match(authoritySummaryForDossier(a).join('\n'),/Scene 47/);
});
test('M3-S7 general location grant is not promoted to restricted Scene 48 variation',async()=>{
 const b=await summary(1);
 assert.equal(b.status,'CONDITION_REVIEW_NO_GRANT');assert.equal(b.restriction.index,2);assert.equal(b.grant,null);
 const held=b.additional.find(x=>x.index===1 && x.kind==='MODEL_GRANT_SCOPE_UNVERIFIED');
 assert.ok(held);assert.equal(held.grant,.8159);assert.match(held.quote,/LOCATION CONSENT/);
 const dossier=authoritySummaryForDossier(b).join('\n');
 assert.doesNotMatch(dossier,/Potential documentary variation:/);assert.match(dossier,/0\.8159/);
 assert.match(dossier,/NOT a scene-scoped exception/);assert.equal(b.notClearance,true);
});
test('M3-S7 mismatched scene IDs never promote model-positive grant, nor does unscoped language',()=>{
 const r={index:1,range:[0,20],clause:'Consent for Scene 12 only.',requestHash:'a'.repeat(64),notClearance:true,finding:{code:'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW',relevance:.98,grant:.94}};
 const b={sceneId:'S13',notClearance:true,origin:'live',checked:[r],candidates:1,attempts:1,complete:true,coverageWarning:false};
 let s=sceneAuthoritySummary(b);assert.equal(s.grant,null);assert.equal(s.additional[0].kind,'MODEL_GRANT_SCOPE_UNVERIFIED');
 b.checked[0].clause='General venue filming consent exists.';
 s=sceneAuthoritySummary(b);assert.equal(s.grant,null);
 b.checked[0].clause='Scene 13 and Scene 14 are permitted with consent.';
 s=sceneAuthoritySummary(b);assert.equal(s.grant,null);
 b.checked[0].clause='Signed addendum for Scene 13 only.';
 s=sceneAuthoritySummary(b);assert.equal(s.grant.index,1);
});
test('M3-S7 two consecutive full 8-call source batches pass local 256/hour default without external calls',async()=>{
 let calls=0;
 const mocked=async()=>{calls++;return new Response(JSON.stringify({answers:{activity_link:{type:'noul',noul:.9},granted_for_scene:{type:'noul',noul:.02}}}),{status:200,headers:{'x-clocked-credits':'1'}});};
 const makeInput=id=>{const c=cases.find(x=>x.id===id);return {permitText:c.permit,scenes:c.scenes.map(row=>({sceneId:'S'+/^Scene (\d+)/.exec(row)[1],sceneRow:row}))};};
 const call=async(base,id)=>{const r=await fetch(base+'/api/semantic-batch',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':'local-test'},body:JSON.stringify(makeInput(id))});return {status:r.status,json:await r.json()};};
 const srv=createAppServer({enabled:true,apiKey:'fake-no-network-key',operatorToken:'local-test',fetchImpl:mocked});
 srv.listen(0,'127.0.0.1');await once(srv,'listening');const base='http://127.0.0.1:'+srv.address().port;
 try{for(const id of ['U01','U02']){const r=await call(base,id);assert.equal(r.status,200);assert.equal(r.json.complete,true);assert.equal(r.json.attempts,8);}assert.equal(calls,16);}
 finally{await new Promise(resolve=>srv.close(resolve));}
 const capped=createAppServer({enabled:true,apiKey:'fake-no-network-key',operatorToken:'local-test',fetchImpl:mocked,maxCallsPerHour:8});
 capped.listen(0,'127.0.0.1');await once(capped,'listening');const capBase='http://127.0.0.1:'+capped.address().port;
 try{const first=await call(capBase,'U01');assert.equal(first.status,200);const second=await call(capBase,'U02');assert.equal(second.status,429);assert.match(second.json.error,/hourly/i);assert.equal(calls,24);}
 finally{await new Promise(resolve=>capped.close(resolve));}
});
test('M3-S7 invalid local throttle configuration is rejected at startup',()=>{
 for(const n of [0,-1,7,20001,12.5,NaN])assert.throws(()=>createAppServer({maxCallsPerHour:n}),/between 8 and 20000/);
});
