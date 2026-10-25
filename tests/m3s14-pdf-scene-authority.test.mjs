import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {extractConservativePdf} from '../src/pdf-intake.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {createProduction,applySourceImport,confirmPdfTranscription,reviseDocument,setCallSheet,exportWorkspace,importWorkspace} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {recordSceneAuthority,projectSceneAuthority,assertSceneAuthorityIntegrity} from '../src/scene-authority.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createAppServer} from '../server.mjs';
import {createWorkspaceController,productionView} from '../public/workspace-desk.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function pdf(lines=['No drones.','Only Scene 12 may use the south loading bay.'],{compressed=false,content=null}={}){
 let stream=content??`BT /F1 11 Tf 70 740 Td (${lines[0]}) Tj 0 -16 Td (${lines[1]}) Tj ET`;
 const raw=compressed?deflateSync(Buffer.from(stream,'ascii')):Buffer.from(stream,'ascii');
 const pieces=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  Buffer.concat([Buffer.from(`<< /Length ${raw.length}${compressed?' /Filter /FlateDecode':''} >>\nstream\n`),raw,Buffer.from('\nendstream')])
 ];
 const chunks=[Buffer.from('%PDF-1.4\n','ascii')],offsets=[0];
 for(let i=0;i<pieces.length;i++){
  offsets.push(Buffer.concat(chunks).length);
  chunks.push(Buffer.from(`${i+1} 0 obj\n`),Buffer.isBuffer(pieces[i])?pieces[i]:Buffer.from(pieces[i],'ascii'),Buffer.from('\nendobj\n'));
 }
 const xref=Buffer.concat(chunks).length;
 const records=['0000000000 65535 f ',...offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ')];
 chunks.push(Buffer.from(`xref\n0 6\n${records.join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
 return Buffer.concat(chunks);
}
const row='Scene 12 | South loading bay | 10:00-11:00 | Drone camera movement';
function workspace(){return createProduction({id:'s14',title:'Authority-linked production',documents:[{id:'permit',name:'permit.txt',text:'No drones.\n\nOnly Scene 12 may use the loading bay.'},{id:'amend',name:'amend.txt',text:'Scene 12 amendment request is unsigned.'}],callSheetText:row});}
const file=x=>({name:'permit.pdf',kind:'permit',contentBase64:x.toString('base64'),mediaType:'application/pdf'});
test('conservative PDF actual classic xref, original bytes, exact extraction mapping',()=>{
 const bytes=pdf(),got=extractConservativePdf(bytes);
 assert.equal(got.text,'No drones.\nOnly Scene 12 may use the south loading bay.');assert.equal(got.rawHash,sha(bytes));
 assert.deepEqual(got.sourceMap.map(x=>Array.from(got.text).slice(x.start,x.end).join('')),['No drones.','Only Scene 12 may use the south loading bay.']);
 assert(got.requiresHumanTextReview);assert.equal(got.sourceMap[0].page,1);
});
test('compressed PDF stream is decompressed locally with human transcription hold',()=>{
 const bytes=pdf(undefined,{compressed:true}),out=inspectImport(file(bytes));assert.equal(out.rawHash,sha(bytes));assert.equal(out.requiresHumanTextReview,true);
 assert.equal(out.sourceFormat,'PDF_CONSERVATIVE_TYPE1_TEXT_V1');
});
test('structural PDF failures are rejected, never partially interpreted',()=>{
 const bytes=pdf();
 assert.throws(()=>extractConservativePdf(Buffer.from('%PDF-1.4\nstream scan data%%EOF')),/cross-reference|EOF/);
 assert.throws(()=>extractConservativePdf(Buffer.from(bytes.toString('latin1').replace('/Root 1 0 R','/Root 9 0 R'),'latin1')),/catalog/);
 assert.throws(()=>extractConservativePdf(Buffer.from(bytes.toString('latin1').replace('/Helvetica','/NonStandard'),'latin1')),/font\/encoding|cross-reference/);
 assert.throws(()=>extractConservativePdf(Buffer.from(bytes.toString('latin1').replace('/Type /Catalog','/Encrypt /Type /Catalog'),'latin1')),/security/);
 assert.throws(()=>inspectImport({name:'forged.pdf',kind:'permit',text:'%PDF-1.4'}),/original base64/);
});
test('PDF unreadable operators, rotated layout and high-to-low reversed lines are rejected',()=>{
 const rotated=pdf(undefined,{content:'BT /F1 11 Tf 0 1 -1 0 70 740 Tm (No drones.) Tj ET'});
 const laterAbove=pdf(undefined,{content:'BT /F1 11 Tf 70 500 Td (First.) Tj 0 120 Td (Second.) Tj ET'});
 const unsafe=pdf(undefined,{content:'q BT /F1 11 Tf 70 740 Td (No drones.) Tj ET Q'});
 for(const v of [rotated,laterAbove,unsafe])assert.throws(()=>extractConservativePdf(v),/PDF intake/);
});
test('PDF source cannot silently enter model plan until explicit review bound to original bytes and extracted text',()=>{
 const w=createProduction({id:'pdf',title:'Human transcription required',callSheetText:row});const receipt=inspectImport(file(pdf()));
 applySourceImport(w,receipt,{documentId:'p1'});
 assert.throws(()=>planIntelligence(w),/requires human verification/);
 assert.throws(()=>confirmPdfTranscription(w,{documentId:'p1',reviewer:'A',reason:'Visually checked text',rawHash:'0'.repeat(64),normalizedHash:w.documents[0].sourceHash}),/match original/);
 confirmPdfTranscription(w,{documentId:'p1',reviewer:'A',reason:'Compared each extracted PDF line to visible original page',rawHash:receipt.rawHash,normalizedHash:receipt.normalizedHash});
 assert.equal(planIntelligence(w).plannedCalls,2);
 const copy=importWorkspace(exportWorkspace(w));assert.equal(copy.documents[0].pdfTranscriptionReview.status,'HUMAN_REVIEWED_TEXT_ONLY_NOT_AUTHORITY');
 reviseDocument(w,'p1','No drones.\n\nNo exceptions.');assert.equal(w.documents[0].pdfTranscriptionReview,null);
});
test('scene-specific authority records persist exact quoted original source and human scope, never grant clearance',()=>{
 const w=workspace(),args={sceneId:'S12',documentId:'permit',unitId:'U001',kind:'RESTRICTION',scope:'LOCATION_WIDE',reviewer:'Coordinator',reason:'Current prohibition compared to call sheet'};
 recordSceneAuthority(w,args);assertSceneAuthorityIntegrity(w);
 const r=projectSceneAuthority(w);assert.equal(r.summary.current,1);assert.equal(r.scenes[0].explicitHumanReviewItems,1);assert.equal(r.records[0].quote,'No drones.');assert.equal(r.notClearance,true);
 assert.throws(()=>recordSceneAuthority(w,args),/Duplicate/);
 const out=importWorkspace(exportWorkspace(w));assert.equal(projectSceneAuthority(out).summary.current,1);
});
test('source change and scene change stale human applicability separately without losing original evidence',()=>{
 const w=workspace();const a={sceneId:'S12',documentId:'permit',unitId:'U001',kind:'RESTRICTION',scope:'SCOPE_UNRESOLVED',reviewer:'Coordinator',reason:'Manual question'};
 recordSceneAuthority(w,a);setCallSheet(w,'Scene 12 | South loading bay | 10:00-11:00 | Handheld camera');
 assert.equal(projectSceneAuthority(w).summary.stale,1);assertSceneAuthorityIntegrity(w);
 setCallSheet(w,row);assert.equal(projectSceneAuthority(w).summary.current,0,'same-text reversal must retain the old claim as historical');
 reviseDocument(w,'permit','No cameras.\n\nOnly Scene 12 may use the loading bay.');assert.equal(projectSceneAuthority(w).summary.stale,1);
});
test('scene authority refuses forged identities and source quotations',()=>{
 const w=workspace();recordSceneAuthority(w,{sceneId:'S12',documentId:'permit',unitId:'U001',kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'A',reason:'Review'});
 w.sceneAuthority[0].quote='PERMISSION ISSUED';assert.throws(()=>assertSceneAuthorityIntegrity(w),/corrupted|mismatch/);
});
test('human PDF gate and scene authority are durable with version fencing',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-s14-'));try{
 const store=createWorkspaceStore({directory:dir});const w=workspace();let saved=await store.persist(w,{expectedVersion:0});recordSceneAuthority(w,{sceneId:'S12',documentId:'permit',unitId:'U001',kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'A',reason:'Manual'});
 saved=await store.persist(w,{expectedVersion:1});assert.equal(projectSceneAuthority((await store.load('s14')).workspace).summary.current,1);
 await assert.rejects(()=>store.persist(w,{expectedVersion:1}),/Version conflict/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
async function browser(){const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-s14-api-'));const store=createWorkspaceStore({directory:dir}),server=createAppServer({enabled:false,workspaceStore:store});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const rq=async(method,payload,body)=>{const response=await fetch(base+payload,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:response.status,json:await response.json()};};
 return {rq,fetchLocal:(uri,init)=>fetch(base+uri,init),close:async()=>{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}};
}
test('HTTP PDF import -> pending -> exact human confirmation -> plan, source-bound version gates',async()=>{
 const s=await browser();try{
 let r=await s.rq('POST','/api/workspaces',{id:'papi',title:'PDF import'});assert.equal(r.status,201);
 const bytes=pdf();r=await s.rq('POST','/api/workspaces/papi/import',{expectedVersion:1,documentId:'permit',file:file(bytes)});assert.equal(r.status,200);
 const p=r.json.workspace.documents[0],hash=p.sourceHash,raw=p.importReceipt.rawHash;
 assert.equal((await s.rq('GET','/api/workspaces/papi/overview')).json.state,'PDF_TRANSCRIPTION_REVIEW_REQUIRED');
 assert.equal((await s.rq('GET','/api/workspaces/papi/execution')).json.state,'PDF_TRANSCRIPTION_REVIEW_REQUIRED');
 assert.equal((await s.rq('POST','/api/workspaces/papi/pdf-transcription',{expectedVersion:2,documentId:'permit',reviewer:'A',reason:'Printed page compared',rawHash:'0'.repeat(64),normalizedHash:hash})).status,422);
 r=await s.rq('POST','/api/workspaces/papi/pdf-transcription',{expectedVersion:2,documentId:'permit',reviewer:'A',reason:'Visually reviewed all lines',rawHash:raw,normalizedHash:hash});assert.equal(r.status,200);
 assert.equal((await s.rq('POST','/api/workspaces/papi/pdf-transcription',{expectedVersion:2,documentId:'permit',reviewer:'A',reason:'Retry',rawHash:raw,normalizedHash:hash})).status,409);
 }finally{await s.close();}
});
test('HTTP scene authority stores reviewed source-scene claim, exposes scene projection and cannot be declared cleared',async()=>{
 const s=await browser();try{
 await s.rq('POST','/api/workspaces',{id:'scope',title:'Source scene'});
 let r=await s.rq('POST','/api/workspaces/scope/import',{expectedVersion:1,documentId:'p',file:{name:'p.txt',kind:'permit',text:'No drones.\n\nUse of loading bay requires explicit signed amendment.'}});assert.equal(r.status,200);
 r=await s.rq('POST','/api/workspaces/scope/import',{expectedVersion:2,file:{name:'call.txt',kind:'callSheet',text:row}});assert.equal(r.status,200);
 r=await s.rq('POST','/api/workspaces/scope/scene-authority',{expectedVersion:3,sceneId:'S12',documentId:'p',unitId:'U001',kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'A',reason:'Human flagged'});assert.equal(r.status,200);
 const g=await s.rq('GET','/api/workspaces/scope/scene-authority');assert.equal(g.status,200);assert.equal(g.json.scenes[0].explicitHumanReviewItems,1);
 assert.equal(g.json.scenes[0].authorityState,'HUMAN_REVIEW_REQUIRED');assert.equal(g.json.notClearance,true);
 assert.equal((await s.rq('POST','/api/workspaces/scope/scene-authority',{expectedVersion:3,sceneId:'S12',documentId:'p',unitId:'U001',kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'A',reason:'Human flagged'})).status,409);
 }finally{await s.close();}
});
test('full project PDF -> held with call sheet -> reviewer confirms -> intelligent plan unlocked, zero provider calls',async()=>{
 const s=await browser();try{
  await s.rq('POST','/api/workspaces',{id:'workflow',title:'Reviewed permit PDF'});
  let r=await s.rq('POST','/api/workspaces/workflow/import',{expectedVersion:1,file:{name:'shoot.txt',kind:'callSheet',text:row}});assert.equal(r.status,200);
  const bytes=pdf();r=await s.rq('POST','/api/workspaces/workflow/import',{expectedVersion:2,documentId:'permit',file:file(bytes)});assert.equal(r.status,200);
  const hash=r.json.workspace.documents[0].sourceHash,rawHash=r.json.workspace.documents[0].importReceipt.rawHash;
  r=await s.rq('GET','/api/workspaces/workflow/overview');assert.equal(r.status,200);assert.equal(r.json.state,'PDF_TRANSCRIPTION_REVIEW_REQUIRED');
  assert.equal((await s.rq('GET','/api/workspaces/workflow/plan')).status,422);
  r=await s.rq('POST','/api/workspaces/workflow/pdf-transcription',{expectedVersion:3,documentId:'permit',rawHash,normalizedHash:hash,reviewer:'A',reason:'Original single-page PDF compared visually word by word'});assert.equal(r.status,200);
  r=await s.rq('GET','/api/workspaces/workflow/overview');assert.equal(r.status,200);assert.equal(r.json.state,'READY_FOR_HUMAN_SOURCE_REVIEW');
  assert.equal((await s.rq('GET','/api/workspaces/workflow/plan')).json.plannedCalls,2);
  assert.equal((await s.rq('GET','/api/workspaces/workflow/execution')).json.attempts,0);
 }finally{await s.close();}
});
test('owner browser project controller saves source-to-scene human link and renders updated scene authority history',async()=>{
 const s=await browser();try{
 await s.rq('POST','/api/workspaces',{id:'ui',title:'Project UI'});
 await s.rq('POST','/api/workspaces/ui/import',{expectedVersion:1,documentId:'permit',file:{name:'permit.txt',kind:'permit',text:'No drones.\n\nDolly camera permitted.'}});
 await s.rq('POST','/api/workspaces/ui/import',{expectedVersion:2,file:{name:'call.txt',kind:'callSheet',text:row}});
 const vals={'project-scene-auth-scene':'S12','project-scene-auth-doc':'permit','project-scene-auth-unit':'U001','project-scene-auth-kind':'RESTRICTION','project-scene-auth-scope':'EXACT_SCENE','project-scene-auth-reviewer':'Location manager','project-scene-auth-reason':'Reviewed the exact scene and clause'};
 const root={querySelector:q=>({value:vals[q.slice(1)]??'',files:[],dataset:{}})};
 const c=createWorkspaceController({fetchImpl:s.fetchLocal,root});await c.load();await c.click({id:'',dataset:{projectOpen:'ui'}});
 assert.match(productionView(c.model),/Scene-specific documentary applicability/);
 assert.match(productionView(c.model),/Source document/);
 await c.click({id:'project-scene-auth-save',dataset:{}});
 assert.equal(c.model.sceneAuthority.summary.current,1);assert.match(productionView(c.model),/CURRENT_UNVERIFIED/);
 assert.match(productionView(c.model),/No drones/);
 }finally{await s.close();}
});
test('same normalized text from DIFFERENT original PDFs cannot silently inherit source-scoped work',()=>{
 const a=pdf(),b=pdf(undefined,{compressed:true});const w=createProduction({id:'reorigin',title:'Different bytes same words'});
 applySourceImport(w,inspectImport(file(a)),{documentId:'permit'});
 assert.throws(()=>applySourceImport(w,inspectImport(file(b)),{documentId:'permit'}),/new document ID/);
 assert.equal(w.documents.length,1);assert.equal(w.documents[0].importReceipt.rawHash,sha(a));
 applySourceImport(w,inspectImport(file(b)),{documentId:'permit_new_binary'});assert.equal(w.documents.length,2);
});
test('two-page source order and original page quotation map remain explicit',()=>{
 const chunks=[Buffer.from('%PDF-1.4\n')],offsets=[0];
 const stream=(line)=>{const value=Buffer.from(`BT /F1 10 Tf 72 700 Td (${line}) Tj ET`,'ascii');return Buffer.concat([Buffer.from(`<< /Length ${value.length} >>\nstream\n`),value,Buffer.from('\nendstream')]);};
 const bodies=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>',
  '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',stream('No smoke on stage.'),
  '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>',stream('No drones near audience.')];
 for(let i=0;i<bodies.length;i++){offsets.push(Buffer.concat(chunks).length);chunks.push(Buffer.from(`${i+1} 0 obj\n`),Buffer.isBuffer(bodies[i])?bodies[i]:Buffer.from(bodies[i]),Buffer.from('\nendobj\n'));}
 const xref=Buffer.concat(chunks).length;chunks.push(Buffer.from(`xref\n0 8\n0000000000 65535 f \n${offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Root 1 0 R /Size 8 >>\nstartxref\n${xref}\n%%EOF\n`));
 const out=extractConservativePdf(Buffer.concat(chunks));assert.equal(out.text,'No smoke on stage.\nNo drones near audience.');assert.deepEqual(out.sourceMap.map(x=>x.page),[1,2]);
});
test('scanner image, suspicious annotations and synthetic embedded JavaScript are not treated as parsed permit conditions',()=>{
 const scanned=pdf(undefined,{content:'q 72 0 0 72 20 20 cm /Im0 Do Q'});
 assert.throws(()=>extractConservativePdf(scanned),/PDF intake/);
 const other=Buffer.from(pdf().toString('latin1').replace('/Type /Catalog','/OpenAction /Type /Catalog'),'latin1');
 assert.throws(()=>extractConservativePdf(other),/security/);
});
