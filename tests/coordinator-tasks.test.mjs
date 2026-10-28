import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAppServer} from '../server.mjs';
import {makeEvaluationRuntime} from '../src/evaluation-mode.mjs';
import {discoverSourceUnits} from '../src/permit-intelligence.mjs';
import {decodeLiteralRequirements,literalHash,LITERAL_FIELDS} from '../src/literal-requirements.mjs';
import {validateRecordedLiteralBundle,projectCoordinatorTasks} from '../src/coordinator-tasks.mjs';
import {recordedCoordinatorEvidence} from '../src/recorded-coordinator-evidence.mjs';
import {createProduction,reviseDocument,setCallSheet} from '../src/production-workspace.mjs';
import {buildProductionDossier,dossierMarkdown} from '../src/production-dossier.mjs';
import {createWorkspaceController} from '../public/workspace-desk.mjs';
import {workspaceLocation,restoreWorkspaceLocation,followWorkspaceAnchor} from '../public/workspace/navigation.mjs';
import {coordinatorView} from '../public/workspace/coordinator-view.mjs';

const bundleBytes=await readFile(new URL('../fixtures/audit/U01_MATCHED_EXTRACT_OWNER_RECORDED_v1.json',import.meta.url));
const decideBytes=await readFile(new URL('../fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json',import.meta.url));
const bundle=JSON.parse(bundleBytes),evidence=validateRecordedLiteralBundle(bundleBytes,decideBytes);
const permitBytes=Buffer.from(bundle.permitBase64,'base64');
function input(unitId='U002'){
 const files=bundle.records.find(r=>r.sourceUnit===unitId).files;
 const requestBytes=Buffer.from(files['request.body.json'],'base64'),responseBytes=Buffer.from(files['response.body.bin'],'base64');
 return {permitBytes,permitSha256:bundle.permitSha256,unit:discoverSourceUnits(permitBytes.toString()).units.find(u=>u.id===unitId),requestBytes,responseBytes,
  requestSha256:literalHash(requestBytes),responseSha256:literalHash(responseBytes),receipt:JSON.parse(Buffer.from(files['receipt.json'],'base64')),provenance:'OWNER_RECORDED_CLOCKED_EXTRACT'};
}
function alteredResponse(change){
 const data=input(),r=JSON.parse(data.responseBytes);change(r);data.responseBytes=Buffer.from(JSON.stringify(r));
 data.responseSha256=literalHash(data.responseBytes);data.receipt={...data.receipt,responseSha256:data.responseSha256,storedBodySha256:data.responseSha256,responseByteLength:data.responseBytes.length};
 data.provenance='CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED';return data;
}
async function fixture(t){
 const runtime=await makeEvaluationRuntime();let calls=0;
 const server=createAppServer({evaluationMode:true,evaluationRuntime:runtime,workspaceStore:runtime.store,executionStore:runtime.execution,sourceVault:runtime.vault,
  enabled:true,apiKey:'CONTROLLED_NOT_REAL',operatorToken:'CONTROLLED_NOT_REAL',fetchImpl:async()=>{calls++;throw Error('NO CLOCKED ALLOWED');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await new Promise(r=>server.close(r));await runtime.dispose();assert.equal(calls,0);});
 const request=async(path,method='GET',body=null,headers={})=>{
  const r=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
  return {status:r.status,data:await r.json()};
 };
 return {runtime,server,base,request,calls:()=>calls,workflow:async(scene='S47')=>(await request('/api/workspaces/eval_archive/workflow?sceneId='+scene)).data};
}
test('actual imported owner bytes validate all three responses, exact Unicode spans and zero-item negative',()=>{
 assert.equal(literalHash(permitBytes),'6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c');
 assert.equal(evidence.facts.length,3);
 assert.deepEqual(evidence.facts.map(f=>[f.quote,f.unitRange,f.permitRange]),[
  ['written registrar consent',[85,110],[170,195]],['protective boards',[126,143],[333,350]],['on-site registrar',[151,168],[358,375]]]);
 for(const f of evidence.facts){assert.equal(Array.from(evidence.permit).slice(...f.permitRange).join(''),f.quote);assert.equal(f.issuance,'UNKNOWN');assert.equal(f.status,'MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED');}
 const negative=decodeLiteralRequirements(input('U004'));assert.equal(negative.facts.length,0);
 assert.ok(Object.values(negative.fieldStates).every(v=>v==='NO_LITERAL_REQUIREMENT_FOUND_IN_THIS_FIELD'));
 assert.equal(evidence.fieldStates[2].responseSha256,'43b7fefa475ec30ce8e2808a3e0b9faf7ea763adf7bc62167277243fbf53693d');
});
test('accepted recorded structures are immutable after validation, including nested source spans',()=>{
 assert.ok(Object.isFrozen(evidence));assert.ok(Object.isFrozen(evidence.facts[0].unitRange));
 assert.throws(()=>{evidence.facts[0].quote='invented consent';},TypeError);
 assert.throws(()=>{evidence.sceneRows[0]=evidence.sceneRows[1];},TypeError);
});
test('in-page action and skip links retain reading state rather than replacing it with an anchor hash',()=>{
 let prevented=0,focused=0,scrolled=0;
 const event={target:{closest:()=>({tagName:'A',getAttribute:()=> '#next-human-action'})},preventDefault:()=>prevented++};
 const target={focus:()=>focused++,scrollIntoView:()=>scrolled++};
 assert.equal(followWorkspaceAnchor(event,{getElementById:id=>id==='next-human-action'?target:null}),true);
 assert.equal(prevented,1);assert.equal(focused,1);assert.equal(scrolled,1);
 assert.equal(followWorkspaceAnchor(event,{getElementById:()=>null}),'MISSING');
});
for(const [name,change] of Object.entries({
 'wrong extraction category':r=>{r.fields.made_up_actions=[];},
 'missing field':r=>{delete r.fields.required_physical_protections;},
 'nonarray field values':r=>{r.fields.required_written_documents.value='consent';},
 'nonarray items':r=>{r.fields.required_written_documents.items={};},
 'wrong quote':r=>{r.fields.required_written_documents.items[0].value='invented consent';},
 'off by one':r=>{r.fields.required_written_documents.items[0].start++;},
 'negative offset':r=>{r.fields.required_written_documents.items[0].start=-1;},
 'fractional offset':r=>{r.fields.required_written_documents.items[0].end=110.5;},
 'offset outside unit':r=>{r.fields.required_written_documents.items[0].end=10000;},
 'string confidence':r=>{r.fields.required_written_documents.items[0].confidence='1';},
 'unknown confidence':r=>{r.fields.required_written_documents.items[0].p_verify=2;},
}))test(`${name} fails closed with explicit incomplete review and no trusted facts`,()=>{
 const p=decodeLiteralRequirements(alteredResponse(change));assert.equal(p.state,'PARTIAL_INCOMPLETE_REVIEW');assert.equal(p.facts.length,0);assert.ok(p.errors.length);
});
for(const [name,change] of Object.entries({
 'mismatched permit hash':d=>{d.permitSha256='0'.repeat(64);},
 'altered original permit':d=>{d.permitBytes=Buffer.from(evidence.permit+' altered');},
 'invalid UTF8':d=>{d.permitBytes=Buffer.from([255,254]);},
 'unknown source unit':d=>{d.unit={...d.unit,id:'U999'};},
 'wrong source-unit range':d=>{d.unit={...d.unit,start:d.unit.start+1};},
 'request hash mismatch':d=>{d.requestSha256='0'.repeat(64);},
 'response hash mismatch':d=>{d.responseSha256='0'.repeat(64);},
 'missing receipt':d=>{d.receipt=null;},
 'incomplete response':d=>{d.receipt.complete=false;},
 'missing accepted provenance':d=>{d.provenance='LIVE_CLOCKED';},
 'malformed response':d=>{d.responseBytes=Buffer.from('not JSON');d.responseSha256=literalHash(d.responseBytes);d.receipt={...d.receipt,responseSha256:d.responseSha256,storedBodySha256:d.responseSha256,responseByteLength:d.responseBytes.length};},
}))test(`${name} cannot create a literal requirement`,()=>{
 const d=input();change(d);const p=decodeLiteralRequirements(d);assert.equal(p.facts.length,0);assert.equal(p.state,'PARTIAL_INCOMPLETE_REVIEW');
});
test('duplicate exact facts deduplicate without merging distinct physical/personnel obligations',()=>{
 const d=alteredResponse(r=>{const f=r.fields.required_written_documents;f.value.push(f.value[0]);f.items.push({...f.items[0]});});
 assert.equal(decodeLiteralRequirements(d).facts.length,1);assert.equal(decodeLiteralRequirements(input('U003')).facts.length,2);
});
test('duplicate/swapped recorded responses or missing original bytes cannot masquerade as accepted owner evidence',()=>{
 const duplicate=JSON.parse(bundleBytes);duplicate.records[1]=duplicate.records[0];
 assert.throws(()=>validateRecordedLiteralBundle(Buffer.from(JSON.stringify(duplicate)),decideBytes),/INTEGRITY/);
 assert.throws(()=>validateRecordedLiteralBundle(bundleBytes,Buffer.from('{}')),/INTEGRITY/);
 const w=createProduction({id:'missing',title:'Missing evidence',documents:[{id:'permit',name:'fictional',text:evidence.permit}],callSheetText:bundle.sceneRows.join('\n')});
 const p=projectCoordinatorTasks(w,{});assert.equal(p.state,'PARTIAL_INCOMPLETE_REVIEW');assert.equal(p.candidates.length,0);
});
test('actual Evaluation Mode produces S47 three/S48 one plus unissued warning and preserves every original question',async t=>{
 const x=await fixture(t),a=await x.workflow(),b=await x.workflow('S48');
 assert.equal(a.coordinatorTasks.candidates.length,4);assert.equal(a.sceneWorkbench.coordinatorTasks.candidates.length,3);assert.equal(b.sceneWorkbench.coordinatorTasks.candidates.length,1);
 assert.equal(b.sceneWorkbench.coordinatorTasks.candidates[0].unitId,'U002');assert.equal(b.sceneWorkbench.coordinatorTasks.warnings[0].unitId,'U004');
 assert.match(b.sceneWorkbench.coordinatorTasks.warnings[0].message,/other applicable issued authorization/);
 assert.equal(a.coordinatorTasks.historicalComparison.originalOpenReviewQuestions.length,13);
 assert.equal(a.coordinatorTasks.historicalComparison.clockedFindings.length,7);assert.equal(a.coordinatorTasks.historicalComparison.aiOffFindings.length,6);
 assert.equal(a.dossier.counts.completedModelChecks,8);assert.equal(a.actionQueue.byCategory.HUMAN,14);assert.equal(a.dossier.counts.currentReviewedTasks,0);
 assert.ok(a.coordinatorTasks.candidates.every(c=>c.status==='MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED'&&c.provenance==='OWNER_RECORDED_CLOCKED_EXTRACT'));
 assert.equal(x.calls(),0);
});
test('high general-consent model grant never transfers Scene 47 conditions or clears Scene 48',async t=>{
 const x=await fixture(t),w=await x.workflow('S48');
 const general=w.sceneWorkbench.tasks.find(t=>t.unitId==='U001');assert.ok(general.model.grant>0.8);
 assert.ok(w.sceneWorkbench.coordinatorTasks.candidates.every(c=>c.unitId==='U002'));
 assert.equal(w.sceneWorkbench.scene.notClearance,true);assert.equal(w.sceneWorkbench.coordinatorTasks.issuance,'UNKNOWN');
 assert.ok(w.sceneWorkbench.tasks.find(t=>t.unitId==='U004'));assert.ok(w.coordinatorTasks.historicalComparison.originalOpenReviewQuestions.some(f=>f.sceneId==='S48'&&f.quote?.includes('not issued')));
});
test('human suggestion review is versioned, scene-bound, survives reload, enters history and never resolves original work',async t=>{
 const x=await fixture(t),before=await x.workflow(),c=before.coordinatorTasks.candidates[1];
 const path='/api/workspaces/eval_archive/review-coordinator-suggestion';
 const input={expectedVersion:before.version,candidateId:c.id,sceneId:c.sceneId,reviewer:'Fictional coordinator',reason:'Read the boards requirement; still need an accountable site check.',attestedReview:true};
 assert.equal((await x.request(path,'POST',{...input,sceneId:'S48'})).status,422);
 assert.equal((await x.request(path,'POST',{...input,attestedReview:false})).status,422);
 assert.equal((await x.request(path,'POST',input)).status,200);
 assert.equal((await x.request(path,'POST',input)).status,409);
 const after=await x.workflow();assert.equal(after.version,before.version+1);
 const reviewed=after.coordinatorTasks.candidates.find(t=>t.id===c.id);assert.equal(reviewed.humanReview.reviewer,'Fictional coordinator');
 assert.equal(reviewed.status,'MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED');assert.equal(reviewed.issuance,'UNKNOWN');
 assert.equal(after.actionQueue.byCategory.HUMAN,before.actionQueue.byCategory.HUMAN);assert.equal(after.workspace.reviewActions.length,0);
 assert.equal(after.operations.conditions.length,0);assert.ok(after.history.records.some(r=>r.id.startsWith('suggestion-review:')));
 const persisted=await x.runtime.store.load('eval_archive');assert.equal(persisted.workspace.coordinatorTaskReviews.length,1);
});
test('source revision/reversal and swapped scene identities do not revive old suggestions or their reviews',async t=>{
 const x=await fixture(t),before=await x.workflow(),c=before.coordinatorTasks.candidates[0];
 await x.request('/api/workspaces/eval_archive/review-coordinator-suggestion','POST',{expectedVersion:before.version,candidateId:c.id,sceneId:c.sceneId,reviewer:'Test reviewer',reason:'Read; authenticity unverified.',attestedReview:true});
 const saved=await x.runtime.store.load('eval_archive'),w=structuredClone(saved.workspace),id=w.documents[0].id,text=w.documents[0].text;
 reviseDocument(w,id,text+'\nNew restriction.');reviseDocument(w,id,text);await x.runtime.store.persist(w,{expectedVersion:saved.version});
 const changed=await x.workflow();assert.equal(changed.coordinatorTasks.candidates.length,0);assert.equal(changed.coordinatorTasks.reviewHistory[0].sourceState,'HISTORICAL_SOURCE_CHANGED');
 assert.equal((await x.request('/api/workspaces/eval_archive/review-coordinator-suggestion','POST',{expectedVersion:changed.version,candidateId:c.id,sceneId:c.sceneId,reviewer:'Test',reason:'No stale reuse',attestedReview:true})).status,422);
 const swapped=createProduction({id:'swapped',title:'Fictional',documents:[{id:'permit',name:'permit',text}],callSheetText:bundle.sceneRows.map(row=>row.replace('Scene 47','Scene 49').replace('Scene 48','Scene 47')).join('\n')});
 assert.equal(projectCoordinatorTasks(swapped,{evidence}).candidates.length,0);
});
test('unchanged scene remains distinct when the other scene changes, no new automatic applicability',async t=>{
 const x=await fixture(t),saved=await x.runtime.store.load('eval_archive'),w=saved.workspace;
 setCallSheet(w,bundle.sceneRows[0]+'\n'+bundle.sceneRows[1]+' Corrected activity.');await x.runtime.store.persist(w,{expectedVersion:saved.version});
 const s=await x.workflow('S48');assert.ok(s.coordinatorTasks.candidates.every(c=>c.sceneId==='S47'));assert.equal(s.sceneWorkbench.coordinatorTasks.candidates.length,0);
});
test('JSON and markdown dossier include real response hashes, source offsets and review-only state',async t=>{
 const x=await fixture(t),s=await x.workflow();
 const saved=await x.runtime.store.load('eval_archive');
 const {planIntelligence}=await import('../src/intelligence-workflow.mjs');
 const modelEvidence=await x.runtime.execution.exportEvidence(planIntelligence(saved.workspace));
 const d=buildProductionDossier(saved.workspace,{persistedVersion:saved.version,asOf:s.asOf,modelEvidence,coordinatorEvidence:await recordedCoordinatorEvidence()});
 const md=dossierMarkdown(d);assert.match(md,/Source-grounded coordinator suggestions/);assert.match(md,/83222d1c35c473c2363a29fd546fb5ee5b68c12d1707e47cdc747b16b169a531/);
 assert.match(md,/permit \[333,350\)/);assert.match(md,/issuance UNKNOWN/);assert.equal(d.coordinatorTasks.candidates.length,4);
});
const emptyRoot={querySelector:()=>null,querySelectorAll:()=>[]};
test('actual controller navigates suggestions to exact original and back; URL reading position restores after refresh/back-forward',async t=>{
 const x=await fixture(t),fetchImpl=(url,options)=>fetch(x.base+url,options);
 const a=createWorkspaceController({fetchImpl,root:emptyRoot});await a.load();
 await a.click({dataset:{projectOpen:'eval_archive'}});await a.click({dataset:{sceneFocus:'S48'}});
 const scenePosition=workspaceLocation(a.model),candidate=a.model.coordinatorTasks.candidates.find(c=>c.sceneId==='S48');
 await a.click({dataset:{coordinatorSource:candidate.id}});const sourcePosition=workspaceLocation(a.model);
 assert.equal(a.model.focusUnitId,'U002');assert.match(a.render(),/Return to scene/);
 const b=createWorkspaceController({fetchImpl,root:emptyRoot});await b.load();assert.equal(await restoreWorkspaceLocation(b,sourcePosition),true);
 assert.equal(b.model.activeSceneId,'S48');assert.equal(b.model.sourceMode,'reader');assert.equal(b.model.focusUnitId,'U002');
 await restoreWorkspaceLocation(b,scenePosition);assert.equal(b.model.workflowStage,'review');assert.equal(b.model.activeSceneId,'S48');
 await restoreWorkspaceLocation(b,sourcePosition);assert.equal(b.model.workflowStage,'sources');
 await b.click({dataset:{designAction:'return-to-coordinator-scene'}});assert.equal(b.model.activeSceneId,'S48');assert.equal(b.model.workflowStage,'review');
 assert.equal(b.model.sceneWorkbench.coordinatorTasks.candidates.length,1);
});
test('scene task surface is escaped, source-linked, natural-language, and preserves all 13 baseline questions',async t=>{
 const x=await fixture(t),s=await x.workflow();const m={coordinatorTasks:s.coordinatorTasks,stagedReviews:[]};
 const html=coordinatorView(m,'S47');assert.match(html,/Confirm the on-site registrar remains present throughout the take/);
 assert.doesNotMatch(html,/presence of on-site registrar/);assert.match(html,/13 review questions at recording/);
 assert.match(html,/Previously recorded Clocked Extract/);assert.match(html,/data-coordinator-source=/);assert.match(html,/Needs human verification/);
 const bad=structuredClone(m);bad.coordinatorTasks.candidates[0].quote='<script>attack</script>';
 assert.ok(coordinatorView(bad,'S47').includes('&lt;script&gt;'));assert.ok(!coordinatorView(bad,'S47').includes('<script>'));
});
test('Evaluation reset restores suggestions and clears only disposable human reviews; provider routes remain disabled',async t=>{
 const x=await fixture(t),s=await x.workflow(),c=s.coordinatorTasks.candidates[0];
 await x.request('/api/workspaces/eval_archive/review-coordinator-suggestion','POST',{expectedVersion:s.version,candidateId:c.id,sceneId:c.sceneId,reviewer:'Test',reason:'Disposable review',attestedReview:true});
 assert.equal((await x.request('/api/evaluation/reset','POST',{})).status,200);
 const reset=await x.workflow();assert.equal(reset.coordinatorTasks.candidates.length,4);assert.equal(reset.coordinatorTasks.reviewHistory.length,0);assert.equal(reset.actionQueue.byCategory.HUMAN,14);
 assert.equal((await x.request('/api/extract','POST',{text:'fictional only'})).status,503);assert.equal(x.calls(),0);
});
test('new modules are explicitly served with CSP while receipt source files and credential files stay private',async t=>{
 const x=await fixture(t);
 for(const path of ['/workspace/coordinator-view.mjs','/workspace/navigation.mjs']){const r=await fetch(x.base+path);assert.equal(r.status,200);assert.ok(r.headers.get('Content-Security-Policy'));}
 for(const path of ['/.env','/fixtures/audit/U01_MATCHED_EXTRACT_OWNER_RECORDED_v1.json'])assert.equal((await fetch(x.base+path)).status,404);
 assert.equal((await x.request('/api/health')).data.liveEnabled,false);
});
test('comparison defaults follow validated U01 scene bindings in both directions and remain explicit reading selections',async t=>{
 const x=await fixture(t),controller=createWorkspaceController({fetchImpl:(u,o)=>fetch(x.base+u,o),root:emptyRoot});
 await controller.load();await controller.click({dataset:{projectOpen:'eval_archive'}});
 for(const scene of ['S48','S47']){
  await controller.click({dataset:{sceneFocus:scene}});await controller.click({dataset:{designAction:'comparison'}});
  const html=controller.render(),left=scene==='S48'?'U004':'U003',right=scene==='S48'?'U003':'U004';
  const leftSelect=html.split('id="design-compare-left"')[1].split('</select>')[0];
  const rightSelect=html.split('id="design-compare-right"')[1].split('</select>')[0];
  assert.match(leftSelect,new RegExp(`value="${left}" selected`));assert.match(rightSelect,new RegExp(`value="${right}" selected`));
  assert.match(html,/other applicable issued authorization/);assert.match(html,/Confirm protective boards/);
 }
});
test('unissued-warning review button opens exact Scene 48 U004 and does not mutate any human decision',async t=>{
 const x=await fixture(t),controller=createWorkspaceController({fetchImpl:(u,o)=>fetch(x.base+u,o),root:emptyRoot});
 await controller.load();await controller.click({dataset:{projectOpen:'eval_archive'}});await controller.click({dataset:{sceneFocus:'S48'}});
 const warning=controller.model.coordinatorTasks.warnings[0];
 await controller.click({dataset:{compareReviewScene:warning.sceneId,compareDocument:warning.documentId,compareUnit:warning.unitId,compareHash:warning.permitSha256}});
 const task=controller.model.sceneWorkbench.tasks.find(t=>t.id===controller.model.selectedTask);
 assert.equal(task.unitId,'U004');assert.equal(task.sceneId,'S48');assert.match(controller.render(),/not issued as a signed amendment/);
 assert.equal(controller.model.dossier.counts.currentReviewedTasks,0);
});
test('missing saved production is explicit and cannot silently select an unrelated workspace',async t=>{
 const x=await fixture(t),controller=createWorkspaceController({fetchImpl:(u,o)=>fetch(x.base+u,o),root:emptyRoot});await controller.load();
 await assert.rejects(restoreWorkspaceLocation(controller,'#br?p=missing&stage=review&s=S48'),/not available/);
 assert.equal(controller.model.selected,null);
});
test('forged suggestion review history cannot be treated as a human check',async t=>{
 const x=await fixture(t),saved=await x.runtime.store.load('eval_archive');
 saved.workspace.coordinatorTaskReviews=[{candidateId:'forged',decision:'SUGGESTION_REVIEWED_NOT_FULFILLMENT',notClearance:true,sha256:'0'.repeat(64)}];
 assert.throws(()=>projectCoordinatorTasks(saved.workspace,{evidence}),/integrity failed/);
});
