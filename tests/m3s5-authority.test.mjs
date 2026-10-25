import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneAuthoritySummary,authoritySummaryForDossier} from '../src/authority-summary.mjs';
import {auditDeskSweep} from '../src/desk-semantic.mjs';
import {sha256} from '../src/semantic.mjs';
const recorded=JSON.parse(readFileSync(new URL('../fixtures/audit/M3S4_OWNER_TWO_SCENE_LIVE.json',import.meta.url),'utf8'));
const permit=JSON.parse(readFileSync(new URL('../fixtures/M3_SEMANTIC_PAIRS.json',import.meta.url),'utf8')).cases.find(x=>x.id==='M3B').permit;
async function bound(index){const r=recorded.scenes[index];return auditDeskSweep({permitText:permit,sceneRow:r.sceneRow,sceneId:r.sceneId,scan:r.scan,origin:'live',hash:async s=>sha256(s)});}
test('no source-bound assessment never grants authority',()=>{const s=sceneAuthoritySummary(null);assert.equal(s.status,'NOT_EVALUATED');assert.equal(s.notClearance,true);assert.equal(s.modelOrigin,'NONE');});
test('Scene 31 has both relevant condition and scene-limited documentary grant, without clearance',async()=>{const s=sceneAuthoritySummary(await bound(0));assert.equal(s.status,'RESTRICTION_AND_CONDITIONAL_GRANT');assert.equal(s.restriction.index,2);assert.equal(s.grant.index,3);assert.match(s.grant.quote,/Scene 31/);assert.match(s.missing.join(' '),/prerequisite/i);assert.equal(s.notClearance,true);assert.ok(s.additional.some(x=>x.index===4));assert.ok(authoritySummaryForDossier(s).join('\n').includes(s.grant.requestHash));});
test('Scene 32 cannot inherit Scene 31 grant; extension clause remains scope review',async()=>{const s=sceneAuthoritySummary(await bound(1));assert.equal(s.status,'CONDITION_REVIEW_NO_GRANT');assert.equal(s.restriction.index,2);assert.equal(s.grant,null);assert.ok(s.additional.some(x=>x.index===4));assert.match(s.detail,/neither a proven violation/i);assert.match(s.missing.join(' '),/separate request, scope or extension/);assert.doesNotMatch(s.headline,/authorized|clearance/i);});
test('truncated/error run cannot be presented as full permission even if a grant appears',async()=>{const r=await bound(0);r.complete=false;r.coverageWarning=true;const s=sceneAuthoritySummary(r);assert.equal(s.status,'PARTIAL_ASSESSMENT');assert.ok(s.missing.length>=2);assert.equal(s.notClearance,true);});
test('unresolved-only cases never imply no restriction or authorization',async()=>{const r=await bound(1);r.checked=r.checked.filter(v=>v.index===1);r.candidates=1;const s=sceneAuthoritySummary(r);assert.equal(s.status,'NO_LINK_IN_SEGMENTED_CANDIDATES');assert.match(s.detail,/does not establish unrestricted/i);});
test('reject tampered or improper pre-summary contract',async()=>{const b=await bound(0);assert.throws(()=>sceneAuthoritySummary({...b,notClearance:false}),/contract/);const c=structuredClone(b);c.checked[0].notClearance=false;assert.throws(()=>sceneAuthoritySummary(c),/clause/);assert.throws(()=>authoritySummaryForDossier({notClearance:false}),/no-clearance/);});
test('no keyword/synonym categorization: abstract source document works by typed model outcomes',()=>{const make=(code)=>({index:1,range:[0,12],clause:'XZY ZQ MRP.',requestHash:'f'.repeat(64),notClearance:true,finding:{code,relevance:.91,grant:.02}});const b={notClearance:true,origin:'live',checked:[make('CLOCKED_SEMANTIC_REVIEW')],candidates:1,attempts:1,complete:true,coverageWarning:false};const s=sceneAuthoritySummary(b);assert.equal(s.status,'CONDITION_REVIEW_NO_GRANT');assert.equal(s.restriction.quote,'XZY ZQ MRP.');});

test('server ships first-party Scene Authority module, not missing asset',async()=>{
 const {createAppServer}=await import('../server.mjs');const {once}=await import('node:events');
 const s=createAppServer({enabled:false,apiKey:'',operatorToken:'',fetchImpl:()=>{throw Error('No network');}});
 s.listen(0,'127.0.0.1');await once(s,'listening');
 try{const r=await fetch(`http://127.0.0.1:${s.address().port}/src/authority-summary.mjs`);assert.equal(r.status,200);assert.match(await r.text(),/sceneAuthoritySummary/);}
 finally{await new Promise(resolve=>s.close(resolve));}
});

test('server serves original two-scene recording offline with explicit provider-run provenance',async()=>{
 const {createAppServer}=await import('../server.mjs');const {once}=await import('node:events');
 const s=createAppServer({enabled:false,apiKey:'NOT_SET',operatorToken:'',fetchImpl:()=>{throw Error('No network allowed in recorded mode');}});
 s.listen(0,'127.0.0.1');await once(s,'listening');
 try{const r=await fetch(`http://127.0.0.1:${s.address().port}/fixtures/M3S4_TWO_SCENE_RECORDED`);assert.equal(r.status,200);const b=await r.json();assert.equal(b.source,'live-clocked-decide-multi-scene');assert.equal(b.scenes.length,2);assert.equal(b.attempts,8);assert.equal(b.reportedCredits,8);assert.equal(b.complete,true);assert.doesNotMatch(JSON.stringify(b),/"Authorization"|"operatorToken"|"CLOCKED_API_KEY"/);}
 finally{await new Promise(resolve=>s.close(resolve));}
});
