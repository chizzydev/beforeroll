/** OFFLINE CONTROLLED TRANSPORT TESTS. These are not Clocked evaluation results. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createProduction,applySourceImport,reviseDocument,setCallSheet} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createDiscoveryExecution} from '../src/discovery-execution.mjs';
import {discoveryPlan,assertDiscoveryFresh,projectDiscovery,EXTRACT_CONTRACT_SHA256,discoveryHash,scopeCaution} from '../src/core-discovery.mjs';
import {LITERAL_FIELDS,literalHash} from '../src/literal-requirements.mjs';
import {buildProductionDossier,dossierMarkdown} from '../src/production-dossier.mjs';
import {recordCoordinatorSuggestionReview} from '../src/coordinator-tasks.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from '../src/production-lifecycle.mjs';
import {createAppServer} from '../server.mjs';
import {makeEvaluationRuntime} from '../src/evaluation-mode.mjs';
import {analysisView} from '../public/workspace/analysis-view.mjs';
import {coordinatorView} from '../public/workspace/coordinator-view.mjs';
import {buildProductionJourney} from '../src/production-journey.mjs';
import {spawn} from 'node:child_process';
const permit=[
 'For all overhead transit, a signed municipal access release is required.',
 'Scene 91 overhead transit requires written rigging consent.',
 'Scene 91 overhead transit must use deck mats and tether sleeves with an on-site hoist marshal throughout the take. 🎬',
 'Scene 92 proposes extending Scene 91 safeguards; an unsigned request names a pilot supervisor.',
 'A historical photograph shows the old crew with a ladder steward.',
 'Visitor café opens at noon.',
 'Ventilation protocol awaits clarification.'
].join('\n\n');
const call='Scene 91 | Dock | 08:00-09:00 | overhead transit\nScene 92 | Dock | 09:00-10:00 | floating jib sweep';
const file={kind:'permit',name:'fictional-transit.txt',text:permit};
const selection={documentIds:['PERMIT_TRANSIT'],sceneIds:['S91','S92'],sourceConfirmed:true,verifiedBy:'Fictional coordinator',maxCalls:64,creditBudget:256,creditReservePerCall:4};
function workspace(){const w=createProduction({id:'fresh_transit',title:'Fictional Transit',callSheetText:call});applySourceImport(w,inspectImport(file),{documentId:'PERMIT_TRANSIT'});return w;}
function literalResponse(text){
 const phrases={required_written_documents:['signed municipal access release','written rigging consent'],required_physical_protections:['deck mats','tether sleeves'],required_on_site_personnel:['on-site hoist marshal','pilot supervisor','ladder steward']};
 return {model:'CONTROLLED_FAKE_NOT_CLOCKED',usage:{synthetic:true},fields:Object.fromEntries(LITERAL_FIELDS.map(k=>{const items=phrases[k].filter(q=>text.includes(q)).map(value=>({value,start:Array.from(text.slice(0,text.indexOf(value))).length,end:Array.from(text.slice(0,text.indexOf(value)+value.length)).length,confidence:0.95,p_verify:0.95}));return [k,{value:items.map(x=>x.value),items,confidence:0.95}];}))};
}
function fakeTransport({change=()=>{},before=async()=>{},credits='1',status=200}={}){
 const calls=[];const fetchImpl=async(url,opts)=>{const body=JSON.parse(opts.body);calls.push({url,body,opts});await before(calls.length,body,url);
  let result;if(url.endsWith('/decide')){const exact=/EXACT PASSAGE [^\n]+\n([\s\S]*?)\n\nNEIGHBOR/.exec(body.state)?.[1]??body.state;const relevance=exact.includes('café')?0.1:exact.includes('Ventilation')?0.5:0.95;
   result={model:'CONTROLLED_FAKE_NOT_CLOCKED',answers:{activity_link:{type:'noul',noul:relevance},granted_for_scene:{type:'noul',noul:0.99}}};
  }else result=literalResponse(body.text);
  change(result,body,url,calls.length);
  return new Response(JSON.stringify(result),{status,headers:{...(credits!==null?{'x-clocked-credits':credits}:{}),'content-type':'application/json'}});
 };return {calls,fetchImpl};
}
async function setup(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-discovery-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const w=workspace(),execution=createDiscoveryExecution({directory:dir});return {dir,w,execution,plan:discoveryPlan(w,selection)};}
async function run(f,transport,extra={}){return f.execution.run({workspace:f.w,plan:f.plan,apiKey:'OFFLINE_TEST_KEY_ONLY',operatorAuthorized:true,controlledTest:true,fetchImpl:transport.fetchImpl,checkFresh:async()=>f.w,beforeCall:async()=>{},...extra});}
async function httpFixture(t,opts={}){
 const f=await setup(t),store=createWorkspaceStore({directory:f.dir}),vault=createSourceOriginalVault({directory:f.dir});
 await vault.storeImport(file,inspectImport(file));await store.persist(f.w,{expectedVersion:0});
 const transport=fakeTransport(opts),server=createAppServer({workspaceStore:store,sourceVault:vault,enabled:true,apiKey:'OFFLINE_TEST_KEY_ONLY',operatorToken:'OFFLINE_OPERATOR',controlledTestMode:true,fetchImpl:transport.fetchImpl,...opts.server});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const base='http://127.0.0.1:'+server.address().port;
 const request=async(route,method='GET',body=null,headers={})=>{const resp=await fetch(base+'/api/workspaces/fresh_transit/'+route,{method,headers:{...(body?{'content-type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:resp.status,data:await resp.json()};};
 const authorize=async()=>{const input={...selection,expectedVersion:1};const preview=await request('discovery/preview','POST',input);assert.equal(preview.status,200,JSON.stringify(preview));const started=await request('discovery/run','POST',{...input,previewSha256:preview.data.previewSha256,confirm:'RUN_CORE_DISCOVERY',acceptBillingUncertainty:true},{'x-operator-token':'OFFLINE_OPERATOR'});assert.equal(started.status,202,JSON.stringify(started));
  for(let i=0;i<200;i++){const jobs=await f.execution.list(f.w.id);if(jobs[0]?.state!=='RUNNING')return jobs[0];await new Promise(r=>setTimeout(r,10));}throw Error('Controlled job did not finish');};
 return {...f,store,vault,server,transport,request,authorize};
}
test('complete source inventory needs no known terms or selected clauses; budget and source identity gates',()=>{
 const w=workspace(),p=discoveryPlan(w,selection);assert.equal(p.tasks.length,w.documents[0].units.length*2);assert.equal(p.maxExtractCalls,w.documents[0].units.length);assert.equal(p.concurrency,1);
 assert.ok(p.tasks.some(t=>t.sourceQuote.includes('café')));assert.ok(p.tasks.some(t=>t.sourceQuote.includes('historical')));
 for(const patch of [{sourceConfirmed:false},{verifiedBy:''},{sceneIds:['S47']},{documentIds:[]},{maxCalls:1},{creditBudget:1},{maxCalls:129},{creditReservePerCall:NaN}])assert.throws(()=>discoveryPlan(w,{...selection,...patch}));
 delete w.documents[0].importReceipt;assert.throws(()=>discoveryPlan(w,selection),/original/);
});
test('uniform Extract specification is byte-equivalent to accepted recorded request fields and instructions',async()=>{
 const bundle=JSON.parse(await fs.readFile(new URL('../fixtures/audit/U01_MATCHED_EXTRACT_OWNER_RECORDED_v1.json',import.meta.url)));
 const request=JSON.parse(Buffer.from(bundle.records[0].files['request.body.json'],'base64'));delete request.text;assert.equal(discoveryHash(request),EXTRACT_CONTRACT_SHA256);
});
test('controlled full job retains every pair, quarantines proposal/history/other-scene and yields distinct exact tasks',async t=>{
 const f=await setup(t),transport=fakeTransport(),job=await run(f,transport),p=projectDiscovery(f.w,[job]);
 assert.equal(job.state,'COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY');assert.equal(p.candidates.filter(c=>c.sceneId==='S91').length,5);assert.equal(p.candidates.filter(c=>c.sceneId==='S92').length,1);
 assert.equal(p.jobs[0].coverage.unassessed,0);assert.equal(p.jobs[0].coverage.ambiguous,2);
 assert.ok(p.jobs[0].pairs.some(x=>x.scopeCaution?.includes('NARRATIVE')));
 for(const c of p.candidates){assert.equal(Array.from(permit).slice(...c.permitRange).join(''),c.quote);assert.equal(c.provenance,'CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED');assert.equal(c.issuance,'UNKNOWN');assert.equal(c.fulfillment,'UNVERIFIED');assert.equal(c.notClearance,true);}
 assert.equal(p.jobs[0].comparison.aiOffLiteralTaskCount,0);assert.equal(p.jobs[0].comparison.modelDerivedTaskCount,6);
 assert.equal(p.jobs[0].reportedCredits,transport.calls.length);
 assert.equal(transport.calls.filter(c=>c.url.endsWith('/extract')).length,5); // once/unit, not once/scene
 assert.equal(f.w.reviewActions.length,0);assert.equal(f.w.sceneAuthority.length,0);assert.equal(f.w.conditions.length,0);
 const saved=await createDiscoveryExecution({directory:f.dir}).read(f.w.id,f.plan.id);assert.deepEqual(saved,job);
 for(const e of job.entries){assert.equal(literalHash(Buffer.from(e.responseBase64,'base64')),e.receipt.responseSha256);assert.equal(e.receipt.httpStatus,200);assert.ok(e.receipt.latencyMs>=0);assert.equal(e.receipt.model,'CONTROLLED_FAKE_NOT_CLOCKED');}
 assert.equal(new Set(job.entries.map(e=>e.idempotencyKey)).size,job.entries.length);
 await assert.rejects(run(f,transport),/permanent/);assert.equal(transport.calls.length,job.entries.length);
});
for(const [name,options,reason] of [
 ['quota rejection',{status:429},'PROVIDER_HTTP_429'],
 ['schema rejection',{status:422},'PROVIDER_HTTP_422'],
 ['unknown credits',{credits:null},'UNKNOWN_REPORTED_CREDITS'],
 ['over-reserve credits',{credits:'5'},'REPORTED_CREDITS_EXCEED_RESERVE'],
 ['malformed typed answer',{change:r=>{delete r.answers;}},'INVALID_DECIDE_RESPONSE'],
 ['transport lost',{before:async()=>{throw Error('DO NOT STORE THIS TEXT');}},'TRANSPORT_FAILED_OUTCOME_OR_BILLING_UNKNOWN']
])test(name+' durably stops and cannot retry',async t=>{const f=await setup(t),tr=fakeTransport(options),j=await run(f,tr);assert.equal(j.state,'STOPPED_INCOMPLETE');assert.equal(j.stopReason,reason);assert.equal(tr.calls.length,1);assert.ok(projectDiscovery(f.w,[j]).jobs[0].coverage.unassessed>0);await assert.rejects(run(f,tr),/permanent/);assert.equal(tr.calls.length,1);assert.doesNotMatch(JSON.stringify(j),/DO NOT STORE THIS TEXT/);});
for(const [name,change] of Object.entries({
 'wrong offsets':r=>{r.fields.required_written_documents.items[0].end++;},
 'unknown categories':r=>{r.fields.extra={value:[],items:[],confidence:1};},
 'wrong arrays':r=>{r.fields.required_written_documents.value='release';},
 'invented quote':r=>{r.fields.required_written_documents.items[0].value='invented';},
 'invalid JSON shape':r=>{delete r.fields;}
}))test(name+' rejects Extract and stops subsequent units',async t=>{const f=await setup(t),tr=fakeTransport({change:(r,b,url)=>{if(url.endsWith('/extract'))change(r);}}),j=await run(f,tr);assert.equal(j.stopReason,'INVALID_EXTRACT_RESPONSE');assert.equal(j.entries.filter(e=>e.kind==='extract').length,1);assert.equal(projectDiscovery(f.w,[j]).candidates.length,0);});
test('empty Extract arrays leave relevant source checks visible with no inferred tasks or permission',async t=>{const f=await setup(t),tr=fakeTransport({change:(r,b,url)=>{if(url.endsWith('/extract'))r.fields=literalResponse('').fields;}}),j=await run(f,tr),p=projectDiscovery(f.w,[j]);assert.equal(p.candidates.length,0);assert.equal(p.jobs[0].coverage.unassessed,0);assert.ok(p.jobs[0].coverage.relevant>0);});
test('returned Decide coverage cannot disguise a failed Extract as a successful analysis journey',async t=>{const f=await setup(t),j=await run(f,fakeTransport({change:(r,b,url)=>{if(url.endsWith('/extract'))delete r.fields;}}));
 const d=buildProductionDossier(f.w,{persistedVersion:1,asOf:'2026-10-27T12:00:00.000Z',discoveryJournals:[j]});assert.equal(d.counts.effectiveUnassessedChecks,0);assert.equal(d.counts.discoveryIncompleteRuns,1);assert.ok(d.outstanding.some(x=>x.code==='DISCOVERY_EXECUTION_INCOMPLETE'));assert.equal(buildProductionJourney(d).checkpoints.find(x=>x.id==='analysis').status,'STOPPED');});
test('intent is durable before transport; cancellation waits for in-flight request then stops',async t=>{
 const f=await setup(t),tr=fakeTransport({before:async()=>{const j=await f.execution.read(f.w.id,f.plan.id);assert.equal(j.entries.at(-1).status,'IN_FLIGHT');await f.execution.stop(f.w.id,f.plan.id);}}),j=await run(f,tr);assert.equal(j.stopReason,'OWNER_CANCELLED');assert.equal(j.entries.length,1);assert.equal(j.entries[0].status,'ACCEPTED');
});
test('source replacement during dispatch stops; A to B to A cannot resurrect old candidates',async t=>{
 const f=await setup(t),tr=fakeTransport({before:async()=>reviseDocument(f.w,'PERMIT_TRANSIT',permit+'\n\nNo vehicles.')}),j=await run(f,tr);assert.equal(j.state,'STOPPED_INCOMPLETE');assert.equal(tr.calls.length,1);assert.equal(projectDiscovery(f.w,[j]).candidates.length,0);reviseDocument(f.w,'PERMIT_TRANSIT',permit);assert.throws(()=>assertDiscoveryFresh(f.w,f.plan));
});
test('scene activity changes invalidate candidates and source-bound suggestion review cannot close authority',async t=>{
 const f=await setup(t),j=await run(f,fakeTransport());const d=buildProductionDossier(f.w,{persistedVersion:1,asOf:'2026-10-27T12:00:00.000Z',discoveryJournals:[j]}),c=d.coordinatorTasks.candidates[0];
 assert.throws(()=>recordCoordinatorSuggestionReview(f.w,d.coordinatorTasks,{candidateId:c.id,sceneId:'S92',reviewer:'A',reason:'checked',attestedReview:true}));
 recordCoordinatorSuggestionReview(f.w,d.coordinatorTasks,{candidateId:c.id,sceneId:c.sceneId,reviewer:'A',reason:'Need issued original and scope',attestedReview:true});
 let next=buildProductionDossier(f.w,{persistedVersion:2,asOf:'2026-10-27T12:00:00.000Z',discoveryJournals:[j]});assert.equal(next.coordinatorTasks.candidates[0].humanReview.reviewer,'A');assert.equal(f.w.reviewActions.length,0);assert.equal(f.w.conditions.length,0);
 setCallSheet(f.w,call.replace('overhead transit','different activity'));next=buildProductionDossier(f.w,{persistedVersion:3,asOf:'2026-10-27T12:00:00.000Z',discoveryJournals:[j]});assert.equal(next.coordinatorTasks.candidates.length,0);assert.equal(next.coordinatorTasks.reviewHistory[0].sourceState,'HISTORICAL_SOURCE_CHANGED');assert.match(dossierMarkdown(next),/HISTORICAL suggestion/);
});
test('corrupt journal response is rejected before projection; credential echoes are sealed and halt',async t=>{
 const f=await setup(t),tr=fakeTransport({change:r=>{r.echo='OFFLINE_TEST_KEY_ONLY';}}),j=await run(f,tr);assert.equal(j.entries[0].receipt.sealed,true);assert.equal(j.entries[0].status,'BILLING_UNKNOWN');assert.equal(projectDiscovery(f.w,[j]).candidates.length,0);assert.doesNotMatch(JSON.stringify(j),/OFFLINE_TEST_KEY_ONLY/);
 const bad=structuredClone(j);bad.entries[0].responseBase64='YmFk';assert.throws(()=>f.execution.validate(bad),/checksum/);
});
test('explicit scope fence handles alphanumeric scene identities and mixed scenes conservatively',()=>{assert.equal(scopeCaution('Scene X9 requires padded skates.','SX9'),null);assert.match(scopeCaution('Scene X9 requires padded skates.','SX8'),/OTHER/);assert.match(scopeCaution('Scene X8 and Scene X9 require padded skates.','SX8'),/MIXED/);});
test('actual server preview is unbilled, guarded execution drives atomic dossier/history/exports and review',async t=>{
 const f=await httpFixture(t);let r=await f.request('discovery/preview','POST',{...selection,expectedVersion:1});assert.equal(r.status,200);assert.equal(f.transport.calls.length,0);
 r=await f.request('discovery/run','POST',{...selection,expectedVersion:1});assert.equal(r.status,401);assert.equal(f.transport.calls.length,0);
 r=await f.request('discovery/run','POST',{...selection,expectedVersion:1,confirm:'RUN_CORE_DISCOVERY',acceptBillingUncertainty:true,previewSha256:'bad'},{'x-operator-token':'OFFLINE_OPERATOR'});assert.equal(r.status,422);
 const job=await f.authorize();assert.equal(job.state,'COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY',job.stopReason);r=await f.request('workflow?sceneId=S91');assert.equal(r.status,200,r.data.error);assert.equal(r.data.coordinatorTasks.candidates.length,6);assert.equal(r.data.sceneWorkbench.coordinatorTasks.candidates.length,5);
 assert.ok(r.data.history.records.some(x=>x.id.startsWith('discovery:')));assert.equal(r.data.dossier.sha256,r.data.dossierSha256);
 const c=r.data.coordinatorTasks.candidates[0];r=await f.request('review-coordinator-suggestion','POST',{expectedVersion:1,candidateId:c.id,sceneId:c.sceneId,reviewer:'Fictional coordinator',reason:'Documentary follow-up required',attestedReview:true});assert.equal(r.status,200);
 r=await f.request('workflow?sceneId=S91');assert.equal(r.data.coordinatorTasks.candidates.find(x=>x.id===c.id).humanReview.reviewer,'Fictional coordinator');assert.equal(r.data.workspace.reviewActions.length,0);
 r=await f.request('discovery/evidence');assert.equal(r.data.jobs.length,1);assert.equal(r.data.jobs[0].origin,'CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED');assert.equal(r.data.jobs[0].entries.length,f.transport.calls.length);
});
test('server refuses missing live configuration, stale preview, missing custody and insufficient hourly allowance',async t=>{
 const f=await httpFixture(t,{server:{enabled:false}});const input={...selection,expectedVersion:1};const p=await f.request('discovery/preview','POST',input);
 const r=await f.request('discovery/run','POST',{...input,previewSha256:p.data.previewSha256,confirm:'RUN_CORE_DISCOVERY',acceptBillingUncertainty:true},{'x-operator-token':'OFFLINE_OPERATOR'});assert.equal(r.status,503);
 assert.equal((await f.request('discovery/preview','POST',{...input,expectedVersion:9})).status,409);assert.equal(f.transport.calls.length,0);
});
test('server quota preflight makes zero attempts rather than truncating scope silently',async t=>{const f=await httpFixture(t,{server:{maxCallsPerHour:8}}),input={...selection,expectedVersion:1},p=await f.request('discovery/preview','POST',input),r=await f.request('discovery/run','POST',{...input,previewSha256:p.data.previewSha256,confirm:'RUN_CORE_DISCOVERY',acceptBillingUncertainty:true},{'x-operator-token':'OFFLINE_OPERATOR'});assert.equal(r.status,429);assert.equal(f.transport.calls.length,0);});
test('lifecycle backup and separate-workspace recovery preserve discovery raw evidence and permanent fences',async t=>{
 const f=await setup(t),j=await run(f,fakeTransport()),store=createWorkspaceStore({directory:f.dir}),saved=await store.persist(f.w,{expectedVersion:0}),legacy=createDurableExecution({directory:f.dir});
 const bundle=await createLifecycleBackup(saved,legacy);assert.equal(bundle.discoveryJournals[0].sha256,j.sha256);verifyLifecycleBackup(bundle,legacy);
 const target=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-discovery-recovered-'));t.after(()=>fs.rm(target,{recursive:true,force:true}));const targetExecution=createDurableExecution({directory:target});
 await restoreLifecycleBackup(bundle,{workspaceStore:createWorkspaceStore({directory:target}),execution:targetExecution,ownerConfirmed:true});const d=createDiscoveryExecution({directory:target});assert.deepEqual(await d.read(f.w.id,f.plan.id),j);await assert.rejects(d.run({workspace:f.w,plan:f.plan,operatorAuthorized:true,apiKey:'OFFLINE_ONLY',controlledTest:true,fetchImpl:async()=>{throw Error('MUST_NOT_DISPATCH');},checkFresh:async()=>f.w,beforeCall:async()=>{}}),/permanent/);
});
test('Evaluation rejects all discovery mutations with zero provider requests and states whole-run replay limitation',async t=>{
 const runtime=await makeEvaluationRuntime();t.after(()=>runtime.dispose());let calls=0;const server=createAppServer({evaluationMode:true,evaluationRuntime:runtime,workspaceStore:runtime.store,enabled:true,apiKey:'OFFLINE_ONLY',operatorToken:'OFFLINE_ONLY',fetchImpl:async()=>{calls++;throw Error('NEVER');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 for(const action of ['preview','run','stop']){const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/workspaces/eval_archive/discovery/'+action,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(r.status,403);assert.match((await r.json()).error,/No fresh/);}
 const html=analysisView({evaluationMode:true});assert.match(html,/No complete generalized discovery run/);assert.doesNotMatch(html,/id="project-discovery-run"/);assert.equal(calls,0);
});
test('new coordinator cards never acquire historical U01 or Scene 47 labels from generic unit IDs',async t=>{const f=await setup(t),j=await run(f,fakeTransport()),d=buildProductionDossier(f.w,{persistedVersion:1,asOf:'2026-10-27T12:00:00.000Z',discoveryJournals:[j]}),html=coordinatorView({coordinatorTasks:d.coordinatorTasks});assert.match(html,/CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED/);assert.doesNotMatch(html,/Scene 47 addendum only|OWNER_RECORDED_CLOCKED_EXTRACT · not a new/);});
test('raw malformed JSON and broken response streams retain received bytes and never continue',async t=>{
 for(const brokenStream of [false,true]){
  const f=await setup(t),raw=Buffer.from('{partial response');let calls=0;
  const j=await run(f,{fetchImpl:async()=>{calls++;return brokenStream?new Response(new ReadableStream({start(c){c.enqueue(raw);},pull(){throw Error('stream lost');}}),{headers:{'x-clocked-credits':'1'}}):new Response(raw,{headers:{'x-clocked-credits':'1'}});}});
  assert.equal(calls,1);assert.equal(Buffer.from(j.entries[0].responseBase64,'base64').toString(),raw.toString());assert.equal(projectDiscovery(f.w,[j]).candidates.length,0);assert.equal(j.state,'STOPPED_INCOMPLETE');
 }
});
test('nonzero document and scene epochs validate after restart without restoring prior source evidence',async t=>{
 const f=await setup(t);setCallSheet(f.w,call.replace('overhead transit','different lifting activity'));
 const revisedFile={...file,text:permit+'\n\nNo drones.'};applySourceImport(f.w,inspectImport(revisedFile),{documentId:'PERMIT_TRANSIT'});
 f.plan=discoveryPlan(f.w,selection);const j=await run(f,fakeTransport());assert.equal(j.state,'COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY');assert.equal((await f.execution.read(f.w.id,f.plan.id)).sha256,j.sha256);
});
test('legacy project execution cannot bypass a discovery unknown-outcome fence',async t=>{const f=await httpFixture(t,{before:async()=>{throw Error('uncertain');}});await f.authorize();const r=await f.request('execution','POST',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:1},{'x-operator-token':'OFFLINE_OPERATOR'});assert.equal(r.status,409);assert.equal(f.transport.calls.length,1);});
test('shared legacy execution lock prevents discovery dispatch',async t=>{const f=await setup(t);await fs.mkdir(path.join(f.dir,'.clocked-execution'));await fs.writeFile(path.join(f.dir,'.clocked-execution',f.w.id+'.lock'),'stranded fictional lock');const tr=fakeTransport();await assert.rejects(run(f,tr),/lock exists/);assert.equal(tr.calls.length,0);});
test('changing selected scenes cannot bypass an uncertain request fence',async t=>{const f=await setup(t);f.plan=discoveryPlan(f.w,{...selection,sceneIds:['S91']});const tr=fakeTransport({before:async()=>{throw Error('uncertain');}});await run(f,tr);f.plan=discoveryPlan(f.w,selection);await assert.rejects(run(f,tr),/permanent/);assert.equal(tr.calls.length,1);});
test('recomputed checksum cannot disguise incomplete discovery as completed or change a source-bound request',async t=>{const f=await setup(t),j=await run(f,fakeTransport());
 const incomplete=structuredClone(j);incomplete.entries.pop();delete incomplete.sha256;incomplete.sha256=discoveryHash(incomplete);assert.throws(()=>f.execution.validate(incomplete),/completion accounting/);
 const changed=structuredClone(j);changed.plan.tasks[0].payload.state='different source';delete changed.sha256;changed.sha256=discoveryHash(changed);assert.throws(()=>f.execution.validate(changed),/STALE_SOURCE_OR_SCENE/);
});
test('missing original custody and owner authentication fail before preview or dispatch',async t=>{
 const f=await httpFixture(t);const bytes=await fs.readdir(f.vault.directory);for(const name of bytes)await fs.unlink(path.join(f.vault.directory,name));const r=await f.request('discovery/preview','POST',{...selection,expectedVersion:1});assert.equal(r.status,422);assert.equal(f.transport.calls.length,0);
 const guarded=await httpFixture(t,{server:{ownerToken:'FictionalOwnerToken_0123456789_0123456789'}});assert.equal((await guarded.request('discovery')).status,401);assert.equal((await guarded.request('discovery/preview','POST',{...selection,expectedVersion:1})).status,401);
});
test('owner cold-run client prepares unbilled then runs exclusively through guarded app handlers with fake transport',async t=>{
 const f=await httpFixture(t),permitPath=path.join(f.dir,'fresh.txt'),callSheetPath=path.join(f.dir,'call.txt'),out=path.join(f.dir,'private-cold-run');await fs.writeFile(permitPath,permit);await fs.writeFile(callSheetPath,call);
 const invoke=input=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/clocked-core-owner.mjs'],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('exit',code=>resolve({code,stdout,stderr}));child.stdin.end(JSON.stringify(input));});
 const input={baseUrl:'http://127.0.0.1:'+f.server.address().port,productionId:'cold_owner_fictional',permitPath,callSheetPath,reviewer:'Offline coordinator',evidenceDirectory:out,sourceIdentityVerified:true,ownerToken:'OFFLINE_ONLY'};
 let r=await invoke(input);assert.equal(r.code,0,r.stderr);assert.match(r.stdout,/PREPARED_ONLY/);assert.equal(f.transport.calls.length,0);
 r=await invoke({...input,authorizeLive:true,approvalPath:path.join(out,'approval.json'),operatorToken:'OFFLINE_OPERATOR'});assert.equal(r.code,0,r.stderr);assert.match(r.stdout,/PENDING_OWNER_REVIEW/);
 const evidence=JSON.parse(await fs.readFile(path.join(out,'discovery-evidence.json')));assert.equal(evidence.jobs[0].origin,'CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED');assert.equal(evidence.jobs[0].entries.length,19);
 const calls=f.transport.calls.length;r=await invoke({...input,authorizeLive:true,approvalPath:path.join(out,'approval.json'),operatorToken:'OFFLINE_OPERATOR'});assert.equal(r.code,1);assert.equal(f.transport.calls.length,calls);
});
