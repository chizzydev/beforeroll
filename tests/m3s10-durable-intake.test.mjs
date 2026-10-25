import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inspectImport,readCsv} from '../src/source-intake.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {workspaceDirectory} from '../src/workspace-location.mjs';
import {createProduction,applySourceImport,assertWorkspaceSources,recordReview,reviseDocument} from '../src/production-workspace.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {createAppServer} from '../server.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const csv='Scene,Location,Start,End,Activity\r\n9,"Courtyard, east",10:00,10:25,"Follow the crane, safely"\r\n10,Courtyard,11:15,11:35,Do not fly a drone';
const doc='ISSUED PERMIT LP-7 covers the courtyard.\n\nNo drones.\n\nCrane work needs signed marshal supervision.';
const fmt={name:'locations.txt',kind:'permit',text:doc};
const call={name:'call-sheet.csv',kind:'callSheet',text:csv};
async function service(){
 const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-m3s10-'));
 const store=createWorkspaceStore({directory:dir});const server=createAppServer({enabled:false,workspaceStore:store});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const request=async(method,uri,obj)=>{const r=await fetch(base+uri,{method,headers:obj?{'content-type':'application/json'}:{},body:obj?JSON.stringify(obj):undefined});return {status:r.status,body:await r.json()};};
 const close=async()=>{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});};
 return {dir,store,base,request,close};
}
test('strict CSV import preserves commas and source row lineage',()=>{
 const data=inspectImport(call);assert.equal(data.sourceFormat,'CALL_SHEET_CSV_RFC4180');
 assert.equal(data.sourceMap.length,2);assert.equal(data.sourceMap[0].sourceLine,2);
 assert.match(data.text,/Courtyard, east/);assert.match(data.text,/Follow the crane, safely/);
 assert.equal(data.rawHash,sha(Buffer.from(csv)));assert.equal(data.normalizedHash,sha(data.text));
});
test('CSV parser correctly handles commas, escaped quotes, CRLF and header aliases',()=>{
 const items=readCsv('scene id,site,from,to,action\r\n1,"Location, east",09:00,09:30,"""Action"", safe"\r\n');
 assert.equal(items.rows.length,2);assert.equal(items.rows[1].fields[1],'Location, east');assert.equal(items.rows[1].fields[4],'"Action", safe');
 const parsed=inspectImport({name:'x.csv',kind:'callSheet',text:'scene id,site,from,to,action\r\n1,"Location, east",09:00,09:30,"""Action"", safe"'});
 assert.match(parsed.text,/"Action", safe/);
});
test('zero silently skipped CSV rows: duplicate ID, malformed header, wrong shape, bad clock rejected',()=>{
 assert.throws(()=>inspectImport({...call,text:csv+'\r\n9,Court,12:00,12:30,Duplicate'}),/Duplicate/);
 assert.throws(()=>inspectImport({...call,text:'Scene,Start,End,Activity\n9,09:00,09:30,Go'}),/location column/);
 assert.throws(()=>inspectImport({...call,text:'Scene,Location,Start,End,Activity\n9,A,10:00,10:30,Go,Extra'}),/6 fields/);
 assert.throws(()=>inspectImport({...call,text:'Scene,Location,Start,End,Activity\n9,A,5pm,10:30,Go'}),/24-hour/);
 assert.throws(()=>readCsv('a,b\n"unterminated'),/Unterminated/);
 assert.throws(()=>readCsv('a,b\n"one"junk,two'),/Unexpected characters/);
 assert.throws(()=>readCsv('a,b\n\nx,y'),/Blank CSV row/);
});
test('no unsupported office/PDF file is pretended extracted or converted to trusted source',()=>{
 for(const ext of ['pdf','docx','xlsx','html'])assert.throws(()=>inspectImport({name:'permit.'+ext,kind:'permit',text:'Readable words are not a parsed PDF'}),/not supported/);
 assert.throws(()=>inspectImport({name:'permit.csv',kind:'permit',text:csv}),/only supported for call sheets/);
});
test('invalid encodings, binary, file paths and malformed base64 fail closed',()=>{
 assert.throws(()=>inspectImport({name:'../../x.txt',kind:'permit',text:'No drones.'}),/safe filename/);
 assert.throws(()=>inspectImport({name:'x.txt',kind:'permit',contentBase64:Buffer.from([0xff,0xfe]).toString('base64')}),/UTF-8/);
 assert.throws(()=>inspectImport({name:'x.txt',kind:'permit',contentBase64:'%%%'}),/base64/);
 assert.throws(()=>inspectImport({name:'x.txt',kind:'permit',contentBase64:Buffer.from([0,3]).toString('base64')}),/Binary/);
 assert.throws(()=>inspectImport({name:'x.txt',kind:'permit',text:'a',contentBase64:'YQ=='}),/exactly one/);
});
test('permit text and JSON import preserve short restrictions and BOM byte identity',()=>{
 const received=inspectImport({name:'permit.txt',kind:'permit',contentBase64:Buffer.from('\ufeff'+doc).toString('base64')});
 assert.match(received.text,/No drones/);assert.equal(received.rawHash,sha(Buffer.from('\ufeff'+doc)));
 assert.notEqual(received.rawHash,received.normalizedHash);
 assert(received.warnings.some(x=>x.includes('BOM')));
 const json=inspectImport({name:'doc.json',kind:'permit',text:JSON.stringify({schema:'beforeroll-permit-source-v1',text:doc})});
 assert.equal(json.text,doc);
 const calls=inspectImport({name:'scenes.json',kind:'callSheet',text:JSON.stringify({schema:'beforeroll-call-sheet-v1',scenes:[{number:3,location:'East Hall',start:'09:00',end:'10:00',activity:'Walking action'}]})});
 assert.match(calls.text,/Scene 3 \| East Hall/);
 assert.throws(()=>inspectImport({name:'doc.json',kind:'permit',text:'{"text":"ignored"}'}),/schema/);
});
test('applied original source import records provenance without faking authority',()=>{
 const w=createProduction({id:'film-1',title:'Film One'});
 applySourceImport(w,inspectImport(fmt),{documentId:'D1'});
 applySourceImport(w,inspectImport(call));
 assert.equal(w.documents[0].importReceipt.sourceFormat,'UTF8_TEXT');
 assert.equal(w.callSheet.importReceipt.sourceFormat,'CALL_SHEET_CSV_RFC4180');
 assert.equal(w.callSheet.scenes.length,2);assert.equal(w.imports.length,2);
 assertWorkspaceSources(w);const plan=planIntelligence(w);assert(plan.plannedCalls>=6);
 assert(plan.tasks.some(x=>x.sourceQuote==='No drones.'));
 assert(plan.tasks.every(t=>t.status==='NOT_EVALUATED'));
});
test('editing imported documents invalidates stale importReceipt and the linked assessments',()=>{
 const w=createProduction({id:'film-1',title:'Film One'});
 applySourceImport(w,inspectImport(fmt),{documentId:'D1'});
 w.assessments=[{documentId:'D1',status:'COMPLETE'}];
 reviseDocument(w,'D1',doc+'\nA separately signed route plan is required.');
 assert.equal(w.documents[0].importReceipt,null);assert.equal(w.assessments[0].status,'STALE_SOURCE_CHANGED');
 assertWorkspaceSources(w);
});
test('atomic store round trip, version conflict and project listing',async()=>{
 const s=await service();try{
  const w=createProduction({id:'film_2',title:'Film Two'});
  const first=await s.store.persist(w,{expectedVersion:0});assert.equal(first.version,1);
  assert.rejects(()=>s.store.persist(w,{expectedVersion:0}),/Version conflict/);
  applySourceImport(w,inspectImport(fmt),{documentId:'D2'});
  const second=await s.store.persist(w,{expectedVersion:1});assert.equal(second.version,2);
  const loaded=await s.store.load('film_2');assert.equal(loaded.workspace.documents.length,1);
  assert.equal(loaded.workspace.documents[0].sourceHash,sha(doc));
  const list=await s.store.list();assert.equal(list.length,1);assert.equal(list[0].version,2);
 }finally{await s.close();}
});
test('file tampering and malformed restored workspace rejected before mutation',async()=>{
 const s=await service();try{
  const w=createProduction({id:'film_3',title:'Film Three',documents:[{id:'D',name:'source',text:doc}]});
  await s.store.persist(w,{expectedVersion:0});const file=path.join(s.dir,'film_3.json');
  const raw=await readFile(file,'utf8');await writeFile(file,raw.replace('No drones.','Drones allowed.'));
  await assert.rejects(()=>s.store.load('film_3'),/integrity failure/);
  await assert.rejects(()=>s.store.persist({...w,id:'../escape'},{expectedVersion:0}),/id must/);
 }finally{await s.close();}
});
test('simultaneous writers may not overwrite each other',async()=>{
 const s=await service();try{
  const w=createProduction({id:'film_concurrent',title:'Concurrency'});
  await s.store.persist(w,{expectedVersion:0});
  const result=await Promise.allSettled([s.store.persist(w,{expectedVersion:1}),s.store.persist(w,{expectedVersion:1})]);
  assert.equal(result.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(result.filter(x=>x.status==='rejected').length,1);
  assert.equal((await s.store.load('film_concurrent')).version,2);
 }finally{await s.close();}
});
test('local project API: create -> upload CSV + permit -> plan -> reviewer -> list; no provider calls',async()=>{
 const s=await service();try{
  const created=await s.request('POST','/api/workspaces',{id:'riverside',title:'Riverside Film'});
  assert.equal(created.status,201);assert.equal(created.body.version,1);
  const first=await s.request('POST','/api/workspaces/riverside/import',{expectedVersion:1,documentId:'permit-a',file:fmt});
  assert.equal(first.status,200);assert.equal(first.body.version,2);
  const second=await s.request('POST','/api/workspaces/riverside/import',{expectedVersion:2,file:call});
  assert.equal(second.status,200);assert.equal(second.body.workspace.callSheet.scenes.length,2);
  const plan=await s.request('GET','/api/workspaces/riverside/plan');assert.equal(plan.status,200);
  assert(plan.body.plannedCalls>=6);assert(plan.body.tasks.every(x=>x.status==='NOT_EVALUATED'));
  const review=await s.request('POST','/api/workspaces/riverside/review',{expectedVersion:3,evidenceId:'permit-a:U001',decision:'NEEDS_SOURCE',reviewer:'owner',reason:'Obtain signed document'});
  assert.equal(review.status,200);assert.equal(review.body.version,4);
  const duplicate=await s.request('POST','/api/workspaces/riverside/import',{expectedVersion:3,file:call});assert.equal(duplicate.status,409);
  const list=await s.request('GET','/api/workspaces');assert.equal(list.body.items.length,1);
  const loaded=await s.request('GET','/api/workspaces/riverside');assert.equal(loaded.body.workspace.reviewActions.length,1);
  const wrong=await s.request('GET','/api/workspaces/..%2fsecret');assert.notEqual(wrong.status,200);
  assert.equal((await s.request('GET','/api/health')).body.liveEnabled,false);
 }finally{await s.close();}
});
test('unsupported file and invalid plan never generate AI output',async()=>{
 const s=await service();try{
  await s.request('POST','/api/workspaces',{id:'no_doc',title:'No Document'});
  const invalid=await s.request('POST','/api/workspaces/no_doc/import',{expectedVersion:1,documentId:'P',file:{name:'danger.pdf',kind:'permit',text:'No drones'}});
  assert.equal(invalid.status,422);
  const plan=await s.request('GET','/api/workspaces/no_doc/plan');assert.equal(plan.status,422);
  const data=await s.request('GET','/api/workspaces/no_doc');assert.equal(data.body.workspace.documents.length,0);
 }finally{await s.close();}
});

test('real file CLI uses same audited parser and persists between separate processes',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-cli-'));
 const argv=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../scripts/workspace-cli.mjs');
 const permit=path.join(dir,'issued.txt'),sheet=path.join(dir,'calls.csv');
 await writeFile(permit,doc);await writeFile(sheet,csv);
 const run=(...args)=>spawnSync(process.execPath,[argv,...args],{encoding:'utf8',env:{...process.env,BEFOREROLL_DATA_DIR:path.join(dir,'store')}});
 try{
  assert.equal(run('init','cli_film','CLI Film').status,0);
  const a=run('import','cli_film','permit','P1',permit);assert.equal(a.status,0,a.stderr);
  const b=run('import','cli_film','callSheet','-',sheet);assert.equal(b.status,0,b.stderr);
  const plan=run('plan','cli_film');assert.equal(plan.status,0,plan.stderr);assert.match(plan.stdout,/CALLS_EXECUTED=0/);
  const show=run('show','cli_film');assert.equal(show.status,0);assert.match(show.stdout,/P1/);
  assert.equal(run('init','cli_film','DUPLICATE').status,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('default project path remains stable across extracted versions; env override requires absolute path',()=>{
 const local=workspaceDirectory({LOCALAPPDATA:'C:/Users/Owner/AppData/Local'},'win32');
 assert.match(local,/BeforeRoll/);
 assert.match(local,/Workspaces/);
 const portable=workspaceDirectory({BEFOREROLL_DATA_DIR:path.resolve(os.tmpdir(),'br-external')});
 assert.equal(portable,path.resolve(os.tmpdir(),'br-external'));
 assert.throws(()=>workspaceDirectory({BEFOREROLL_DATA_DIR:'relative-projects'}),/absolute/);
});

test('an unrecovered cross-process writer lock stops mutations rather than overwriting',async()=>{
 const s=await service();try{
  const w=createProduction({id:'locked',title:'Locked project'});
  await writeFile(path.join(s.dir,'.beforeroll-write.lock'),'held by another writer');
  await assert.rejects(()=>s.store.persist(w,{expectedVersion:0}),/Another writer/);
  assert.equal((await s.store.list()).length,0);
 }finally{await s.close();}
});
