import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,utimes,mkdir,readdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
import {createHash} from 'node:crypto';
import {createAppServer} from '../server.mjs';
import {createOwnerSecurity,loopbackAddress,constantTimeMatch,trustedOwnerRequest} from '../src/owner-security.mjs';
import {encryptOwnerBackup,decryptOwnerBackup} from '../src/secure-backup.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createProduction,applySourceImport} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from '../src/production-lifecycle.mjs';
import {retentionPlan,pruneOrphanedOriginals} from '../src/privacy-retention.mjs';
const TOKEN='OWNER_ACCESS_S29_LOCAL_RANDOM_TOKEN_ONLY_abcdefghijklmnopqrstuvwxyz';
const sha=b=>createHash('sha256').update(b).digest('hex');
async function lab(){const directory=await mkdtemp(path.join(os.tmpdir(),'br-s29-'));
 const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory});let calls=0;
 const server=createAppServer({workspaceStore:store,executionStore:execution,ownerToken:TOKEN,enabled:true,apiKey:'fake-test-api',operatorToken:'fake-operator',fetchImpl:async()=>{calls++;throw Error('Provider must not be called');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
 const request=async(url,{method='GET',cookie='',origin='',site='',body=null,host=null}={})=>{
  const headers={};if(cookie)headers.Cookie=cookie;if(origin)headers.Origin=origin;if(site)headers['Sec-Fetch-Site']=site;if(host)headers.Host=host;
  if(body!==null)headers['Content-Type']='application/json';
  const r=await fetch(`http://127.0.0.1:${port}`+url,{method,headers,body:body===null?undefined:JSON.stringify(body)});
  const txt=await r.text();let result;try{result=JSON.parse(txt);}catch{result=txt;}
  return {code:r.status,data:result,headers:r.headers};
 };
 const unlock=async()=>{const r=await request('/api/owner/unlock',{method:'POST',body:{token:TOKEN},site:'same-origin',origin:`http://127.0.0.1:${port}`});assert.equal(r.code,200);return r.headers.get('set-cookie').split(';')[0];};
 return {store,execution,directory,server,port,request,unlock,calls:()=>calls,close:async()=>{await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}};
}
test('owner token is checked constant time via fixed-length digest, and localhost peers are explicitly bounded',()=>{
 assert.equal(constantTimeMatch('alpha','alpha'),true);assert.equal(constantTimeMatch('alpha','ALPHA'),false);
 for(const s of ['127.0.0.1','::1','::ffff:127.0.0.1','127.11.22.33'])assert.equal(loopbackAddress(s),true,s);
 for(const s of ['192.168.1.2','10.1.1.2','8.8.8.8','127.0.0.999','127.0.1','localhost'])assert.equal(loopbackAddress(s),false,s);
});
test('RAM-only owner session, expiry, lock and bounded incorrect logins',()=>{
 let now=100;const auth=createOwnerSecurity({token:TOKEN,now:()=>now});
 assert.equal(auth.authorized({headers:{}}),false);
 for(let i=0;i<5;i++)assert.equal(auth.unlock(null,'incorrect').ok,false);
 assert.equal(auth.unlock(null,TOKEN).limited,true);
 now+=600001;const a=auth.unlock(null,TOKEN);assert.equal(a.ok,true);assert.match(a.cookie,/HttpOnly; SameSite=Strict/);
 const cookie=a.cookie.split(';')[0],req={headers:{cookie}};
 assert.equal(auth.authorized(req),true);auth.lock(req);assert.equal(auth.authorized(req),false);
 const again=auth.unlock(null,TOKEN),req2={headers:{cookie:again.cookie.split(';')[0]}};assert.equal(auth.authorized(req2),true);
 now+=4*60*60*1000+1;assert.equal(auth.authorized(req2),false);
});
test('private workspaces reject GET and mutating POST until local owner session unlock',async()=>{
 const l=await lab();try{
  assert.equal((await l.request('/api/workspaces')).code,401);
  assert.equal((await l.request('/api/workspaces',{method:'POST',body:{id:'secret',title:'secret'}})).code,401);
  const stat=await l.request('/api/owner/status');assert.equal(stat.data.authenticated,false);
  assert.equal((await l.request('/api/owner/unlock',{method:'POST',body:{token:'wrong'}})).code,401);
  const cookie=await l.unlock();assert.equal((await l.request('/api/workspaces',{cookie})).code,200);
  assert.equal((await l.request('/api/workspaces',{method:'POST',cookie,body:{id:'secret',title:'Sensitive film production'}})).code,201);
  assert.equal((await l.request('/api/workspaces/secret',{cookie})).data.workspace.title,'Sensitive film production');
  assert.equal((await l.request('/api/workspaces/secret')).code,401);
  const r=await l.request('/api/owner/lock',{method:'POST',cookie});assert.equal(r.code,200);
  assert.equal((await l.request('/api/workspaces',{cookie})).code,401);assert.equal(l.calls(),0);
 }finally{await l.close();}
});
test('DNS-rebinding host spoof, cross-site fetch metadata, forged Origin and proxy headers fail closed',async()=>{
 const l=await lab();try{const cookie=await l.unlock();const path='/api/workspaces';
  const other=['evil.example:'+l.port,'127.0.0.1:55555'];
  for(const host of other)assert.equal(trustedOwnerRequest({socket:{remoteAddress:'127.0.0.1',localPort:l.port},headers:{host}}),false,host);
  assert.equal((await l.request(path,{cookie,site:'cross-site'})).code,403);
  assert.equal((await l.request(path,{cookie,site:'same-site'})).code,403);
  assert.equal((await l.request(path,{cookie,origin:'https://evil.example'})).code,403);
  assert.equal((await l.request('/api/owner/unlock',{method:'POST',body:{token:TOKEN},origin:'https://evil.example'})).code,403);
  const response=await fetch(`http://127.0.0.1:${l.port}/api/workspaces`,{headers:{Cookie:cookie,'X-Forwarded-Host':'localhost'}});
  assert.equal(response.status,403);
  assert.equal(l.calls(),0);
 }finally{await l.close();}
});
test('owner token never enters HTTP health, access-status, or workspace error bodies',async()=>{
 const l=await lab();try{
  const views=await Promise.all([l.request('/api/health'),l.request('/api/owner/status'),l.request('/api/workspaces')]);
  for(const r of views)assert.equal(JSON.stringify(r.data).includes(TOKEN),false);
  assert.equal(views[0].data.ownerAccessRequired,true);
  assert.equal(views[0].data.liveEnabled,true);
  assert.equal(views[1].data.required,true);
 }finally{await l.close();}
});
test('sensitive document access, original-file download, dossier and lifecycle export all require owner session',async()=>{
 const l=await lab();try{const cookie=await l.unlock();const r=await l.request('/api/workspaces',{cookie,method:'POST',body:{id:'prod29',title:'Sensitive permit'}});assert.equal(r.code,201);
  for(const route of ['/api/workspaces/prod29','/api/workspaces/prod29/originals','/api/workspaces/prod29/dossier','/api/workspaces/prod29/lifecycle/backup','/api/workspaces/prod29/workflow']){
   assert.equal((await l.request(route)).code,401,route);
  }
  assert.equal((await l.request('/api/workspaces/prod29/lifecycle/backup',{cookie})).code,403);
  assert.equal(l.calls(),0);
 }finally{await l.close();}
});
test('AES-256-GCM+scrypt encrypted lifecycle backups authenticate exact workspace and retained originals',async()=>{
 const l=await lab();try{
  const w=createProduction({id:'encrypt29',title:'Confidential location consent'}),file={kind:'permit',name:'location.txt',text:'No drones. The location is confidential.'};
  const envelope=inspectImport(file);applySourceImport(w,envelope,{documentId:'PERMIT29'});
  await l.store.persist(w,{expectedVersion:0});const vault=createSourceOriginalVault({directory:l.directory});await vault.storeImport(file,envelope);
  const saved=await l.store.load(w.id),backup=await createLifecycleBackup(saved,l.execution,{sourceVault:vault});verifyLifecycleBackup(backup,l.execution);
  const secret='this is a strongly unique 16+ char local passphrase';const encrypted=await encryptOwnerBackup(backup,secret);
  assert.equal(JSON.stringify(encrypted).includes('No drones'),false);
  assert.equal(encrypted.schema,'beforeroll-encrypted-owner-backup-v1');
  const recovered=await decryptOwnerBackup(encrypted,secret);assert.equal(recovered.sha256,backup.sha256);
  assert.equal(verifyLifecycleBackup(recovered,l.execution).originalFileCount,1);
  await assert.rejects(()=>decryptOwnerBackup(encrypted,'wrong-passphrase'),/authentication failed/);
  const edited=structuredClone(encrypted);const damaged=Buffer.from(edited.ciphertextBase64,'base64');damaged[0]^=1;edited.ciphertextBase64=damaged.toString('base64');
  await assert.rejects(()=>decryptOwnerBackup(edited,secret),/authentication failed/);
  const target=await mkdtemp(path.join(os.tmpdir(),'br-s29-recover-'));
  try{const st=createWorkspaceStore({directory:target}),ex=createDurableExecution({directory:target});
   const restored=await restoreLifecycleBackup(recovered,{workspaceStore:st,execution:ex,ownerConfirmed:true});
   assert.equal(restored.restoredOriginals,1);assert.equal((await st.load(w.id)).workspace.title,w.title);
   assert.equal((await createSourceOriginalVault({directory:target}).read(envelope.rawHash)).toString(),file.text);
  }finally{await rm(target,{recursive:true,force:true});}
 }finally{await l.close();}
});
test('encrypted backup API requires owner unlock and current project version, preserves confidentiality',async()=>{
 const l=await lab();try{const cookie=await l.unlock();const created=await l.request('/api/workspaces',{method:'POST',cookie,body:{id:'protected',title:'Secret test'}});
  assert.equal(created.code,201);
  const url='/api/workspaces/protected/lifecycle/backup-encrypted';
  assert.equal((await l.request(url,{method:'POST',body:{expectedVersion:1,passphrase:'abcdefghijklmn'}})).code,401);
  assert.equal((await l.request(url,{method:'POST',cookie,body:{expectedVersion:0,passphrase:'abcdefghijklmn'}})).code,409);
  assert.equal((await l.request(url,{method:'POST',cookie,body:{expectedVersion:1,passphrase:'short'}})).code,422);
  const result=await l.request(url,{method:'POST',cookie,body:{expectedVersion:1,passphrase:'abcdefghijklmn'}});
  assert.equal(result.code,200,JSON.stringify(result.data));
  const unpacked=await decryptOwnerBackup(result.data,'abcdefghijklmn');assert.equal(unpacked.workspaceId,'protected');
  assert.equal(l.calls(),0);
 }finally{await l.close();}
});
test('retention reports historical-source protection, never deletes anything automatically',async()=>{
 const l=await lab();try{
  const file={kind:'permit',name:'source.txt',text:'No drones. Original archival source.'};const w=createProduction({id:'retained',title:'Retained historical owner data'});
  const env=inspectImport(file);applySourceImport(w,env,{documentId:'PERMIT29'});await l.store.persist(w,{expectedVersion:0});const v=createSourceOriginalVault({directory:l.directory});await v.storeImport(file,env);
  const plan=await retentionPlan(l.store);assert.equal(plan.protectedOriginals,1);assert.equal(plan.candidateCount,0);assert.equal(plan.automaticDeletion,false);
  assert.equal((await v.read(env.rawHash)).toString(),file.text);
  await assert.rejects(()=>pruneOrphanedOriginals(l.store,{confirmationSha256:'bad'}),/confirmation missing/);
 }finally{await l.close();}
});
test('only aged unreferenced exact-hash blobs are candidates; confirmed cleanup leaves live evidence intact',async()=>{
 const l=await lab();try{
  const folder=path.join(l.directory,'.source-originals');await mkdir(folder,{recursive:true});
  const old=Buffer.from('old unsuccessful upload which was never committed'),recent=Buffer.from('recent unfinished upload');
  const agedFile=path.join(folder,sha(old)+'.bin'),youngFile=path.join(folder,sha(recent)+'.bin');
  await writeFile(agedFile,old);await writeFile(youngFile,recent);
  const previous=new Date(Date.now()-40*86400000);await utimes(agedFile,previous,previous);
  const plan=await retentionPlan(l.store);assert.equal(plan.candidateCount,1);assert.equal(plan.candidates[0].sha256,sha(old));
  const result=await pruneOrphanedOriginals(l.store,{confirmationSha256:plan.confirmationSha256});assert.equal(result.deletedOrphanCount,1);
  assert.equal((await readFile(youngFile)).toString(),recent.toString());
  assert.equal((await readdir(folder)).length,1);assert.equal(result.journalsDeleted,0);
 }finally{await l.close();}
});
test('retention tampering and changing orphan inventory invalidates reviewed confirmation',async()=>{
 const l=await lab();try{
  const folder=path.join(l.directory,'.source-originals');await mkdir(folder,{recursive:true});
  const old=Buffer.from('bad orphan');const file=path.join(folder,sha(old)+'.bin');await writeFile(file,old);
  const previous=new Date(Date.now()-40*86400000);await utimes(file,previous,previous);
  const preview=await retentionPlan(l.store);
  await writeFile(file,Buffer.from('changed'));
  const updated=await retentionPlan(l.store);assert.equal(updated.candidateCount,0);
  await assert.rejects(()=>pruneOrphanedOriginals(l.store,{confirmationSha256:preview.confirmationSha256}),/plan changed/);
  assert.equal((await readFile(file)).toString(),'changed');
 }finally{await l.close();}
});
test('locked browser controller shows unlock screen, never projects a private production before authentication',async()=>{
 const {createWorkspaceController,productionView}=await import('../public/workspace-desk.mjs');
 let authenticated=false,logins=0,privateReads=0;
 const fetchImpl=async(path,options)=>{
  const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
  if(path==='/api/health')return response(200,{liveEnabled:false});
  if(path==='/api/workspaces'){privateReads++;return authenticated?response(200,{items:[]}):response(401,{error:'OWNER_ACCESS_LOCKED',ownerUnlockRequired:true});}
  if(path==='/api/owner/unlock'){
   logins++;assert.equal(JSON.parse(options.body).token,TOKEN);authenticated=true;return response(200,{authenticated:true});
  }
  throw Error('Unexpected controller request: '+path);
 };
 const root={querySelector:id=>id==='#owner-access-input'?{value:TOKEN}:null};
 const c=createWorkspaceController({fetchImpl,root});await c.load();assert.equal(c.model.authLocked,true);
 assert.match(productionView(c.model),/Unlock BeforeRoll/);assert.doesNotMatch(productionView(c.model),/No drones/);
 await c.click({id:'owner-access-unlock',dataset:{}});assert.equal(c.model.authLocked,false);
 assert.equal(logins,1);assert.equal(privateReads,2);
});

test('plaintext lifecycle export can be accessed only with explicit sensitive-data acknowledgement after unlock',async()=>{
 const l=await lab();try{
  const cookie=await l.unlock();await l.request('/api/workspaces',{method:'POST',cookie,body:{id:'manualplaintext',title:'Confidential'}});
  const route=`http://127.0.0.1:${l.port}/api/workspaces/manualplaintext/lifecycle/backup`;
  const r=await fetch(route,{headers:{Cookie:cookie,'X-BeforeRoll-Plaintext-Export':'I_ACCEPT_UNENCRYPTED_BACKUP'}});
  assert.equal(r.status,200);assert.equal(r.headers.get('x-beforeroll-sensitive-export'),'PLAINTEXT_ORIGINAL_DOCUMENTS');
  assert.equal((await r.json()).secretsIncluded,false);
  assert.equal(l.calls(),0);
 }finally{await l.close();}
});
