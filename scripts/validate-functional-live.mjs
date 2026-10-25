/** Explicit one-time mission validation. Real provider, fictional sources only.
 * At most 12 NEW requests; no retries. Never prints credentials or raw documents.
 * Existing isolated receipt/store blocks another run, including unknown billing.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadLocalEnv} from '../src/local-env.mjs';
import {createAppServer} from '../server.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if(process.argv[2]!=='--authorize-12-fictional-requests')throw Error('Explicit mission request authorization flag required');
loadLocalEnv({directory:root});
if(!process.env.CLOCKED_API_KEY||!process.env.BEFOREROLL_OPERATOR_TOKEN){console.log('LIVE_VALIDATION=UNAVAILABLE NEW_REQUESTS=0');process.exit(2);}
const directory=path.join(root,'.beforeroll-data','functional-live-20261025');
await fs.mkdir(directory,{recursive:true});
// The marker is intentionally never removed: restarting must not reset the budget.
await fs.writeFile(path.join(directory,'mission-started.json'),JSON.stringify({maxNewRequests:12,startedAt:new Date().toISOString(),retry:false}),{flag:'wx',mode:0o600});
const ownerToken=randomBytes(32).toString('hex');
const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory});
const server=createAppServer({workspaceStore:store,executionStore:execution,ownerToken,enabled:true,
 apiKey:process.env.CLOCKED_API_KEY,operatorToken:process.env.BEFOREROLL_OPERATOR_TOKEN,maxCallsPerHour:32});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
const report={schema:'beforeroll-functional-live-validation-v1',maxNewRequests:12,newAttempts:0,knownCredits:0,unknownCreditEntries:0,notClearance:true,phases:[]};
async function request(url,body,operator=false){
 const r=await fetch(base+url,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(operator?{'X-Operator-Token':process.env.BEFOREROLL_OPERATOR_TOKEN}:{})},body:body?JSON.stringify(body):undefined});
 const data=await r.json();if(!r.ok)throw Error('Local validation route failed: HTTP '+r.status);
 if(url==='/api/owner/unlock')cookie=r.headers.get('set-cookie').split(';')[0];return data;
}
const endpoint='/api/workspaces/functional_live_20261025';
try{
 await request('/api/owner/unlock',{token:ownerToken});
 let saved=await request('/api/workspaces',{id:'functional_live_20261025',title:'Generated fictional mission production'});
 const permit='FICTIONAL LOCATION CONSENT authorizes filming at Imaginary Hall on 8 November 2026.\n\nWheeled camera platforms must not cross the mosaic floor without an issued scene-specific exception.\n\nISSUED ADDENDUM specifically permits Scene 1 to use a wheeled camera dolly on the mosaic floor while protective boards and a registrar are present.\n\nThe location manager requested the same exception for Scene 2, but the request has not been issued or approved.';
 const sheet='Scene 1 | Imaginary Hall | 09:00-09:30 | Wheeled camera dolly on mosaic floor with protective boards and registrar\nScene 2 | Imaginary Hall | 10:00-10:30 | Wheeled camera platform across mosaic floor';
 saved=await request(endpoint+'/import',{expectedVersion:saved.version,documentId:'FICTIONAL',file:{kind:'permit',name:'fictional.txt',text:permit}});
 saved=await request(endpoint+'/import',{expectedVersion:saved.version,file:{kind:'callSheet',name:'fictional.txt',text:sheet}});
 let workflow=await request(endpoint+'/workflow');if(workflow.overview.plannedCalls!==8)throw Error('Unexpected plan size; no dispatch');
 const initial=await request(endpoint+'/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:8},true);
 report.newAttempts+=initial.executed;
 report.phases.push({phase:'initial',executed:initial.executed,completed:initial.completed,state:initial.state,knownCredits:initial.knownCredits,unknownCreditEntries:initial.unknownCreditEntries});
 if(initial.completed===8&&!initial.unknownBilling){
  const file={kind:'callSheet',name:'fictional-revised.txt',text:sheet.replace('10:00-10:30','10:05-10:35')};
  const preview=await request(endpoint+'/impact',{expectedVersion:saved.version,file});
  saved=await request(endpoint+'/commit-source-change',{expectedVersion:saved.version,file,previewSha256:preview.previewSha256});
  workflow=await request(endpoint+'/workflow');
  if(workflow.execution.completed!==4||workflow.execution.retainedAttempts!==4)throw Error('Unchanged task retention failed; no further dispatch');
  const revised=await request(endpoint+'/execution',{confirm:'RUN_PROJECT_CLOCKED',maxCalls:4},true);report.newAttempts+=revised.executed;
  report.phases.push({phase:'revised_scene_only',executed:revised.executed,completed:revised.completed,retainedAttempts:revised.retainedAttempts,state:revised.state,knownCredits:revised.knownCredits,unknownCreditEntries:revised.unknownCreditEntries});
 }
 const pack=await request(endpoint+'/dossier/complete');
 const originals=pack.journals.filter(j=>!j.run.checkpoint.entries.every(e=>e.inheritedFromPlanKey));
 const unique=new Map();for(const j of originals)for(const e of j.run.checkpoint.entries)if(e.status!=='NOT_ATTEMPTED')unique.set(e.id,e);
 report.newAttempts=unique.size;report.knownCredits=[...unique.values()].reduce((n,e)=>n+(Number.isSafeInteger(e.credits)?e.credits:0),0);
 report.unknownCreditEntries=[...unique.values()].filter(e=>e.credits===null).length;
 report.observations=pack.dossier.sceneTasks.map(t=>({sceneId:t.sceneId,unitId:t.unitId,status:t.modelState,relevance:t.model?.relevance??null,grant:t.model?.grant??null,retained:Boolean(t.inheritedFromPlanKey)}));
 report.completedCurrent=pack.dossier.counts.completedModelChecks;
 report.verdict=report.newAttempts===12&&report.completedCurrent===8?'COMPLETED_CURRENT_CONTRACT_AND_SELECTIVE_REANALYSIS':'INCOMPLETE_NO_RETRY';
}catch{
 report.verdict='STOPPED_NO_RETRY';report.limitation='A local or provider operation failed. Inspect the isolated durable journal; do not reset the marker or automatically retry.';
 // Even when the HTTP response is unavailable, durable intent accounting remains authoritative.
 try{const w=(await store.load('functional_live_20261025'))?.workspace;if(w){const {planIntelligence}=await import('../src/intelligence-workflow.mjs');const rows=await execution.exportAllRuns(planIntelligence(w));const entries=new Map();for(const row of rows)for(const e of row.run.checkpoint.entries)if(e.status!=='NOT_ATTEMPTED')entries.set(e.id,e);report.newAttempts=entries.size;report.knownCredits=[...entries.values()].reduce((n,e)=>n+(e.credits??0),0);report.unknownCreditEntries=[...entries.values()].filter(e=>e.credits===null).length;}}catch{report.accounting='Inspect durable journal before any further calls';}
}finally{
 await fs.writeFile(path.join(directory,'mission-receipt.json'),JSON.stringify(report,null,2),{mode:0o600});
 console.log(JSON.stringify(report));await new Promise(ok=>server.close(ok));
}
