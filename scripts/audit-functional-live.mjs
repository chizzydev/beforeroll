/** Read-only audit of the mission's generated local live journals. No .env,
 * network, provider dispatch, source rewriting or frozen-study re-scoring. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {setCallSheet} from '../src/production-workspace.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory=path.join(root,'.beforeroll-data','functional-live-20261025');
const store=createWorkspaceStore({directory}),ex=createDurableExecution({directory}),vault=createSourceOriginalVault({directory});
const saved=await store.load('functional_live_20261025');if(!saved)throw Error('No mission evidence available');
const w=saved.workspace,current=planIntelligence(w),original=structuredClone(w);
const receipt=w.imports.find(r=>r.kind==='callSheet');
original.callSheet=null;setCallSheet(original,(await vault.read(receipt.rawHash)).toString('utf8'));
const initial=planIntelligence(original),plans=[initial,current];
// Explicit semantic expectations for ALL passages and scenes, not a selected
// success subset. These are an engineering audit, NOT preregistered model science.
const expected={S1:{U001:['low','low'],U002:['high','low'],U003:['high','high'],U004:['low','low']},
 S2:{U001:['low','low'],U002:['high','low'],U003:['low','low'],U004:['high','low']}};
const checked=new Set();let checks=0,passed=0,unknown=0,knownCredits=0;
for(const plan of plans){
 const result=await ex.snapshot(plan);
 for(const [i,e] of (result.run?.checkpoint.entries??[]).entries()){
  if(checked.has(e.id))continue;checked.add(e.id);const task=plan.tasks[i];
  if(e.status!=='COMPLETE'){unknown++;continue;}
  knownCredits+=e.credits??0;
  const a=e.finding.modelAnswers,[link,grant]=expected[task.sceneId][task.unitId];
  for(const [field,band] of [['activity_link',link],['granted_for_scene',grant]]){
   checks++;const actual=a[field].noul,ok=band==='high'?actual>=.8:actual<=.2;if(ok)passed++;
   console.log(`${ok?'PASS':'FAIL'} ${task.sceneId}/${task.unitId} ${field} expected=${band} actual=${actual}`);
  }
 }
}
console.log(JSON.stringify({distinctRequests:checked.size,comparisons:checks,passed,unknown,knownCredits,newRequestsInThisAudit:0,
 scope:'Generated-only integration expectations; not preregistered scientific accuracy, calibrated confidence or filming authority'}));
if(unknown||passed!==checks)process.exitCode=2;
