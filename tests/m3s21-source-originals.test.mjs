import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createSourceOriginalVault,referencedOriginals} from '../src/source-originals.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createProduction,applySourceImport} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from '../src/production-lifecycle.mjs';
import {createAppServer} from '../server.mjs';
const permit='Only Scene 31 may use the glass hall.\n\nNo drones.\n\nCamera carriage requires issued protective boards.';
const later='Only Scene 31 may use the glass hall.\n\nNo drones.\n\nCamera carriage requires issued protective boards.\n\nNo public foyer access.';
const csv='Scene,Location,Start,End,Activity\n31,Glass hall,10:00,11:30,Rubber wheeled camera carriage';
const digest=b=>createHash('sha256').update(b).digest('hex');
const textFile=(name,text,kind='permit')=>({name,kind,contentBase64:Buffer.from(text,'utf8').toString('base64')});
async function fixture(){
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-s21-'));
 const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory}),vault=createSourceOriginalVault({directory});
 const w=createProduction({id:'originals_s21',title:'Original evidence across revisions'});
 const first=textFile('permit.txt',permit),sheet=textFile('sheet.csv',csv,'callSheet');
 for(const [file,documentId] of [[first,'P1'],[sheet,null]]){
  const envelope=inspectImport(file);applySourceImport(w,envelope,{documentId});await vault.storeImport(file,envelope);
 }
 const saved=await store.persist(w,{expectedVersion:0});
 return {directory,store,execution,vault,w,saved,first,sheet,cleanup:()=>fs.rm(directory,{recursive:true,force:true})};
}
const bundleHash=b=>digest(Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(b).filter(([key])=>key!=='sha256')))));
test('original vault preserves exact uploaded bytes, not a UTF-8 normalization substitute',async()=>{
 const p=await fixture();try{
  assert.equal((await p.vault.read(digest(Buffer.from(permit)))).toString(),permit);
  const inventory=await p.vault.inventory(p.w,{includeBytes:true});assert.equal(inventory.preserved,2);assert(inventory.complete);
  assert(inventory.items.every(x=>Buffer.from(x.contentBase64,'base64').length===x.byteCount));
  assert.equal((await p.vault.storeImport(p.first,inspectImport(p.first))).alreadyPresent,true);
 }finally{await p.cleanup();}
});
test('a mismatched source byte receipt is rejected without changing the existing file',async()=>{
 const p=await fixture();try{
  const envelope=inspectImport(p.first),incorrect={...envelope,rawHash:'f'.repeat(64)};
  await assert.rejects(p.vault.storeImport(p.first,incorrect),/disagrees/);
  assert.equal((await p.vault.read(envelope.rawHash)).toString(),permit);
  await assert.rejects(p.vault.storeImport({...p.first,contentBase64:'not-base64'},envelope),/base64/);
 }finally{await p.cleanup();}
});
test('corrupted persisted original blobs fail closed rather than being exported as valid',async()=>{
 const p=await fixture();try{
  const hash=digest(Buffer.from(permit)),original=path.join(p.vault.directory,hash+'.bin');
  await fs.writeFile(original,'forged text');
  await assert.rejects(p.vault.read(hash),/checksum mismatch/);
  await assert.rejects(p.vault.inventory(p.w,{includeBytes:true}),/checksum mismatch/);
  await assert.rejects(createLifecycleBackup(p.saved,p.execution,{sourceVault:p.vault}),/checksum mismatch/);
 }finally{await p.cleanup();}
});
test('portable backup embeds verified original bytes and recovery restores them before the project',async()=>{
 const p=await fixture();try{
  const bundle=await createLifecycleBackup(p.saved,p.execution,{sourceVault:p.vault,asOf:'2026-10-25T15:00:00.000Z'});
  assert.equal(bundle.originalBytesIncluded,true);assert.equal(bundle.originalSources.preserved,2);assert.equal(bundle.originalSources.totalBytes,Buffer.byteLength(permit)+Buffer.byteLength(csv));
  assert.equal(verifyLifecycleBackup(bundle,p.execution).originalFileCount,2);
  const newdir=path.join(p.directory,'recovered');const store=createWorkspaceStore({directory:newdir}),execution=createDurableExecution({directory:newdir});
  const restored=await restoreLifecycleBackup(bundle,{workspaceStore:store,execution,ownerConfirmed:true});
  assert.equal(restored.restoredOriginals,2);
  const vault=createSourceOriginalVault({directory:newdir});assert((await vault.read(digest(Buffer.from(permit)))).equals(Buffer.from(permit)));
  assert((await vault.read(digest(Buffer.from(csv)))).equals(Buffer.from(csv)));
  assert.equal((await store.load(p.w.id)).workspace.imports.length,2);
 }finally{await p.cleanup();}
});
test('source revisions keep BOTH old and current exact original bytes in the portable archive',async()=>{
 const p=await fixture();try{
  const second=textFile('permit.txt',later),env=inspectImport(second);
  applySourceImport(p.w,env,{documentId:'P1'});await p.vault.storeImport(second,env);
  const saved=await p.store.persist(p.w,{expectedVersion:1});
  const bundle=await createLifecycleBackup(saved,p.execution,{sourceVault:p.vault});
  assert.equal(referencedOriginals(p.w).length,3);
  assert.equal(bundle.originalSources.preserved,3);assert(bundle.originalSources.complete);
  const target=path.join(p.directory,'revision-recovered');
  await restoreLifecycleBackup(bundle,{workspaceStore:createWorkspaceStore({directory:target}),execution:createDurableExecution({directory:target}),ownerConfirmed:true});
  const vault=createSourceOriginalVault({directory:target});
  assert((await vault.read(digest(Buffer.from(permit)))).equals(Buffer.from(permit)));
  assert((await vault.read(digest(Buffer.from(later)))).equals(Buffer.from(later)));
 }finally{await p.cleanup();}
});
test('legacy projects with missing original blobs honestly report unavailable source bytes',async()=>{
 const p=await fixture();try{
  await fs.rm(path.join(p.vault.directory,digest(Buffer.from(csv))+'.bin'));
  const bundle=await createLifecycleBackup(p.saved,p.execution,{sourceVault:p.vault});
  assert.equal(bundle.originalSources.preserved,1);assert.equal(bundle.originalSources.missingOriginalSha256.length,1);
  assert.equal(bundle.originalSources.complete,false);assert.equal(verifyLifecycleBackup(bundle,p.execution).missingOriginalFiles,1);
  const target=path.join(p.directory,'partial');await restoreLifecycleBackup(bundle,{workspaceStore:createWorkspaceStore({directory:target}),execution:createDurableExecution({directory:target}),ownerConfirmed:true});
  const files=await createSourceOriginalVault({directory:target}).inventory(p.w);assert.equal(files.preserved,1);assert.equal(files.missingOriginalSha256.length,1);
 }finally{await p.cleanup();}
});
test('a forged embedded original fails even if the outer backup hash is recomputed',async()=>{
 const p=await fixture();try{
  const bundle=await createLifecycleBackup(p.saved,p.execution,{sourceVault:p.vault});
  const changed=structuredClone(bundle);changed.originalSources.items[0].contentBase64=Buffer.from('fake').toString('base64');changed.sha256=bundleHash(changed);
  assert.throws(()=>verifyLifecycleBackup(changed,p.execution),/Original source bytes/);
 }finally{await p.cleanup();}
});
test('archive detects missing, duplicated, or unrelated original-source records after checksum recomputation',async()=>{
 const p=await fixture();try{
  const original=await createLifecycleBackup(p.saved,p.execution,{sourceVault:p.vault});
  for(const mutate of [
   v=>{v.originalSources.items.push(structuredClone(v.originalSources.items[0]));v.originalSources.preserved++;},
   v=>{v.originalSources.items[0].rawHash='f'.repeat(64);},
   v=>{v.originalBytesIncluded=false;},
   v=>{v.originalSources.complete=false;}
  ]){const changed=structuredClone(original);mutate(changed);changed.sha256=bundleHash(changed);assert.throws(()=>verifyLifecycleBackup(changed,p.execution),/Original|archive/);}
 }finally{await p.cleanup();}
});
test('recovery requires deliberate authorization even with embedded private originals',async()=>{
 const p=await fixture();try{
  const bundle=await createLifecycleBackup(p.saved,p.execution,{sourceVault:p.vault});
  const dest=path.join(p.directory,'unauthorized');
  await assert.rejects(restoreLifecycleBackup(bundle,{workspaceStore:createWorkspaceStore({directory:dest}),execution:createDurableExecution({directory:dest})}),/authorization/);
  await assert.rejects(fs.access(dest));
 }finally{await p.cleanup();}
});
test('source original HTTP API requires a referenced hash and returns byte-identical attachments',async()=>{
 const p=await fixture();let server;try{
  server=createAppServer({enabled:false,workspaceStore:p.store,executionStore:p.execution,sourceVault:p.vault});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const base='http://127.0.0.1:'+server.address().port;
  const list=await fetch(base+'/api/workspaces/'+p.w.id+'/originals');assert.equal(list.status,200);
  const info=await list.json();assert.equal(info.files.length,2);assert.equal(info.missingOriginalSha256.length,0);
  const hash=digest(Buffer.from(permit));const download=await fetch(base+'/api/workspaces/'+p.w.id+'/originals/'+hash);
  assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/attachment/);
  assert(Buffer.from(await download.arrayBuffer()).equals(Buffer.from(permit)));
  assert.equal((await fetch(base+'/api/workspaces/'+p.w.id+'/originals/'+'0'.repeat(64))).status,404);
  assert.equal((await fetch(base+'/api/workspaces/'+p.w.id+'/originals/'+hash,{headers:{Origin:'https://attacker.example'}})).status,403);
  const backup=await (await fetch(base+'/api/workspaces/'+p.w.id+'/lifecycle/backup')).json();
  assert.equal(backup.originalSources.preserved,2);assert.equal(verifyLifecycleBackup(backup,p.execution).originalFileCount,2);
  assert.equal((await p.store.load(p.w.id)).version,1);
 }finally{if(server)await new Promise(done=>server.close(done));await p.cleanup();}
});
test('new HTTP file import atomically captures original byte identity before exposing committed workspace',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-s21-http-'));let server;try{
  const store=createWorkspaceStore({directory});server=createAppServer({enabled:false,workspaceStore:store});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const base='http://127.0.0.1:'+server.address().port;
  const post=async(url,input)=>fetch(base+url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
  const created=await post('/api/workspaces',{id:'actual_http',title:'Actual upload'});assert.equal(created.status,201);
  const file=textFile('permit.txt',permit),imported=await post('/api/workspaces/actual_http/import',{expectedVersion:1,documentId:'p1',file});assert.equal(imported.status,200);
  const receipt=(await imported.json()).workspace.documents[0].importReceipt;
  const original=await fetch(base+'/api/workspaces/actual_http/originals/'+receipt.rawHash);
  assert.equal(original.status,200);assert(Buffer.from(await original.arrayBuffer()).equals(Buffer.from(permit)));
  const stale=await post('/api/workspaces/actual_http/import',{expectedVersion:1,documentId:'p1',file:textFile('permit.txt',later)});assert.equal(stale.status,409);
  const inv=await (await fetch(base+'/api/workspaces/actual_http/originals')).json();assert.equal(inv.preserved,1);
 }finally{if(server)await new Promise(done=>server.close(done));await fs.rm(directory,{recursive:true,force:true});}
});
test('legacy original can be reconnected by exact SHA-256 without editing source revisions or model journals',async()=>{
 const p=await fixture();let server;try{
  const hash=digest(Buffer.from(permit));await fs.rm(path.join(p.vault.directory,hash+'.bin'));
  server=createAppServer({enabled:false,workspaceStore:p.store,executionStore:p.execution,sourceVault:p.vault});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const base='http://127.0.0.1:'+server.address().port;
  const post=async input=>{const r=await fetch(base+'/api/workspaces/'+p.w.id+'/originals/relink',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});return {status:r.status,body:await r.json()};};
  const wrong=await post({expectedVersion:1,rawHash:hash,file:{contentBase64:Buffer.from('not the original').toString('base64')}});
  assert.equal(wrong.status,422);assert.equal(await p.vault.read(hash),null);
  const stale=await post({expectedVersion:0,rawHash:hash,file:{contentBase64:p.first.contentBase64}});assert.equal(stale.status,409);
  const success=await post({expectedVersion:1,rawHash:hash,file:{contentBase64:p.first.contentBase64}});
  assert.equal(success.status,200);assert.equal(success.body.workspaceChanged,false);assert.equal(success.body.newClockedCalls,0);
  const saved=await p.store.load(p.w.id);assert.equal(saved.version,1);assert.equal(saved.workspace.revision,p.w.revision);
  assert.equal((await p.vault.inventory(p.w)).preserved,2);
 }finally{if(server)await new Promise(done=>server.close(done));await p.cleanup();}
});
test('a production cannot attach a different project original through the hash-relink route',async()=>{
 const p=await fixture();try{
  const hash=digest(Buffer.from('Unrelated original file'));
  await assert.rejects(p.vault.relink(p.w,{rawHash:hash,file:{contentBase64:Buffer.from('Unrelated original file').toString('base64')}}),/not referenced/);
  assert.equal(await p.vault.read(hash),null);
 }finally{await p.cleanup();}
});
test('UTF-8 BOM and original line endings survive normalized transcript hashing and backup',async()=>{
 const p=await fixture();try{
  const original=Buffer.from('\ufeffNo drones.\r\n\r\nCrane allowed only with approval.','utf8');
  const upload={name:'bom.md',kind:'permit',contentBase64:original.toString('base64')};
  const receipt=inspectImport(upload);assert.notEqual(receipt.rawHash,receipt.normalizedHash);
  applySourceImport(p.w,receipt,{documentId:'BOM'});await p.vault.storeImport(upload,receipt);
  const saved=await p.store.persist(p.w,{expectedVersion:1}),bundle=await createLifecycleBackup(saved,p.execution,{sourceVault:p.vault});
  const stored=bundle.originalSources.items.find(x=>x.rawHash===digest(original));assert(stored);
  assert(Buffer.from(stored.contentBase64,'base64').equals(original));assert.equal(verifyLifecycleBackup(bundle,p.execution).originalFileCount,3);
 }finally{await p.cleanup();}
});
test('manual-text workspace without uploaded files remains a valid partial-life-cycle backup',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'beforeroll-s21-manual-'));try{
  const w=createProduction({id:'manual_s21',title:'Manual only',documents:[{id:'p1',name:'typed permit',text:permit}]});
  const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory});const saved=await store.persist(w,{expectedVersion:0});
  const bundle=await createLifecycleBackup(saved,execution,{sourceVault:createSourceOriginalVault({directory})});
  assert.equal(bundle.originalBytesIncluded,false);assert.equal(bundle.originalSources.referenced,0);assert.equal(bundle.originalSources.complete,true);
  assert.equal(verifyLifecycleBackup(bundle,execution).originalFileCount,0);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
test('no original-file symlinks may be read as owner evidence',async()=>{
 const p=await fixture();try{
  const hash=digest(Buffer.from(csv)),filename=path.join(p.vault.directory,hash+'.bin');
  await fs.rm(filename);
  if(process.platform==='win32'){
   // Standard Windows accounts cannot always create symbolic links. Keep the
   // gate non-elevated: use a corrupt regular blob rather than skipping.
   await fs.writeFile(filename,Buffer.from('wrong bytes'));
   await assert.rejects(p.vault.read(hash),/checksum mismatch/);
  }else{
   await fs.symlink(path.join(p.directory,'fake-file'),filename);
   await assert.rejects(p.vault.read(hash),/Invalid original-file blob/);
  }
 }finally{await p.cleanup();}
});
test('old v0.18.0 backup envelopes remain verifiable and recoverable with their known original-byte limitation',async()=>{
 const p=await fixture();try{
  const bundle=await createLifecycleBackup(p.saved,p.execution);
  assert.equal(bundle.originalSources,undefined);assert.equal(bundle.originalBytesIncluded,false);
  const checked=verifyLifecycleBackup(bundle,p.execution);assert.equal(checked.missingOriginalFiles,2);
  const target=path.join(p.directory,'legacy');
  const restore=await restoreLifecycleBackup(bundle,{workspaceStore:createWorkspaceStore({directory:target}),execution:createDurableExecution({directory:target}),ownerConfirmed:true});
  assert.equal(restore.restoredOriginals,0);
 }finally{await p.cleanup();}
});
