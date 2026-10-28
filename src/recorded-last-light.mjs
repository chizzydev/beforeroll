/** Exact full-run replay. Provider bytes are never rewritten or dispatched here. */
import {createHash} from 'node:crypto';
import {importWorkspace} from './production-workspace.mjs';
import {inspectImport} from './source-intake.mjs';
import {assertDiscoveryFresh,projectDiscovery} from './core-discovery.mjs';
import {projectCoordinatorTasks} from './coordinator-tasks.mjs';
export const LAST_LIGHT_RECORDING_SHA256='2cc34e798efe694df045418082e29f8b6c3b5b35f600f4167305a9ce5cc30954';
export const LAST_LIGHT_PRODUCTION_ID='last_light_browser_01';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function validateLastLightRecording(bytes,execution){
 if(sha(bytes)!==LAST_LIGHT_RECORDING_SHA256)throw Error('Last Light recorded packet integrity failed');
 const b=JSON.parse(bytes);if(b.schema!=='beforeroll-last-light-complete-recording-v1'||b.productionId!==LAST_LIGHT_PRODUCTION_ID||b.notClearance!==true||b.jobs.length!==1)throw Error('Invalid Last Light recording');
 const w=importWorkspace(JSON.stringify(b.workspace));projectCoordinatorTasks(w);
 if(w.id!==b.productionId||w.sceneAuthority.length||w.conditionDecisions.length)throw Error('Recording cannot assert authority or fulfillment');
 for(const j of b.jobs){execution.validate(j);assertDiscoveryFresh(w,j.plan);if(j.origin!=='OWNER_CLOCKED_CORE_DISCOVERY'||j.state!=='COMPLETE_FOR_PLANNED_UNITS_NOT_AUTHORITY')throw Error('Recording is not a genuine completed owner run');}
 for(const o of b.originals){const bytes=Buffer.from(o.base64,'base64');if(bytes.toString('base64')!==o.base64||sha(bytes)!==o.rawSha256)throw Error('Recorded original integrity failed');const input=inspectImport({kind:o.kind,name:o.name,contentBase64:o.base64});
  const target=o.kind==='callSheet'?w.callSheet:w.documents.find(d=>d.id===o.documentId);if(!target||target.importReceipt.rawHash!==input.rawHash||target.sourceHash!==input.normalizedHash)throw Error('Recorded original/source mismatch');}
 if(b.originals.length!==w.documents.length+1)throw Error('Incomplete recorded originals');
 const p=projectDiscovery(w,b.jobs);if(p.candidates.filter(c=>!c.documentaryRecord).length!==b.acceptedPrerequisiteCount||p.candidates.filter(c=>c.documentaryRecord).length!==b.acceptedInvestigationCount)throw Error('Recorded projection changed; inspect before replay');
 return b;
}
