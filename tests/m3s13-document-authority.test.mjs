import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {inspectImport} from '../src/source-intake.mjs';
import {createProduction,applySourceImport,reviseDocument,exportWorkspace,importWorkspace} from '../src/production-workspace.mjs';
import {annotateAuthorityDocument,recordAuthorityLink,projectAuthorityGraph,assertAuthorityIntegrity} from '../src/document-authority.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createAppServer} from '../server.mjs';
import {createWorkspaceController,productionView} from '../public/workspace-desk.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
function crc32(b){let c=0xffffffff;for(const n of b){c^=n;for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xedb88320:0);}return(c^0xffffffff)>>>0;}
const w16=x=>{const b=Buffer.alloc(2);b.writeUInt16LE(x);return b;};
const w32=x=>{const b=Buffer.alloc(4);b.writeUInt32LE(x>>>0);return b;};
/** Test-only canonical ZIP writer, independent from the application reader. */
function zipOf(data,{badCrc=false,extra=[]}={}){
 let local=[],central=[],at=0;
 for(const [name,dataValue] of [...Object.entries(data),...extra]){
  const raw=Buffer.isBuffer(dataValue)?dataValue:Buffer.from(dataValue);
  const packed=deflateRawSync(raw),fname=Buffer.from(name),crc=crc32(raw);
  const header=Buffer.concat([w32(0x04034b50),w16(20),w16(0),w16(8),w16(0),w16(0),w32(crc),w32(packed.length),w32(raw.length),w16(fname.length),w16(0),fname]);
  local.push(header,packed);central.push(Buffer.concat([w32(0x02014b50),w16(20),w16(20),w16(0),w16(8),w16(0),w16(0),w32(badCrc?crc+1:crc),w32(packed.length),w32(raw.length),w16(fname.length),w16(0),w16(0),w16(0),w16(0),w32(0),w32(at),fname]));at+=header.length+packed.length;
 }
 const cd=Buffer.concat(central);return Buffer.concat([...local,cd,w32(0x06054b50),w16(0),w16(0),w16(central.length),w16(central.length),w32(cd.length),w32(at),w16(0)]);
}
const xmlBody='<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Do not use drones.</w:t></w:r></w:p><w:p><w:r><w:t>Amendment M-4 &amp; Scene 52.</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Location</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>North Gallery</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>';
const pack=(document=xmlBody,extra=[])=>zipOf({'[Content_Types].xml':'<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>','_rels/.rels':'<Relationships/>','word/document.xml':document},{extra});
const permit='ISSUED PERMIT P1 covers Room A.\n\nAmendment A2 modifies P1 for Scene 52, provided a steward is present.';
const amendment='AMENDMENT A2 is subject to approval.\n\nScene 52 requires signed steward checklist.';
const csv='Scene,Location,Start,End,Activity\n52,Room A,10:00,10:20,Move camera through gallery';
const fixture=()=>{const w=createProduction({id:'graph',title:'Documented gallery'});applySourceImport(w,inspectImport({name:'permit.txt',kind:'permit',text:permit}),{documentId:'p1'});applySourceImport(w,inspectImport({name:'amend.txt',kind:'permit',text:amendment}),{documentId:'a2'});applySourceImport(w,inspectImport({name:'sheet.csv',kind:'callSheet',text:csv}));return w;};
const anchor=(w,id='p1',idx=1)=>{const x=w.documents.find(d=>d.id===id).units[idx];return {start:x.start,end:x.end,quote:x.text};};
test('actual DOCX ZIP main-body paragraphs and tables extract source text with raw-byte hashes and text offsets',()=>{
 const bytes=pack();const receipt=inspectImport({name:'permit.docx',kind:'permit',contentBase64:bytes.toString('base64')});
 assert.equal(receipt.rawHash,sha(bytes));assert.equal(receipt.sourceFormat,'DOCX_MAIN_BODY_TEXT_V1');
 assert.match(receipt.text,/Do not use drones\./);assert.match(receipt.text,/Amendment M-4 & Scene 52/);assert.match(receipt.text,/Location \| North Gallery/);
 assert.equal(receipt.normalizedHash,sha(receipt.text));assert.equal(receipt.sourceMap.length,3);
 assert.equal(Array.from(receipt.text).slice(receipt.sourceMap[2].start,receipt.sourceMap[2].end).join(''),'Location | North Gallery');
 const w=createProduction({id:'docx',title:'Source-bound document'});applySourceImport(w,receipt,{documentId:'permit'});
 assert.equal(w.documents[0].importReceipt.rawHash,sha(bytes));assert(planIntelligence({...w,callSheet:fixture().callSheet}).plannedCalls>=3);
});
test('docx corrupt CRC is rejected rather than presenting invented text',()=>assert.throws(()=>inspectImport({name:'permit.docx',kind:'permit',contentBase64:zipOf({'[Content_Types].xml':'wordprocessingml.document.main+xml','_rels/.rels':'ok','word/document.xml':xmlBody},{badCrc:true}).toString('base64')}),/CRC mismatch/));
test('docx external relationships are rejected before extracting even if document body seems readable',()=>assert.throws(()=>inspectImport({name:'permit.docx',kind:'permit',contentBase64:pack(xmlBody,[['word/_rels/document.xml.rels','<Relationships><Relationship TargetMode="External" Target="http://x"/></Relationships>']]).toString('base64')}),/External relationship/));
test('docx tracked changes or footnotes fail closed to avoid silent omission',()=>{for(const mark of ['<w:ins w:id="1">','<w:footnoteReference w:id="2"/>','<w:drawing/>']){const xml=xmlBody.replace('</w:body>',mark+'</w:body>');assert.throws(()=>inspectImport({name:'x.docx',kind:'permit',contentBase64:pack(xml).toString('base64')}),/Unsupported review-critical/);}});
test('docx missing package parts, zip-slip path, and fake PDF remain unsupported',()=>{
 const noDoc=zipOf({'[Content_Types].xml':'wordprocessingml.document.main+xml','_rels/.rels':'ok'});assert.throws(()=>inspectImport({name:'x.docx',kind:'permit',contentBase64:noDoc.toString('base64')}),/ordinary .docx/);
 const traversal=pack(xmlBody,[['../escape.txt','a']]);assert.throws(()=>inspectImport({name:'x.docx',kind:'permit',contentBase64:traversal.toString('base64')}),/Unsafe/);
 assert.throws(()=>inspectImport({name:'permit.pdf',kind:'permit',text:'%PDF-1.7 pretend'}),/not supported/);
});
test('docx call sheet is not passed off as validated structured schedule',()=>assert.throws(()=>inspectImport({name:'sheet.docx',kind:'callSheet',contentBase64:pack().toString('base64')}),/call-sheet import/));
test('metadata is human-labeled, unverified, bound to document exact source revision and persisted across serialization',()=>{
 const w=fixture();annotateAuthorityDocument(w,{documentId:'a2',role:'AMENDMENT',reference:'A2',issuer:'Office, unverified',issuedOn:'2026-11-08',reviewer:'Coordinator',reason:'Paper title read by human'});
 const restored=importWorkspace(exportWorkspace(w));assert.equal(restored.documents[1].authority.reference,'A2');assert.equal(projectAuthorityGraph(restored).documents[1].metadataStatus,'HUMAN_RECORDED_UNVERIFIED');
 reviseDocument(w,'a2',amendment+'\n\nNo drones.');assert.equal(w.documents[1].authority,null);
});
test('source-anchored relationship connects two documents, creates an auditable graph, not a legal clearance conclusion',()=>{
 const w=fixture();recordAuthorityLink(w,{fromId:'p1',toId:'a2',kind:'REFERENCES',...anchor(w),reviewer:'Coordinator',reason:'Manual cross-reference'});
 const graph=projectAuthorityGraph(w);assert.equal(graph.links.length,1);assert.equal(graph.summary.staleLinks,0);assert.equal(graph.scenes[0].notClearance,true);
 assert.equal(graph.links[0].quote,anchor(w).quote);assert.equal(graph.links[0].status,'HUMAN_ASSERTED_UNVERIFIED');assertAuthorityIntegrity(w);
});
test('source editing stales original graph relation but retains history and prevents stale relation from appearing current',()=>{
 const w=fixture();recordAuthorityLink(w,{fromId:'p1',toId:'a2',kind:'AMENDS',...anchor(w),reviewer:'Auditor',reason:'Needs cross-check'});
 reviseDocument(w,'a2',amendment+'\n\nNot approved.');const result=projectAuthorityGraph(w);
 assert.equal(result.summary.staleLinks,1);assert.equal(result.links[0].status,'STALE_ORIGINAL_SOURCE');assert.equal(w.authorityLinks.length,1);
});
test('tampered source offsets and forged relationship identities cannot be loaded or trusted',()=>{
 const w=fixture();recordAuthorityLink(w,{fromId:'p1',toId:'a2',kind:'REFERENCES',...anchor(w),reviewer:'Auditor',reason:'Owner asserted'});
 w.authorityLinks[0].quote='FORGED';assert.throws(()=>assertAuthorityIntegrity(w),/integrity|identity/);
 w.authorityLinks[0].fromHash=w.documents[0].sourceHash;assert.throws(()=>assertAuthorityIntegrity(w),/integrity/);
});
test('invalid document dates, unreviewed role, and unsupported sources cannot become documentary facts',()=>{
 const w=fixture();const b={documentId:'p1',role:'AMENDMENT',reference:'A2',issuer:'Office',reviewer:'A',reason:'Manual'};
 assert.throws(()=>annotateAuthorityDocument(w,{...b,issuedOn:'2026-02-30'}),/requires/);
 assert.throws(()=>annotateAuthorityDocument(w,{...b,role:'SIGNED_AUTHORITY',issuedOn:null}),/requires/);
 assert.throws(()=>recordAuthorityLink(w,{fromId:'p1',toId:'unknown',kind:'AMENDS',...anchor(w),reviewer:'A',reason:'Check'}),/two different/);
});
test('cycle protection covers mixed AMENDS and SUPERSEDES chains',()=>{
 const w=fixture();recordAuthorityLink(w,{fromId:'p1',toId:'a2',kind:'AMENDS',...anchor(w),reviewer:'A',reason:'Chain'});
 assert.throws(()=>recordAuthorityLink(w,{fromId:'a2',toId:'p1',kind:'SUPERSEDES',...anchor(w,'a2',0),reviewer:'A',reason:'cycle'}),/Circular/);
});
test('authority graph is paginated and never silently clips or authenticates source authority',()=>{
 const w=fixture();recordAuthorityLink(w,{fromId:'p1',toId:'a2',kind:'CONFLICTS_WITH',...anchor(w),reviewer:'Auditor',reason:'Question'});
 assert.equal(projectAuthorityGraph(w,{offset:0,limit:1}).summary.unresolvedConflicts,1);
 assert.throws(()=>projectAuthorityGraph(w,{offset:-1}),/pagination/);
});
async function local(){const directory=await mkdtemp(path.join(os.tmpdir(),'beforeroll-m3s13-'));const server=createAppServer({enabled:false,workspaceStore:createWorkspaceStore({directory})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;const request=async(method,url,body)=>{const resp=await fetch(base+url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:resp.status,data:await resp.json()};};return {directory,request,fetchLocal:(uri,opts)=>fetch(base+uri,opts),async close(){await new Promise(r=>server.close(r));await rm(directory,{recursive:true,force:true});}};}
async function populated(s){await s.request('POST','/api/workspaces',{id:'graph',title:'Authority graph'});await s.request('POST','/api/workspaces/graph/import',{expectedVersion:1,documentId:'p1',file:{name:'permit.txt',kind:'permit',text:permit}});await s.request('POST','/api/workspaces/graph/import',{expectedVersion:2,documentId:'a2',file:{name:'amend.txt',kind:'permit',text:amendment}});await s.request('POST','/api/workspaces/graph/import',{expectedVersion:3,file:{name:'sheet.csv',kind:'callSheet',text:csv}});}
test('actual owner project API persists metadata and links with optimistic version protection and reads graph',async()=>{
 const s=await local();try{await populated(s);
  let r=await s.request('POST','/api/workspaces/graph/authority-document',{expectedVersion:4,documentId:'a2',role:'AMENDMENT',reference:'A2',issuer:'Unverified office',issuedOn:'2026-11-08',reviewer:'A',reason:'Human original'});assert.equal(r.status,200);
  r=await s.request('POST','/api/workspaces/graph/authority-link',{expectedVersion:5,fromId:'p1',toId:'a2',unitId:'U002',kind:'AMENDS',reviewer:'A',reason:'Verify signature'});assert.equal(r.status,200);
  const graph=await s.request('GET','/api/workspaces/graph/authority');assert.equal(graph.status,200);assert.equal(graph.data.summary.currentLinks,1);
  assert.equal(graph.data.documents.find(d=>d.id==='a2').metadata.reference,'A2');
  assert.equal((await s.request('POST','/api/workspaces/graph/authority-link',{expectedVersion:5,fromId:'p1',toId:'a2',unitId:'U002',kind:'AMENDS',reviewer:'A',reason:'Verify signature'})).status,409);
  assert.equal((await s.request('GET','/api/workspaces/graph/overview')).status,200);
 }finally{await s.close();}
});
test('HTTP DOCX intake through workspace endpoint preserves normalized audit and blocks repeat spoofing',async()=>{
 const s=await local();try{await s.request('POST','/api/workspaces',{id:'docx',title:'DOCX film'});
 const bytes=pack(),r=await s.request('POST','/api/workspaces/docx/import',{expectedVersion:1,documentId:'p',file:{name:'permit.docx',kind:'permit',contentBase64:bytes.toString('base64')}});
 assert.equal(r.status,200);assert.equal(r.data.workspace.documents[0].importReceipt.sourceFormat,'DOCX_MAIN_BODY_TEXT_V1');
 assert.equal(r.data.workspace.documents[0].importReceipt.rawHash,sha(bytes));
 assert.equal((await s.request('GET','/api/workspaces/docx/authority')).status,200);
 }finally{await s.close();}
});
test('browser controller renders documentary source graph and saves reviewer classification via owner API without exposing credentials',async()=>{
 const s=await local();try{await populated(s);
 const values={'project-authority-document':'a2','project-authority-role':'AMENDMENT','project-authority-reference':'A2','project-authority-issuer':'Unverified office','project-authority-date':'2026-11-08','project-authority-reviewer':'A','project-authority-reason':'Original paper'};
 const root={querySelector:q=>({value:values[q.slice(1)]??'',dataset:{},files:[]})};const controller=createWorkspaceController({fetchImpl:s.fetchLocal,root});await controller.load();await controller.click({id:'',dataset:{projectOpen:'graph'}});
 assert.match(productionView(controller.model),/Documentary authority/);
 await controller.click({id:'project-authority-save',dataset:{}});
 assert.equal(controller.model.authority.documents.find(d=>d.id==='a2').metadata.role,'AMENDMENT');
 assert.equal(controller.model.authority.notClearance,true);
 }finally{await s.close();}
});
