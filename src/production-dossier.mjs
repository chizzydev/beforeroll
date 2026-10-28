/** M3-S16: read-only, cross-workflow production evidence packet.
 * An auditable inventory of what is and is not known, never a clearance engine.
 * This is deliberately derived from the same persisted workspace and durable model
 * evidence that power the Production Desk; no parallel mutable dossier state.
 */
import {createHash} from 'node:crypto';
import {assertWorkspaceSources} from './production-workspace.mjs';
import {planIntelligence} from './intelligence-workflow.mjs';
import {sourcePointSlice} from './engine.mjs';
import {projectAuthorityGraph} from './document-authority.mjs';
import {projectSceneAuthority} from './scene-authority.mjs';
import {projectDocumentaryReasoning} from './documentary-reasoning.mjs';
import {projectOperations} from './production-operations.mjs';
import {projectCoordinatorTasks} from './coordinator-tasks.mjs';
import {projectDiscovery,mergeDiscoverySuggestions} from './core-discovery.mjs';
const blockedPlan=/^(Need source documents|Unsupported call-sheet|Invalid scene rows|Document coverage|PDF .* requires human verification|Document-scene plan requires more than)/;
const hash=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const text=x=>String(x??'');
const safeLine=x=>text(x).replace(/[\r\n\t]+/g,' ').trim();
const integrity=x=>{if(x?.notClearance!==true)throw Error('Dossier must never imply filming clearance');return x;};
const MODEL_STATUSES=new Set(['NOT_ATTEMPTED','COMPLETE','IN_FLIGHT','BILLING_UNKNOWN']);
function allSceneClaims(w){
 const output=[];for(let offset=0;;offset+=100){const p=projectSceneAuthority(w,{offset,limit:100});output.push(...p.records);if(!p.pagination.hasMore)break;}
 return output;
}
function allDocumentLinks(w){
 const output=[];for(let offset=0;;offset+=100){const p=projectAuthorityGraph(w,{offset,limit:100});output.push(...p.links);if(!p.pagination.hasMore)break;}
 return output;
}
/** @param {Object} params - validated local workspace, persisted version and optional audited full execution export. */
export function buildProductionDossier(w,{persistedVersion,asOf,modelEvidence=null,executionSummary=null,coordinatorEvidence={},discoveryJournals=[]}={}){
 assertWorkspaceSources(w);
 if(!Number.isSafeInteger(persistedVersion)||persistedVersion<1)throw Error('Persisted workspace version required');
 const ops=projectOperations(w,{asOf});
 const authority=projectAuthorityGraph(w,{offset:0,limit:100});
 const sceneAuthority=projectSceneAuthority(w,{offset:0,limit:100});
 const claims=allSceneClaims(w),links=allDocumentLinks(w);
 let plan=null,planProblem=null;
 if(!w.documents.length||!w.callSheet?.scenes?.length)planProblem='MISSING_DOCUMENTS_OR_SCENES';
 else {try{plan=planIntelligence(w);}catch(e){if(!blockedPlan.test(e.message))throw e;planProblem=safeLine(e.message);}}
 if(executionSummary!==null&&(executionSummary.schema!=='beforeroll-execution-status-v1'||executionSummary.projectId!==w.id||!Number.isSafeInteger(executionSummary.archivedRuns)||executionSummary.archivedRuns<0))throw Error('Execution summary does not match the project');
 if(modelEvidence!==null){
  if(!plan||modelEvidence.schema!=='beforeroll-project-model-evidence-v1'||modelEvidence.notClearance!==true||modelEvidence.workspaceId!==w.id||
    JSON.stringify(modelEvidence.documents)!==JSON.stringify(plan.documents)||modelEvidence.callSheetHash!==plan.callSheetHash||
    !Array.isArray(modelEvidence.records)||modelEvidence.records.length!==plan.tasks.length||modelEvidence.sha256!==hash(Object.fromEntries(Object.entries(modelEvidence).filter(([k])=>k!=='sha256'))))throw Error('Model evidence does not bind the current source plan');
  for(let i=0;i<plan.tasks.length;i++){
   const t=plan.tasks[i],r=modelEvidence.records[i];
   if(!MODEL_STATUSES.has(r.status)||r.id!==t.id||r.requestHash!==t.requestHash||r.sourceQuote!==t.sourceQuote||r.sceneHash!==t.sceneHash||r.documentHash!==t.documentHash||r.finding?.notClearance===false)throw Error('Dossier model record diverges from source task');
  }
 }
 const records=plan?.tasks.map((t,i)=>{
  const r=modelEvidence?.records[i];
  return {id:t.id,sceneId:t.sceneId,documentId:t.documentId,documentHash:t.documentHash,sceneHash:t.sceneHash,
   unitId:t.unitId,sourceRange:t.sourceRange,quote:t.sourceQuote,requestHash:t.requestHash,
   modelState:r?.status??'NOT_ATTEMPTED',modelOrigin:r?(r.finding?.controlledTest?'CONTROLLED_TEST_RESPONSE_NOT_CLOCKED':r.finding?.replayOrigin??'LOCAL_OWNER_RUN_NOT_CRYPTOGRAPHICALLY_ATTESTED'):'NO_MODEL_RECORDING',
   model:r?.finding??null,reportedCredits:r?.credits??null,error:r?.error??null,inheritedFromPlanKey:r?.inheritedFromPlanKey??null,notClearance:true};
 })??[];
 const discovery=projectDiscovery(w,discoveryJournals);
 const discoveredChecks=new Map(discovery.jobs.filter(j=>j.current).flatMap(j=>j.pairs.map(p=>[p.taskId,{...p,discoveryId:j.id}])));
 for(const record of records)if(discoveredChecks.has(record.id))record.discoveryCheck=discoveredChecks.get(record.id);
 const documentary=projectDocumentaryReasoning(w,{asOf,modelRecords:records});
 const documentaryByScene=new Map(documentary.scenes.map(x=>[x.sceneId,x]));
 const validTaskIds=new Set(records.map(r=>r.id));
 const latestReviews=new Map();for(const action of w.reviewActions??[])if(validTaskIds.has(action.evidenceId))latestReviews.set(action.evidenceId,action);
 const recordsByScene=new Map();for(const rec of records){const values=recordsByScene.get(rec.sceneId)??[];values.push(rec);recordsByScene.set(rec.sceneId,values);}
 const scenes=(w.callSheet?.scenes??[]).map(s=>{
  const assigned=recordsByScene.get(s.id)??[];
  const claimRows=claims.filter(r=>r.sceneId===s.id);
  const currentClaims=claimRows.filter(r=>r.sourceState==='CURRENT_UNVERIFIED');
  const schedule=ops.scenes.find(x=>x.sceneId===s.id);
  const tally={planned:assigned.length,modelComplete:assigned.filter(x=>x.modelState==='COMPLETE').length,
   neverAttempted:assigned.filter(x=>x.modelState==='NOT_ATTEMPTED').length,
   interruptedOrBillingUnknown:assigned.filter(x=>['IN_FLIGHT','BILLING_UNKNOWN'].includes(x.modelState)).length,
   humanReviewed:assigned.filter(x=>latestReviews.has(x.id)).length,
   humanUnresolved:assigned.filter(x=>latestReviews.has(x.id)&&latestReviews.get(x.id).decision!=='RESOLVED_BY_HUMAN').length};
  const issues=[];
  if(!plan)issues.push('NO_COMPLETE_SOURCE_PLAN');
  if(!schedule||schedule.scheduleState!=='DATED_HUMAN_PLAN_NOT_AUTHORITY')issues.push('DATED_SCENE_SCHEDULE_NOT_CURRENT');
  if(!assigned.length)issues.push('NO_PLANNED_SOURCE_ASSESSMENT');
  if(tally.neverAttempted)issues.push('MODEL_CHECKS_NOT_EVALUATED');
  if(tally.interruptedOrBillingUnknown)issues.push('MODEL_EXECUTION_BILLING_OR_RESPONSE_UNCERTAIN');
  if(tally.humanReviewed<tally.planned)issues.push('SOURCE_TASKS_AWAIT_HUMAN_REVIEW');
  if(tally.humanUnresolved)issues.push('HUMAN_REVIEW_DECISIONS_STILL_OPEN');
  if(schedule?.openPrerequisites)issues.push('OPERATIONAL_PREREQUISITES_OPEN');
  if(schedule?.pastDuePrerequisites)issues.push('PREREQUISITES_PAST_DUE');
  if(currentClaims.some(c=>c.kind==='REQUEST_NOT_GRANTED'||c.kind==='CONFLICT_OR_UNCERTAIN'))issues.push('DOCUMENTARY_REQUEST_OR_CONFLICT_REQUIRES_REVIEW');
  if(!currentClaims.length)issues.push('NO_HUMAN_SCENE_SCOPE_ASSERTIONS');
  if(documentaryByScene.get(s.id)?.unresolvedGrantClaims)issues.push('DOCUMENTARY_GRANT_SCOPE_OR_ISSUANCE_UNRESOLVED');
  return integrity({sceneId:s.id,location:s.location,activity:s.activity,start:s.start,end:s.end,originalRow:sourcePointSlice(w.callSheet.text,s.source.start,s.source.end),
   schedule:schedule??null,claimIds:claimRows.map(c=>c.id),currentHumanClaims:currentClaims.length,
   taskIds:assigned.map(x=>x.id),documentaryState:documentaryByScene.get(s.id)?.state??'NOT_REVIEWED',...tally,issues,
   readiness:issues.length?'OUTSTANDING_REVIEW':'RECORDED_REVIEW_ONLY_NOT_CLEARANCE',notClearance:true});
 });
 const docRows=w.documents.map(d=>({id:d.id,name:d.name,role:d.authority?.role??null,sourceSha256:d.sourceHash,
  originalBytesSha256:d.importReceipt?.rawHash??null,sourceFormat:d.importReceipt?.sourceFormat??'MANUAL_TEXT',
  units:d.units.length,sourceCoverageGaps:d.coverage.gaps,requiresPdfTextReview:Boolean(d.importReceipt?.requiresHumanTextReview&&!d.pdfTranscriptionReview),
  transcriptionReview:d.pdfTranscriptionReview??null,
  reviewedOriginalPermit:d.importReceipt?.reviewedPermitAttestation?{
   ...Object.fromEntries(Object.entries(d.importReceipt.reviewedPermitAttestation).filter(([k])=>k!=='sections')),
   sections:d.importReceipt.reviewedPermitAttestation.sections.map(s=>({reference:s.reference,ordinal:s.ordinal,start:s.start,end:s.end,textSha256:createHash('sha256').update(s.text).digest('hex')}))
  }:null,authorityMetadata:d.authority??null,notClearance:true}));
 const counts={documents:docRows.length,scenes:scenes.length,unresolvedCallSheetRows:w.callSheet?.unsupported?.length??0,
  planTasks:records.length,completedModelChecks:records.filter(x=>x.modelState==='COMPLETE').length,
  unattemptedChecks:records.filter(x=>x.modelState==='NOT_ATTEMPTED').length,
  uncertainModelChecks:records.filter(x=>['IN_FLIGHT','BILLING_UNKNOWN'].includes(x.modelState)).length,
  archivedModelRuns:executionSummary?.archivedRuns??0,
  currentReviewedTasks:latestReviews.size,
  currentUnresolvedHumanReviews:[...latestReviews.values()].filter(x=>x.decision!=='RESOLVED_BY_HUMAN').length,staleHumanReviews:(w.reviewActions??[]).filter(x=>!validTaskIds.has(x.evidenceId)).length,
  unresolvedPdfTranscriptions:docRows.filter(x=>x.requiresPdfTextReview).length,
  undatedScenes:scenes.filter(x=>x.issues.includes('DATED_SCENE_SCHEDULE_NOT_CURRENT')).length,
  openPrerequisites:ops.summary.openPrerequisites,pastDuePrerequisites:ops.summary.pastDuePrerequisites,
  unverifiedDocumentConflicts:authority.summary.unresolvedConflicts,
  currentSceneScopeAssertions:sceneAuthority.summary.current,staleSceneScopeAssertions:sceneAuthority.summary.stale,
  unreviewedDocumentProvenance:authority.summary.unreviewedDocuments.length};
 if(discovery.jobs.length){counts.discoveryAssessedChecks=records.filter(r=>r.discoveryCheck?.decideStatus==='ACCEPTED').length;counts.effectiveUnassessedChecks=records.filter(r=>r.modelState!=='COMPLETE'&&r.discoveryCheck?.decideStatus!=='ACCEPTED').length;
  counts.discoveryIncompleteRuns=discovery.jobs.filter(j=>j.current&&j.state!=='COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY').length;}
 const outstanding=[];
 if(counts.discoveryIncompleteRuns)outstanding.push({code:'DISCOVERY_EXECUTION_INCOMPLETE',count:counts.discoveryIncompleteRuns});
 if(planProblem)outstanding.push({code:'PLAN_BLOCKED',detail:planProblem});
 if(counts.unresolvedPdfTranscriptions)outstanding.push({code:'PDF_TRANSCRIPTION_UNREVIEWED',count:counts.unresolvedPdfTranscriptions});
 if(counts.unresolvedCallSheetRows)outstanding.push({code:'UNSUPPORTED_CALL_SHEET_ROWS',count:counts.unresolvedCallSheetRows});
 if((counts.effectiveUnassessedChecks??counts.unattemptedChecks)||counts.uncertainModelChecks)outstanding.push({code:'MODEL_SOURCE_CHECKS_OUTSTANDING',count:(counts.effectiveUnassessedChecks??counts.unattemptedChecks)+counts.uncertainModelChecks});
 if(counts.currentReviewedTasks<counts.planTasks)outstanding.push({code:'CURRENT_HUMAN_REVIEWS_INCOMPLETE',count:counts.planTasks-counts.currentReviewedTasks});
 if(counts.currentUnresolvedHumanReviews)outstanding.push({code:'HUMAN_REVIEW_DECISIONS_STILL_OPEN',count:counts.currentUnresolvedHumanReviews});
 if(counts.undatedScenes)outstanding.push({code:'SCENE_DATES_NOT_REVIEWED',count:counts.undatedScenes});
 if(counts.openPrerequisites)outstanding.push({code:'OPEN_OPERATIONAL_PREREQUISITES',count:counts.openPrerequisites});
 if(counts.pastDuePrerequisites)outstanding.push({code:'PAST_DUE_PREREQUISITES',count:counts.pastDuePrerequisites});
 if(counts.unverifiedDocumentConflicts)outstanding.push({code:'UNVERIFIED_DOCUMENT_CONFLICTS',count:counts.unverifiedDocumentConflicts});
 if(counts.unreviewedDocumentProvenance)outstanding.push({code:'UNREVIEWED_DOCUMENT_PROVENANCE',count:counts.unreviewedDocumentProvenance});
 if(counts.archivedModelRuns)outstanding.push({code:'ARCHIVED_MODEL_RUNS_FROM_OTHER_SOURCE_PLAN',count:counts.archivedModelRuns});
 if(counts.staleHumanReviews||ops.summary.staleConditions||authority.summary.staleLinks||sceneAuthority.summary.stale)outstanding.push({code:'STALE_HISTORICAL_EVIDENCE_PRESENT',count:counts.staleHumanReviews+ops.summary.staleConditions+authority.summary.staleLinks+sceneAuthority.summary.stale});
 const dossier=integrity({schema:'beforeroll-integrated-production-dossier-v1',productionId:w.id,title:w.title,
  workspaceRevision:w.revision,persistedVersion,asOf:ops.asOf,
  authorityPolicy:'HUMAN_REVIEW_AND_MODEL_AID_NOT_FILMING_CLEARANCE',
  sourceDocuments:docRows,callSheet:{sha256:w.callSheet?.sourceHash??null,format:w.callSheet?.importReceipt?.sourceFormat??null,
   unsupportedRows:w.callSheet?.unsupported??[],sceneCount:scenes.length,reviewedOriginalTranscription:w.callSheet?.importReceipt?.reviewedAttestation??null},
  documentaryLinks:links,sceneScopeClaims:claims,documentaryReasoning:documentary,operations:ops,
  modelExecution:modelEvidence?{origin:modelEvidence.origin,planKey:modelEvidence.planKey,state:modelEvidence.state,attempts:modelEvidence.attempts,
    completed:modelEvidence.confirmedCompleted,unknownBilling:modelEvidence.unknownBilling,knownSourceEvidenceOnly:true}:executionSummary?{origin:'NO_CURRENT_MODEL_RECORDING',state:executionSummary.state,attempts:0,archivedRuns:executionSummary.archivedRuns,knownSourceEvidenceOnly:true}:null,
  coordinatorTasks:mergeDiscoverySuggestions(w,projectCoordinatorTasks(w,{...coordinatorEvidence,modelRecords:records}),discovery),
  sceneTasks:records,reviewActions:w.reviewActions??[],currentTaskReviews:records.filter(x=>latestReviews.has(x.id)).map(x=>latestReviews.get(x.id)),
  scenes,counts,outstanding,
  productionState:outstanding.length?'OPEN_REVIEW_ITEMS':'REVIEW_REGISTER_RECORDED_NOT_CLEARANCE',
  caveats:['Not filming clearance, permit authentication or legal advice.',
   'Human assertions are unverified and require responsible sign-off outside this tool.',
   'Clocked scores are not calibrated confidence and cannot override specific documentary restrictions.',
   'Candidate source coverage is not proof that all operative documents or obligations have been supplied.',
   'Unknown billing, interrupted requests, unsupported material and stale evidence remain unresolved.'],notClearance:true});
 return {...dossier,sha256:hash(dossier)};
}
export function dossierMarkdown(dossier){
 if(dossier?.schema!=='beforeroll-integrated-production-dossier-v1'||dossier.notClearance!==true||dossier.sha256!==hash(Object.fromEntries(Object.entries(dossier).filter(([k])=>k!=='sha256'))))throw Error('Invalid integrated dossier fingerprint');
 const c=dossier.counts,effective=c.effectiveUnassessedChecks===undefined?c.completedModelChecks:c.planTasks-c.effectiveUnassessedChecks;
 const lines=[`# BeforeRoll — ${safeLine(dossier.title)}`,``,`**Source-bound production review · NOT FILMING CLEARANCE**`,``,`Project: ${dossier.productionId} · persisted version ${dossier.persistedVersion} · workspace revision ${dossier.workspaceRevision}`,`Review as-of: ${dossier.asOf}`,`Dossier SHA-256 (JSON body): ${dossier.sha256}`,``,`Current source assessments: ${effective}/${c.planTasks}. Legacy Decide-only journal counters below are separate from accepted discovery checks; they do not mean the discovery was unattempted.`,``,`## Current inventory`,...Object.entries(dossier.counts).map(([k,v])=>`- ${['completedModelChecks','unattemptedChecks','uncertainModelChecks'].includes(k)?'legacyDecideJournal.':''}${k}: ${v}`),``,`## Outstanding evidence and review`,...(dossier.outstanding.length?dossier.outstanding.map(i=>`- ${i.code}: ${i.detail??i.count}`):['- No tracked outstanding review items. This does **NOT** constitute permission to film.']),``,`## Original documents`];
 for(const d of dossier.sourceDocuments){lines.push(`- ${safeLine(d.id)}: ${safeLine(d.name)} · SHA-256 ${d.sourceSha256} · ${d.units} exact source units · ${d.sourceCoverageGaps.length} coverage gaps · original bytes SHA-256 ${d.originalBytesSha256??'not recorded'} · transcription review ${d.requiresPdfTextReview?'REQUIRED':'not pending'}`);}
 for(const d of dossier.sourceDocuments){if(d.reviewedOriginalPermit){
  const a=d.reviewedOriginalPermit;lines.push('','## Human-reviewed original permit: '+safeLine(d.id),
   `- Source: ${safeLine(a.sourceFormat)} · exact original SHA-256 ${a.rawHash} · normalized text SHA-256 ${a.normalizedHash}`,
   `- Attested by: ${safeLine(a.reviewer)} · ${safeLine(a.reason)}`,
   `- ${safeLine(a.status)}. No independent document completeness or authorization verification.`,
   ...a.sections.map(s=>`- ${safeLine(s.reference)}: codepoint [${s.start},${s.end}) · section text SHA-256 ${s.textSha256}`));
 }}
 if(dossier.callSheet.reviewedOriginalTranscription){const a=dossier.callSheet.reviewedOriginalTranscription;lines.push('','## Human-transcribed original call sheet',`- Original type: ${a.sourceFormat}; original raw SHA-256: ${a.rawHash}`,`- Normalized scene rows: ${a.sceneCount}; attested complete by: ${safeLine(a.reviewer)}`,`- Basis supplied: ${safeLine(a.reason)}`,`- Status: ${a.status}; no independent verification of rows against original binary`,...a.rows.map(r=>`- ${safeLine(r.sceneId)}: ${safeLine(r.sourceReference)} · ${safeLine(r.normalizedRow)}`));}
 lines.push('','## Scenes and source-backed findings');
 for(const scene of dossier.scenes){
  const sceneTasks=dossier.sceneTasks.filter(t=>t.sceneId===scene.sceneId),assessed=sceneTasks.filter(t=>t.modelState==='COMPLETE'||t.discoveryCheck?.decideStatus==='ACCEPTED').length;
  lines.push(`### ${safeLine(scene.sceneId)} — ${safeLine(scene.location)}`,
   `Activity: ${safeLine(scene.activity)} · scheduled: ${scene.schedule?.startUtc??'NOT HUMAN-DATED'}`,
   `Current assessments: ${assessed}/${scene.planned} exact source tasks · legacy journal completed ${scene.modelComplete}/${scene.planned} · human source-task reviews: ${scene.humanReviewed}/${scene.planned}`,
   `Open prerequisites: ${scene.schedule?.openPrerequisites??'unknown'} · state: ${scene.readiness}`,
   ...scene.issues.filter(i=>i!=='MODEL_CHECKS_NOT_EVALUATED'||assessed<scene.planned).map(i=>`- Outstanding: ${i}`));
  for(const t of dossier.sceneTasks.filter(t=>t.sceneId===scene.sceneId)){
   const review=dossier.currentTaskReviews.find(r=>r.evidenceId===t.id);
   lines.push(`- [${t.discoveryCheck?.decideStatus==='ACCEPTED'?'DISCOVERY_DECIDE_RECORDED; legacy '+t.modelState:t.modelState}] ${safeLine(t.documentId)}/${safeLine(t.unitId)} [${t.sourceRange.join(',')}) SHA-256 ${t.documentHash}: ${safeLine(t.quote)}`);
   if(t.model)lines.push(`  - Clocked result: ${t.model.code} · activity link ${t.model.relevance??'unknown'} · grant ${t.model.grant??'unknown'} · scope ${t.model.scope?.matched===false?'UNVERIFIED':t.model.scope?.matched===true?'SCENE_NAMED_MODEL_ONLY':'NOT CLAIMED'} · request ${t.requestHash}`);
   if(t.discoveryCheck)lines.push(`  - Discovery Decide: ${t.discoveryCheck.decideStatus} · ${t.discoveryCheck.route} · ${t.discoveryCheck.origin} · relevance ${t.discoveryCheck.relevance??'unknown'} · response ${t.discoveryCheck.decideResponseSha256??'unavailable'} · scope ${t.discoveryCheck.scopeCaution??'HUMAN_UNVERIFIED'}`);
   if(t.inheritedFromPlanKey)lines.push(`  - Retained exact unchanged task from journal ${t.inheritedFromPlanKey}; no new request or additional credit consumption for this retained result.`);
   if(review)lines.push(`  - Human review: ${review.decision}, ${safeLine(review.reviewer)} — ${safeLine(review.reason)}`);
  }
 }
 lines.push('','## Source-grounded coordinator suggestions (model evidence, not authority)',
  `State: ${safeLine(dossier.coordinatorTasks?.state)}. Historical U01 sources were researcher-selected; new discovery is model-assisted and unproven on fresh documents. No time-saving claim.`);
 for(const c of dossier.coordinatorTasks?.candidates??[])lines.push(`- ${safeLine(c.sceneId)}: ${safeLine(c.title)} · ${safeLine(c.status)} · issuance UNKNOWN`,
  `  - Original phrase: ${safeLine(c.quote)} · ${safeLine(c.documentId)}/${safeLine(c.unitId)} unit [${c.unitRange}) / permit [${c.permitRange}) · SHA-256 ${c.permitSha256}`,
  `  - ${safeLine(c.provenance)} · request ${c.requestSha256} · response ${c.responseSha256}`,
  `  - Human suggestion review: ${c.humanReview?safeLine(c.humanReview.reviewer)+' — '+safeLine(c.humanReview.reason):'NOT RECORDED'}; fulfillment and authority remain unverified.`);
 for(const warning of dossier.coordinatorTasks?.warnings??[])lines.push(`- ${safeLine(warning.sceneId)} documentary warning: ${safeLine(warning.message)} · ${safeLine(warning.quote)}`);
 for(const c of (dossier.coordinatorTasks?.candidates??[]).filter(c=>c.documentaryRecord))lines.push(`- Documentary investigation ${safeLine(c.sceneId)}: model role ${safeLine(c.documentaryRecord.role)}; source reference ${safeLine(c.documentaryRecord.fields.referenced_instrument.value??'not stated')}; supporting evidence UNESTABLISHED; actual issuance/authenticity UNVERIFIED. A source claim is not independent proof.`);
 for(const review of dossier.coordinatorTasks?.reviewHistory??[])lines.push(`- Suggestion review history: ${safeLine(review.sourceState)} · ${safeLine(review.sceneId)} · ${safeLine(review.reviewer)} — ${safeLine(review.reason)} · not fulfillment or clearance.`);
 for(const job of dossier.coordinatorTasks?.discovery?.jobs??[]){
  lines.push('','## Owner discovery '+job.id,`Source state: ${job.current?'CURRENT':'HISTORICAL'} · ${job.state} · ${job.origin}`,`Coverage: ${JSON.stringify(job.coverage)} · attempts ${job.attempts} · reported credits ${job.reportedCredits} · unknown cost entries ${job.unknownCreditEntries} · latency ms ${job.latencyMs}`,`Stop reason: ${job.stopReason??'none'}`);
  for(const pair of job.pairs)lines.push(`- ${safeLine(pair.sceneId)} / ${safeLine(pair.documentId)} / ${pair.unitId}: ${pair.route} · ${pair.extractStatus} · ${pair.scopeCaution??'applicability unverified'}`);
  if(!job.current)for(const c of job.candidates)lines.push(`- HISTORICAL suggestion: ${safeLine(c.sceneId)} · ${safeLine(c.title)} · ${safeLine(c.quote)} · response ${c.responseSha256}`);
 }
 lines.push('','## Documentary authority reasoning (claims, not verified grants)');
 for(const scene of dossier.documentaryReasoning.scenes){
  lines.push(`### ${safeLine(scene.sceneId)} — ${safeLine(scene.state)} · NO CLEARANCE`);
  for(const model of scene.modelOnlyFindings)lines.push(`- Clocked only, no human documentary assertion: ${safeLine(model.documentId)}/${safeLine(model.unitId)} · ${safeLine(model.code)} · NOT ISSUANCE OR CLEARANCE`);
  for(const claim of scene.claims)lines.push(`- ${safeLine(claim.documentId)}/${safeLine(claim.unitId)} ${safeLine(claim.kind)}: ${safeLine(claim.assertionState)} · scope ${safeLine(claim.applicable.state)} · issuance ${safeLine(claim.issuance)} · provenance ${safeLine(claim.evidenceClass)} · original \"${safeLine(claim.quote)}\"`,
   `  - Related restrictions: ${claim.relatedRestrictions.map(x=>x.id).join(', ')||'NONE RECORDED'} · amendment linkage: ${safeLine(claim.documentaryConnection)}`,
   `  - Prerequisites: ${safeLine(claim.prerequisiteMode)} · ${claim.linkedConditions.map(x=>safeLine(x.status)).join(', ')||'NO LINKED RECORDS'} · never proof of fulfillment`,
   ...claim.modelHits.map(h=>`  - Independently assessed Clocked task ${h.taskId}: ${safeLine(h.code)} · relevance ${h.relevance} · grant score ${h.grant}; NOT documentary authentication`));
 }
 lines.push('','## Documentary relationships');
 for(const l of dossier.documentaryLinks)lines.push(`- ${l.status}: ${safeLine(l.fromId)} ${l.kind} ${safeLine(l.toId)} · source quote: ${safeLine(l.quote)} · reviewer: ${safeLine(l.reviewer)} (${safeLine(l.reason)})`);
 lines.push('','## Operational history');
 for(const c of dossier.operations.conditions)lines.push(`- ${safeLine(c.sceneId)} · ${safeLine(c.title)} · ${c.sourceState} · human decision ${c.decision} · deadline ${c.dueUtc??'none'} · ${c.deadlineState}`);
 lines.push('','## Scope and limitations',...dossier.caveats.map(c=>`- ${c}`),'','**NO filming clearance inferred.**','');
 return lines.join('\n');
}
