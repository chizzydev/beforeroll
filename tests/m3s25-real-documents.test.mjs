import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';
import {inspectImport} from '../src/source-intake.mjs';
import {inspectReviewedPermit,verifyReviewedPermitReceipt} from '../src/reviewed-permit.mjs';
import {extractLocalPdfText} from '../src/practical-pdf.mjs';
import {extractDocx,validateDocxContainer} from '../src/docx-intake.mjs';
import {inspectReviewedCallSheet} from '../src/reviewed-call-sheet.mjs';
import {createProduction,applySourceImport,assertWorkspaceSources,importWorkspace,exportWorkspace} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {buildProductionDossier,dossierMarkdown} from '../src/production-dossier.mjs';
import {previewSourceChange,verifySourceChangeCommit} from '../src/source-change-control.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from '../src/production-lifecycle.mjs';
import {createAppServer} from '../server.mjs';
import {productionView} from './helpers/ui-views.mjs';
import {createWorkspaceController} from '../public/workspace-desk.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const binary=async name=>fs.readFile(new URL('../fixtures/testing/'+name,import.meta.url));
const file=(bytes,name='location.pdf')=>({name,kind:'permit',contentBase64:bytes.toString('base64')});
const trans=(s='No drones.\n\nAn issued amendment must be signed.')=>({reviewer:'Location coordinator',reason:'Read the original PDF page-by-page and checked all visible conditions, including image-only text.',attestedComplete:true,sections:[{reference:'Page 1',text:s},{reference:'Page 2',text:'Unapproved email requests do not amend an issued permit.'}]});
const originalSheet='Scene 31 | North Arcade | 09:00-10:00 | Drone camera rehearsal\nScene 32 | North Arcade | 11:00-12:00 | Handheld camera';
function project(){return createProduction({id:'s25',title:'Original permit validation',callSheetText:originalSheet});}
const importPermit=(bytes,t=trans())=>inspectImport({...file(bytes),reviewedTranscription:t});
function tinyZip(data){const parts=[],central=[];let cursor=0;
 const w16=n=>{const b=Buffer.alloc(2);b.writeUInt16LE(n);return b;},w32=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b;};
 function crc32(b){let c=0xffffffff;for(const n of b){c^=n;for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xedb88320:0);}return(c^0xffffffff)>>>0;}
 for(const [name,val]of Object.entries(data)){const raw=Buffer.from(val),packed=deflateRawSync(raw),f=Buffer.from(name),crc=crc32(raw);
  const head=Buffer.concat([w32(0x04034b50),w16(20),w16(0),w16(8),w16(0),w16(0),w32(crc),w32(packed.length),w32(raw.length),w16(f.length),w16(0),f]);
  parts.push(head,packed);central.push(Buffer.concat([w32(0x02014b50),w16(20),w16(20),w16(0),w16(8),w16(0),w16(0),w32(crc),w32(packed.length),w32(raw.length),w16(f.length),w16(0),w16(0),w16(0),w16(0),w32(0),w32(cursor),f]));cursor+=head.length+packed.length;}
 const dir=Buffer.concat(central);return Buffer.concat([...parts,dir,w32(0x06054b50),w16(0),w16(0),w16(central.length),w16(central.length),w32(dir.length),w32(cursor),w16(0)]);
}
const docx=(xml,more={})=>tinyZip({'[Content_Types].xml':'<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>','_rels/.rels':'<Relationships/>','word/document.xml':xml,...more});
const word=(extra='')=>`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:hyperlink w:anchor="s1"><w:r><w:t>No drones.</w:t></w:r></w:hyperlink></w:p>${extra}</w:body></w:document>`;

test('complete reviewed original binary permit with section locators and separate byte/text fingerprints',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf'),e=importPermit(bytes);assert.equal(e.sourceFormat,'PDF_OWNER_VERIFIED_PERMIT_TRANSCRIPTION_V1');
 assert.equal(e.rawHash,sha(bytes));assert.equal(e.normalizedHash,sha(e.text));assert.notEqual(e.rawHash,e.normalizedHash);
 assert.equal(e.verifiedTextExtraction,false);assert.equal(e.reviewedPermitAttestation.status,'HUMAN_TRANSCRIPTION_NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(e.sourceMap.length,2);assert.equal(e.sourceMap[0].reference,'Page 1');assert.equal(Array.from(e.text).slice(e.sourceMap[0].start,e.sourceMap[0].end).join(''),trans().sections[0].text);
 assert.equal(verifyReviewedPermitReceipt(e,e.text),true);
});
test('scanned/image-only original can be retained as human testimony but no OCR or fabricated PDF extraction is claimed',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf');const e=importPermit(bytes);const w=project();applySourceImport(w,e,{documentId:'issued'});assertWorkspaceSources(w);
 assert(planIntelligence(w).plannedCalls>=4);assert.equal(w.documents[0].importReceipt.reviewedPermitAttestation.rawHash,sha(bytes));
 assert.equal(w.documents[0].pdfTranscriptionReview,null);
});
test('transcription refuses missing section locator, omitted reviewer, negative attestation, wrong original format and fake base64',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf'),f=file(bytes);
 assert.throws(()=>inspectReviewedPermit({file:f,transcription:{...trans(),attestedComplete:false}}),/attest completeness/);
 assert.throws(()=>inspectReviewedPermit({file:f,transcription:{...trans(),sections:[{reference:'Page ?',text:'No drones.'}]}}),/Page, Section/);
 assert.throws(()=>inspectReviewedPermit({file:{...f,name:'source.txt'},transcription:trans()}),/only supports original/);
 assert.throws(()=>inspectReviewedPermit({file:{...f,contentBase64:f.contentBase64+'*'},transcription:trans()}),/canonical base64/);
 assert.throws(()=>inspectReviewedPermit({file:{...f,name:'..\\evil.pdf'},transcription:trans()}),/safe original/);
});
test('source inspection preserves fail-explicit fallback when a non-representable PDF cannot be automatically read',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf');
 const previous=process.env.BEFOREROLL_PDFTOTEXT_PATH;delete process.env.BEFOREROLL_PDFTOTEXT_PATH;
 try{assert.throws(()=>inspectImport(file(bytes)),/human-reviewed permit transcription workflow/);}finally{if(previous!==undefined)process.env.BEFOREROLL_PDFTOTEXT_PATH=previous;}
});
test('explicit local PDF text-layer adapter is bounded, does not execute a shell, maps original pages, and requires later human verification',async()=>{
 const bytes=await binary('S25_TWO_PAGE_LAYOUT.pdf');let args,options;
 const parsed=extractLocalPdfText(bytes,{toolPath:path.resolve('trusted-pdftotext'),spawn:(bin,argv,opts)=>{args=argv;options=opts;return {stdout:Buffer.from('No drones.\fCondition M-7 requires floor boards.\f'),status:0};}});
 assert.equal(parsed.sourceFormat,'PDF_POPPLER_TEXT_LAYER_HUMAN_REVIEW_V1');assert.equal(parsed.requiresHumanTextReview,true);
 assert.equal(parsed.sourceMap.length,2);assert.equal(parsed.sourceMap[1].page,2);assert.equal(parsed.text,'No drones.\n\nCondition M-7 requires floor boards.');
 assert.deepEqual(args,['-layout','-enc','UTF-8','-','-']);assert.equal(options.shell,false);assert.equal(options.timeout,15000);
});
test('PDF adapter rejects relative executable, image-only pages, invalid UTF-8 and a failed external converter',async()=>{
 const b=await binary('S25_TWO_PAGE_LAYOUT.pdf');
 assert.throws(()=>extractLocalPdfText(b,{toolPath:'pdftotext'}),/absolute/);
 const opts={toolPath:path.resolve('pdftotext')};
 assert.throws(()=>extractLocalPdfText(b,{...opts,spawn:()=>({stdout:Buffer.from('Text\f\f'),status:0})}),/Empty\/scanned page/);
 assert.throws(()=>extractLocalPdfText(b,{...opts,spawn:()=>({stdout:Buffer.from([0xc0,0xaf]),status:0})}),/invalid UTF-8/);
 assert.throws(()=>extractLocalPdfText(b,{...opts,spawn:()=>({stdout:Buffer.alloc(0),status:1})}),/failed or timed out/);
});
test('existing imported PDF confirmation permits either the strict parser or owner-installed text-layer adapter',async()=>{
 const bytes=await binary('S25_TWO_PAGE_LAYOUT.pdf');const previous=process.env.BEFOREROLL_PDFTOTEXT_PATH;
 process.env.BEFOREROLL_PDFTOTEXT_PATH=path.resolve('test-script-that-does-not-exist');
 try{assert.throws(()=>inspectImport(file(bytes)),/human-reviewed/);}finally{if(previous===undefined)delete process.env.BEFOREROLL_PDFTOTEXT_PATH;else process.env.BEFOREROLL_PDFTOTEXT_PATH=previous;}
});
test('common internal Word hyperlinks are visible and not omitted during conservative automatic extraction',()=>{
 const bytes=docx(word());const e=inspectImport({name:'ordinary.docx',kind:'permit',contentBase64:bytes.toString('base64')});
 assert.match(e.text,/No drones/);assert.equal(e.sourceFormat,'DOCX_MAIN_BODY_TEXT_V1');
});
test('image-containing DOCX can use verified binary container fallback without silently claiming image text extraction',()=>{
 const bytes=docx(word('<w:p><w:r><w:drawing/></w:r></w:p>'),{'word/media/floor.png':'RAW BINARY PICTURE'});
 assert.equal(validateDocxContainer(bytes).hasMedia,true);
 assert.throws(()=>extractDocx(bytes),/Embedded or attached|Unsupported/);
 const e=inspectImport({name:'image.docx',kind:'permit',contentBase64:bytes.toString('base64'),reviewedTranscription:trans()});
 assert.equal(e.sourceFormat,'DOCX_OWNER_VERIFIED_PERMIT_TRANSCRIPTION_V1');assert.equal(e.verifiedTextExtraction,false);
});
test('human-transcribed DOCX call sheet accepts original images but retains scene count attestation',()=>{
 const bytes=docx(word('<w:p><w:r><w:drawing/></w:r></w:p>'),{'word/media/call.png':'image'});
 const e=inspectReviewedCallSheet({file:{name:'shoot.docx',contentBase64:bytes.toString('base64')},transcription:{rows:[{number:'31',location:'North Arcade',start:'09:00',end:'10:00',activity:'Drone rehearsal',reference:'Table 1'}],expectedSceneCount:1,attestedComplete:true,reviewer:'Coordinator',reason:'Compared all image-printed rows'}});
 assert.equal(e.reviewedAttestation.sceneCount,1);assert.equal(e.rawHash,sha(bytes));
});
test('DOCX security rejects macros, embedded executable objects and external content even in human fallback',()=>{
 const body=word();const evil=[{'word/vbaProject.bin':'code'},{'word/embeddings/oleObject1.bin':'payload'},{'word/_rels/document.xml.rels':'<Relationships><Relationship TargetMode="External" Target="http://bad.invalid"/></Relationships>'}];
 for(const parts of evil){const bytes=docx(body,parts);assert.throws(()=>inspectImport({name:'x.docx',kind:'permit',contentBase64:bytes.toString('base64'),reviewedTranscription:trans()}),/Unsupported|External relationship/);}
});
test('reviewed transcription receipt is cryptographically bound to normalized original text, source map and persisted workspace',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf'),e=importPermit(bytes),w=project();applySourceImport(w,e,{documentId:'permit'});
 assertWorkspaceSources(importWorkspace(exportWorkspace(w)));
 const a=structuredClone(w);a.documents[0].importReceipt.reviewedPermitAttestation.reviewer='Forger';assert.throws(()=>assertWorkspaceSources(a),/receipt identity|mismatch/);
 const b=structuredClone(w);b.documents[0].importReceipt.sourceMap[0].reference='Page 999';assert.throws(()=>assertWorkspaceSources(b),/section map/);
 const c=structuredClone(w);c.documents[0].text+='\nUnsigned amendment approved.';assert.throws(()=>assertWorkspaceSources(c),/Source hash/);
});
test('dossier contains the original/transcription provenance, page links, hashes and honest verification caveats',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf'),w=project();applySourceImport(w,importPermit(bytes),{documentId:'permit'});
 const dossier=buildProductionDossier(w,{persistedVersion:1,asOf:'2026-10-25T16:00:00.000Z'}),d=dossier.sourceDocuments[0];
 assert.equal(d.reviewedOriginalPermit.rawHash,sha(bytes));assert.equal(d.reviewedOriginalPermit.sections[0].reference,'Page 1');
 assert.equal(d.reviewedOriginalPermit.sections[0].text,undefined);
 assert.match(dossierMarkdown(dossier),/Human-reviewed original permit/);assert.match(dossierMarkdown(dossier),/No independent document completeness/);
});
test('same original binary corrected transcription changes analyzed source, previews retirement, retains historical original fingerprint',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf'),w=project();const a=importPermit(bytes);applySourceImport(w,a,{documentId:'permit'});
 const oldIds=planIntelligence(w).taskIds;
 const revised=importPermit(bytes,trans('No drones.\n\nSigned board approval is REQUIRED before filming.'));
 assert.equal(a.rawHash,revised.rawHash);assert.notEqual(a.normalizedHash,revised.normalizedHash);
 const preview=previewSourceChange(w,revised,{documentId:'permit',persistedVersion:7});assert.equal(preview.changed,true);
 assert(preview.tasks.retired>0);assert.equal(preview.reconciliation.originalSource.newRawSha256,sha(bytes));
 assert.throws(()=>verifySourceChangeCommit(w,a,{documentId:'permit',persistedVersion:7,previewSha256:preview.previewSha256}),/differs/);
 verifySourceChangeCommit(w,revised,{documentId:'permit',persistedVersion:7,previewSha256:preview.previewSha256});
 applySourceImport(w,revised,{documentId:'permit'});assertWorkspaceSources(w);
 assert(oldIds.some(id=>!planIntelligence(w).taskIds.includes(id)));assert.equal(w.imports.length,2);
});
test('portable backup and full recovery retain original unmodified PDF bytes and exact reviewed sections',async()=>{
 const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf'),dir=await fs.mkdtemp(path.join(os.tmpdir(),'br-s25-back-'));
 try{const store=createWorkspaceStore({directory:dir}),vault=createSourceOriginalVault({directory:dir}),execution=createDurableExecution({directory:dir});
  const w=project(),e=importPermit(bytes);applySourceImport(w,e,{documentId:'permit'});await vault.storeImport(file(bytes),e);
  const saved=await store.persist(w,{expectedVersion:0}),backup=await createLifecycleBackup(saved,execution,{sourceVault:vault});
  assert.equal(verifyLifecycleBackup(backup,execution).originalFileCount,1);
  const restored=path.join(dir,'restored');await restoreLifecycleBackup(backup,{workspaceStore:createWorkspaceStore({directory:restored}),execution:createDurableExecution({directory:restored}),ownerConfirmed:true});
  const again=(await createWorkspaceStore({directory:restored}).load('s25')).workspace;assertWorkspaceSources(again);
  assert((await createSourceOriginalVault({directory:restored}).read(sha(bytes))).equals(bytes));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('private HTTP import -> current task plan -> original retrieve -> guarded correction preview/commit',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'br-s25-http-'));let srv;
 try{srv=createAppServer({enabled:false,workspaceStore:createWorkspaceStore({directory:dir})});await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
  const base='http://127.0.0.1:'+srv.address().port,post=async(route,data)=>{const r=await fetch(base+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});return {status:r.status,data:await r.json()};};
  const bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf');let r=await post('/api/workspaces',{id:'s25http',title:'Source corrections'});assert.equal(r.status,201);
  r=await post('/api/workspaces/s25http/import',{expectedVersion:1,file:{name:'call.txt',kind:'callSheet',text:originalSheet}});assert.equal(r.status,200);
  r=await post('/api/workspaces/s25http/import',{expectedVersion:2,documentId:'source',file:{...file(bytes),reviewedTranscription:trans()}});assert.equal(r.status,200,JSON.stringify(r.data));
  assert.equal(r.data.workspace.documents[0].importReceipt.reviewedPermitAttestation.sections.length,2);
  const plan=await (await fetch(base+'/api/workspaces/s25http/plan')).json();assert(plan.plannedCalls>=4);
  const original=await fetch(base+'/api/workspaces/s25http/originals/'+sha(bytes));assert.equal(original.status,200);assert(Buffer.from(await original.arrayBuffer()).equals(bytes));
  const replacement={...file(bytes),reviewedTranscription:trans('No drones.\n\nIssued permit requires a protected pedestrian route.')};
  const preview=await post('/api/workspaces/s25http/impact',{expectedVersion:3,documentId:'source',file:replacement});assert.equal(preview.status,200,JSON.stringify(preview.data));
  assert.equal((await post('/api/workspaces/s25http/commit-source-change',{expectedVersion:3,documentId:'source',file:replacement,previewSha256:'0'.repeat(64)})).status,422);
  const commit=await post('/api/workspaces/s25http/commit-source-change',{expectedVersion:3,documentId:'source',file:replacement,previewSha256:preview.data.previewSha256});assert.equal(commit.status,200,JSON.stringify(commit.data));
  assert.equal(commit.data.workspace.documents[0].importReceipt.reviewedPermitAttestation.rawHash,sha(bytes));
  assert.equal((await post('/api/workspaces/s25http/commit-source-change',{expectedVersion:3,documentId:'source',file:replacement,previewSha256:preview.data.previewSha256})).status,409);
 }finally{if(srv)await new Promise(ok=>srv.close(ok));await fs.rm(dir,{recursive:true,force:true});}
});
test('browser project sources expose explicit scanned permit fallback and source-confirmed correction pathway',()=>{
 const view=productionView({items:[],selected:{workspace:project(),version:1},overview:null,execution:null,authority:null,sceneAuthority:null,operations:null,dossier:null,actionQueue:null,originals:null});
 assert.match(view,/project-permit-use-transcription/);assert.match(view,/project-permit-sections/);assert.match(view,/project-permit-complete/);assert.match(view,/project-impact-permit/);
});
test('browser imports reviewed original binary permit through actual local HTTP and reloads same project',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'br-s25-browser-'));let srv;
 try{srv=createAppServer({enabled:false,workspaceStore:createWorkspaceStore({directory:dir})});await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
  const base='http://127.0.0.1:'+srv.address().port,bytes=await binary('S25_IMAGE_ONLY_PAGE.pdf');
  await fetch(base+'/api/workspaces',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'s25browser',title:'Browser original'})});
  const vals={'project-doc-id':'permit_scanned','project-permit-sections':'[Page 1]\nNo drones.\n\n[Page 2]\nSignature not established.','project-permit-section-count':'2','project-permit-reviewer':'Human coordinator','project-permit-review-reason':'Read each original page visually and checked the conditions against the pages.'};
  const mock={name:'scanned.pdf',size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
  const root={querySelector:selector=>{const id=selector.slice(1);return {value:vals[id]??'',files:id==='project-permit-file'?[mock]:[],checked:['project-permit-use-transcription','project-permit-complete'].includes(id),dataset:{}};}};
  const controller=createWorkspaceController({fetchImpl:(url,opts)=>fetch(base+url,opts),root});await controller.load();await controller.click({id:'',dataset:{projectOpen:'s25browser'}});
  await controller.click({id:'project-import-permit',dataset:{}});
  assert.equal(controller.model.selected.workspace.documents.length,1);assert.equal(controller.model.selected.workspace.documents[0].importReceipt.reviewedPermitAttestation.reviewer,'Human coordinator');
  assert.match(productionView(controller.model),/Human-transcribed original/);
 }finally{if(srv)await new Promise(ok=>srv.close(ok));await fs.rm(dir,{recursive:true,force:true});}
});

test('source text preview extracts obvious structured rows from a Word document but never creates a production scene',async()=>{
 const {previewCallSheetOriginal}=await import('../src/document-preview.mjs');
 const doc=docx(word('<w:p><w:r><w:t>Scene 31 | North Arcade | 09:00-10:00 | Camera cart</w:t></w:r></w:p>'));
 const p=previewCallSheetOriginal({name:'schedule.docx',contentBase64:doc.toString('base64')});
 assert.equal(p.state,'EXTRACTED_TEXT_NOT_VERIFIED');assert.equal(p.sceneRowSuggestions.length,1);
 assert.equal(p.sceneRowSuggestions[0].number,'31');assert.match(p.sceneRowSuggestions[0].reference,/Paragraph/);
 assert.equal(p.originalRawSha256,sha(doc));assert.equal(p.notClearance,true);assert.equal(p.sceneRowSuggestions[0].activity,'Camera cart');
});
test('scanned PDF and image-only DOCX preview explain fallback rather than inventing scene rows',async()=>{
 const {previewCallSheetOriginal}=await import('../src/document-preview.mjs');
 const previous=process.env.BEFOREROLL_PDFTOTEXT_PATH;delete process.env.BEFOREROLL_PDFTOTEXT_PATH;
 try{const b=await binary('S25_IMAGE_ONLY_PAGE.pdf'),p=previewCallSheetOriginal({name:'scan.pdf',contentBase64:b.toString('base64')});
  assert.equal(p.state,'MANUAL_TRANSCRIPTION_REQUIRED');assert.equal(p.sceneRowSuggestions.length,0);assert.equal(p.originalRawSha256,sha(b));
 }finally{if(previous!==undefined)process.env.BEFOREROLL_PDFTOTEXT_PATH=previous;}
});
test('document preview HTTP is read-only, source version-bound, and blocks forged cross-origin previews',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'br-s25-preview-'));let srv;
 try{srv=createAppServer({enabled:false,workspaceStore:createWorkspaceStore({directory})});await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
  const base='http://127.0.0.1:'+srv.address().port,send=async(route,body,extra={})=>fetch(base+route,{method:'POST',headers:{'content-type':'application/json',...extra},body:JSON.stringify(body)});
  const created=await send('/api/workspaces',{id:'preview_s25',title:'Read only sample'});assert.equal(created.status,201);
  const bytes=docx(word('<w:p><w:r><w:t>Scene 31 | North Arcade | 09:00-10:00 | Camera cart</w:t></w:r></w:p>'));
  const payload={expectedVersion:1,file:{name:'call.docx',contentBase64:bytes.toString('base64')}};
  assert.equal((await send('/api/workspaces/preview_s25/document-preview',{...payload,expectedVersion:0})).status,409);
  assert.equal((await send('/api/workspaces/preview_s25/document-preview',payload,{origin:'https://evil.invalid'})).status,403);
  const response=await send('/api/workspaces/preview_s25/document-preview',payload);assert.equal(response.status,200);
  const preview=await response.json();assert.equal(preview.sceneRowSuggestions.length,1);assert.equal(preview.originalRawSha256,sha(bytes));
  const workspace=await (await fetch(base+'/api/workspaces/preview_s25')).json();assert.equal(workspace.workspace.callSheet,null);assert.equal(workspace.workspace.documents.length,0);assert.equal(workspace.version,1);
 }finally{if(srv)await new Promise(ok=>srv.close(ok));await fs.rm(directory,{recursive:true,force:true});}
});
test('preview rejects fake file names, invalid base64, unsupported extensions and invalid Office package',async()=>{
 const {previewCallSheetOriginal}=await import('../src/document-preview.mjs');
 assert.throws(()=>previewCallSheetOriginal({name:'../bad.docx',contentBase64:'YQ=='}),/safe PDF/);
 assert.throws(()=>previewCallSheetOriginal({name:'schedule.rtf',contentBase64:'YQ=='}),/safe PDF/);
 assert.throws(()=>previewCallSheetOriginal({name:'schedule.docx',contentBase64:'AQ=='}),/Original|invalid|package|ZIP/);
});

test('browser document-preview button shows provisional row context but never saves or attests a call sheet',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'br-s25-view-'));let srv;
 try{srv=createAppServer({enabled:false,workspaceStore:createWorkspaceStore({directory})});await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
  const base='http://127.0.0.1:'+srv.address().port;
  const wordFile=docx(word('<w:p><w:r><w:t>Scene 31 | North Arcade | 09:00-10:00 | Camera cart</w:t></w:r></w:p>'));
  const mock={name:'shoot.docx',size:wordFile.length,arrayBuffer:async()=>Uint8Array.from(wordFile).buffer};
  const root={querySelector:q=>({value:'',checked:false,files:q==='#project-manual-call-file'?[mock]:[],dataset:{}})};
  const controller=createWorkspaceController({fetchImpl:(url,opts)=>fetch(base+url,opts),root});
  await fetch(base+'/api/workspaces',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'previewbutton',title:'Draft only'})});
  await controller.load();await controller.click({id:'',dataset:{projectOpen:'previewbutton'}});
  await controller.click({id:'project-manual-call-preview',dataset:{}});
  assert.equal(controller.model.documentPreview.sceneRowSuggestions.length,1);
  assert.match(productionView(controller.model),/NOT A VERIFIED CALL SHEET/);
  assert.equal(controller.model.selected.workspace.callSheet,null);
 }finally{if(srv)await new Promise(ok=>srv.close(ok));await fs.rm(directory,{recursive:true,force:true});}
});

test('archived corrected permit attestations remain checksum-checked rather than silently trusting historical metadata',async()=>{
 const b=await binary('S25_IMAGE_ONLY_PAGE.pdf'),w=project();
 applySourceImport(w,importPermit(b),{documentId:'permit'});
 applySourceImport(w,importPermit(b,trans('No drones.\n\nAdditional issued restriction requires floor boards.')),{documentId:'permit'});
 assertWorkspaceSources(w);
 const a=structuredClone(w);a.imports[0].reviewedPermitAttestation.sections[0].text='Drones allowed';
 assert.throws(()=>assertWorkspaceSources(a),/identity|mismatch|altered/);
});
