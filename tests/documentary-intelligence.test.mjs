/** No network. Recorded revalidation is distinct from controlled orchestration. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {decodeDocumentary,documentaryPayload,DOCUMENTARY_CONTRACT_SHA256} from '../src/documentary-intelligence.mjs';
import {createProduction,applySourceImport,reviseDocument} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {discoveryPlan,projectDiscovery,discoveryHash,assertDiscoveryFresh} from '../src/core-discovery.mjs';
import {createDiscoveryExecution} from '../src/discovery-execution.mjs';
import {recordCoordinatorSuggestionReview,projectCoordinatorTasks} from '../src/coordinator-tasks.mjs';
import {mergeDiscoverySuggestions} from '../src/core-discovery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const base=new URL('../verification/batch-b-last-light-20261027/',import.meta.url);
const packet=JSON.parse(await fs.readFile(new URL('fill-v6-freeze.json',base),'utf8'));
const samples=await Promise.all(packet.roles.map(async(g,i)=>({g,response:JSON.parse(await fs.readFile(new URL(`fill-v6-${i+1}-raw-response.bin`,base),'utf8'))})));
function decode(sample,change=()=>{}){const {g}=sample,d=packet.documents.find(d=>d.id===g.documentId),response=structuredClone(sample.response);change(response);return decodeDocumentary({payload:g.payload,response,document:d,unit:d.inventory[g.unitIndex],requestSha256:g.requestSha256,responseSha256:sha(JSON.stringify(response))});}
for(const [i,s] of samples.entries())test('genuine saved Fill revalidation '+(i+1)+' (not a fresh API call)',()=>{const d=decode(s);assert.equal(d.role,s.g.role);assert.deepEqual(d.sceneIds,s.g.sceneIds);assert.equal(d.actualIssuance,'UNVERIFIED');assert.equal(d.sourceHash,packet.documents.find(x=>x.id===s.g.documentId).sourceSha256);assert.equal(d.notClearance,true);});
for(const [name,change] of Object.entries({missing:r=>delete r.fields.scope_quote,extra:r=>r.fields.clearance={value:true},unknownRole:r=>r.fields.claimed_role.value='authenticated',generated:r=>r.fields.claim_quote.source='generated',wrongSpan:r=>r.fields.claim_quote.start++,nonfinite:r=>r.fields.claim_quote.confidence=2,foreignScene:r=>r.fields.scene_scope.value='S999',fakeQuote:r=>r.fields.referenced_instrument.value='invented consent',nativeImage:r=>r.mode='native_vision'}))test('strict Fill decoder rejects '+name,()=>assert.throws(()=>decode(samples[1],change)));
test('unissued quotation cannot support a claimed-issued classification',()=>assert.throws(()=>decode(samples[2],r=>r.fields.claimed_role.value='claims_issued_variation'),/CONTRADICTION/));
test('source/request integrity is required independently of semantic classification',()=>{const s=samples[0],d=packet.documents[1];assert.throws(()=>decodeDocumentary({payload:s.g.payload,response:s.response,unit:d.inventory[0],document:{...d,text:d.text+'x'},requestSha256:s.g.requestSha256,responseSha256:'a'.repeat(64)}),/SOURCE/);});
test('a valid quotation cannot be relabeled as another source unit',()=>{const s=samples[0],d=packet.documents.find(d=>d.id===s.g.documentId);assert.throws(()=>decodeDocumentary({payload:s.g.payload,response:s.response,unit:{...d.inventory[0],id:'U999'},document:d,requestSha256:s.g.requestSha256,responseSha256:'a'.repeat(64)}),/IDENTITY/);});
test('current contract exactly matches accepted v6 request and avoids independent NONE multiselect',()=>{assert.equal(packet.fillContract,DOCUMENTARY_CONTRACT_SHA256);for(const s of samples)assert.deepEqual(documentaryPayload(s.g.payload.text,packet.scenes),s.g.payload);assert.equal(samples[0].g.payload.fields.scene_scope.type,'choice');});
test('all six frozen two-endpoint projections remain byte-structure compatible with their archived dossiers',async()=>{for(const id of ['A_DOCK','B_GALLERY','C_ORCHARD','D_ROAD','E_PRESENT_PHOTO','F_COLLECTION']){const root=new URL('../verification/clocked-live-20261027/'+id+'/',import.meta.url),w=JSON.parse(await fs.readFile(new URL('post-repair/workflow.json',root),'utf8')),d=JSON.parse(await fs.readFile(new URL('post-repair/dossier.json',root),'utf8')),raw=JSON.parse(await fs.readFile(new URL('raw-evidence.json',root),'utf8'));assert.deepEqual(projectDiscovery(w.workspace,raw.jobs),d.coordinatorTasks.discovery,id);}});
test('preserved real browser run after generic repairs: six prerequisites, two distinct investigations, no transferred or false duties',async()=>{
 const before=JSON.parse(await fs.readFile(new URL('initial-browser-run-workflow.json',base),'utf8')),raw=JSON.parse(await fs.readFile(new URL('initial-browser-run-evidence.json',base),'utf8'));
 const p=projectDiscovery(before.workspace,raw.jobs),facts=p.candidates.filter(c=>!c.documentaryRecord);
 assert.equal(facts.length,6);for(const e of packet.expectedPrerequisites)assert(facts.some(c=>c.sceneId===e[0]&&c.field===e[1]&&c.quote===e[2]));
 assert.equal(p.candidates.filter(c=>c.documentaryRecord).length,2);assert.equal(p.jobs[0].quarantinedRequirements.length,1);assert.equal(p.jobs[0].quarantinedRequirements[0].fact.quote,'Consent Schedule CS-9');
 assert.equal(p.jobs[0].coverage.assessed,14);assert.equal(p.jobs[0].documentaryCoverage.acceptedUnits,5);assert.equal(before.workspace.sceneAuthority.length,0);assert.equal(before.workspace.conditionDecisions.length,0);
});
function workspace(){const w=createProduction({id:'offline_last_light',title:'Fictional controlled Last Light',callSheetText:packet.callSheet});for(const d of packet.documents)applySourceImport(w,inspectImport({kind:'permit',name:d.name,text:d.text}),{documentId:d.id});return w;}
const selection={documentIds:packet.documents.map(d=>d.id),sceneIds:packet.scenes.map(s=>s.id),verifiedBy:'Fictional offline reviewer',sourceConfirmed:true,maxCalls:80,creditBudget:1024,creditReservePerCall:16,includeDocumentary:true};
function controlled(body,url){
 if(url.endsWith('/decide')){const scene=body.state.split('PROPOSED SCENE')[1],q=body.state.split('EXACT PASSAGE')[1].split('NEIGHBOR CONTEXT')[0];return {model:'CONTROLLED_NOT_CLOCKED',answers:{activity_link:{type:'noul',noul:q.includes('venue duty officer')||scene.includes('Scene 31')&&q.includes('Direct manipulation')?0.95:0.05},granted_for_scene:{type:'noul',noul:0.99}}};}
 if(url.endsWith('/extract')){const fields=Object.fromEntries(['required_written_documents','required_physical_protections','required_on_site_personnel'].map(field=>{const phrases=[...new Set(packet.expectedPrerequisites.filter(e=>e[1]===field&&body.text.includes(e[2])).map(e=>e[2]))],items=phrases.map(value=>({value,start:Array.from(body.text.slice(0,body.text.indexOf(value))).length,end:Array.from(body.text.slice(0,body.text.indexOf(value)+value.length)).length,confidence:0.99}));return [field,{value:phrases,items,confidence:0.99}];}));return {model:'CONTROLLED_NOT_CLOCKED',fields};}
 const s=samples.find(s=>s.g.payload.text===body.text);if(s)return {...structuredClone(s.response),model:'CONTROLLED_REPLAY_NOT_FRESH_CLOCKED'};
 const read={value:body.text,start:0,end:Array.from(body.text).length,confidence:0.99};return {model:'CONTROLLED_NOT_CLOCKED',fields:{claimed_role:{value:'current_condition'},claim_quote:read,referenced_instrument:{value:null},scope_quote:read,scene_scope:{value:'all_selected_scenes'}}};
}
test('opt-in Fill has its own fingerprint, reserves full units, and original two-endpoint plan stays compatible',()=>{const w=workspace(),a=discoveryPlan(w,{...selection,includeDocumentary:false}),b=discoveryPlan(w,selection);assert.notEqual(a.id,b.id);assert.equal(a.fills,undefined);assert.equal(b.maxFillCalls,5);assert.equal(b.worstCaseCalls,26);assert.equal(b.tasks.length,14);assertDiscoveryFresh(w,b);});
test('controlled complete journal, documentary tasks, review, retirement and strict archive tamper checks',async t=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-fill-test-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const w=workspace(),p=discoveryPlan(w,selection),x=createDiscoveryExecution({directory:dir}),calls=[];
 const job=await x.run({workspace:w,plan:p,apiKey:'CONTROLLED_TEST_KEY',operatorAuthorized:true,controlledTest:true,checkFresh:async()=>w,beforeCall:async()=>{},fetchImpl:async(url,o)=>{calls.push(url);return new Response(JSON.stringify(controlled(JSON.parse(o.body),url)),{headers:{'x-clocked-credits':'1'}});}});
 assert.equal(job.state,'COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY');x.validate(job);assert.equal(calls.filter(x=>x.endsWith('/fill')).length,5);
 const projection=projectDiscovery(w,[job]),investigations=projection.candidates.filter(c=>c.documentaryRecord);assert.equal(investigations.length,2);assert.deepEqual(investigations.map(c=>[c.sceneId,c.documentaryRecord.role]),[['S31','claims_issued_variation'],['S32','request_only']]);
 const merged=mergeDiscoverySuggestions(w,projectCoordinatorTasks(w),projection);recordCoordinatorSuggestionReview(w,merged,{candidateId:investigations[1].id,sceneId:'S32',reviewer:'Offline fictional reviewer',reason:'Investigate request; no fulfillment or authority.',attestedReview:true});assert.equal(w.sceneAuthority.length,0);assert.equal(w.conditionDecisions.length,0);
 const broken=structuredClone(job);broken.entries=broken.entries.filter(e=>e.kind!=='fill');delete broken.sha256;broken.sha256=discoveryHash(broken);assert.throws(()=>x.validate(broken),/completion/);
 reviseDocument(w,'LENDER',w.documents.find(d=>d.id==='LENDER').text+'\nA changed reference.');assert.equal(projectDiscovery(w,[job]).candidates.length,0);assert.equal(projectDiscovery(w,[job]).jobs[0].current,false);
});
