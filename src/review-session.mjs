/** M3-S19 — preview/commit for human source-task review sessions.
 * One existing project store; one exact current plan; no separate review database,
 * inferred model result, implicit authority or unverified batch writes.
 */
import {createHash} from 'node:crypto';
import {recordReview,assertWorkspaceSources} from './production-workspace.mjs';
import {assertAuthorityIntegrity} from './document-authority.mjs';
import {assertSceneAuthorityIntegrity} from './scene-authority.mjs';
import {assertProductionOperationsIntegrity} from './production-operations.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const choices=new Set(['OPEN','ACKNOWLEDGED','NEEDS_SOURCE','RESOLVED_BY_HUMAN']);
const validString=(x,cap)=>typeof x==='string'&&x.trim().length>0&&x.length<=cap;
const allowedKeys=new Set(['evidenceId','decision','reviewer','reason']);
const matchingDossier=d=>{
 if(d?.schema!=='beforeroll-integrated-production-dossier-v1'||d.notClearance!==true||!Array.isArray(d.sceneTasks)||!Array.isArray(d.currentTaskReviews))throw Error('Verified current production dossier is required');
 const {sha256,...body}=d;if(sha(body)!==sha256)throw Error('Review session refuses altered dossier evidence');
 return d;
};
export function previewReviewSession(workspace,dossier,{expectedVersion,edits}={}){
 assertWorkspaceSources(workspace);matchingDossier(dossier);
 if(!Number.isSafeInteger(expectedVersion)||expectedVersion<1||expectedVersion!==dossier.persistedVersion||workspace.revision!==dossier.workspaceRevision||dossier.productionId!==workspace.id)throw Error('Review session has a stale workspace version or dossier');
 if(!Array.isArray(edits)||edits.length<1||edits.length>64)throw Error('A review session requires 1-64 individually justified source decisions');
 // The current source plan is authoritative. Unknown or stale task IDs are never accepted.
 const current=new Map(dossier.sceneTasks.map(t=>[t.id,t]));
 if(current.size!==dossier.sceneTasks.length)throw Error('Review session has duplicate source tasks');
 const previous=new Map(dossier.currentTaskReviews.map(x=>[x.evidenceId,x]));
 const seen=new Set(),items=[];
 for(const input of edits){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowedKeys.has(k)))throw Error('Review session contains an unsupported edit');
  const {evidenceId,decision,reviewer,reason}=input;
  if(typeof evidenceId!=='string'||!/^[a-f0-9]{64}$/.test(evidenceId)||seen.has(evidenceId))throw Error('Review session contains duplicate or malformed evidence ID');
  seen.add(evidenceId);
  if(!choices.has(decision)||!validString(reviewer,150)||!validString(reason,3000))throw Error('Each source task needs its own valid reviewer, decision and rationale');
  const t=current.get(evidenceId);if(!t)throw Error('Review session refuses stale or foreign source task');
  const prior=previous.get(evidenceId);
  const normalized={evidenceId,decision,reviewer:reviewer.trim(),reason:reason.trim()};
  const noChange=Boolean(prior&&prior.decision===normalized.decision&&prior.reviewer===normalized.reviewer&&prior.reason===normalized.reason);
  items.push({sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,documentHash:t.documentHash,sceneHash:t.sceneHash,
   quote:t.quote,requestHash:t.requestHash,modelState:t.modelState,previousDecision:prior?.decision??null,
   edit:normalized,noChange,notClearance:true});
 }
 const summary={selected:items.length,newReviews:items.filter(x=>!x.previousDecision).length,
  updatedReviews:items.filter(x=>x.previousDecision&&!x.noChange).length,unchanged:items.filter(x=>x.noChange).length,
  needsFollowUp:items.filter(x=>x.edit.decision!=='RESOLVED_BY_HUMAN').length,
  scenes:[...new Set(items.map(x=>x.sceneId))].sort(),documents:[...new Set(items.map(x=>x.documentId))].sort()};
 const unsigned={schema:'beforeroll-human-review-session-v1',productionId:workspace.id,expectedVersion,
  workspaceRevision:workspace.revision,dossierSha256:dossier.sha256,asOf:dossier.asOf,
  items,summary,notClearance:true,
  notice:'Each decision is source-specific human documentation. This session does NOT grant filming permission, assert document authenticity or resolve outstanding model/operational checks.'};
 return {...unsigned,sha256:sha(unsigned)};
}
/** Revalidate the exact preview against current source and project version, then mutate a CLONE.
 * The caller persists the cloned workspace atomically with the same expectedVersion.
 */
export function commitReviewSession(workspace,dossier,{expectedVersion,asOf,edits,previewSha256}={}){
 if(typeof asOf!=='string'||asOf!==dossier.asOf||typeof previewSha256!=='string'||!/^[a-f0-9]{64}$/.test(previewSha256))throw Error('Exact previous review-session preview required');
 const preview=previewReviewSession(workspace,dossier,{expectedVersion,edits});
 if(previewSha256!==preview.sha256)throw Error('Review-session preview invalidated or altered; no changes made');
 const next=structuredClone(workspace);
 for(const item of preview.items){if(!item.noChange)recordReview(next,item.edit);}
 assertWorkspaceSources(next);assertAuthorityIntegrity(next);assertSceneAuthorityIntegrity(next);assertProductionOperationsIntegrity(next);
 return {workspace:next,preview,applied:preview.summary.newReviews+preview.summary.updatedReviews};
}
