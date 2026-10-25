// M3-S2. Deterministic source segmentation, Clocked-owned semantic applicability.
// A scan is exhaustive ONLY over successfully segmented candidates, not all legal conditions.
import {sentenceCandidates,excerptFromRange} from './semantic-source.mjs';
import {decideSemanticPayload,sha256,conservativeSemanticFinding} from './semantic.mjs';
export const MAX_SWEEP_CLAUSES=8;
export function sweepCandidatePlan(permitText,sceneRow){
 if(typeof permitText!=='string'||permitText.length<40||permitText.length>12000)throw Error('Permit text must be 40–12,000 characters');
 if(typeof sceneRow!=='string'||sceneRow.length<25||sceneRow.length>1000||!/^(?:\s*)Scene\s+[^\r\n]+\|/.test(sceneRow))throw Error('Use a single complete, supported scene row');
 const candidates=sentenceCandidates(permitText);
 if(candidates.length===0)throw Error('No usable clauses were segmented; manual review required');
 if(candidates.length>MAX_SWEEP_CLAUSES)throw Error(`Permit has ${candidates.length} detected clauses. This bounded pilot supports at most ${MAX_SWEEP_CLAUSES}; no truncated scan permitted.`);
 return candidates.map((c,i)=>({index:i+1,start:c.start,end:c.end,text:excerptFromRange(permitText,c.start,c.end),payload:decideSemanticPayload(c.text,sceneRow),requestHash:sha256(JSON.stringify(decideSemanticPayload(c.text,sceneRow)))}));
}
export function parseSweepReply(answer,plan,permitText,sceneRow,credits){
 const typed=answer?.answers?.activity_link?.type==='noul'&&answer?.answers?.granted_for_scene?.type==='noul';
 const finding=typed?conservativeSemanticFinding(answer?.answers):{code:'FORMAT_UNVERIFIED',title:'Typed Clocked response unavailable',status:'unresolved',relevance:null,grant:null,explanation:'Response did not contain both supported noul probability objects. No inference was accepted.'};
 return {
  index:plan.index,range:[plan.start,plan.end],clause:plan.text,
  requestHash:plan.requestHash,permitHash:sha256(permitText),sceneHash:sha256(sceneRow),
  finding,modelAnswers:{activity_link:answer?.answers?.activity_link??null,granted_for_scene:answer?.answers?.granted_for_scene??null},
  reportedCredits:credits,notClearance:true
 };
}

/** Report non-whitespace source text not included in any candidate. Missing short clauses
 * must remain visible; e.g. "No drones." is too short for the M3 excerpt contract.
 */
export function uncoveredSourceSpans(permitText, plan){
 const points=Array.from(permitText);const claimed=new Uint8Array(points.length);
 for(const c of plan)for(let i=c.start;i<c.end;i++)claimed[i]=1;
 const missing=[];let begin=-1;
 for(let i=0;i<=points.length;i++){
  const outside=i<points.length&&!claimed[i]&&points[i].trim().length>0;
  if(outside&&begin===-1)begin=i;
  if(!outside&&begin!==-1){missing.push({start:begin,end:i,text:points.slice(begin,i).join('')});begin=-1;}
 }
 return missing.slice(0,30);
}
