/** M3-S12: crash-conservative durable Clocked project execution.
 * A request is persisted as IN_FLIGHT before the provider is called.
 * A crash/time-out cannot turn an attempted request into a retryable task.
 * Every source-revision plan is stored under its own immutable identity.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {MAX_PLAN_TASKS,createCheckpoint,markAttempt,commitAnswer,haltUnknown,nextPlannedTask,assertPlanFresh} from './intelligence-workflow.mjs';
import {modelGrantScope} from './authority-summary.mjs';
const digest=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const allowed=new Set(['NOT_ATTEMPTED','IN_FLIGHT','COMPLETE','BILLING_UNKNOWN']);
const safeId=id=>{if(typeof id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id))throw Error('Invalid production identity');return id;};
export const planKey=plan=>digest(plan.taskIds);
function validate(run,plan){
 if(run?.schema!=='beforeroll-execution-run-v1'||run.projectId!==plan.workspaceId||run.planKey!==planKey(plan)||run.checkpoint?.schema!=='beforeroll-checkpoint-v1'||run.checkpoint.planIdentity!==run.planKey)throw Error('Execution source plan identity mismatch');
 const cp=run.checkpoint;
 if(run.taskManifest&&JSON.stringify(run.taskManifest)!==JSON.stringify(plan.tasks.map(t=>({id:t.id,requestHash:t.requestHash,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,sceneHash:t.sceneHash,documentHash:t.documentHash}))))throw Error('Execution task manifest differs from exact current plan');
 if(!Array.isArray(cp.entries)||cp.entries.length!==plan.tasks.length||cp.callsPlanned!==plan.tasks.length||!Number.isSafeInteger(cp.attempts)||!Number.isSafeInteger(cp.confirmedCompleted)||!Number.isSafeInteger(cp.unknownBilling))throw Error('Execution checkpoint counts invalid');
 let attempted=0,completed=0,unknown=0;
 for(let i=0;i<cp.entries.length;i++){
  const e=cp.entries[i],t=plan.tasks[i];
  if(e.id!==t.id||e.requestHash!==t.requestHash||!allowed.has(e.status))throw Error('Execution task fingerprint/status mismatch');
  if(e.status!=='NOT_ATTEMPTED')attempted++;
  if(e.status==='COMPLETE'){
   completed++;
   if(e.finding?.requestHash!==t.requestHash||e.finding?.documentHash!==t.documentHash||e.finding?.sceneHash!==t.sceneHash||e.finding?.sourceQuote!==t.sourceQuote||e.finding?.notClearance!==true)throw Error('Completed evidence no longer matches exact sources');
  }else if(e.finding!==null)throw Error('Uncompleted task cannot contain accepted model evidence');
  if(e.status==='BILLING_UNKNOWN')unknown++;
 }
 if(attempted!==cp.attempts||completed!==cp.confirmedCompleted||unknown!==cp.unknownBilling)throw Error('Execution attempt accounting differs from ledger');
 if(unknown>0&&cp.state!=='HALTED_UNKNOWN_BILLING')throw Error('Unknown billing must halt all remaining tasks');
 if(completed===cp.entries.length&&cp.state!=='COMPLETE_FOR_PLANNED_UNITS_ONLY')throw Error('Full completion state missing');
 return run;
}
const getSummary=(run,plan,{stale=false,archivedRuns=0,offset=0,limit=20}={})=>{
 const cp=run?.checkpoint??createCheckpoint(plan);
 const entries=cp.entries.slice(offset,offset+limit).map((e,i)=>{
  const task=plan.tasks[offset+i];
  const scope=e.finding?.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'?modelGrantScope(task.sourceQuote,task.sceneId):null;
  return {id:e.id,sceneId:task.sceneId,documentId:task.documentId,unitId:task.unitId,sourceQuote:task.sourceQuote,
   sourceRange:task.sourceRange,requestHash:e.requestHash,status:e.status,credits:e.credits,
   inheritedFromPlanKey:e.inheritedFromPlanKey??null,relevance:e.finding?.relevance??null,grant:e.finding?.grant??null,finding:scope&&!scope.matched?'MODEL_GRANT_SCOPE_UNVERIFIED':e.finding?.code??null,scopeReason:scope?.reason??null,error:e.error,notClearance:true};
 });
 const byScene=Object.create(null),byDocument=Object.create(null);for(let i=0;i<plan.tasks.length;i++){
  const id=plan.tasks[i].sceneId,s=byScene[id]??(byScene[id]={planned:0,attempted:0,complete:0,uncertain:0});
  const doc=plan.tasks[i].documentId,d=byDocument[doc]??(byDocument[doc]={planned:0,attempted:0,complete:0,uncertain:0});
  s.planned++;d.planned++;const state=cp.entries[i].status;
  if(state!=='NOT_ATTEMPTED'){s.attempted++;d.attempted++;}
  if(state==='COMPLETE'){s.complete++;d.complete++;}
  if(state==='BILLING_UNKNOWN'||state==='IN_FLIGHT'){s.uncertain++;d.uncertain++;}
 }
 const credited=cp.entries.filter(e=>e.status==='COMPLETE'&&Number.isSafeInteger(e.credits));
 const knownCredits=credited.reduce((n,e)=>n+e.credits,0);
 const remaining=Math.max(0,cp.callsPlanned-cp.attempts);
 const sampleCount=credited.length;
 const average=sampleCount?knownCredits/sampleCount:null;
 const estimate=sampleCount?{basis:'OBSERVED_REPORTED_ONLY_NOT_QUOTE',sampleCount,averageCreditsPerReportedCall:Number(average.toFixed(4)),remainingCreditsAtObservedMean:Math.ceil(average*remaining),unreportedAndFutureCostUncertain:true}:null;
 return {schema:'beforeroll-execution-status-v1',projectId:plan.workspaceId,planKey:planKey(plan),planned:cp.callsPlanned,attempts:cp.attempts,completed:cp.confirmedCompleted,unknownBilling:cp.unknownBilling,
  state:stale?'STALE_SOURCES':cp.state,stale,archivedRuns,byScene,byDocument,remaining,completionPercent:cp.callsPlanned?Number((100*cp.confirmedCompleted/cp.callsPlanned).toFixed(2)):100,knownCredits,creditProjection:estimate,unknownCreditEntries:cp.entries.filter(e=>e.status!=='NOT_ATTEMPTED'&&e.credits===null).length,
  retainedAttempts:cp.entries.filter(e=>e.inheritedFromPlanKey).length,newPlanAttempts:cp.entries.filter(e=>e.status!=='NOT_ATTEMPTED'&&!e.inheritedFromPlanKey).length,
  pagination:{offset,limit,hasMore:offset+entries.length<cp.callsPlanned},entries,notClearance:true,
  notice:'Only segmented source candidates have been assessed. Provider outputs are uncalibrated; no filming clearance or document authenticity is established.'};
};
export function createDurableExecution({directory}){
 if(typeof directory!=='string'||!path.isAbsolute(directory))throw Error('Absolute project storage directory required');
 const root=path.join(directory,'.clocked-execution');
 async function init(){await fs.mkdir(root,{recursive:true,mode:0o700});const st=await fs.lstat(root);if(!st.isDirectory()||st.isSymbolicLink())throw Error('Invalid execution data directory');}
 const file=(plan)=>path.join(root,safeId(plan.workspaceId)+'.'+planKey(plan)+'.json');
 const lockfile=id=>path.join(root,safeId(id)+'.lock');
 // For large plans, the full snapshot is a sealed baseline; one fsynced chained
 // event per intent/settlement avoids rewriting tens of thousands of tasks for
 // every single provider request. Files without events remain v1 compatible.
 const SHARD_THRESHOLD=3000;
 const eventFile=(projectId,key)=>path.join(root,safeId(projectId)+'.'+key+'.events');
 const tails=new WeakMap(),entryLookups=new WeakMap();
 function applyEvent(run,event){
  if(!event||typeof event!=='object'||typeof event.at!=='string'||Number.isNaN(Date.parse(event.at)))throw Error('Corrupt large execution event');
  const cp=run.checkpoint;
  if(event.kind==='STATE'){
   if(event.state!=='STALE_SOURCES'||cp.state==='HALTED_UNKNOWN_BILLING')throw Error('Invalid execution state transition');
   cp.state=event.state;
  }else{
   let lookup=entryLookups.get(cp);if(!lookup){lookup=new Map(cp.entries.map(e=>[e.id,e]));entryLookups.set(cp,lookup);}
   const entry=lookup.get(event.id);
   if(!entry||entry.requestHash!==event.requestHash)throw Error('Large execution event task identity mismatch');
   if(event.kind==='INTENT'){
    if(entry.status!=='NOT_ATTEMPTED'||cp.state==='HALTED_UNKNOWN_BILLING'||cp.state==='STALE_SOURCES')throw Error('Duplicate attempted Clocked request in journal');
    entry.status='IN_FLIGHT';cp.attempts++;cp.state='RUNNING';
   }else if(event.kind==='SETTLE'){
    if(entry.status!=='IN_FLIGHT'||!['COMPLETE','BILLING_UNKNOWN'].includes(event.status))throw Error('Illegal Clocked settlement replay');
    if(event.status==='COMPLETE'){
     if(event.finding?.notClearance!==true||event.finding?.requestHash!==entry.requestHash||!Number.isSafeInteger(event.credits)&&event.credits!==null)throw Error('Invalid completed Clocked evidence in event');
     entry.finding=event.finding;entry.credits=event.credits;entry.error=null;entry.status='COMPLETE';cp.confirmedCompleted++;
     if(cp.confirmedCompleted===cp.callsPlanned)cp.state='COMPLETE_FOR_PLANNED_UNITS_ONLY';
    }else{
     if(event.finding!==null||typeof event.error!=='string'||!event.error)throw Error('Invalid uncertain provider settlement');
     entry.status='BILLING_UNKNOWN';entry.error=event.error;cp.unknownBilling++;cp.state='HALTED_UNKNOWN_BILLING';
    }
   }else throw Error('Unknown large execution event kind');
  }
  run.updatedAt=event.at;
 }
 async function hydrate(run,key){
  const name=eventFile(run.projectId,key);
  let raw;try{raw=await fs.readFile(name,'utf8');}catch(e){if(e.code==='ENOENT'){tails.set(run,digest(run));return run;}throw e;}
  if(raw&&!raw.endsWith('\n'))throw Error('Truncated large execution event log: inspect before new provider requests');
  let prev=digest(run);
  for(const line of raw.split('\n')){
   if(!line)continue;
   let record;try{record=JSON.parse(line);}catch{throw Error('Unreadable large execution event log');}
   if(record?.prev!==prev||record.hash!==digest({prev:record.prev,event:record.event}))throw Error('Large execution event checksum chain mismatch');
   applyEvent(run,record.event);prev=record.hash;
  }
  tails.set(run,prev);return run;
 }
 async function appendEvent(plan,run,event){
  let prev=tails.get(run);if(!prev)throw Error('Missing journal baseline hash');
  const hash=digest({prev,event}),name=eventFile(plan.workspaceId,planKey(plan));
  const handle=await fs.open(name,'a',0o600);
  try{await handle.writeFile(JSON.stringify({prev,event,hash})+'\n');await handle.sync();}
  finally{await handle.close();}
  tails.set(run,hash);
 }
 const journaled=plan=>plan.tasks.length>SHARD_THRESHOLD;
 function changeEvent(task,entry,at){
  return {kind:'SETTLE',id:task.id,requestHash:task.requestHash,status:entry.status,
   finding:entry.finding,credits:entry.credits,error:entry.error,at};
 }

 async function readStored(plan){
  await init();let raw;try{raw=await fs.readFile(file(plan),'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}
  let record;try{record=JSON.parse(raw);}catch{throw Error('Execution journal corrupted');}
  if(record?.envelope!=='beforeroll-atomic-execution-v1'||record.hash!==digest(record.run))throw Error('Execution journal SHA-256 integrity failure');
  return validate(await hydrate(record.run,planKey(plan)),plan);
 }
 // A changed production plan does not make unchanged exact tasks billable again.
 // Reconcile by task identity (including source epochs), then independently
 // validate quotes, request hashes and source hashes against the CURRENT plan.
 // This projection is deterministic and read-only until an authorized run seals
 // it as a new baseline. Backup exports include that same baseline.
 function inheritExactTasks(plan,rows){
  const entries=new Map(),currentIds=new Set(plan.taskIds),currentKey=planKey(plan);let updatedAt=null;
  for(const row of rows){
   if(row.planKey===currentKey)continue;
   for(const e of row.run.checkpoint.entries){
    if(e.status==='NOT_ATTEMPTED'||!currentIds.has(e.id))continue;
    const prior=entries.get(e.id);
    const identity=x=>JSON.stringify({requestHash:x.requestHash,status:x.status==='IN_FLIGHT'?'BILLING_UNKNOWN':x.status,finding:x.finding,credits:x.credits});
    if(prior&&identity(prior.entry)!==identity(e))throw Error('Conflicting historical outcomes for the same exact task; owner investigation required');
    entries.set(e.id,{entry:e,origin:e.inheritedFromPlanKey??row.planKey});
   }
   if(row.run.updatedAt&&(!updatedAt||row.run.updatedAt>updatedAt))updatedAt=row.run.updatedAt;
  }
  const cp=createCheckpoint(plan);let inherited=0;
  for(let i=0;i<plan.tasks.length;i++){
   const prior=entries.get(plan.tasks[i].id);if(!prior)continue;
   const e=structuredClone(prior.entry);
   e.inheritedFromPlanKey=prior.origin;
   if(e.status==='IN_FLIGHT'){e.status='BILLING_UNKNOWN';e.error='Historical dispatch interrupted; billing unknown. No retry allowed.';}
   cp.entries[i]=e;cp.attempts++;inherited++;
   if(e.status==='COMPLETE')cp.confirmedCompleted++;
   if(e.status==='BILLING_UNKNOWN')cp.unknownBilling++;
  }
  if(!inherited)return null;
  cp.state=cp.unknownBilling?'HALTED_UNKNOWN_BILLING':cp.confirmedCompleted===cp.callsPlanned?'COMPLETE_FOR_PLANNED_UNITS_ONLY':'READY';
  return validate({schema:'beforeroll-execution-run-v1',projectId:plan.workspaceId,planKey:planKey(plan),checkpoint:cp,createdAt:updatedAt,updatedAt,notClearance:true},plan);
 }
 async function read(plan){
  const stored=await readStored(plan);if(stored)return stored;
  const rows=await exportAllRuns(plan);
  return rows.find(x=>x.planKey===planKey(plan))?.run??null;
 }
 async function write(plan,run){
  run.taskManifest??=plan.tasks.map(t=>({id:t.id,requestHash:t.requestHash,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,sceneHash:t.sceneHash,documentHash:t.documentHash}));
  validate(run,plan);await init();
  const target=file(plan),tmp=path.join(root,'.'+randomUUID()+'.tmp');
  const wrapper={envelope:'beforeroll-atomic-execution-v1',hash:digest(run),run};
  try{await fs.writeFile(tmp,JSON.stringify(wrapper)+'\n',{flag:'wx',mode:0o600});await fs.rename(tmp,target);}finally{await fs.unlink(tmp).catch(()=>{});}
 }
 /** A single journal read feeds BOTH status and full evidence, avoiding torn views
  * if an authorized live request completes between two separate HTTP reads.
  */
 async function snapshot(plan,{offset=0,limit=20}={}){
  if(!Number.isSafeInteger(offset)||offset<0||offset>MAX_PLAN_TASKS||!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('Invalid execution pagination');
  const run=await read(plan);
  const count=await archivedCount(plan);
  return {status:getSummary(run,plan,{offset,limit,archivedRuns:count}),
   evidence:run&&run.checkpoint.attempts>0?evidenceFromRun(run,plan):null,run};
 }
 /** Exact project execution journals for portable owner backup. An archived plan is
  * structurally checked but cannot be recertified against documents no longer present.
  * The CURRENT run is always checked against the reconstructed original source plan.
  */
 function validateHistoric(run,projectId,key){
  if(run?.schema!=='beforeroll-execution-run-v1'||run.projectId!==projectId||run.planKey!==key||run.notClearance!==true||
    run.checkpoint?.schema!=='beforeroll-checkpoint-v1'||run.checkpoint.planIdentity!==key||
    !Array.isArray(run.checkpoint.entries)||run.checkpoint.entries.length>MAX_PLAN_TASKS)throw Error('Historical journal identity/structure mismatch');
  const cp=run.checkpoint;
  let attempts=0,completed=0,unknown=0;
  for(const e of cp.entries){
   if(typeof e.id!=='string'||!/^[a-f0-9]{64}$/.test(e.id)||typeof e.requestHash!=='string'||!/^[a-f0-9]{64}$/.test(e.requestHash)||!allowed.has(e.status)||
    (e.status==='COMPLETE'?!e.finding||e.finding.requestHash!==e.requestHash||e.finding.notClearance!==true:e.finding!==null))throw Error('Historical journal entry identity mismatch');
   if(e.status!=='NOT_ATTEMPTED')attempts++;
   if(e.status==='COMPLETE')completed++;
   if(e.status==='BILLING_UNKNOWN')unknown++;
  }
  if(run.taskManifest&&(!Array.isArray(run.taskManifest)||run.taskManifest.length!==cp.entries.length||run.taskManifest.some((t,i)=>t.id!==cp.entries[i].id||t.requestHash!==cp.entries[i].requestHash||!['sceneId','documentId','unitId'].every(k=>typeof t[k]==='string'&&t[k].length>0))))throw Error('Historical journal task manifest identity mismatch');
  if(cp.callsPlanned!==cp.entries.length||cp.attempts!==attempts||cp.confirmedCompleted!==completed||cp.unknownBilling!==unknown||
   (unknown>0&&cp.state!=='HALTED_UNKNOWN_BILLING'))throw Error('Historical journal checkpoint accounting mismatch');
  return run;
 }
 async function exportAllRuns(plan){
  await init();const prefix=safeId(plan.workspaceId)+'.';
  const names=(await fs.readdir(root)).filter(n=>n.startsWith(prefix)&&n.endsWith('.json')).sort();
  if(names.length>1000)throw Error('Too many archived execution journals for a single backup');
  const rows=[];
  for(const name of names){
   const key=name.slice(prefix.length,-5);
   if(!/^[a-f0-9]{64}$/.test(key))throw Error('Unexpected execution journal filename');
   let wrapper;try{wrapper=JSON.parse(await fs.readFile(path.join(root,name),'utf8'));}catch{throw Error('Execution backup refuses an unreadable journal');}
   if(wrapper.envelope!=='beforeroll-atomic-execution-v1'||wrapper.hash!==digest(wrapper.run))throw Error('Execution backup refuses journal checksum mismatch');
   const complete=await hydrate(wrapper.run,key);
   validateHistoric(complete,plan.workspaceId,key);
   if(key===planKey(plan))validate(complete,plan);
   rows.push({planKey:key,run:complete,sha256:digest(complete),sourceValidation:key===planKey(plan)?'CURRENT_EXACT_PLAN':'ARCHIVED_NOT_SOURCE_REVALIDATED'});
  }
  if(!rows.some(x=>x.planKey===planKey(plan))&&Array.isArray(plan.tasks)){
   const inherited=inheritExactTasks(plan,rows);
   if(inherited)rows.push({planKey:planKey(plan),run:inherited,sha256:digest(inherited),sourceValidation:'CURRENT_EXACT_PLAN'});
  }
  return rows;
 }
 function verifyAllRuns(plan,rows){
  if(!Array.isArray(rows)||rows.length>1000)throw Error('Invalid recovered journal collection');
  const keys=new Set();
  for(const entry of rows){
   if(!entry||!/^[a-f0-9]{64}$/.test(entry.planKey)||keys.has(entry.planKey)||digest(entry.run)!==entry.sha256)throw Error('Recovery journal checksum/duplicate mismatch');
   keys.add(entry.planKey);validateHistoric(entry.run,plan.workspaceId,entry.planKey);
   if(entry.planKey===planKey(plan))validate(entry.run,plan);
   if(entry.sourceValidation!==(entry.planKey===planKey(plan)?'CURRENT_EXACT_PLAN':'ARCHIVED_NOT_SOURCE_REVALIDATED'))throw Error('Recovery journal provenance label mismatch');
  }
  return {count:rows.length,current:rows.filter(x=>x.planKey===planKey(plan)).length,archived:rows.filter(x=>x.planKey!==planKey(plan)).length};
 }
 async function restoreAllRuns(plan,rows){
  verifyAllRuns(plan,rows);
  await init();let lock;try{lock=await fs.open(lockfile(plan.workspaceId),'wx',0o600);}catch(e){if(e.code==='EEXIST')throw Error('Recovery blocked by active/stranded execution lock');throw e;}
  const created=[];
  try{
   for(const entry of rows){
    const destination=path.join(root,safeId(plan.workspaceId)+'.'+entry.planKey+'.json');
    try{await fs.access(destination);throw Error('Recovery refused: existing project execution journal');}catch(e){if(e.code!=='ENOENT')throw e;}
   }
   // Current journal first: a stranded partial recovery must never erase attempted requests.
   const ordered=[...rows].sort((a,b)=>Number(b.planKey===planKey(plan))-Number(a.planKey===planKey(plan)));
   for(const entry of ordered){
    const destination=path.join(root,safeId(plan.workspaceId)+'.'+entry.planKey+'.json');
    const wrapper={envelope:'beforeroll-atomic-execution-v1',hash:entry.sha256,run:entry.run};
    const temp=path.join(root,'.'+randomUUID()+'.tmp');
    try{await fs.writeFile(temp,JSON.stringify(wrapper)+'\n',{flag:'wx',mode:0o600});await fs.rename(temp,destination);created.push(destination);}finally{await fs.unlink(temp).catch(()=>{});}
   }
   return {restored:created.length};
  }catch(error){for(const name of created)await fs.unlink(name).catch(()=>{});throw error;
  }finally{await lock.close();await fs.unlink(lockfile(plan.workspaceId));}
 }
 async function archivedCount(plan){
  await init();const prefix=safeId(plan.workspaceId)+'.';return (await fs.readdir(root)).filter(n=>n.startsWith(prefix)&&n.endsWith('.json')&&n!==path.basename(file(plan))).length;
 }
 async function status(plan,{offset=0,limit=20}={}){
  if(!Number.isSafeInteger(offset)||offset<0||offset>MAX_PLAN_TASKS||!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('Invalid execution pagination');
  const run=await read(plan);return getSummary(run,plan,{offset,limit,archivedRuns:await archivedCount(plan)});
 }
 function evidenceFromRun(run,plan){
  if(!run)throw Error('No project Clocked execution journal exists');
  const cp=run.checkpoint;
  const records=plan.tasks.map((task,i)=>{
   const entry=cp.entries[i];
   return {id:task.id,documentId:task.documentId,documentHash:task.documentHash,documentRevision:task.documentRevision,
    sceneId:task.sceneId,sceneHash:task.sceneHash,unitId:task.unitId,sourceRange:task.sourceRange,
    sourceQuote:task.sourceQuote,requestHash:task.requestHash,status:entry.status,credits:entry.credits,error:entry.error,inheritedFromPlanKey:entry.inheritedFromPlanKey??null,
    finding:entry.finding?{code:entry.finding.code,status:entry.finding.status,relevance:entry.finding.relevance,grant:entry.finding.grant,
     modelAnswers:entry.finding.modelAnswers,...(entry.finding.controlledTest?{controlledTest:true}:{}),...(entry.finding.replayOrigin?{replayOrigin:entry.finding.replayOrigin,legacyRequestHash:entry.finding.legacyRequestHash}:{}),scope:entry.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'?modelGrantScope(task.sourceQuote,task.sceneId):null,notClearance:true}:null};
  });
  const evidence={schema:'beforeroll-project-model-evidence-v1',origin:cp.entries.some(e=>e.finding?.controlledTest)?'CONTROLLED_TEST_RESPONSE_NOT_CLOCKED':cp.entries.some(e=>e.finding?.replayOrigin)?'OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT': 'LOCAL_OWNER_RUN_NOT_CRYPTOGRAPHICALLY_ATTESTED',workspaceId:plan.workspaceId,
   planKey:planKey(plan),callSheetHash:plan.callSheetHash,documents:plan.documents,createdAt:run.createdAt,updatedAt:run.updatedAt,
   state:cp.state,planned:cp.callsPlanned,attempts:cp.attempts,confirmedCompleted:cp.confirmedCompleted,
   unknownBilling:cp.unknownBilling,records,notClearance:true,scope:'SEGMENTED_SOURCE_UNITS_NOT_COMPLETE_LEGAL_DOCUMENT_AUTHORITY',
   warning:'Original content and model scores are unverified interpretation, not permission to film. Source revisions produce new journals.'};
  return {...evidence,sha256:digest(evidence)};
 }
 async function exportEvidence(plan){const run=await read(plan);return evidenceFromRun(run,plan);}
 async function runBatch({workspace,plan,maxCalls,transport,checkFresh=()=>Promise.resolve(workspace),beforeCall=()=>{},operatorAuthorized=false}){
  if(!operatorAuthorized||typeof transport!=='function'||!Number.isSafeInteger(maxCalls)||maxCalls<1||maxCalls>32)throw Error('Authorized batch must specify 1-32 requests');
  assertPlanFresh(workspace,plan);await init();
  let lock;try{lock=await fs.open(lockfile(plan.workspaceId),'wx',0o600);}catch(e){if(e.code==='EEXIST'){const conflict=Error('An execution is active or a crashed lock needs owner inspection; no calls made');conflict.httpStatus=409;throw conflict;}throw e;}
  try{
   let run=await readStored(plan);
   if(!run){
    run=await read(plan);
    if(run){await write(plan,run);tails.set(run,digest(run));}
   }
   if(!run){run={schema:'beforeroll-execution-run-v1',projectId:plan.workspaceId,planKey:planKey(plan),checkpoint:createCheckpoint(plan),createdAt:new Date().toISOString(),updatedAt:null,notClearance:true};await write(plan,run);tails.set(run,digest(run));}
   const cp=run.checkpoint;
   const unfinished=cp.entries.find(e=>e.status==='IN_FLIGHT');
   if(unfinished){
    const task=plan.tasks.find(t=>t.id===unfinished.id);
    haltUnknown(cp,task,'Process interrupted after dispatch intent; billing unknown. No retry allowed.');
    run.updatedAt=new Date().toISOString();if(journaled(plan))await appendEvent(plan,run,changeEvent(task,cp.entries.find(e=>e.id===task.id),run.updatedAt));else await write(plan,run);
   }
   if(cp.state==='HALTED_UNKNOWN_BILLING'||cp.state==='STALE_SOURCES')return {executed:0,...await status(plan)};
   let executed=0;
   for(;executed<maxCalls;){
    const current=await checkFresh();try{assertPlanFresh(current,plan);}catch{cp.state='STALE_SOURCES';run.updatedAt=new Date().toISOString();if(journaled(plan))await appendEvent(plan,run,{kind:'STATE',state:'STALE_SOURCES',at:run.updatedAt});else await write(plan,run);break;}
    const task=nextPlannedTask(plan,cp);
    if(!task)break;
    await beforeCall(task); // Budget validation happens before durable attempt; failures consume no request.
    markAttempt(cp,task);run.updatedAt=new Date().toISOString();if(journaled(plan))await appendEvent(plan,run,{kind:'INTENT',id:task.id,requestHash:task.requestHash,at:run.updatedAt});else await write(plan,run);
    executed++;
    try{
     const receipt=await transport(task.payload,task);
     if(!receipt?.response)throw Error('Provider returned no usable response');
     commitAnswer(cp,task,receipt.response,{credits:receipt.credits??null,replayOrigin:receipt.replayOrigin??null,legacyRequestHash:receipt.legacyRequestHash??null,controlledTest:receipt.controlledTest===true});
    }catch{if(cp.entries.find(e=>e.id===task.id)?.status==='IN_FLIGHT')haltUnknown(cp,task,'Provider error/timeout/invalid JSON; billing unknown; no retry');}
    run.updatedAt=new Date().toISOString();if(journaled(plan))await appendEvent(plan,run,changeEvent(task,cp.entries.find(e=>e.id===task.id),run.updatedAt));else await write(plan,run);
    if(cp.state==='HALTED_UNKNOWN_BILLING')break;
   }
   return {executed,...await status(plan)};
  }finally{await lock.close();await fs.unlink(lockfile(plan.workspaceId));}
 }
 return {read,status,snapshot,runBatch,exportEvidence,exportAllRuns,restoreAllRuns,verifyAllRuns,inspectRun:(plan,run)=>({status:getSummary(run,plan),evidence:run&&run.checkpoint.attempts>0?evidenceFromRun(run,plan):null}),directory:root};
}
