/** Human-recorded SOURCE x SCENE applicability register. Never a legal clearance decision.
 * Assertions bind both immutable original source ranges and exact call-sheet scene rows.
 * Edits retire only affected assertions from CURRENT projections; history stays intact.
 */
import {createHash} from 'node:crypto';
import {assertWorkspaceSources,guard} from './production-workspace.mjs';
import {verifySourceUnit} from './permit-intelligence.mjs';
import {sourcePointSlice} from './engine.mjs';
const sha=s=>createHash('sha256').update(s,'utf8').digest('hex');
const stable=x=>sha(JSON.stringify(x));
const kinds=new Set(['RESTRICTION','CONDITIONAL_GRANT_CLAIM','REQUIREMENT','REQUEST_NOT_GRANTED','CONFLICT_OR_UNCERTAIN','BACKGROUND_CONTEXT']);
const scopes=new Set(['EXACT_SCENE','LOCATION_WIDE','SCOPE_UNRESOLVED']);
const issuances=new Set(['DOCUMENT_CLAIMS_ISSUED','REQUEST_ONLY','NOT_ESTABLISHED']);
const prerequisiteModes=new Set(['LINKED_CONDITIONS','NONE_STATED_HUMAN_REVIEW','NOT_REVIEWED']);
const dateOK=s=>s===null||(typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().startsWith(s));
/** Structured testimony, not an independent permit fact. Every facet requires its own
 * original-document verification. A null facet is UNKNOWN, never universally scoped. */
function checkApplicability(a){
 if(a===undefined)return true; // Historical v1 scene records remain supported.
 if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).sort().join(',')!==['activity','conditionIds','issuance','location','prerequisiteMode','relatedRestrictionIds','validFrom','validThrough'].sort().join(','))throw Error('Exact eight-field documentary applicability required');
 for(const k of ['activity','location'])if(a[k]!==null&&(!str(a[k],300)||a[k]!==a[k].trim()))throw Error('Activity and location must be exact reviewed text or null');
 if(!dateOK(a.validFrom)||!dateOK(a.validThrough)||a.validFrom&&a.validThrough&&a.validFrom>a.validThrough)throw Error('Invalid documentary effective-date window');
 if(!issuances.has(a.issuance)||!prerequisiteModes.has(a.prerequisiteMode))throw Error('Invalid asserted issuance or prerequisite state');
 for(const key of ['relatedRestrictionIds','conditionIds'])if(!Array.isArray(a[key])||a[key].length>30||a[key].some(x=>typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x))||new Set(a[key]).size!==a[key].length)throw Error('Invalid source-bound restriction or condition references');
 if(a.prerequisiteMode==='LINKED_CONDITIONS'&&!a.conditionIds.length||a.prerequisiteMode!=='LINKED_CONDITIONS'&&a.conditionIds.length)throw Error('Prerequisites must be explicitly linked, reviewed as none stated, or unresolved');
 return true;
}

const str=(s,n=200)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;
function sceneRow(workspace,scene){return sourcePointSlice(workspace.callSheet.text,scene.source.start,scene.source.end);}
function activeBinding(workspace,entry){
 const doc=workspace.documents.find(d=>d.id===entry.documentId),scene=workspace.callSheet?.scenes.find(s=>s.id===entry.sceneId);
 if(!doc||!scene)return false;
 const unit=doc.units.find(u=>u.id===entry.unitId);
 return doc.sourceHash===entry.documentHash&&sha(sceneRow(workspace,scene))===entry.sceneRowHash&&
  Boolean(unit&&unit.start===entry.start&&unit.end===entry.end&&unit.hash===entry.quoteHash&&unit.text===entry.quote&&verifySourceUnit(doc.text,unit));
}
export function assertSceneAuthorityIntegrity(workspace){
 guard(workspace);const seen=new Set();
 for(const e of workspace.sceneAuthority??[]){
  if(!str(e.id,64)||!/^[a-f0-9]{64}$/.test(e.id)||!str(e.sceneId,80)||!str(e.documentId,80)||!str(e.unitId,40)||
   !kinds.has(e.kind)||!scopes.has(e.scope)||!str(e.reviewer,150)||!str(e.reason,2000)||!str(e.quote,1750)||
   !/^[a-f0-9]{64}$/.test(e.documentHash)||!/^[a-f0-9]{64}$/.test(e.sceneRowHash)||!/^[a-f0-9]{64}$/.test(e.quoteHash)||sha(e.quote)!==e.quoteHash||
   !Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start<0||e.end<=e.start||!checkApplicability(e.applicability)||e.notClearance!==true||e.status!=='HUMAN_RECORDED_NOT_VERIFIED')
   throw Error('Scene authority record corrupted');
  if(seen.has(e.id)||e.id!==stable({sceneId:e.sceneId,sceneRowHash:e.sceneRowHash,documentId:e.documentId,documentHash:e.documentHash,unitId:e.unitId,quoteHash:e.quoteHash,start:e.start,end:e.end,kind:e.kind,scope:e.scope,reviewer:e.reviewer,reason:e.reason,...(e.applicability?{applicability:e.applicability}:{})}))throw Error('Scene authority identity mismatch or duplicate');
  seen.add(e.id);
  const d=workspace.documents.find(d=>d.id===e.documentId),s=workspace.callSheet?.scenes.find(s=>s.id===e.sceneId);
  if(!d)throw Error('Scene authority lost referenced document');
  if(d.sourceHash===e.documentHash){const u=d.units.find(u=>u.id===e.unitId);
   if(!u||!verifySourceUnit(d.text,u)||u.start!==e.start||u.end!==e.end||u.hash!==e.quoteHash||u.text!==e.quote)throw Error('Scene authority quotation mismatch for current document');}
 }
 return true;
}
export function recordSceneAuthority(workspace,{sceneId,documentId,unitId,kind,scope,reviewer,reason,applicability}){
 assertWorkspaceSources(workspace);assertSceneAuthorityIntegrity(workspace);
 const d=workspace.documents.find(d=>d.id===documentId),s=workspace.callSheet?.scenes.find(s=>s.id===sceneId);
 if(!d||!s||!d.coverage.represented)throw Error('Choose current scene and original source document');
 const u=d.units.find(u=>u.id===unitId);
 if(!u||!verifySourceUnit(d.text,u)||!kinds.has(kind)||!scopes.has(scope)||!str(reviewer,150)||!str(reason,2000))throw Error('Scene authority requires a valid source quote, scope, reviewer and reason');
 checkApplicability(applicability);
 if(applicability){
  if(kind==='CONDITIONAL_GRANT_CLAIM'&&applicability.issuance==='REQUEST_ONLY')throw Error('An unissued request cannot be labeled a documentary grant');
  for(const id of applicability.relatedRestrictionIds){
   const prior=(workspace.sceneAuthority??[]).find(x=>x.id===id);
   if(!prior||prior.kind!=='RESTRICTION'||prior.sceneId!==sceneId||!activeBinding(workspace,prior))throw Error('Link only current restrictions recorded against this exact scene');
  }
  for(const id of applicability.conditionIds){
   const c=(workspace.conditions??[]).find(x=>x.id===id);
   if(!c||c.sceneId!==sceneId)throw Error('Linked condition must belong to this exact scene');
  }
 }
 if((workspace.sceneAuthority?.length??0)>=2000)throw Error('Scene authority record limit; split the production');
 const base={sceneId,sceneRowHash:sha(sceneRow(workspace,s)),documentId,documentHash:d.sourceHash,unitId,quoteHash:u.hash,start:u.start,end:u.end,kind,scope,reviewer,reason,...(applicability?{applicability}:{})};
 const id=stable(base);const previous=workspace.sceneAuthority??(workspace.sceneAuthority=[]);
 if(previous.some(e=>e.id===id))throw Error('Duplicate source-to-scene assertion');
 previous.push({...base,id,quote:u.text,status:'HUMAN_RECORDED_NOT_VERIFIED',recordedAtRevision:workspace.revision+1,notClearance:true});
 workspace.revision++;return workspace;
}
export function projectSceneAuthority(workspace,{offset=0,limit=100,sceneId=null}={}){
 assertWorkspaceSources(workspace);assertSceneAuthorityIntegrity(workspace);
 if(!Number.isSafeInteger(offset)||offset<0||offset>2000||!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('Scene authority pagination invalid');
 if(sceneId!==null&&!workspace.callSheet?.scenes.some(s=>s.id===sceneId))throw Error('Unknown scene filter');
 const all=(workspace.sceneAuthority??[]).filter(x=>sceneId===null||x.sceneId===sceneId).map(x=>({
  id:x.id,sceneId:x.sceneId,documentId:x.documentId,unitId:x.unitId,kind:x.kind,scope:x.scope,applicability:x.applicability??null,quote:x.quote,range:[x.start,x.end],reviewer:x.reviewer,reason:x.reason,
  sourceState:activeBinding(workspace,x)?'CURRENT_UNVERIFIED':'STALE_SOURCE_OR_SCENE',notClearance:true}));
 const sceneList=(workspace.callSheet?.scenes??[]).map(s=>{
  const matches=all.filter(e=>e.sceneId===s.id),current=matches.filter(e=>e.sourceState==='CURRENT_UNVERIFIED');
  const alerts=current.filter(e=>e.kind==='RESTRICTION'||e.kind==='REQUIREMENT'||e.kind==='REQUEST_NOT_GRANTED'||e.kind==='CONFLICT_OR_UNCERTAIN');
  return {sceneId:s.id,location:s.location,claims:matches.length,currentClaims:current.length,staleClaims:matches.length-current.length,
   explicitHumanReviewItems:alerts.length,authorityState:alerts.length?'HUMAN_REVIEW_REQUIRED':'AUTHORITY_NOT_ESTABLISHED',notClearance:true};
 });
 return {schema:'beforeroll-scene-authority-register-v1',workspaceId:workspace.id,revision:workspace.revision,scenes:sceneList,
  records:all.slice(offset,offset+limit),pagination:{offset,limit,hasMore:offset+limit<all.length},
  summary:{total:all.length,current:all.filter(x=>x.sourceState==='CURRENT_UNVERIFIED').length,stale:all.filter(x=>x.sourceState!=='CURRENT_UNVERIFIED').length},
  notClearance:true,warning:'Human-recorded scope claims are not signature validation, fulfilled prerequisites, lawful authority or filming clearance.'};
}
