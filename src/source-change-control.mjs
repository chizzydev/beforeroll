/** Read-only, pre-commit source impact preview. No persistence or Clocked requests.
 * The same applySourceImport function is used for preview and commit, preventing
 * a separate guess-based invalidation implementation.
 */
import {applySourceImport,assertWorkspaceSources} from './production-workspace.mjs';
import {planIntelligence} from './intelligence-workflow.mjs';
import {projectAuthorityGraph} from './document-authority.mjs';
import {projectSceneAuthority} from './scene-authority.mjs';
import {projectOperations} from './production-operations.mjs';
import {createHash} from 'node:crypto';
function planResult(w){try{const p=planIntelligence(w);return {ids:new Set(p.taskIds),tasks:p.tasks,planned:p.plannedCalls,blocked:null};}catch(e){
 if(!/^(Need source documents|Unsupported call-sheet|Invalid scene rows|Document coverage|PDF .* requires human verification|Document-scene plan requires more than)/.test(e.message))throw e;
 return {ids:null,tasks:[],planned:null,blocked:e.message};}}
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function group(rows,key){const result={};for(const r of rows){const k=r[key];result[k]=(result[k]??0)+1;}return Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b)));}
/** Verify that a commit uses the same original bytes, source identity, and persisted
 * version as the owner's read-only preview. This is not a permission to film. */
export function verifySourceChangeCommit(workspace,envelope,{documentId=null,persistedVersion,previewSha256}={}){
 if(typeof previewSha256!=='string'||!/[0-9a-f]{64}/.test(previewSha256)||previewSha256.length!==64)throw Error('The exact source-change preview fingerprint is required');
 const preview=previewSourceChange(workspace,envelope,{documentId,persistedVersion});
 if(preview.previewSha256!==previewSha256)throw Error('Source-change preview differs from the file, project version or original evidence; re-preview before committing');
 if(!preview.changed)throw Error('No source-identity change to commit');
 return preview;
}
function allCurrentLinkIds(w){
 const ids=new Set();for(let offset=0;offset<(w.authorityLinks??[]).length;offset+=100){
  const page=projectAuthorityGraph(w,{offset,limit:100});
  for(const link of page.links)if(link.status==='HUMAN_ASSERTED_UNVERIFIED')ids.add(link.id);
 }return ids;
}
function allCurrentClaimIds(w){
 const ids=new Set();for(let offset=0;offset<(w.sceneAuthority??[]).length;offset+=100){
  const page=projectSceneAuthority(w,{offset,limit:100});
  for(const claim of page.records)if(claim.sourceState==='CURRENT_UNVERIFIED')ids.add(claim.id);
 }return ids;
}
function retireIds(before,after){return [...before].filter(x=>!after.has(x)).sort();}
function currentCounts(w){
 const now='2026-01-01T00:00:00.000Z';
 return {documentLinks:projectAuthorityGraph(w).summary,sceneClaims:projectSceneAuthority(w).summary,operations:projectOperations(w,{asOf:now}).summary};
}
export function previewSourceChange(workspace,envelope,{documentId=null,persistedVersion}={}){
 assertWorkspaceSources(workspace);
 if(!Number.isSafeInteger(persistedVersion)||persistedVersion<1)throw Error('Impact preview needs a persisted production version');
 if(envelope?.schema!=='beforeroll-source-import-v1')throw Error('Invalid imported source envelope');
 const beforePlan=planResult(workspace),beforeCounts=currentCounts(workspace);
 const before={documents:workspace.documents.map(d=>({id:d.id,sourceHash:d.sourceHash,revision:d.revision,rawHash:d.importReceipt?.rawHash??null})),
  callSheetHash:workspace.callSheet?.sourceHash??null,sceneIds:workspace.callSheet?.scenes?.map(x=>x.id)??[],humanReviews:workspace.reviewActions.length};
 const after=structuredClone(workspace);
 applySourceImport(after,envelope,{documentId});assertWorkspaceSources(after);
 const afterPlan=planResult(after),afterCounts=currentCounts(after);
 const retained=beforePlan.ids&&afterPlan.ids?[...beforePlan.ids].filter(id=>afterPlan.ids.has(id)).length:null;
 const oldTaskCount=beforePlan.planned,newTaskCount=afterPlan.planned;
 const affected=oldTaskCount===null||newTaskCount===null?null:{retained,retired:oldTaskCount-retained,added:newTaskCount-retained};
 const pastReviewIds=new Set(afterPlan.ids??[]);
 const priorReviews=workspace.reviewActions.filter(a=>beforePlan.ids?.has(a.evidenceId)).length;
 const preservedCurrentReviews=afterPlan.ids?workspace.reviewActions.filter(a=>pastReviewIds.has(a.evidenceId)).length:null;
 const revisedDoc=after.documents.find(d=>d.id===documentId);
 const oldIds=new Set(before.sceneIds),newIds=new Set(after.callSheet?.scenes?.map(x=>x.id)??[]);
 const oldTaskMap=new Map(beforePlan.tasks.map(t=>[t.id,t])),newTaskMap=new Map(afterPlan.tasks.map(t=>[t.id,t]));
 const retiredTasks=[...oldTaskMap.values()].filter(t=>!newTaskMap.has(t.id));
 const addedTasks=[...newTaskMap.values()].filter(t=>!oldTaskMap.has(t.id));
 const oldOps=projectOperations(workspace,{asOf:'2026-01-01T00:00:00.000Z'}),newOps=projectOperations(after,{asOf:'2026-01-01T00:00:00.000Z'});
 const oldSchedules=new Set(oldOps.scenes.filter(s=>s.scheduleState==='DATED_HUMAN_PLAN_NOT_AUTHORITY').map(s=>s.sceneId));
 const newSchedules=new Set(newOps.scenes.filter(s=>s.scheduleState==='DATED_HUMAN_PLAN_NOT_AUTHORITY').map(s=>s.sceneId));
 const oldLinks=allCurrentLinkIds(workspace),newLinks=allCurrentLinkIds(after);
 const oldClaims=allCurrentClaimIds(workspace),newClaims=allCurrentClaimIds(after);
 const currentConditions=x=>x.filter(c=>c.sourceState==='CURRENT_HUMAN_CLAIM').length;
 const reconciliation={
  scenes:{added:[...newIds].filter(id=>!oldIds.has(id)).sort(),removed:[...oldIds].filter(id=>!newIds.has(id)).sort(),retained:[...newIds].filter(id=>oldIds.has(id)).sort()},
  exactModelTasks:{retiredByScene:group(retiredTasks,'sceneId'),addedByScene:group(addedTasks,'sceneId'),
   retiredReviewed:retiredTasks.filter(t=>workspace.reviewActions.some(r=>r.evidenceId===t.id)).length,
   retiredSample:retiredTasks.slice(0,40).map(t=>({id:t.id,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId})),
   addedSample:addedTasks.slice(0,40).map(t=>({id:t.id,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId})),
   samplesTruncated:retiredTasks.length>40||addedTasks.length>40},
  documentaryLinks:{currentBefore:oldLinks.size,currentAfter:newLinks.size,becomingHistorical:retireIds(oldLinks,newLinks).length,
   retiredIdSample:retireIds(oldLinks,newLinks).slice(0,40),revalidatedHistoric:retireIds(newLinks,oldLinks).length},
  sceneAuthorityClaims:{currentBefore:oldClaims.size,currentAfter:newClaims.size,becomingHistorical:retireIds(oldClaims,newClaims).length,
   retiredIdSample:retireIds(oldClaims,newClaims).slice(0,40),revalidatedHistoric:retireIds(newClaims,oldClaims).length},
  schedules:{currentBefore:oldSchedules.size,currentAfter:newSchedules.size,requireReconfirmation:[...oldSchedules].filter(id=>!newSchedules.has(id)).sort()},
  prerequisites:{currentBefore:currentConditions(oldOps.conditions),currentAfter:currentConditions(newOps.conditions),becomingHistorical:Math.max(0,currentConditions(oldOps.conditions)-currentConditions(newOps.conditions))},
  originalSource:{previousRawHashes:(workspace.imports??[]).map(x=>x.rawHash).filter(Boolean),newRawSha256:envelope.rawHash},
  effect:'READ_ONLY_RECONCILIATION_NOT_CLEARANCE'
 };
 const output={schema:'beforeroll-readonly-source-impact-v1',productionId:workspace.id,persistedVersion,
  requested:{kind:envelope.kind,documentId:envelope.kind==='permit'?documentId:null,fileName:envelope.name,originalFileSha256:envelope.rawHash,extractedTextSha256:envelope.normalizedHash,importEnvelopeSha256:sha(envelope)},
  changed:envelope.kind==='callSheet'?before.callSheetHash!==after.callSheet?.sourceHash:
   !before.documents.some(d=>d.id===documentId&&d.sourceHash===revisedDoc?.sourceHash&&d.rawHash===revisedDoc?.importReceipt?.rawHash),
  before:{planTasks:oldTaskCount,planBlocked:beforePlan.blocked,documents:before.documents.length,scenes:before.sceneIds.length,currentHumanReviewRecords:priorReviews,
   documentLinks:beforeCounts.documentLinks.currentLinks??null,sceneScopeClaims:beforeCounts.sceneClaims.current??null,staleSceneScopeClaims:beforeCounts.sceneClaims.stale??null,staleOperationalConditions:beforeCounts.operations.staleConditions},
  after:{planTasks:newTaskCount,planBlocked:afterPlan.blocked,documents:after.documents.length,scenes:after.callSheet?.scenes?.length??0,remainingCurrentHumanReviewRecords:preservedCurrentReviews,
   documentLinks:afterCounts.documentLinks.currentLinks??null,sceneScopeClaims:afterCounts.sceneClaims.current??null,staleSceneScopeClaims:afterCounts.sceneClaims.stale??null,staleOperationalConditions:afterCounts.operations.staleConditions},
  tasks:affected,
  preservedHistory:{reviewRecords:workspace.reviewActions.length,authorityLinks:(workspace.authorityLinks??[]).length,sceneAuthorityClaims:(workspace.sceneAuthority??[]).length,operationalConditions:(workspace.conditions??[]).length},
  reconciliation,previewOnly:true,providerCalls:0,notClearance:true,
  warning:'This is a non-mutating preview of the exact source update. Any intervening writer increments persistedVersion and blocks the actual import. Changed tasks and affected human bindings retire; exact unchanged tasks retain original evidence and reported costs without new requests or approvals.'};
  return {...output,previewSha256:sha(output)};
}
