/** BeforeRoll M3-S1: semantic relevance is exclusively a Clocked Decide output.
 * Deterministic operations ONLY: find exact source ranges, validate source hashes,
 * reject malformed model probabilities, map model scores to conservative REVIEW states.
 */
import {createHash} from 'node:crypto';
export function sha256(value){return createHash('sha256').update(value,'utf8').digest('hex');}
import {excerptFromRange} from './semantic-source.mjs';
export {slicePoints,excerptFromRange,sentenceCandidates} from './semantic-source.mjs';
import {decideSemanticPayload} from './semantic-contract.mjs';
export {decideSemanticPayload} from './semantic-contract.mjs';
export function parseNoul(answer){const val=answer?.noul;return typeof val==='number' && Number.isFinite(val)&&val>=0&&val<=1 ? val : null;}
export function conservativeSemanticFinding(answers){
 const relevance=parseNoul(answers?.activity_link),grant=parseNoul(answers?.granted_for_scene);
 if(relevance===null||grant===null)return {code:'FORMAT_UNVERIFIED',title:'Clocked outcome format not recognized',status:'unresolved',relevance,grant,explanation:'No semantic claim accepted; inspect raw response shape locally.'};
 if(relevance>=0.80 && grant<=0.20)return {code:'CLOCKED_SEMANTIC_REVIEW',title:'Clocked linked an unfamiliar activity to a source condition',status:'review',relevance,grant,explanation:'This may be a restriction or approval prerequisite. The selected excerpt does not establish specific issued permission. Human review required.'};
 if(relevance>=0.80 && grant>=0.80)return {code:'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW',title:'Clocked linked the activity to a documented permission',status:'review',relevance,grant,explanation:'The excerpt describes a potential issued authorization. Verify signer, scene, date, location and every prerequisite before reliance. Never treat this as clearance.'};
 if(relevance<=0.20 && grant<=0.20)return {code:'NO_SEMANTIC_LINK_DETECTED',title:'No link detected in this selected clause',status:'unresolved',relevance,grant,explanation:'This does not establish unrestricted permission; another relevant clause may have been omitted.'};
 return {code:'CLOCKED_SEMANTIC_AMBIGUOUS',title:'Semantic relationship remains uncertain',status:'unresolved',relevance,grant,explanation:'Model probabilities do not support a dependable conclusion. Review the complete documents manually.'};
}
