/** Unified BeforeRoll project state: one source-of-truth for documents, scenes and review.
 * Pure serialization; explicitly no filesystem, browser, secret, or model calls.
 */
import {sourceFingerprint,discoverSourceUnits} from './permit-intelligence.mjs';
import {parseCallSheet,sourcePointSlice} from './engine.mjs';
import {verifyReviewedCallSheetReceipt} from './reviewed-call-sheet.mjs';
import {verifyReviewedPermitReceipt} from './reviewed-permit.mjs';
const clone=x=>structuredClone(x);
const nonempty=(x,max=150)=>typeof x==='string'&&x.trim()&&x.length<=max;
const humanStatuses=new Set(['OPEN','ACKNOWLEDGED','NEEDS_SOURCE','RESOLVED_BY_HUMAN']);
export function createProduction({id,title,documents=[],callSheetText=''}){
 if(!nonempty(id,80)||!nonempty(title))throw Error('Production id and title required');
 const base={schema:'beforeroll-workspace-v1',id,title,revision:0,documents:[],callSheet:null,assessments:[],reviewActions:[],imports:[],authorityLinks:[],sceneAuthority:[],sceneSchedules:[],conditions:[],conditionDecisions:[],notClearance:true};
 for(const doc of documents)addDocument(base,doc);
 if(callSheetText)setCallSheet(base,callSheetText);
 return base;
}
export function addDocument(workspace,doc){
 guard(workspace);if(!doc||!nonempty(doc.id,80)||!nonempty(doc.name)||!nonempty(doc.text,40000))throw Error('Document id, name and nonempty text required');
 if(workspace.documents.some(d=>d.id===doc.id))throw Error('Duplicate document id; update explicitly to create a new revision');
 const preview=discoverSourceUnits(doc.text);
 workspace.documents.push({id:doc.id,name:doc.name,role:doc.role||'permit',text:doc.text,sourceHash:preview.sourceHash,revision:1,units:preview.units,coverage:{represented:preview.allNonWhitespaceRepresented,gaps:preview.unrepresented},status:'SOURCE_UNVERIFIED'});
 workspace.revision++;return workspace;
}
export function reviseDocument(workspace,id,newText){
 guard(workspace);const old=workspace.documents.find(d=>d.id===id);if(!old)throw Error('Unknown document');
 const parsed=discoverSourceUnits(newText);
 if(old.sourceHash===parsed.sourceHash)return workspace;
 old.text=newText;old.importReceipt=null;old.authority=null;old.pdfTranscriptionReview=null;old.sourceHash=parsed.sourceHash;old.units=parsed.units;old.coverage={represented:parsed.allNonWhitespaceRepresented,gaps:parsed.unrepresented};
 // S28: a return to identical text is a NEW source revision, not permission to
 // resurrect a prior Clocked journal or human review from an earlier lifecycle.
 // Legacy workspaces have no epoch and retain their accepted current task IDs.
 old.analysisEpoch=(old.analysisEpoch??0)+1;old.revision++;
 invalidateAssessments(workspace,a=>a.documentId===id);
 workspace.revision++;return workspace;
}
export function setCallSheet(workspace,text){
 guard(workspace);if(typeof text!=='string'||!text.trim()||text.length>80000)throw Error('Unsupported call-sheet source');
 const parsed=parseCallSheet(text);
 const identities=new Set();
 for(const s of parsed.scenes){if(identities.has(s.id))throw Error(`Duplicate scene identity ${s.id}`);identities.add(s.id);}
 const sourceHash=sourceFingerprint(text);
 if(workspace.callSheet?.sourceHash===sourceHash)return workspace;
 // Preserve unaffected scene identities when a call sheet changes. Scene epochs
 // advance only for changed or reintroduced scenes, preventing a reverted row
 // from inheriting an older human review or model result. Legacy rows are epoch 0.
 const previous=workspace.callSheet;
 const earlier=new Map((previous?.scenes??[]).map(x=>[x.id,x]));
 const history={...(previous?.historicalSceneEpochs??{})};
 for(const old of previous?.scenes??[])if(!Object.hasOwn(history,old.id))history[old.id]=old.sourceEpoch??0;
 const scenes=parsed.scenes.map(scene=>{
  const prior=earlier.get(scene.id);
  const same=prior&&sourcePointSlice(previous.text,prior.source.start,prior.source.end)===sourcePointSlice(text,scene.source.start,scene.source.end);
  const sourceEpoch=prior?(prior.sourceEpoch??0)+(same?0:1):Object.hasOwn(history,scene.id)?history[scene.id]+1:0;
  history[scene.id]=sourceEpoch;
  return {...scene,sourceEpoch};
 });
 workspace.callSheet={text,sourceHash,scenes,unsupported:parsed.unsupported,format:parsed.format,
  revision:(previous?.revision||0)+1,historicalSceneEpochs:history};
 invalidateAssessments(workspace,()=>true);
 workspace.revision++;return workspace;
}
function invalidateAssessments(workspace,predicate){
 workspace.assessments=workspace.assessments.map(a=>predicate(a)?{...a,status:'STALE_SOURCE_CHANGED'}:a);
 // Human action history is retained with its original evidence id, never silently transplanted.
}
/** Attach a verified file-import receipt while preserving original byte hash and provenance.
 * The source retains exact normalized text; raw source hashes never falsely imply unchanged bytes.
 */
export function applySourceImport(workspace,envelope,{documentId=null}={}){
 guard(workspace);
 if(!envelope||envelope.schema!=='beforeroll-source-import-v1'||envelope.notClearance!==true)throw Error('Unverified source import');
 if(typeof envelope.text!=='string'||!envelope.text.trim())throw Error('Missing imported text');
 const receipt={kind:envelope.kind,name:envelope.name,sourceFormat:envelope.sourceFormat,rawHash:envelope.rawHash,normalizedHash:envelope.normalizedHash,byteCount:envelope.byteCount,sourceMap:envelope.sourceMap,warnings:envelope.warnings,reviewedAttestation:envelope.reviewedAttestation??null,reviewedPermitAttestation:envelope.reviewedPermitAttestation??null,requiresHumanTextReview:envelope.requiresHumanTextReview===true,extractionPartSha256:envelope.originalPartSha256??null,revision:workspace.revision+1};
 if(sourceFingerprint(envelope.text)!==receipt.normalizedHash)throw Error('Imported normalized hash mismatch');
 if(envelope.reviewedAttestation)verifyReviewedCallSheetReceipt(receipt,envelope.text);
 if(envelope.reviewedPermitAttestation)verifyReviewedPermitReceipt(receipt,envelope.text);
 if(envelope.kind==='permit'){
  if(!nonempty(documentId,80))throw Error('Document id required for permit import');
  const found=workspace.documents.find(x=>x.id===documentId);
  if(found&&found.sourceHash===envelope.normalizedHash&&found.importReceipt?.rawHash!==envelope.rawHash)throw Error('Same extracted text but different original file provenance. Import under a new document ID; do not transplant previous authority or Clocked evidence onto different source bytes');
  if(found)reviseDocument(workspace,documentId,envelope.text);
  else addDocument(workspace,{id:documentId,name:envelope.name,text:envelope.text});
  const doc=workspace.documents.find(x=>x.id===documentId);
  doc.importReceipt={...receipt,documentId,sourceHash:doc.sourceHash};
  doc.pdfTranscriptionReview=null;
 }else if(envelope.kind==='callSheet'){
  if(workspace.callSheet?.sourceHash===envelope.normalizedHash&&workspace.callSheet?.importReceipt?.rawHash!==envelope.rawHash)throw Error('Different binary originals or a previously manual call sheet may not reattribute identical scene text and existing model evidence to a new original file; use a distinct changed scene revision');
  setCallSheet(workspace,envelope.text);
  workspace.callSheet.importReceipt={...receipt,sourceHash:workspace.callSheet.sourceHash};
 }else throw Error('Unsupported import kind');
 workspace.imports??=[];
 workspace.imports.push(receipt);
 return workspace;
}

/** Explicit reviewer confirmation of exact imported PDF transcription and original-byte identity.
 * This is a human check of text completeness, not evidence of permit validity.
 */
export function confirmPdfTranscription(workspace,{documentId,reviewer,reason,rawHash,normalizedHash}){
 guard(workspace);const d=workspace.documents.find(x=>x.id===documentId);
 if(!d||!d.importReceipt?.requiresHumanTextReview||!['PDF_CONSERVATIVE_TYPE1_TEXT_V1','PDF_POPPLER_TEXT_LAYER_HUMAN_REVIEW_V1'].includes(d.importReceipt.sourceFormat))throw Error('Choose a PDF import awaiting transcript review');
 if(!nonempty(reviewer,150)||!nonempty(reason,2000)||d.importReceipt.rawHash!==rawHash||d.sourceHash!==normalizedHash||d.importReceipt.normalizedHash!==normalizedHash)throw Error('PDF text review must match original bytes, exact extracted text, reviewer and reason');
 if(d.pdfTranscriptionReview?.rawHash===rawHash)throw Error('This source PDF transcription is already reviewed');
 d.pdfTranscriptionReview={documentId,rawHash,normalizedHash,documentRevision:d.revision,reviewer,reason,status:'HUMAN_REVIEWED_TEXT_ONLY_NOT_AUTHORITY',notClearance:true};
 workspace.revision++;return workspace;
}
export function guard(workspace){if(!workspace||workspace.schema!=='beforeroll-workspace-v1'||!Array.isArray(workspace.documents)||!Array.isArray(workspace.assessments))throw Error('Invalid workspace schema');return true;}
export function assertWorkspaceSources(workspace){
 guard(workspace);
 for(const doc of workspace.documents){
  if(doc.analysisEpoch!==undefined&&(!Number.isSafeInteger(doc.analysisEpoch)||doc.analysisEpoch<0))throw Error('Document analysis epoch invalid');
  if(sourceFingerprint(doc.text)!==doc.sourceHash)throw Error(`Source hash mismatch for ${doc.id}`);
  const parsed=discoverSourceUnits(doc.text);
  if(JSON.stringify(parsed.units)!==JSON.stringify(doc.units)||!parsed.allNonWhitespaceRepresented)throw Error(`Source coverage integrity mismatch for ${doc.id}`);
 }
 for(const doc of workspace.documents){
  if(doc.importReceipt&&doc.importReceipt.sourceHash!==doc.sourceHash)throw Error(`Imported document receipt stale for ${doc.id}`);
  if(doc.pdfTranscriptionReview){const r=doc.pdfTranscriptionReview,p=doc.importReceipt;
   if(!p?.requiresHumanTextReview||r.status!=='HUMAN_REVIEWED_TEXT_ONLY_NOT_AUTHORITY'||r.notClearance!==true||r.documentId!==doc.id||r.rawHash!==p.rawHash||r.normalizedHash!==doc.sourceHash||r.documentRevision!==doc.revision||!nonempty(r.reviewer,150)||!nonempty(r.reason,2000))throw Error(`PDF transcript review integrity failed for ${doc.id}`);}
  if(doc.importReceipt?.reviewedPermitAttestation)verifyReviewedPermitReceipt(doc.importReceipt,doc.text);
  if(doc.importReceipt?.requiresHumanTextReview&&!['PDF_CONSERVATIVE_TYPE1_TEXT_V1','PDF_POPPLER_TEXT_LAYER_HUMAN_REVIEW_V1'].includes(doc.importReceipt.sourceFormat))throw Error('Unrecognized source requiring transcript review');
 }
 // Archived document revisions have no current document text. Verify their
 // retained reviewer sections against their own exact normalized SHA-256.
 for(const receipt of workspace.imports??[]){
  if(receipt.reviewedPermitAttestation){
   const sections=receipt.reviewedPermitAttestation.sections;
   if(!Array.isArray(sections))throw Error('Historical reviewed permit sections missing');
   verifyReviewedPermitReceipt(receipt,sections.map(x=>x.text).join('\n\n'));
  }
 }
 if(workspace.callSheet){
  const parsed=parseCallSheet(workspace.callSheet.text);
  const sourceScenes=workspace.callSheet.scenes.map(({sourceEpoch,...scene})=>scene);
  if(JSON.stringify(sourceScenes)!==JSON.stringify(parsed.scenes)||JSON.stringify(workspace.callSheet.unsupported)!==JSON.stringify(parsed.unsupported)||workspace.callSheet.format!==parsed.format)throw Error('Call-sheet scene projection differs from original source rows');
  if(Object.values(workspace.callSheet.historicalSceneEpochs??{}).some(e=>!Number.isSafeInteger(e)||e<0))throw Error('Historical scene revision lineage invalid');
  for(const scene of workspace.callSheet.scenes){const e=scene.sourceEpoch??0;
   if(!Number.isSafeInteger(e)||e<0||workspace.callSheet.historicalSceneEpochs?.[scene.id]!==undefined&&workspace.callSheet.historicalSceneEpochs[scene.id]!==e)throw Error('Call-sheet scene revision lineage invalid');
  }
  if(workspace.callSheet.importReceipt&&workspace.callSheet.importReceipt.sourceHash!==workspace.callSheet.sourceHash)throw Error('Imported call-sheet receipt stale');
  if(workspace.callSheet.importReceipt?.reviewedAttestation)verifyReviewedCallSheetReceipt(workspace.callSheet.importReceipt,workspace.callSheet.text);
  if(sourceFingerprint(workspace.callSheet.text)!==workspace.callSheet.sourceHash)throw Error('Call sheet hash mismatch');
  for(const scene of workspace.callSheet.scenes){if(scene.source&&sourcePointSlice(workspace.callSheet.text,scene.source.start,scene.source.end).length===0)throw Error('Scene provenance missing');}
 }
 return true;
}
export function recordReview(workspace,{evidenceId,decision,reason,reviewer}){
 guard(workspace);
 if(!nonempty(evidenceId)||!humanStatuses.has(decision)||!nonempty(reason,3000)||!nonempty(reviewer,150))throw Error('Human review requires evidence id, allowed decision, reviewer and reason');
 workspace.reviewActions.push({sequence:workspace.reviewActions.length+1,evidenceId,decision,reason,reviewer,workspaceRevision:workspace.revision,notClearance:true});
 workspace.revision++;return workspace;
}
export function exportWorkspace(workspace){assertWorkspaceSources(workspace);return JSON.stringify(clone(workspace),null,2);}
export function importWorkspace(serialized){if(typeof serialized!=='string'||serialized.length>1000000)throw Error('Workspace import size exceeded');const w=JSON.parse(serialized);assertWorkspaceSources(w);return w;}
