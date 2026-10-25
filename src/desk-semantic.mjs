// M3-S3: source-bound Clocked sweeps integrated into the production Review Desk.
// Browser and Node compatible. No Clocked call, no semantic keyword rules.
import {sentenceCandidates,slicePoints} from './semantic-source.mjs';
import {decideSemanticPayload} from './semantic-contract.mjs';
import {modelGrantScope} from './authority-summary.mjs';

const truth = x => typeof x === 'number' && Number.isFinite(x) && x>=0 && x<=1 ? x : null;
export function classifyAnswers(a){
 const p=truth(a?.activity_link?.noul),g=truth(a?.granted_for_scene?.noul);
 if(a?.activity_link?.type!=='noul'||a?.granted_for_scene?.type!=='noul'||p===null||g===null)return null;
 if(p>=.8&&g<=.2)return {code:'CLOCKED_SEMANTIC_REVIEW',status:'review',relevance:p,grant:g};
 if(p>=.8&&g>=.8)return {code:'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW',status:'review',relevance:p,grant:g};
 if(p<=.2&&g<=.2)return {code:'NO_SEMANTIC_LINK_DETECTED',status:'unresolved',relevance:p,grant:g};
 return {code:'CLOCKED_SEMANTIC_AMBIGUOUS',status:'unresolved',relevance:p,grant:g};
}
export async function auditDeskSweep({permitText,sceneRow,sceneId,scan,hash,origin='live'}){
 if(typeof permitText!=='string'||typeof sceneRow!=='string'||typeof sceneId!=='string'||typeof hash!=='function')throw Error('Missing source for Clocked evidence verification');
 if(!scan||scan.source!=='live-clocked-decide-condition-sweep'||scan.endpoint!=='decide'||scan.notClearance!==true||scan.interpretationScope!=='ONLY_SEGMENTED_CLAUSES_NOT_ENTIRE_PERMIT_AUTHORITY')throw Error('Unexpected sweep contract');
 if(scan.permitHash!==await hash(permitText)||scan.sceneHash!==await hash(sceneRow)||scan.scene?.text!==sceneRow)throw Error('Clocked result does not match current permit and scene');
 const candidates=sentenceCandidates(permitText);
 if(!Array.isArray(scan.results)||!Array.isArray(scan.sourceUnscanned)||!Number.isInteger(scan.candidatesDetected)||scan.candidatesDetected!==candidates.length||candidates.length===0)throw Error('Candidate count or source coverage data invalid');
 if(!Number.isInteger(scan.attempts)||scan.attempts<scan.results.length||scan.attempts>candidates.length||scan.candidatesEvaluated!==scan.results.length)throw Error('Sweep attempt counts invalid');
 if(typeof scan.complete!=='boolean'||(scan.complete&&(scan.error!==null||scan.results.length!==candidates.length)))throw Error('Sweep completeness contract invalid');
 if(scan.reportedCredits!==null && (!Number.isInteger(scan.reportedCredits)||scan.reportedCredits<0))throw Error('Invalid reported credits');
 const checked=[];const seen=new Set();
 for(const r of scan.results){
  if(!Number.isInteger(r.index)||r.index<1||r.index>candidates.length||seen.has(r.index))throw Error('Duplicate/invalid clause index');seen.add(r.index);
  const c=candidates[r.index-1];
  if(!Array.isArray(r.range)||r.range[0]!==c.start||r.range[1]!==c.end||r.clause!==c.text||slicePoints(permitText,c.start,c.end)!==r.clause)throw Error('Original permit source quote mismatch');
  if(r.permitHash!==scan.permitHash||r.sceneHash!==scan.sceneHash||r.notClearance!==true||!/^[a-f0-9]{64}$/.test(r.requestHash||''))throw Error('Per-clause identity invalid');
  if(r.requestHash!==await hash(JSON.stringify(decideSemanticPayload(r.clause,sceneRow))))throw Error('Clocked request fingerprint does not match exact clause and scene');
  if(r.reportedCredits!==null&&(!Number.isInteger(r.reportedCredits)||r.reportedCredits<0))throw Error('Invalid per-clause billing');
  let expected=classifyAnswers(r.modelAnswers);
  // A failed typed response can be retained ONLY as an explicit unresolved partial record.
  if(expected===null && !scan.complete && r.finding?.code==='FORMAT_UNVERIFIED')expected={code:'FORMAT_UNVERIFIED',status:'unresolved',relevance:null,grant:null};
  if(!expected||!r.finding||r.finding.code!==expected.code||r.finding.status!==expected.status||r.finding.relevance!==expected.relevance||r.finding.grant!==expected.grant)throw Error('Model answer and displayed classification diverge');
  checked.push({...r});
 }
 // Source segments excluded by the local sentence splitter remain unresolved, even if the sweep is complete.
 const textPoints=Array.from(permitText),covered=new Uint8Array(textPoints.length);
 for(const c of candidates)for(let i=c.start;i<c.end;i++)covered[i]=1;
 const missing=textPoints.filter((ch,i)=>!covered[i]&&ch.trim()).length;
 if(missing>0 && scan.sourceUnscanned.length===0)throw Error('Scan omitted uncovered source fragments');
 const visible=checked.filter(r=>r.finding.code!=='NO_SEMANTIC_LINK_DETECTED').map(r=>{
   const scoped=r.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'?modelGrantScope(r.clause,sceneId):null;
   const held=!!scoped&&!scoped.matched;
   return {
   id:`clocked:${sceneId}:${r.index}:${r.requestHash.slice(0,16)}`,sceneId,severity:'review',type:'clocked',
   title:held?'Model-positive consent: scene scope unverified':r.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'?'Clocked found a possible scene-specific documentary grant':r.finding.code==='CLOCKED_SEMANTIC_REVIEW'?'Clocked flagged a potentially relevant source condition':r.finding.code==='FORMAT_UNVERIFIED'?'Clocked response format invalid — human review':'Clocked could not resolve this clause',
   detail:held?`${scoped.reason}. Model-positive documentary consent is not an exception to any activity-specific restriction; verify issued scope and precedence.`:r.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'?'A model-positive scene-named grant was identified. Confirm activity scope, signer, date, location and prerequisites; never assume filming clearance.':r.finding.code==='CLOCKED_SEMANTIC_REVIEW'?'A model identified a possible relationship. Verify whether this source clause governs the planned scene, a separate request or an extension. No confirmed violation or issued permission established by this clause.':r.finding.code==='FORMAT_UNVERIFIED'?'Model returned invalid or missing typed scores. No conclusion accepted. Review original evidence; all later calls were stopped.':'Relevance is uncertain; retain manual review of the original documents.',
   evidence:{permit:{start:r.range[0],end:r.range[1]}},
   clocked:{...r,origin,sourceMatched:true,sceneRow,permitHash:scan.permitHash,sceneHash:scan.sceneHash}
 };});
 return {sceneId,permitHash:scan.permitHash,sceneHash:scan.sceneHash,origin,
    attempts:scan.attempts,credits:scan.reportedCredits,complete:scan.complete,
    coverageWarning:missing>0||!scan.complete||scan.sourceUnscanned.length>0,
    uncoveredFragments:scan.sourceUnscanned.length,error:scan.error||null,
    candidates:candidates.length,checked,findings:visible,notClearance:true};
}
