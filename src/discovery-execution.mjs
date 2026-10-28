/** Bounded one-shot owner discovery. Separate schema; shares legacy project lock.
 * Exact raw response bodies are private evidence, never public fixture assets. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,randomBytes,createCipheriv,createHash} from 'node:crypto';
import {discoveryHash,assertDiscoveryFresh,decideRouting,decodedExtract,decodedDocumentary,extractRequirementPayload,EXTRACT_CONTRACT_SHA256} from './core-discovery.mjs';
import {literalHash,strictUtf8} from './literal-requirements.mjs';
import {createProduction} from './production-workspace.mjs';
const validId=x=>{if(typeof x!=='string'||!/^[\w-]{1,80}$/.test(x))throw Error('Invalid discovery production identity');return x;};
const validKey=x=>{if(!/^[a-f0-9]{64}$/.test(x??''))throw Error('Invalid discovery fingerprint');return x;};
const un64=x=>{if(typeof x!=='string'||Buffer.from(x,'base64').toString('base64')!==x)throw Error('Discovery byte encoding invalid');return Buffer.from(x,'base64');};
export function hasUncertainDiscoveryOverlap(jobs,requestIds){
 const ids=new Set(requestIds);
 return jobs.some(j=>j.entries.some(e=>ids.has(e.id)&&(['IN_FLIGHT','BILLING_UNKNOWN'].includes(e.status)||!e.receipt||e.receipt.credits===null)));
}
function validate(job){
 const {sha256,...body}=job;
 if(sha256!==discoveryHash(body)||job.schema!=='beforeroll-core-discovery-journal-v1'||job.notClearance!==true||
  !['OWNER_CLOCKED_CORE_DISCOVERY','CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED'].includes(job.origin)||
  !['RUNNING','STOPPED_INCOMPLETE','COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY'].includes(job.state))throw Error('Discovery journal checksum/envelope invalid');
 const p=job.plan;validKey(p.id);validId(p.workspaceId);
 const reconstructed=createProduction({id:p.workspaceId,title:'Journal source revalidation',callSheetText:p.scenes.map(s=>s.row).join('\n')});
 reconstructed.documents=structuredClone(p.sources);
 for(const s of reconstructed.callSheet.scenes){s.sourceEpoch=p.scenes.find(x=>x.id===s.id).epoch;reconstructed.callSheet.historicalSceneEpochs[s.id]=s.sourceEpoch;}
 assertDiscoveryFresh(reconstructed,p);
 const binding={workspaceId:p.workspaceId,documents:p.documents,scenes:p.scenes,taskIds:p.taskIds,extractContract:p.extractContract,...(p.includeDocumentary?{documentaryContract:p.documentaryContract,fillIds:p.fillIds}:{})};
 if(discoveryHash(binding)!==p.id||p.extractContract!==EXTRACT_CONTRACT_SHA256||p.tasks.length!==p.decideCalls||p.extracts.length!==p.maxExtractCalls||
  p.worstCaseCalls!==p.tasks.length+p.extracts.length+(p.fills?.length??0)||p.worstCaseCalls>p.limits.maxCalls||p.limits.maxCalls>128||job.entries.length>p.limits.maxCalls)throw Error('Discovery request plan invalid');
 const seen=new Set(),acceptedDecide=new Map();let extractStarted=false,fillStarted=false,decideIndex=0,fillIndex=0;
 for(const e of job.entries){
  const spec=(e.kind==='decide'?p.tasks:e.kind==='extract'?p.extracts:e.kind==='fill'?(p.fills??[]):[]).find(t=>t.id===e.id);
  if(!spec||seen.has(e.id)||!['IN_FLIGHT','ACCEPTED','REJECTED','BILLING_UNKNOWN'].includes(e.status)||e.requestSha256!==literalHash(un64(e.requestBase64))||
   e.requestSha256!==discoveryHash(spec.payload)||JSON.stringify(JSON.parse(strictUtf8(un64(e.requestBase64))))!==JSON.stringify(spec.payload))throw Error('Discovery intent identity invalid');
  seen.add(e.id);
  if(e.kind==='decide'){
   if(extractStarted||e.id!==p.tasks[decideIndex++]?.id)throw Error('Discovery Decide ordering invalid');
  }else if(e.kind==='extract'){
   if(fillStarted)throw Error('Extract after Fill invalid');
   extractStarted=true;
   if(acceptedDecide.size!==p.tasks.length||!p.tasks.some(t=>t.documentId===spec.documentId&&t.unitId===spec.unitId&&acceptedDecide.get(t.id)==='RELEVANT_REVIEW_ONLY'))throw Error('Extract lacks accepted complete Decide routing');
  }else{
   fillStarted=true;extractStarted=true;
   const required=p.extracts.filter(x=>p.tasks.some(t=>t.documentId===x.documentId&&t.unitId===x.unitId&&acceptedDecide.get(t.id)==='RELEVANT_REVIEW_ONLY'));
   if(acceptedDecide.size!==p.tasks.length||e.id!==p.fills[fillIndex++]?.id||required.some(x=>!job.entries.slice(0,job.entries.indexOf(e)).some(y=>y.id===x.id&&y.status==='ACCEPTED')))throw Error('Fill lacks complete preceding analysis');
  }
  if(e.receipt&&(e.receipt.credits!==null&&(!Number.isFinite(e.receipt.credits)||e.receipt.credits<0)))throw Error('Invalid discovery credit accounting');
  if(e.kind==='extract'&&JSON.stringify(spec.payload)!==JSON.stringify(extractRequirementPayload(p.sources.find(d=>d.id===spec.documentId).units.find(u=>u.id===spec.unitId).text)))throw Error('Extract contract changed');
  if(e.responseBase64!==undefined&&e.receipt?.storedBodySha256!==literalHash(un64(e.responseBase64)))throw Error('Discovery response integrity invalid');
  if(e.status==='ACCEPTED'){
   if(e.receipt?.httpStatus!==200||!e.receipt.complete||e.receipt.sealed||e.receipt.transportFault!==null||e.receipt.requestSha256!==e.requestSha256||e.receipt.responseSha256!==literalHash(un64(e.responseBase64))||e.receipt.responseByteLength!==un64(e.responseBase64).length)throw Error('Discovery accepted receipt invalid');
   if(e.kind==='decide')acceptedDecide.set(e.id,decideRouting(JSON.parse(strictUtf8(un64(e.responseBase64)))));
   else if(e.kind==='fill')decodedDocumentary(p,e);
   else if(decodedExtract(p,e,job.origin).errors.length)throw Error('Discovery accepted literal response invalid');
  }
 }
 if(job.state==='COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY'){
  const required=p.extracts.filter(x=>p.tasks.some(t=>t.documentId===x.documentId&&t.unitId===x.unitId&&acceptedDecide.get(t.id)==='RELEVANT_REVIEW_ONLY'));
  if(acceptedDecide.size!==p.tasks.length||job.entries.some(e=>e.status!=='ACCEPTED'||e.receipt.credits===null)||[...required,...(p.fills??[])].some(x=>!job.entries.some(e=>e.id===x.id&&e.status==='ACCEPTED')))throw Error('Discovery completion accounting invalid');
 }
 return job;
}
export function createDiscoveryExecution({directory}){
 if(!path.isAbsolute(directory))throw Error('Absolute discovery directory required');
 const root=path.join(directory,'.clocked-discovery'),locks=path.join(directory,'.clocked-execution');
 const file=(id,key)=>path.join(root,validId(id)+'.'+validKey(key)+'.json');
 const stopfile=(id,key)=>file(id,key)+'.stop';
 async function init(){for(const p of [root,locks]){await fs.mkdir(p,{recursive:true,mode:0o700});const s=await fs.lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error('Unsafe discovery directory');}}
 async function durable(name,bytes,exclusive=false){
  const target=exclusive?name:name+'.'+randomUUID()+'.tmp';const h=await fs.open(target,'wx',0o600);
  try{await h.writeFile(bytes);await h.sync();}finally{await h.close();}
  if(!exclusive){
   // Windows readers can briefly deny replacement. Retry only this local atomic
   // rename, never the provider operation; the durable intent remains fenced.
   for(let attempt=0;;attempt++){try{await fs.rename(target,name);break;}catch(e){if(!['EPERM','EACCES','EBUSY'].includes(e.code)||attempt>=9)throw e;await new Promise(r=>setTimeout(r,20));}}
  }
 }
 async function save(job,exclusive=false){job.updatedAt=new Date().toISOString();delete job.sha256;job.sha256=discoveryHash(job);await durable(file(job.plan.workspaceId,job.plan.id),JSON.stringify(job),exclusive);}
 async function readChecked(name){const st=await fs.lstat(name);if(!st.isFile()||st.isSymbolicLink())throw Error('Unsafe discovery journal file');return validate(JSON.parse(await fs.readFile(name,'utf8')));}
 async function read(id,key){try{return await readChecked(file(id,key));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 async function list(id){await init();const names=(await fs.readdir(root)).filter(n=>n.startsWith(validId(id)+'.')&&n.endsWith('.json')).sort();if(names.length>1000)throw Error('Discovery archive capacity reached');return Promise.all(names.map(n=>readChecked(path.join(root,n))));}
 async function stopped(id,key){try{await fs.access(stopfile(id,key));return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
 async function stop(id,key){await init();if(!await read(id,key))throw Error('Discovery job not found');try{await durable(stopfile(id,key),'OWNER_STOP_REQUESTED',true);}catch(e){if(e.code!=='EEXIST')throw e;}return {id:key,state:'STOP_REQUESTED',inFlightMayComplete:true,notClearance:true};}
 async function run({workspace,plan,operatorAuthorized=false,fetchImpl,apiKey,controlledTest=false,checkFresh,beforeCall,onReady=()=>{}}){
  if(!operatorAuthorized||typeof fetchImpl!=='function'||!apiKey||typeof checkFresh!=='function'||typeof beforeCall!=='function')throw Error('Explicit operator authorization, credential and guarded transport required');
  assertDiscoveryFresh(workspace,plan);await init();
  const lock=path.join(locks,validId(workspace.id)+'.lock');let h;
  try{h=await fs.open(lock,'wx',0o600);}catch(e){if(e.code==='EEXIST')throw Error('Production execution lock exists; inspect interrupted execution, never delete to retry');throw e;}
  const job={schema:'beforeroll-core-discovery-journal-v1',plan:structuredClone(plan),origin:controlledTest?'CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED':'OWNER_CLOCKED_CORE_DISCOVERY',
   state:'RUNNING',entries:[],createdAt:new Date().toISOString(),updatedAt:null,notClearance:true};
  async function halt(reason){job.state='STOPPED_INCOMPLETE';job.stopReason=reason;await save(job);return job;}
  async function request(kind,spec){
   assertDiscoveryFresh(await checkFresh(),plan);
   if(await stopped(workspace.id,plan.id))throw Error('OWNER_CANCELLED');
   if(job.entries.length>=plan.limits.maxCalls)throw Error('REQUEST_CAP_REACHED');
   const used=job.entries.reduce((n,e)=>n+(e.receipt?.credits??0),0);
   if(used+plan.limits.creditReservePerCall>plan.limits.creditBudget)throw Error('CREDIT_RESERVE_EXHAUSTED');
   await beforeCall();
   const requestBytes=Buffer.from(JSON.stringify(spec.payload)),entry={id:spec.id,kind,status:'IN_FLIGHT',requestSha256:literalHash(requestBytes),requestBase64:requestBytes.toString('base64'),
    idempotencyKey:randomUUID(),startedAt:new Date().toISOString()};
   job.entries.push(entry);await save(job); // permanent intent BEFORE fetch
   const started=performance.now(),chunks=[];let response=null,bytes=Buffer.alloc(0),complete=false,fault=null;
   try{
    response=await fetchImpl('https://clocked.rezolve.ai/clocked/'+kind,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',Accept:'application/json','Idempotency-Key':entry.idempotencyKey,'User-Agent':'BeforeRoll-Core-Discovery/1.0'},body:requestBytes.toString('utf8'),signal:AbortSignal.timeout(45000),cache:'no-store',redirect:'error'});
    const reader=response.body?.getReader();if(!reader)throw Error('NO_RESPONSE_BODY');
    let size=0;
    for(;;){const {done,value}=await reader.read();if(done){complete=true;break;}size+=value.length;if(size>2*1024*1024){await reader.cancel();fault='RESPONSE_SIZE_LIMIT';break;}chunks.push(Buffer.from(value));}
   }catch{fault='TRANSPORT_FAILED_OUTCOME_OR_BILLING_UNKNOWN';}
   bytes=Buffer.concat(chunks);
   const rawSha=literalHash(bytes),credit=response?.headers.get('x-clocked-credits')??null;
   const credits=credit!==null&&/^\d+(?:\.\d+)?$/.test(credit)&&Number.isFinite(Number(credit))?Number(credit):null;
   const headers=Object.fromEntries(['content-type','x-clocked-credits','x-clocked-model-ms','x-clocked-cost-usd','x-clocked-cost-basis','x-clocked-transport','server-timing','x-request-id','date','retry-after'].map(k=>[k,response?.headers.get(k)??null]));
   let sealed=bytes.includes(Buffer.from(apiKey))||Object.values(headers).some(v=>v?.includes(apiKey));
   if(sealed){
    // Preserve exact recoverable bytes without storing an echoed credential in plaintext.
    const salt=randomBytes(16),iv=randomBytes(12),key=createHash('sha256').update(apiKey).update(salt).digest();
    const cipher=createCipheriv('aes-256-gcm',key,iv),encrypted=Buffer.concat([cipher.update(bytes),cipher.final()]);
    bytes=Buffer.concat([salt,iv,cipher.getAuthTag(),encrypted]);Object.keys(headers).forEach(k=>{if(headers[k]?.includes(apiKey))headers[k]='SEALED_CREDENTIAL_ECHO';});fault='SEALED_CREDENTIAL_ECHO';
   }
   entry.responseBase64=bytes.toString('base64');entry.receipt={requestSha256:entry.requestSha256,complete,httpStatus:response?.status??null,transportFault:fault,sealed,
    responseSha256:rawSha,storedBodySha256:literalHash(bytes),responseByteLength:sealed?null:bytes.length,headers,credits,creditsAsReturned:sealed?null:credit,
    startedAt:entry.startedAt,endedAt:new Date().toISOString(),latencyMs:performance.now()-started};
   entry.status='REJECTED';
   if(fault||!complete){entry.status='BILLING_UNKNOWN';await save(job);throw Error(fault??'INCOMPLETE_RESPONSE');}
   if(response.status!==200){await save(job);throw Error('PROVIDER_HTTP_'+response.status);}
   let result;
   try{
    const body=JSON.parse(strictUtf8(bytes));entry.receipt.model=typeof body.model==='string'?body.model:null;
    if(kind==='decide')result=decideRouting(body);
    else if(kind==='fill')result=decodedDocumentary(plan,entry);
    else{result=decodedExtract(plan,entry,job.origin);if(result.errors.length)throw Error(result.errors[0]);}
   }catch(e){entry.validationError=/^[A-Z_]+$/.test(e.message)?e.message:'INVALID_JSON_OR_TYPED_RESPONSE';await save(job);throw Error('INVALID_'+kind.toUpperCase()+'_RESPONSE');}
   entry.status='ACCEPTED';await save(job);
   if(credits===null)throw Error('UNKNOWN_REPORTED_CREDITS');
   if(credits>plan.limits.creditReservePerCall)throw Error('REPORTED_CREDITS_EXCEED_RESERVE');
   assertDiscoveryFresh(await checkFresh(),plan);
   return result;
  }
  try{
   const existing=await list(workspace.id);if(existing.length>=1000)throw Error('Discovery archive capacity reached; no requests made');
   if(hasUncertainDiscoveryOverlap(existing,[...plan.taskIds,...plan.extracts.map(x=>x.id),...(plan.fills??[]).map(x=>x.id)]))throw Error('Existing uncertain request has a permanent execution fence; changing scene selection cannot retry it');
   try{await save(job,true);}catch(e){if(e.code==='EEXIST')throw Error('Discovery scope already has a permanent execution fence; no repeat dispatch');throw e;}
   onReady({id:plan.id,state:'RUNNING',notClearance:true});
   try{
    const relevant=new Set();
    for(const t of plan.tasks){if(await request('decide',t)==='RELEVANT_REVIEW_ONLY')relevant.add(plan.extracts.find(x=>x.documentId===t.documentId&&x.unitId===t.unitId).id);}
    for(const x of plan.extracts)if(relevant.has(x.id))await request('extract',x);
    for(const x of plan.fills??[])await request('fill',x);
    if(await stopped(workspace.id,plan.id))return await halt('OWNER_CANCELLED');
    job.state='COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY';await save(job);return job;
   }catch(e){return await halt(/^[A-Z_0-9]+$/.test(e.message)?e.message:/^[A-Z_0-9]+$/.test(e.code??'')?'LOCAL_IO_'+e.code:'SOURCE_OR_QUOTA_CHECK_STOPPED');}
  }finally{await h.close();await fs.unlink(lock);}
 }
 return {directory:root,list,read,stop,run,validate,
  async restore(id,jobs){await init();if(!Array.isArray(jobs)||jobs.length>1000)throw Error('Invalid discovery recovery archive');for(const j of jobs){validate(j);if(j.plan.workspaceId!==id)throw Error('Discovery recovery identity mismatch');const existing=await read(id,j.plan.id);if(existing){if(existing.sha256!==j.sha256)throw Error('Discovery recovery journal conflict');}else await durable(file(id,j.plan.id),JSON.stringify(j),true);}return jobs.length;}};
}
