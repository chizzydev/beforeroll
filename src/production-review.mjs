/** Single production review projection: source documents, scene schedule,
 * source-bound planned checks, human decisions. Absolutely no model inference.
 * Page the plan to avoid a browser accidentally mounting thousands of cards.
 */
import {assertWorkspaceSources} from './production-workspace.mjs';
import {MAX_PLAN_TASKS,planIntelligence} from './intelligence-workflow.mjs';
import {projectSceneAuthority} from './scene-authority.mjs';
import {projectOperations} from './production-operations.mjs';

const decisions=new Set(['OPEN','ACKNOWLEDGED','NEEDS_SOURCE','RESOLVED_BY_HUMAN']);
const clamp=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;

export function productionReview(workspace,{offset=0,limit=40,executionStatus=null,asOf='2026-01-01T00:00:00.000Z'}={}){
 assertWorkspaceSources(workspace);
 if(!clamp(offset,MAX_PLAN_TASKS)||!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error(`Review offset must be 0-${MAX_PLAN_TASKS} and page size must be 1-100`);
 const sceneRegister=projectSceneAuthority(workspace);
 const operations=projectOperations(workspace,{asOf});
 const base={schema:'beforeroll-production-review-v1',id:workspace.id,title:workspace.title,revision:workspace.revision,
  documents:workspace.documents.map(d=>({id:d.id,name:d.name,sourceHash:d.sourceHash,revision:d.revision,sourceFormat:d.importReceipt?.sourceFormat??'MANUAL',unitCount:d.units.length,gaps:d.coverage.gaps.length,
   pdfTranscription:d.importReceipt?.requiresHumanTextReview?(d.pdfTranscriptionReview?'HUMAN_REVIEWED_TEXT_ONLY':'REQUIRES_HUMAN_TRANSCRIPTION_REVIEW'):null,rawSourceHash:d.importReceipt?.rawHash??null,
   units:d.units.map(u=>({id:u.id,start:u.start,end:u.end,text:u.text,kind:u.kind,status:'NOT_AI_EVALUATED'}))})),
  scenes:(workspace.callSheet?.scenes??[]).map(s=>({id:s.id,number:s.number,location:s.location,activity:s.activity,start:s.start,end:s.end,source:s.source,ai:executionStatus?.byScene?.[s.id]?.complete===executionStatus?.byScene?.[s.id]?.planned&&executionStatus?.byScene?.[s.id]?.planned>0?'EVALUATED_SEGMENTED_ONLY':executionStatus?.byScene?.[s.id]?.complete?'PARTIAL_EVALUATION':'NOT_EVALUATED'})),
  schedule:{present:Boolean(workspace.callSheet),sourceHash:workspace.callSheet?.sourceHash??null,sourceFormat:workspace.callSheet?.importReceipt?.sourceFormat??null,unsupportedRows:workspace.callSheet?.unsupported.length??0},
  sceneAuthority:sceneRegister.summary,sceneReview:sceneRegister.scenes,operations:operations.summary,sceneOperations:operations.scenes,reviewActions:workspace.reviewActions,reviewedCount:0,plannedCalls:0,pagination:{offset,limit,shown:0,hasMore:false},tasks:[],
  state:'INCOMPLETE_SOURCES',notClearance:true,modelRequests:executionStatus?.attempts??0,notice:'Model attempts and human review are independent; no scene is authorized. Evaluated counts cover segmented candidates only.'};
 if(workspace.documents.some(d=>d.importReceipt?.requiresHumanTextReview&&!d.pdfTranscriptionReview)){base.state='PDF_TRANSCRIPTION_REVIEW_REQUIRED';return base;}
 if(!workspace.documents.length||!workspace.callSheet?.scenes?.length)return base;
 const plan=planIntelligence(workspace);
 const modelEntries=new Map((executionStatus?.entries??[]).map(e=>[e.id,e]));
 const latest=new Map(),validTaskIds=new Set(plan.taskIds);
 for(const action of workspace.reviewActions){if(validTaskIds.has(action.evidenceId)&&decisions.has(action.decision))latest.set(action.evidenceId,action);}
 base.reviewedCount=latest.size;base.plannedCalls=plan.plannedCalls;base.state='READY_FOR_HUMAN_SOURCE_REVIEW';
 base.tasks=plan.tasks.slice(offset,offset+limit).map(t=>({id:t.id,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,sourceQuote:t.sourceQuote,sourceRange:t.sourceRange,contextUnitIds:t.contextUnitIds,requestHash:t.requestHash,
  status:modelEntries.get(t.id)?.status==='COMPLETE'?'CLOCKED_EVALUATED':modelEntries.get(t.id)?.status??'NOT_AI_EVALUATED',modelFinding:modelEntries.get(t.id)?.finding??null,humanReview:latest.get(t.id)??null,notClearance:true}));
 base.pagination={offset,limit,shown:base.tasks.length,hasMore:offset+base.tasks.length<plan.plannedCalls};
 return base;
}
export function verifyTaskForReview(workspace,evidenceId){
 if(typeof evidenceId!=='string'||!/^[0-9a-f]{64}$/.test(evidenceId))throw Error('Review evidence must be a source-bound task SHA-256');
 const plan=planIntelligence(workspace);
 if(!new Set(plan.taskIds).has(evidenceId))throw Error('Review task does not belong to the current original sources');
 return true;
}
