import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {createAppServer} from '../server.mjs';import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';import {createProduction,addDocument,setCallSheet,recordReview,applySourceImport} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {productionHistory} from '../src/production-history.mjs';import {buildProductionDossier} from '../src/production-dossier.mjs';
import {createLifecycleBackup} from '../src/production-lifecycle.mjs';import {encryptOwnerBackup} from '../src/secure-backup.mjs';
import {annotateAuthorityDocument,assertAuthorityIntegrity} from '../src/document-authority.mjs';
import {createWorkspaceController} from '../public/workspace-desk.mjs';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
const sheet='Scene 31 | Fictional Yard | 09:00-10:00 | Handheld camera\nScene 32 | Fictional Yard | 11:00-12:00 | Rolling camera';
const make=()=>{const w=createProduction({id:'closure',title:'Generated closure fixture'});addDocument(w,{id:'P',name:'Fictional permit',text:'No drones.\n\nKeep exits clear.'});setCallSheet(w,sheet);return w;};
test('offline CLI replacement obeys the exact preview and preserves both original files',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'br-closure-cli-'));try{
  const first=path.join(directory,'first.txt'),changed=path.join(directory,'changed.txt');await writeFile(first,'No drones.');await writeFile(changed,'No smoke.');
  const cli=(...args)=>promisify(execFile)(process.execPath,['scripts/workspace-cli.mjs',...args],{env:{...process.env,BEFOREROLL_DATA_DIR:directory}});
  await cli('init','cli_fixture','Generated CLI fixture');await cli('import','cli_fixture','permit','P',first);
  await assert.rejects(cli('import','cli_fixture','permit','P',changed),/preview/i);
  const preview=JSON.parse((await cli('preview-import','cli_fixture','permit','P',changed)).stdout);
  await cli('import','cli_fixture','permit','P',changed,preview.previewSha256);
  await assert.rejects(cli('import','cli_fixture','permit','P',first,preview.previewSha256),/preview/i);
  const saved=await createWorkspaceStore({directory}).load('cli_fixture');const custody=await createSourceOriginalVault({directory}).inventory(saved.workspace);
  assert.equal(saved.version,3);assert.equal(saved.workspace.documents[0].name,'changed.txt');assert.equal(custody.preserved,2);assert.equal(custody.complete,true);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('revised filenames and repeated provenance reviews preserve exact current and historical identities',()=>{
 const w=make();const meta={documentId:'P',role:'PERMIT',reference:'Fictional 42',issuer:'Fictional issuer',reviewer:'Generated reviewer',reason:'Initial source inspection'};
 annotateAuthorityDocument(w,meta);annotateAuthorityDocument(w,{...meta,reason:'Corrected provenance note'});assertAuthorityIntegrity(w);
 let d=buildProductionDossier(w,{persistedVersion:1});let h=productionHistory(w,d,[],{kind:'AUTHORITY'});
 assert.deepEqual(h.records.map(r=>r.status),['HISTORICAL','CURRENT']);
 applySourceImport(w,inspectImport({kind:'permit',name:'revised-name.txt',text:'No drones.\n\nNo smoke.'}),{documentId:'P'});
 assert.equal(w.documents[0].name,'revised-name.txt');assert.equal(w.authorityDocumentHistory.length,2);
 d=buildProductionDossier(w,{persistedVersion:2});h=productionHistory(w,d,[],{kind:'AUTHORITY'});assert(h.records.every(r=>r.status==='HISTORICAL'));
});
test('unsaved work is detectable without storing passwords and staged sessions cannot disappear on project switch',async()=>{
 const ctl=createWorkspaceController({root:{querySelector:()=>null}});assert.equal(ctl.hasUncommittedWork(),false);
 ctl.markDraftChange({id:'project-backup-passphrase',type:'password'});assert.equal(ctl.hasUncommittedWork(),false);
 ctl.markDraftChange({id:'project-scene-reason',type:'textarea'});assert.equal(ctl.hasUncommittedWork(),true);
 ctl.model.diagnostics={old:true};ctl.selectProduction({version:1,workspace:make()});assert.equal(ctl.hasUncommittedWork(),false);assert.equal(ctl.model.diagnostics,null);
 ctl.model.stagedReviews=[{evidenceId:'fictional'}];assert.equal(ctl.hasUncommittedWork(),true);
 await ctl.click({dataset:{projectOpen:'another'}});assert.equal(ctl.model.selected.workspace.id,'closure');assert.equal(ctl.model.stagedReviews.length,1);assert.match(ctl.model.error,/Uncommitted review session/);
});
test('prerequisite decision drafts cannot overwrite another selected prerequisite current status',async()=>{
 const field={id:'project-condition-decision',type:'select-one',tagName:'SELECT',value:'OPEN',options:['OPEN','BLOCKED','HUMAN_CONFIRMED_NOT_AUTHORITY'].map(value=>({value}))};
 const root={querySelector:selector=>selector==='#project-condition-decision'?field:null,querySelectorAll:()=>[field]};
 const ctl=createWorkspaceController({root});ctl.model.selected={version:1,workspace:make()};ctl.captureDrafts();
 await ctl.click({dataset:{conditionId:'confirmed'}});field.value='HUMAN_CONFIRMED_NOT_AUTHORITY';ctl.restoreDrafts();assert.equal(field.value,'HUMAN_CONFIRMED_NOT_AUTHORITY');
 field.value='BLOCKED';ctl.captureDrafts();await ctl.click({dataset:{conditionId:'different'}});field.value='OPEN';ctl.restoreDrafts();assert.equal(field.value,'OPEN');
 await ctl.click({dataset:{conditionId:'confirmed'}});field.value='HUMAN_CONFIRMED_NOT_AUTHORITY';ctl.restoreDrafts();assert.equal(field.value,'BLOCKED');
});
async function lab(){const directory=await mkdtemp(path.join(os.tmpdir(),'br-closure-')),store=createWorkspaceStore({directory}),ex=createDurableExecution({directory});let provider=0;
 const server=createAppServer({workspaceStore:store,executionStore:ex,controlledTestMode:true,enabled:true,apiKey:'CONTROLLED-NOT-A-KEY',operatorToken:'controlled-operator',fetchImpl:async()=>{provider++;return {ok:true,headers:new Headers({'x-clocked-credits':'0'}),json:async()=>({answers:{activity_link:{type:'noul',noul:.9},granted_for_scene:{type:'noul',noul:.01}}})};}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base=`http://127.0.0.1:${server.address().port}`;
 const req=async(url,body,headers={})=>{const r=await fetch(base+url,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};};
 return {directory,store,ex,req,provider:()=>provider,close:async()=>{await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}};}
test('complete history paginates all decisions, filters, and selects exact records beyond the first page',()=>{
 const w=make(),p=planIntelligence(w);for(let i=0;i<107;i++)recordReview(w,{evidenceId:p.taskIds[i%4],decision:'NEEDS_SOURCE',reviewer:'Generated Reviewer',reason:'History fixture '+i});
 const d=buildProductionDossier(w,{persistedVersion:1,asOf:'2026-10-25T00:00:00.000Z'});const ids=[];
 for(let offset=0;offset<107;offset+=20){const h=productionHistory(w,d,[],{kind:'REVIEWS',offset});assert.equal(h.filteredTotal,107);ids.push(...h.records.map(x=>x.id));}
 assert.equal(new Set(ids).size,107);const selected=productionHistory(w,d,[],{selectedId:ids[106],state:'CURRENT'});assert.equal(selected.selected.detail.sequence,107);assert.equal(selected.filteredTotal,4);
 const search=productionHistory(w,d,[],{kind:'REVIEWS',search:'History fixture 106'});assert.equal(search.filteredTotal,1);
 assert.throws(()=>productionHistory(w,d,[],{offset:-1}),/invalid/);
});
test('every HTTP replacement alias requires an exact preview, stale previews fail, and whole-state replacement is retired',async()=>{
 const l=await lab();try{await l.store.persist(make(),{expectedVersion:0});const root='/api/workspaces/closure';const input={expectedVersion:1,documentId:'P',file:{kind:'permit',name:'changed.txt',text:'No drones.\n\nNo smoke.'}};
  assert.equal((await l.req(root+'/import',input)).status,422);assert.equal((await l.req(root+'/replace',{expectedVersion:1,workspace:make()})).status,410);
  const preview=await l.req(root+'/impact',input);assert.equal(preview.status,200);
  const applied=await l.req(root+'/import',{...input,previewSha256:preview.body.previewSha256});assert.equal(applied.status,200);
  assert.equal((await l.req(root+'/commit-source-change',{...input,previewSha256:preview.body.previewSha256})).status,409);
  assert.equal(l.provider(),0);assert.equal((await l.store.load('closure')).version,2);
 }finally{await l.close();}
});
test('separate recovery preserves the same production ID and journals alongside the original, with actionable invalid-backup diagnostics',async()=>{
 const l=await lab();try{await l.store.persist(make(),{expectedVersion:0});const root='/api/workspaces/closure';
  await l.req(root+'/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:2},{'X-Operator-Token':'controlled-operator'});
  const backup=await createLifecycleBackup(await l.store.load('closure'),l.ex),passphrase='generated closure passphrase 2026',encrypted=await encryptOwnerBackup(backup,passphrase);
  const input={backup:encrypted,passphrase,destination:'separate'};
  const wrong=await l.req('/api/workspaces/recovery/verify',{...input,passphrase:'wrong'});assert.equal(wrong.body.code,'BACKUP_AUTHENTICATION_FAILED');assert.match(wrong.body.recoveryGuidance,/original unmodified/);
  const preview=await l.req('/api/workspaces/recovery/verify',input);assert.equal(preview.body.canRestore,true);
  const restored=await l.req('/api/workspaces/recovery/restore',{...input,previewSha256:backup.sha256,confirmId:'closure'});assert.equal(restored.status,201,restored.body.error);
  const header={'X-BeforeRoll-Recovery-Space':restored.body.recoverySpace};
  const workflow=await l.req(root+'/workflow',undefined,header);assert.equal(workflow.status,200,workflow.body.error);assert.equal(workflow.body.execution.completed,2);
  assert(workflow.body.history.records.some(r=>r.category==='RECOVERY'));
  assert(workflow.body.sceneWorkbench.tasks.some(r=>r.modelOrigin==='CONTROLLED_TEST_RESPONSE_NOT_CLOCKED'));
  assert.equal((await l.req('/api/workspaces')).body.items.filter(i=>i.id==='closure').length,2);
  assert.equal((await l.req('/api/workspaces/recovery/verify',input)).body.canRestore,false);
  assert.equal(l.provider(),2,'recovery makes no new transport calls');
  assert.equal((await l.req(root+'/workflow')).body.execution.completed,2,'original unchanged');
 }finally{await l.close();}
});
test('missing original custody blocks a complete recovery claim and lock diagnostics never remove a fence',async()=>{
 const l=await lab();try{const w=make();const file={kind:'permit',name:'new.txt',text:'Fictional missing original.'};applySourceImport(w,inspectImport(file),{documentId:'MISSING'});await l.store.persist(w,{expectedVersion:0});
  const backup=await createLifecycleBackup(await l.store.load('closure'),l.ex),passphrase='generated closure passphrase 2026',encrypted=await encryptOwnerBackup(backup,passphrase);
  const p=await l.req('/api/workspaces/recovery/verify',{backup:encrypted,passphrase,destination:'separate'});assert.equal(p.body.canRestore,false);assert.match(p.body.notice,/missing original/);
  await writeFile(path.join(l.directory,'.beforeroll-write.lock'),'generated stranded fence');
  const diag=await l.req('/api/workspaces/closure/diagnostics');assert.equal(diag.body.writerLock,true);assert.equal(diag.body.locksRemoved,false);assert.equal(diag.body.automaticClockedRetry,false);assert.match(diag.body.guidance,/preserve the lock/);
 }finally{await l.close();}
});
