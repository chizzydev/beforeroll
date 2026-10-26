/** Actual app, generated-only stores. No .env read and no provider transport. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createAppServer} from '../server.mjs';
import {makeEvaluationRuntime} from '../src/evaluation-mode.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createProduction,applySourceImport} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
const root=path.resolve(import.meta.dirname,'..');
const directory=path.join(root,'.beforeroll-data/design-acceptance');
const copyFrom=path.join(root,'.beforeroll-data/closure-browser');
await fs.mkdir(directory,{recursive:true});
// Copy only the known fictional engineering store. Never open the owner's real production directory.
if(!await fs.stat(path.join(directory,'lantern_live.json')).catch(()=>null)){
 for(const name of ['lantern_live.json','history_fixture.json','.clocked-execution','.source-originals','.recovered']){
  const source=path.join(copyFrom,name);if(await fs.stat(source).catch(()=>null))await fs.cp(source,path.join(directory,name),{recursive:true,errorOnExist:true,force:false});
 }
}
const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory}),vault=createSourceOriginalVault({directory});
async function seed(id,title,sceneCount,unknown=false){if(await store.load(id))return;
 const w=createProduction({id,title});
 const long='All camera equipment must remain within the documented route. '+Array.from({length:20},(_,i)=>`Section ${i+1} requires the coordinator to compare the exact scene, operating area and original load assessment before moving equipment. This is generated acceptance material, not a real permit.`).join(' ');
 for(const file of [{kind:'permit',name:'long-source.txt',text:long+'\n\nNo equipment may obstruct the public passage.\n\nAny exception requires a separately issued scene-specific variation.'},{kind:'permit',name:'conditions.txt',text:'Keep the signed route plan with the location coordinator.\n\nA request for altered access has not been issued as an amendment.'},{kind:'callSheet',name:'many-scenes.csv',text:'scene,location,start,end,activity\n'+Array.from({length:sceneCount},(_,i)=>`${201+i},Fictional East Quay,09:00,10:00,Move a rolling camera platform along the passage`).join('\n')}]){
  const intake=inspectImport(file);applySourceImport(w,intake,{documentId:file.kind==='permit'?(file.name==='conditions.txt'?'CONDITIONS':'LONG'):null});await vault.storeImport(file,intake);
 }
 await store.persist(w,{expectedVersion:0});
 try{await execution.runBatch({workspace:w,plan:planIntelligence(w),maxCalls:unknown?1:2,operatorAuthorized:true,transport:async()=>{if(unknown)throw Error('CONTROLLED interrupted transport fixture; no network dispatch');return {response:{answers:{activity_link:{type:'noul',noul:.9},granted_for_scene:{type:'noul',noul:.01}}},credits:0,controlledTest:true};}});}catch(e){if(!unknown)throw e;}
}
await seed('design_many','CONTROLLED — 75 scenes, long sources, partial analysis',75);
await seed('design_uncertain','CONTROLLED — interrupted request, never retry',2,true);
const evaluation=await makeEvaluationRuntime({directory:path.join(root,'.beforeroll-data/design-evaluation')});
const evalServer=createAppServer({evaluationMode:true,evaluationRuntime:evaluation,workspaceStore:evaluation.store,executionStore:evaluation.execution,sourceVault:evaluation.vault,enabled:false,apiKey:null,operatorToken:null});
const privateServer=createAppServer({workspaceStore:store,executionStore:execution,sourceVault:vault,ownerToken:'design-fictional-owner-token-local-only-2026',operatorToken:'design-disabled-operator',enabled:false,apiKey:null,controlledTestMode:true,fetchImpl:async()=>{throw Error('Acceptance provider transport is disabled');}});
evalServer.listen(3045,'127.0.0.1',()=>console.log('DESIGN_EVALUATION=http://127.0.0.1:3045/'));
privateServer.listen(3046,'127.0.0.1',()=>console.log('DESIGN_GENERATED_PRIVATE=http://127.0.0.1:3046/ · provider disabled'));
