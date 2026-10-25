/** Deliberate local evaluation sandbox: NO owner project directory, NO API keys.
 * Generated fictional documents and independently recorded Clocked answers only.
 * Replays are cross-contract demonstrations and are NEVER new provider requests.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {mkdtempSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createWorkspaceStore} from './workspace-store.mjs';
import {createSourceOriginalVault} from './source-originals.mjs';
import {createDurableExecution} from './durable-execution.mjs';
import {createProduction,applySourceImport} from './production-workspace.mjs';
import {inspectImport} from './source-intake.mjs';
import {planIntelligence} from './intelligence-workflow.mjs';
import {sha256} from './semantic.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CASE_IDS=['U01','U02'];
const DATA_IDS={U01:'eval_archive',U02:'eval_arcade'};
export const EVALUATION_NOTICE='FICTIONAL DOCUMENTS ONLY. Recorded Clocked answers from earlier owner experiments are replayed against matching clause/scene text. No new API calls; no filming clearance. Local evaluation state is disposable. Never upload private documents here.';
function casesPath(){return path.join(ROOT,'fixtures','M3S6_UNFAMILIAR_CASES.json');}
async function sourceCase(id){
 if(!CASE_IDS.includes(id))throw Error('Unknown evaluation case');
 const meta=JSON.parse(await fs.readFile(casesPath(),'utf8')).cases.find(x=>x.id===id);
 const live=JSON.parse(await fs.readFile(path.join(ROOT,'fixtures','audit',`M3S6_${id}_OWNER_LIVE_EVIDENCE.json`),'utf8'));
 if(!meta||!live||live.source!=='live-clocked-decide-multi-scene'||live.endpoint!=='decide'||live.permitHash!==sha256(meta.permit)||live.scenes?.length!==meta.scenes.length)throw Error('Frozen evaluation evidence identity failed');
 for(let i=0;i<meta.scenes.length;i++){
  if(live.scenes[i].sceneRow!==meta.scenes[i]||live.scenes[i].sceneHash!==sha256(meta.scenes[i])||live.scenes[i].scan?.complete!==true||live.scenes[i].scan?.results?.length!==4)throw Error('Frozen scene recording mismatch');
 }
 return {meta,live};
}
export async function makeEvaluationRuntime({directory=null}={}){
 const root=directory??mkdtempSync(path.join(os.tmpdir(),'beforeroll-evaluation-'));
 if(!path.isAbsolute(root))throw Error('Evaluation workspace must be absolute');
 const store=createWorkspaceStore({directory:root}),execution=createDurableExecution({directory:root}),vault=createSourceOriginalVault({directory:root});
 async function seed(){
  for(const id of CASE_IDS){
   const {meta}=await sourceCase(id),pId=DATA_IDS[id];
   if(await store.load(pId))continue;
   const w=createProduction({id:pId,title:'FICTIONAL EXAMPLE — '+meta.title});
   const files=[{name:`${id}_FICTIONAL_PERMIT.txt`,kind:'permit',text:meta.permit},{name:`${id}_FICTIONAL_SCENES.txt`,kind:'callSheet',text:meta.scenes.join('\n')}];
   for(const file of files){const envelope=inspectImport(file);applySourceImport(w,envelope,{documentId:id+'_PERMIT'});await vault.storeImport(file,envelope);}
   const saved=await store.persist(w,{expectedVersion:0});
   if(id==='U01')await replayOne(saved.workspace,id); // immediate example with authentic recorded answers
  }
 }
 async function replayOne(workspace,id){
  const {meta,live}=await sourceCase(id);
  if(workspace.id!==DATA_IDS[id]||workspace.documents.length!==1||workspace.documents[0].text!==meta.permit||workspace.callSheet?.text!==meta.scenes.join('\n'))throw Error('This edited project does not match the frozen fictional recording; reset to replay.');
  const plan=planIntelligence(workspace);
  if(plan.tasks.length!==8)throw Error('Frozen source plan changed: refusing recorded replay');
  const lookup=new Map();
  for(const scene of live.scenes)for(const result of scene.scan.results){
   if(result.notClearance!==true||!result.modelAnswers?.activity_link||!result.modelAnswers?.granted_for_scene)throw Error('Recorded Clocked evidence is incomplete');
   lookup.set(scene.sceneId+'\u0000'+result.clause,{scene,result});
  }
  for(const task of plan.tasks){const match=lookup.get(task.sceneId+'\u0000'+task.sourceQuote);if(!match||match.scene.sceneRow!==meta.scenes.find(x=>x.startsWith('Scene '+task.sceneId.slice(1)+' |')))throw Error('Unmatched frozen task; no scores replayed');}
  let cursor=0;
  const transport=async(_payload,task)=>{
   const match=lookup.get(task.sceneId+'\u0000'+task.sourceQuote);if(!match)throw Error('Missing exact frozen answer');
   cursor++;
   return {response:{answers:match.result.modelAnswers},credits:match.result.reportedCredits??null,
    replayOrigin:'OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT',legacyRequestHash:match.result.requestHash};
  };
  const result=await execution.runBatch({workspace,plan,maxCalls:8,operatorAuthorized:true,transport,
   checkFresh:async()=>{const saved=await store.load(workspace.id);return saved?.workspace;}});
  if(result.completed!==8||cursor!==8)throw Error('Evaluation fixture replay did not complete');
  return {schema:'beforeroll-evaluation-recorded-replay-v1',caseId:id,checksReplayed:cursor,liveCalls:0,creditsConsumedNow:0,originalCalls:8,notClearance:true,notice:EVALUATION_NOTICE};
 }
 async function replay(id){
  const caseId=Object.keys(DATA_IDS).find(key=>DATA_IDS[key]===id);
  if(!caseId)throw Error('Only generated evaluation examples support replay');
  const saved=await store.load(id);if(!saved)throw Error('Evaluation project missing');
  const plan=planIntelligence(saved.workspace),status=await execution.status(plan);
  if(status.attempts!==0){if(status.completed===8&&status.attempts===8)return {caseId,checksReplayed:0,liveCalls:0,creditsConsumedNow:0,alreadyReplayed:true,notClearance:true};throw Error('The current plan already has results or uncertain attempts; reset the fictional examples before replay');}
  return replayOne(saved.workspace,caseId);
 }
 let pending=null;
 async function reset(){
  if(pending)return pending;
  pending=(async()=>{
   // Evaluation content is synthetic and disposable; owner workspace storage is never referenced.
   await fs.rm(root,{recursive:true,force:true});await seed();return {reset:true,liveCalls:0,notClearance:true};
  })();
  try{return await pending;}finally{pending=null;}
 }
 await seed();
 return {directory:root,store,execution,vault,replay,reset,notice:EVALUATION_NOTICE,
  dispose:async()=>fs.rm(root,{recursive:true,force:true})};
}
