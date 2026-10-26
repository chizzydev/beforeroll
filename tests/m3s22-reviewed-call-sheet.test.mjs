import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {inspectReviewedCallSheet,verifyReviewedCallSheetReceipt} from '../src/reviewed-call-sheet.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {createProduction,applySourceImport,exportWorkspace,importWorkspace,assertWorkspaceSources,setCallSheet} from '../src/production-workspace.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from '../src/production-lifecycle.mjs';
import {buildProductionDossier,dossierMarkdown} from '../src/production-dossier.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {createAppServer} from '../server.mjs';
import {productionView} from './helpers/ui-views.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
// This intentionally represents an original whose scene layout cannot be decoded by
// the conservative text extractor. It is never presented as machine-verified text.
const original=Buffer.from('%PDF-1.4\n1 0 obj\n<</Type /Page>>\nendobj\nstartxref\n0\n%%EOF\n');
const original2=Buffer.from('%PDF-1.4\n2 0 obj\n<</Type /Page>>\nendobj\nstartxref\n0\n%%EOF\n');
const file=b=>({name:'shoot.pdf',contentBase64:b.toString('base64')});
const rows=[{number:'31',location:'Archive floor',start:'10:00',end:'11:30',activity:'Rubber wheeled camera carriage',reference:'Page 2, scene 31'},
 {number:'32',location:'Archive floor',start:'12:30',end:'14:10',activity:'Tripod and dialogue',reference:'Page 2, scene 32'}];
const attestation=(rs=rows)=>({rows:rs,expectedSceneCount:rs.length,reviewer:'Owner coordinator',reason:'Read every source page and compared each scene number, activity and clock by eye.',attestedComplete:true});
const inspected=(b=original,rs=rows)=>inspectReviewedCallSheet({file:file(b),transcription:attestation(rs)});
const project=()=>{const w=createProduction({id:'reviewed_s22',title:'Human imported call sheet'});applySourceImport(w,inspectImport({name:'permit.txt',kind:'permit',text:'No drones.\n\nScene 31 camera carriage requires protective boards.'}),{documentId:'permit'});return w;};
test('unstructured original PDF and every manually transcribed row are differentiated explicitly',()=>{
 const e=inspected();assert.equal(e.sourceFormat,'PDF_HUMAN_CALL_SHEET_TRANSCRIPTION_V1');assert.equal(e.rawHash,sha(original));assert.equal(e.byteCount,original.length);
 assert.equal(e.reviewedAttestation.sceneCount,2);assert.equal(e.reviewedAttestation.status,'OWNER_TRANSCRIBED_NOT_INDEPENDENTLY_SOURCE_VERIFIED');assert.equal(e.verifiedTextExtraction,false);
 assert(e.warnings.some(x=>x.includes('No machine extraction')));assert.match(e.text,/Scene 31.*Rubber wheeled camera carriage/);
});
test('source location map explicitly retains each human-selected PDF page and scene identity',()=>{
 const e=inspected();assert.deepEqual(e.sourceMap.map(r=>r.sourceReference),['Page 2, scene 31','Page 2, scene 32']);assert.deepEqual(e.sourceMap.map(r=>r.sceneId),['S31','S32']);
 assert(e.sourceMap.every(r=>r.humanTranscribed===true));
});
test('an affirmative explicit owner-attested completeness statement is mandatory',()=>{
 const a=attestation();delete a.attestedComplete;assert.throws(()=>inspectReviewedCallSheet({file:file(original),transcription:a}),/explicit full-scene attestation/);
});
test('reviewer and detailed reason cannot be omitted',()=>{
 for(const k of ['reviewer','reason']){const a=attestation();a[k]='';assert.throws(()=>inspectReviewedCallSheet({file:file(original),transcription:a}),/human reviewer/);}
});
test('a discrepancy between claimed and supplied scene totals blocks import',()=>{
 const a=attestation();a.expectedSceneCount=3;assert.throws(()=>inspectReviewedCallSheet({file:file(original),transcription:a}),/must equal/);
});
test('every PDF scene requires a readable original page reference',()=>{
 for(const reference of ['', 'somewhere', 'table ABC']){const a=attestation([{...rows[0],reference}]);assert.throws(()=>inspectReviewedCallSheet({file:file(original),transcription:a}),/source|page\/table reference|page reference/);}
});
test('duplicate scene numbers fail rather than collapsing original schedule rows',()=>{
 const changed=[rows[0],{...rows[1],number:'31'}];assert.throws(()=>inspected(original,changed),/Duplicate scene/);
});
test('invalid clocks and unsupported normalized scene text fail before source can be committed',()=>{
 assert.throws(()=>inspected(original,[{...rows[0],start:'25:90'}]),/Invalid 24-hour/);
 assert.throws(()=>inspected(original,[{...rows[0],activity:'Invalid | extra field'}]),/Invalid activity/);
});
test('exact PDF original bytes must be supplied with recognizable magic and EOF',()=>{
 for(const invalid of [Buffer.from('fake'),Buffer.from('%PDF-1.4\nwithout trailer'),Buffer.from('%PDF-2.5\n%%EOF')]){
  assert.throws(()=>inspectReviewedCallSheet({file:file(invalid),transcription:attestation()}),/recognizable PDF/);
 }
});
test('noncanonical base64, mismatched extension and text masquerading as uploaded binary fail',()=>{
 for(const source of [{name:'sheet.doc',contentBase64:file(original).contentBase64},{...file(original),contentBase64:'AAAA?'},{...file(original),text:'Pretend'}]){
  assert.throws(()=>inspectReviewedCallSheet({file:source,transcription:attestation()}),/Reviewed call-sheet/);
 }
});
test('verified serialization preserves the source-bound manual attestation without upgrading authority',()=>{
 const w=project();applySourceImport(w,inspected());const recreated=importWorkspace(exportWorkspace(w));
 assertWorkspaceSources(recreated);assert.equal(recreated.callSheet.importReceipt.reviewedAttestation.sceneCount,2);
 assert.equal(recreated.notClearance,true);assert.equal(planIntelligence(recreated).plannedCalls,4);
});
test('editing original-file hash after human attestation breaks source integrity',()=>{
 const w=project();applySourceImport(w,inspected());w.callSheet.importReceipt.rawHash='0'.repeat(64);assert.throws(()=>assertWorkspaceSources(w),/Attestation identity/);
});
test('editing source page references or transcription rows breaks persistent source integrity',()=>{
 for(const key of ['sourceReference','normalizedRow']){const w=project();applySourceImport(w,inspected());w.callSheet.importReceipt.sourceMap[0][key]='FORGED';assert.throws(()=>assertWorkspaceSources(w),/mapping was changed/);}
});
test('attestation SHA-256 is checked and cannot be replaced with a self-declared empty digest',()=>{
 const w=project();applySourceImport(w,inspected());w.callSheet.importReceipt.reviewedAttestation.sha256='0'.repeat(64);assert.throws(()=>assertWorkspaceSources(w),/Attestation identity/);
});
test('same scene text cannot silently transplant evidence to a DIFFERENT original PDF',()=>{
 const w=project();applySourceImport(w,inspected());const old=w.callSheet.importReceipt.rawHash;
 assert.throws(()=>applySourceImport(w,inspected(original2)),/Different binary originals/);assert.equal(w.callSheet.importReceipt.rawHash,old);
});
test('old manually typed scenes cannot silently inherit a newly uploaded original without revising provenance',()=>{
 const w=project(),e=inspected();setCallSheet(w,e.text);
 assert.throws(()=>applySourceImport(w,e),/previously manual call sheet/);
});
test('genuine changed scene rows invalidate previous plan but preserve import history',()=>{
 const w=project();applySourceImport(w,inspected());const first=w.callSheet.sourceHash;
 const changed=[rows[0],{...rows[1],activity:'Night crane movement'}];applySourceImport(w,inspected(original2,changed));
 assert.notEqual(w.callSheet.sourceHash,first);assert.equal(w.imports.length,3);assert.equal(w.callSheet.importReceipt.reviewedAttestation.rows[1].normalizedRow.includes('Night crane'),true);
});
test('dossier and Markdown identify human original transcription and source references',()=>{
 const w=project();applySourceImport(w,inspected());const dossier=buildProductionDossier(w,{persistedVersion:3,asOf:'2026-10-25T18:00:00.000Z'});
 assert.equal(dossier.callSheet.reviewedOriginalTranscription.sceneCount,2);assert.equal(dossier.notClearance,true);assert.match(dossierMarkdown(dossier),/Human-transcribed original call sheet/);assert.match(dossierMarkdown(dossier),/Page 2/);
});
test('original PDF bytes and its human attestation survive complete portable backup and recovery',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-s22-'));try{
  const store=createWorkspaceStore({directory}),vault=createSourceOriginalVault({directory}),execution=createDurableExecution({directory});
  const w=project(),e=inspected();applySourceImport(w,e);await vault.storeImport(file(original),e);const saved=await store.persist(w,{expectedVersion:0});
  const backup=await createLifecycleBackup(saved,execution,{sourceVault:vault});assert.equal(backup.originalSources.preserved,1);
  assert.equal(verifyLifecycleBackup(backup,execution).originalFileCount,1);
  const target=path.join(directory,'restored');await restoreLifecycleBackup(backup,{workspaceStore:createWorkspaceStore({directory:target}),execution:createDurableExecution({directory:target}),ownerConfirmed:true});
  const reloaded=(await createWorkspaceStore({directory:target}).load('reviewed_s22')).workspace;
  assert.equal(reloaded.callSheet.importReceipt.reviewedAttestation.sha256,e.reviewedAttestation.sha256);
  assert((await createSourceOriginalVault({directory:target}).read(sha(original))).equals(original));
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
test('new HTTP workflow safely imports human-reviewed binary, preserves it and rejects stale writes',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-s22-http-'));let server;try{
  const store=createWorkspaceStore({directory});server=createAppServer({enabled:false,workspaceStore:store});await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const url='http://127.0.0.1:'+server.address().port,post=(route,body,headers={})=>fetch(url+route,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
  let res=await post('/api/workspaces',{id:'http_s22',title:'First production'});assert.equal(res.status,201);
  const body={expectedVersion:1,file:file(original),transcription:attestation()};
  res=await post('/api/workspaces/http_s22/call-sheet-transcript',body);assert.equal(res.status,200,JSON.stringify(await res.clone().json()));
  const saved=await res.json();assert.equal(saved.workspace.callSheet.scenes.length,2);assert.equal(saved.version,2);
  assert.equal((await post('/api/workspaces/http_s22/call-sheet-transcript',body)).status,409);
  assert.equal((await post('/api/workspaces/http_s22/call-sheet-transcript',{...body,expectedVersion:2},{origin:'https://foreign.example'})).status,403);
  const inventory=await (await fetch(url+'/api/workspaces/http_s22/originals')).json();assert.equal(inventory.preserved,1);
  const exact=await fetch(url+'/api/workspaces/http_s22/originals/'+sha(original));assert.equal(exact.status,200);assert(Buffer.from(await exact.arrayBuffer()).equals(original));
  const dossier=await (await fetch(url+'/api/workspaces/http_s22/dossier')).json();assert.equal(dossier.callSheet.reviewedOriginalTranscription.sceneCount,2);
 }finally{if(server)await new Promise(done=>server.close(done));await fs.rm(directory,{recursive:true,force:true});}
});
test('owner UI exposes original-file selector, full-scene human attestation, and distinct reviewed-import action',()=>{
 const view=productionView({items:[],selected:{workspace:project(),version:1},overview:null,execution:null,authority:null,sceneAuthority:null,operations:null,dossier:null,actionQueue:null,originals:null});
 assert.match(view,/project-manual-call-file/);assert.match(view,/project-manual-call-count/);assert.match(view,/project-manual-call-attest/);
 assert.match(view,/project-manual-call-submit/);assert.match(view,/No AI\/OCR scene guesses/);
});
test('browser controller performs a complete human-transcribed PDF original import through actual owner HTTP and reloads workspace',async()=>{
 const {createWorkspaceController}=await import('../public/workspace-desk.mjs');
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-s22-browser-'));let server;
 try{
  const store=createWorkspaceStore({directory});server=createAppServer({enabled:false,workspaceStore:store});await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const base='http://127.0.0.1:'+server.address().port;
  const fileMock={name:'shoot.pdf',size:original.length,arrayBuffer:async()=>Uint8Array.from(original).buffer};
  const values={'project-manual-call-count':'2','project-manual-call-rows':rows.map(r=>[r.number,r.location,r.start,r.end,r.activity,r.reference].join(' | ')).join('\n'),
   'project-manual-call-reviewer':'Owner coordinator','project-manual-call-reason':'Read and checked every scene against original paper source'};
  const root={querySelector(q){const id=q.slice(1);return {value:values[id]??'',files:id==='project-manual-call-file'?[fileMock]:[],checked:id==='project-manual-call-attest'};}};
  const ctrl=createWorkspaceController({fetchImpl:(url,options)=>fetch(base+url,options),root});
  const creation=await fetch(base+'/api/workspaces',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'owner_browser',title:'Owner original'})});assert.equal(creation.status,201);
  await ctrl.load();await ctrl.click({id:'',dataset:{projectOpen:'owner_browser'}});
  await ctrl.click({id:'project-manual-call-submit',dataset:{}});
  assert.equal(ctrl.model.selected.workspace.callSheet.scenes.length,2);
  assert.equal(ctrl.model.originals.preserved,1);
  assert.match(productionView(ctrl.model),/Human-transcribed from original/);
 }finally{if(server)await new Promise(done=>server.close(done));await fs.rm(directory,{recursive:true,force:true});}
});
function zipStored(files){
 const short=n=>{const b=Buffer.alloc(2);b.writeUInt16LE(n);return b;};
 const long=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b;};
 const crc32=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 let offset=0;const parts=[],central=[];
 for(const [name,value] of Object.entries(files)){
  const n=Buffer.from(name),v=Buffer.from(value),crc=crc32(v);
  const local=Buffer.concat([long(0x04034b50),short(20),short(0),short(0),short(0),short(0),long(crc),long(v.length),long(v.length),short(n.length),short(0),n]);
  parts.push(local,v);
  central.push(Buffer.concat([long(0x02014b50),short(20),short(20),short(0),short(0),short(0),short(0),long(crc),long(v.length),long(v.length),short(n.length),short(0),short(0),short(0),short(0),long(0),long(offset),n]));
  offset+=local.length+v.length;
 }
 const center=Buffer.concat(central);return Buffer.concat([...parts,center,long(0x06054b50),short(0),short(0),short(central.length),short(central.length),long(center.length),long(offset),short(0)]);
}
function originalWord(extra={}){
 return zipStored({'[Content_Types].xml':'<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
 '_rels/.rels':'<Relationships/>','word/document.xml':'<w:document><w:body><w:p><w:r><w:t>Scene register - check original visually.</w:t></w:r></w:p></w:body></w:document>',...extra});
}
test('real structurally checked DOCX original can be manually transcribed with exact provenance instead of pretending extracted text is a table',()=>{
 const bytes=originalWord();const e=inspectReviewedCallSheet({file:{name:'call.docx',contentBase64:bytes.toString('base64')},transcription:attestation(rows.map((r,i)=>({...r,reference:`Table 1, row ${i+1}`})))});
 assert.equal(e.sourceFormat,'DOCX_HUMAN_CALL_SHEET_TRANSCRIPTION_V1');assert.equal(e.rawHash,sha(bytes));assert.equal(e.sourceMap[0].sourceReference,'Table 1, row 1');
 const w=project();applySourceImport(w,e);assert.equal(importWorkspace(exportWorkspace(w)).callSheet.scenes.length,2);
});
test('DOCX call-sheet originals with external content/macro-like attachments fail closed during upload',()=>{
 const malicious=originalWord({'word/_rels/document.xml.rels':'<Relationships><Relationship TargetMode="External" Target="https://elsewhere.invalid"/></Relationships>'});
 assert.throws(()=>inspectReviewedCallSheet({file:{name:'call.docx',contentBase64:malicious.toString('base64')},transcription:attestation(rows.map(r=>({...r,reference:'Table 1'})))}),/External relationship/);
 const invalid=originalWord({'word/vbaProject.bin':'malicious'});
 assert.throws(()=>inspectReviewedCallSheet({file:{name:'call.docx',contentBase64:invalid.toString('base64')},transcription:attestation(rows.map(r=>({...r,reference:'Table 1'})))}),/Unsupported or macro-enabled/);
});
