/** M3-S20 — portable, integrity-checked production lifecycle backup and recovery.
 * All material is owner-local and confidential. SHA-256 detects accidental/hostile
 * editing of one snapshot, but does NOT authenticate the original filming permits,
 * verify signatures, or prove that a file came from Clocked.
 *
 * An owner backup contains exact current workspace, ALL current + previous Clocked
 * journal records, and a recomputable dossier/action projection at a fixed instant.
 * It does not include original PDF/DOCX file bytes, keys or external signatures.
 */
import {createHash} from 'node:crypto';
import path from 'node:path';
import {importWorkspace,assertWorkspaceSources} from './production-workspace.mjs';
import {assertAuthorityIntegrity} from './document-authority.mjs';
import {assertSceneAuthorityIntegrity} from './scene-authority.mjs';
import {assertProductionOperationsIntegrity} from './production-operations.mjs';
import {planIntelligence} from './intelligence-workflow.mjs';
import {planKey} from './durable-execution.mjs';
import {buildProductionDossier} from './production-dossier.mjs';
import {buildProductionActions} from './production-actions.mjs';
import {referencedOriginals,createSourceOriginalVault} from './source-originals.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString()===x;
const BLOCKED=/^(Need source documents|Unsupported call-sheet|Invalid scene rows|Document coverage|PDF .* requires human verification|Document-scene plan requires more than)/;
function currentPlan(workspace){
 try{return {plan:planIntelligence(workspace),blocked:null};}
 catch(e){if(!BLOCKED.test(e.message))throw e;return {plan:{workspaceId:workspace.id,taskIds:[]},blocked:e.message};}
}
function validStored(saved){
 if(!saved||!Number.isSafeInteger(saved.version)||saved.version<1||!iso(saved.updatedAt)||typeof saved.sha256!=='string')throw Error('A persisted production version is required');
 const workspace=importWorkspace(JSON.stringify(saved.workspace));
 assertWorkspaceSources(workspace);assertAuthorityIntegrity(workspace);assertSceneAuthorityIntegrity(workspace);assertProductionOperationsIntegrity(workspace);
 if(saved.sha256!==sha(workspace))throw Error('Stored project checksum mismatch');
 return workspace;
}
function derived({workspace,version,asOf,plan,blocked,journals,execution}){
 const current=journals.find(x=>x.planKey===planKey(plan));
 const record=blocked?null:execution.inspectRun(plan,current?.run??null);
 const status=record?.status??null;
 if(status)status.archivedRuns=journals.length-(current?1:0);
 const dossier=buildProductionDossier(workspace,{persistedVersion:version,asOf,modelEvidence:record?.evidence??null,executionSummary:status});
 const actions=buildProductionActions(dossier,{offset:0,limit:1});
 if(!blocked&&dossier.sceneTasks.length!==plan.tasks.length)throw Error('Lifecycle dossier omitted source-bound plan tasks');
 if(dossier.productionId!==workspace.id||dossier.persistedVersion!==version||dossier.workspaceRevision!==workspace.revision)throw Error('Lifecycle dossier diverged from persistent workspace');
 if(record&&dossier.counts.completedModelChecks!==record.status.completed)throw Error('Lifecycle model journal and dossier completion counts disagree');
 const sample={schema:'beforeroll-lifecycle-integrity-v1',workspaceId:workspace.id,sourceRevision:workspace.revision,sourcePlan:blocked?'BLOCKED':'EXACT',sourcePlanReason:blocked,
  modelJournalState:record?.status.state??'NO_CURRENT_EXECUTION',currentRunAvailable:Boolean(current),allJournalCount:journals.length,
  archivedSourcePlans:journals.filter(x=>x.planKey!==planKey(plan)).length,
  currentExecutionAttempted:record?.status.attempts??0,currentExecutionCompleted:record?.status.completed??0,
  currentExecutionUncertain:record?.status.byScene?Object.values(record.status.byScene).reduce((n,s)=>n+s.uncertain,0):0,
  workItems:actions.total,sceneCount:dossier.scenes.length,sourceTaskCount:dossier.sceneTasks.length,
  currentHumanReviews:dossier.counts.currentReviewedTasks,staleHumanReviews:dossier.counts.staleHumanReviews,
  staleSceneScopeClaims:dossier.counts.staleSceneScopeAssertions,openPrerequisites:dossier.counts.openPrerequisites,
  unsupportedCallSheetRows:dossier.counts.unresolvedCallSheetRows,unreviewedTranscriptions:dossier.counts.unresolvedPdfTranscriptions,
  dossierSha256:dossier.sha256,actionQueueEvidenceSha256:actions.dossierSha256,
  currentSourceHashes:dossier.sourceDocuments.map(d=>({documentId:d.id,normalizedSha256:d.sourceSha256,originalBytesSha256:d.originalBytesSha256})),
  callSheetHash:dossier.callSheet.sha256,notClearance:true,
  interpretation:'SOURCE_LINKED_OWNER_BACKUP_NOT_AUTHENTICATED_PERMIT_OR_FILMING_CLEARANCE'};
 if(actions.dossierSha256!==dossier.sha256)throw Error('Lifecycle work queue and dossier were derived from different source snapshots');
 return {...sample,sha256:sha(sample)};
}
export async function createLifecycleBackup(saved,execution,{asOf=new Date().toISOString(),sourceVault=null}={}){
 if(!iso(asOf))throw Error('Lifecycle instant must be canonical UTC');
 const workspace=validStored(saved);
 const {plan,blocked}=currentPlan(workspace);
 const journals=await execution.exportAllRuns(plan);
 execution.verifyAllRuns(plan,journals);
 const integrity=derived({workspace,version:saved.version,asOf,plan,blocked,journals,execution});
 const originals=sourceVault?await sourceVault.inventory(workspace,{includeBytes:true}):null;
 const base={schema:'beforeroll-owner-lifecycle-backup-v1',workspaceId:workspace.id,originalVersion:saved.version,originalUpdatedAt:saved.updatedAt,
  asOf,workspace,workspaceSha256:sha(workspace),journals,integrity,
  ...(originals?{originalSources:originals}:{}),
  originalBytesIncluded:Boolean(originals?.items.length),secretsIncluded:false,notClearance:true,
  limitations:[originals?`Includes ${originals.preserved} exact original file(s); ${originals.missingOriginalSha256.length} historical original(s) were not found in the private local vault.`:'Contains exact currently normalized project sources and original import byte hashes, not original uploaded file bytes.',
   'Archived Clocked journals have checksum/accounting checks but are NOT source-revalidated against missing historical documents.',
   'SHA-256 is an integrity fingerprint, not proof of file origin, signatures, provider authenticity or filing permission.',
   'Unknown billing and interrupted attempts remain non-retryable. Restoring never contacts Clocked.']};
 return {...base,sha256:sha(base)};
}
export function verifyLifecycleBackup(bundle,execution){
 if(bundle?.schema!=='beforeroll-owner-lifecycle-backup-v1'||bundle.notClearance!==true||bundle.secretsIncluded!==false||typeof bundle.originalBytesIncluded!=='boolean'||!iso(bundle.asOf)||
  !Number.isSafeInteger(bundle.originalVersion)||bundle.originalVersion<1||!iso(bundle.originalUpdatedAt))throw Error('Invalid owner lifecycle backup envelope');
 const {sha256,...body}=bundle;
 if(sha256!==sha(body))throw Error('Lifecycle backup checksum mismatch');
 const workspace=importWorkspace(JSON.stringify(bundle.workspace));
 assertAuthorityIntegrity(workspace);assertSceneAuthorityIntegrity(workspace);assertProductionOperationsIntegrity(workspace);
 const references=referencedOriginals(workspace);
 if(bundle.originalSources!==undefined){
  const originals=bundle.originalSources;
  if(originals?.schema!=='beforeroll-original-source-inventory-v1'||originals.notClearance!==true||
    !Array.isArray(originals.items)||!Array.isArray(originals.missingOriginalSha256)||typeof originals.complete!=='boolean'||
    originals.referenced!==references.length||originals.items.length!==originals.preserved||originals.items.length>references.length)
   throw Error('Original source archive inventory malformed');
  const expected=new Map(references.map(r=>[r.rawHash,r.byteCount]));const seen=new Set();let total=0;
  for(const original of originals.items){
   const bytes=typeof original?.contentBase64==='string'?Buffer.from(original.contentBase64,'base64'):null;
   if(!bytes||bytes.toString('base64')!==original.contentBase64||!bytes.length||bytes.length>8*1024*1024||
     createHash('sha256').update(bytes).digest('hex')!==original.rawHash||expected.get(original.rawHash)!==original.byteCount||original.byteCount!==bytes.length||seen.has(original.rawHash))
    throw Error('Original source bytes do not match exact import provenance');
   seen.add(original.rawHash);total+=bytes.length;
   if(total>32*1024*1024)throw Error('Original source archive byte budget exceeded');
  }
  if(originals.totalBytes!==total||
    JSON.stringify([...seen].sort())!==JSON.stringify(originals.items.map(x=>x.rawHash).sort()))throw Error('Original archive accounting mismatch');
  const missing=[...expected.keys()].filter(x=>!seen.has(x)).sort();
  if(JSON.stringify(missing)!==JSON.stringify([...originals.missingOriginalSha256].sort())||
    originals.complete!==(missing.length===0)||bundle.originalBytesIncluded!==(seen.size>0))throw Error('Original archive coverage declaration mismatch');
 }else if(bundle.originalBytesIncluded!==false)throw Error('Original file material claimed without an archive');

 if(workspace.id!==bundle.workspaceId||sha(workspace)!==bundle.workspaceSha256)throw Error('Lifecycle project identity or source hash mismatch');
 const {plan,blocked}=currentPlan(workspace);
 const collection=execution.verifyAllRuns(plan,bundle.journals);
 const proof=derived({workspace,version:bundle.originalVersion,asOf:bundle.asOf,plan,blocked,journals:bundle.journals,execution});
 if(sha(proof)!==sha(bundle.integrity))throw Error('Lifecycle cross-system state differs from saved evidence receipt');
 return {schema:'beforeroll-lifecycle-verified-v1',workspaceId:workspace.id,originalVersion:bundle.originalVersion,
  sourceRevision:workspace.revision,journalCount:collection.count,currentRun:collection.current,archivedRuns:collection.archived,
  originalFileCount:bundle.originalSources?.preserved??0,missingOriginalFiles:bundle.originalSources?.missingOriginalSha256.length??references.length,
  sourceTasks:proof.sourceTaskCount,openWorkItems:proof.workItems,backupSha256:bundle.sha256,
  consistency:'CURRENT_WORKSPACE_AND_ALL_JOURNAL_CHECKSUMS_VERIFIED',notClearance:true};
}
/** Owner-only CLI operation. Reconstruct journals BEFORE the project becomes visible;
 * a failed/stranded recovery must not make attempted Clocked requests retryable.
 * No overwrites, no implicit provider dispatch, no workspace mutation on conflict.
 */
export async function restoreLifecycleBackup(bundle,{workspaceStore,execution,sourceVault=null,ownerConfirmed=false}){
 if(!ownerConfirmed)throw Error('Explicit owner authorization required for recovery');
 const verified=verifyLifecycleBackup(bundle,execution);
 if(await workspaceStore.load(bundle.workspaceId))throw Error('Recovery refuses to overwrite an existing production');
 // Ensure both stores point to the same parent. Avoid writing a ledger into another production directory.
 const expectedExecutionRoot=path.join(workspaceStore.directory,'.clocked-execution');
 if(execution.directory!==expectedExecutionRoot)throw Error('Recovery workspace and execution stores must share a data directory');
 const originals=sourceVault??createSourceOriginalVault({directory:workspaceStore.directory});
 if(originals.directory!==path.join(workspaceStore.directory,'.source-originals'))throw Error('Recovery source-originals vault must share the project data directory');
 // Restore original documents without provider calls before making project visible.
 for(const file of bundle.originalSources?.items??[])await originals.putBytes(Buffer.from(file.contentBase64,'base64'),file.rawHash);
 const {plan}=currentPlan(bundle.workspace);
 const restored=await execution.restoreAllRuns(plan,bundle.journals);
 const saved=await workspaceStore.persist(bundle.workspace,{expectedVersion:0});
 return {...verified,recoveredVersion:saved.version,restoredJournals:restored.restored,
  originalVersionRetainedInBackup:bundle.originalVersion,restoredOriginals:bundle.originalSources?.items.length??0,
  outcome:'RECOVERED_LOCAL_SOURCE_AND_MODEL_HISTORY_NOT_FILMING_CLEARANCE'};
}
