/** M3-S24: Read-only production journey built from one validated dossier.
 * Checkpoints are editorial workflow indicators, never legal authority, and have
 * no mutable state independent of the durable production workspace.
 */
import {createHash} from 'node:crypto';
const sha = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const steps = [
 ['sources','01','Import and verify','Load originals, transcribe where needed and confirm source coverage.'],
 ['scope','02','Map authority','Review documentary provenance and exact scene applicability.'],
 ['analysis','03','Run source checks','Perform current source-to-scene Clocked comparisons.'],
 ['review','04','Investigate findings','Record source-bound human decisions and follow-up.'],
 ['operations','05','Resolve prerequisites','Confirm scene dates, operating conditions and outstanding work.'],
 ['changes','06','Reconcile revisions','Preview and commit changed originals, then revisit affected checks.'],
 ['evidence','07','Export evidence','Inspect and export current and historical production evidence.']
];
const snapshot = (status, summary, blockers=[]) => ({status,summary,blockers:blockers.filter(Boolean)});
/** A workflow state is never a certification of permission to film. */
export function buildProductionJourney(d,{originals=null}={}) {
 if(d?.schema!=='beforeroll-integrated-production-dossier-v1'||d.notClearance!==true||!Array.isArray(d.scenes)||!d.counts||!d.callSheet)throw Error('Journey requires an integrated audited dossier');
 const {sha256,...unsigned}=d;
 if(sha256!==sha(unsigned))throw Error('Journey refuses altered source-bound dossier');
 if(originals!==null && (originals.schema!=='beforeroll-original-source-register-v1'||originals.productionId!==d.productionId||originals.persistedVersion!==d.persistedVersion))throw Error('Original source register and dossier version disagree');
 const c=d.counts;
 const haveSources=c.documents>0 && c.scenes>0;
 const planReady=haveSources && c.planTasks>0 && !d.outstanding.some(x=>x.code==='PLAN_BLOCKED');
 const unavailableOriginals=originals?.missingOriginalSha256?.length??0;
 const sourceBlockers=[];
 if(!c.documents)sourceBlockers.push('Import at least one original permit or source document.');
 if(!c.scenes)sourceBlockers.push('Import and inspect a call sheet with supported scenes.');
 if(c.unresolvedCallSheetRows)sourceBlockers.push(`${c.unresolvedCallSheetRows} unsupported call-sheet rows need correction.`);
 if(c.unresolvedPdfTranscriptions)sourceBlockers.push(`${c.unresolvedPdfTranscriptions} PDF text transcriptions need original-page comparison.`);
 if(unavailableOriginals)sourceBlockers.push(`${unavailableOriginals} archived originals are unavailable; reconnect exact matching bytes.`);
 for(const x of d.outstanding.filter(x=>x.code==='PLAN_BLOCKED'))sourceBlockers.push(`Analysis plan blocked: ${x.detail}`);
 const scopeOpen=c.unreviewedDocumentProvenance+d.scenes.filter(s=>!s.currentHumanClaims).length+c.unverifiedDocumentConflicts+(d.documentaryReasoning?.summary.pendingGrantClaims??0);
 const planLeft=c.effectiveUnassessedChecks??Math.max(0,c.planTasks-c.completedModelChecks);
 const humanOpen=Math.max(0,c.planTasks-c.currentReviewedTasks)+c.currentUnresolvedHumanReviews;
 const undated=c.undatedScenes;
 const unsettled=c.openPrerequisites;
 const map={
  sources:snapshot(!haveSources||c.unresolvedCallSheetRows||c.unresolvedPdfTranscriptions||!planReady?'BLOCKED':unavailableOriginals?'ATTENTION':'CURRENT',
   `${c.documents} documents · ${c.scenes} scenes · ${unavailableOriginals} originals missing`,sourceBlockers),
  scope:snapshot(!haveSources?'BLOCKED':scopeOpen?'ATTENTION':'CURRENT',
   `${c.unreviewedDocumentProvenance} document roles unreviewed · ${d.scenes.filter(s=>!s.currentHumanClaims).length} scenes without scope assertions`,
   !haveSources?['Import source documents and scenes first.']:scopeOpen?['Documentary provenance or scene scope needs responsible human review.']:[]),
  analysis:snapshot(!planReady||c.unresolvedPdfTranscriptions||c.unresolvedCallSheetRows?'BLOCKED':c.uncertainModelChecks||c.discoveryIncompleteRuns?'STOPPED':planLeft?'ATTENTION':'CURRENT',
   `${c.planTasks-planLeft}/${c.planTasks} source checks recorded${c.discoveryAssessedChecks?' (including discovery Decide)':''} · ${c.uncertainModelChecks} uncertain`,
   !planReady?['Resolve source-plan blockers before running Clocked.']:c.uncertainModelChecks||c.discoveryIncompleteRuns?['Inspect incomplete/active discovery or uncertain provider outcomes; returned Decide checks alone do not complete Extract. No automatic retries.']:[]),
  review:snapshot(!planReady?'BLOCKED':humanOpen?'ATTENTION':'CURRENT',
   `${c.currentReviewedTasks}/${c.planTasks} current human reviews · ${c.currentUnresolvedHumanReviews} follow-ups`,
   !planReady?['Source plan must exist before exact-task review.']:[]),
  operations:snapshot(!c.scenes?'BLOCKED':undated||unsettled?'ATTENTION':'CURRENT',
   `${c.scenes-undated}/${c.scenes} scenes dated · ${unsettled} open prerequisites · ${c.pastDuePrerequisites} overdue`,
   !c.scenes?['Import scenes before recording operations.']:[]),
  changes:snapshot('AVAILABLE',
   `${c.staleHumanReviews} historical human reviews · ${c.archivedModelRuns} archived Clocked runs`,
   ['Every replacement requires a separate source-bound impact preview and exact commit.']),
  evidence:snapshot(!haveSources?'ATTENTION':d.outstanding.length?'ATTENTION':'CURRENT',
   `${d.outstanding.length} outstanding evidence classes · project version ${d.persistedVersion}`,
   ['Exports document recorded evidence and limitations; never filming clearance.'])
 };
 const checkpoints=steps.map(([id,number,title,description])=>({id,number,title,description,...map[id],notClearance:true}));
 // Never hide later stages behind a gate: responsible people may prepare them out of order.
 // Suggested stage is only guidance, not a guarantee that all source conditions are known.
 const next=checkpoints.find(x=>x.status==='BLOCKED'||x.status==='STOPPED'||x.status==='ATTENTION'&&x.id!=='changes'&&x.id!=='evidence')?.id??'evidence';
 const body={schema:'beforeroll-production-journey-v1',productionId:d.productionId,workspaceRevision:d.workspaceRevision,
  persistedVersion:d.persistedVersion,dossierSha256:d.sha256,checkpoints,suggestedStage:next,
  allCheckpointsCurrent:checkpoints.filter(x=>!['changes','evidence'].includes(x.id)).every(x=>x.status==='CURRENT'),
  caveat:'Operational checkpoints are not approval, authorization, calibrated model confidence or filming clearance.',notClearance:true};
 return {...body,sha256:sha(body)};
}
