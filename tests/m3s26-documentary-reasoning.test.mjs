import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {createProduction,reviseDocument,setCallSheet,exportWorkspace,importWorkspace} from '../src/production-workspace.mjs';
import {recordSceneAuthority,projectSceneAuthority,assertSceneAuthorityIntegrity} from '../src/scene-authority.mjs';
import {annotateAuthorityDocument,recordAuthorityLink} from '../src/document-authority.mjs';
import {recordSceneSchedule,recordCondition,decideCondition} from '../src/production-operations.mjs';
import {projectDocumentaryReasoning} from '../src/documentary-reasoning.mjs';
import {buildProductionDossier,dossierMarkdown} from '../src/production-dossier.mjs';
import {buildSceneWorkbench} from '../src/scene-workbench.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createAppServer} from '../server.mjs';
const permit='No rolling camera carriage on protected mosaic.\n\nPermit WR-17 allows entry to the archive hall, subject to separate activity restrictions.';
const addendum='Issued and signed addendum AD-4: Scene 47 may use a rubber-tyred camera carriage on protective boards at the archive hall between 2026-10-25 and 2026-10-27, with a registrar on site.';
const request='Please extend the carriage exception to Scene 48. Awaiting signed approval; this email is a request only.';
const sheet='Scene 47 | Archive Hall | 10:00-11:00 | Camera carriage on boards\nScene 48 | Archive Hall | 12:00-13:00 | Camera carriage on boards';
const NOW='2026-10-25T09:00:00.000Z';
const reviewer={reviewer:'Location supervisor',reason:'Compared original scene row with exact marked document passage; authenticity not validated'};
const app=(o={})=>({activity:'Camera carriage on boards',location:'Archive Hall',validFrom:'2026-10-25',validThrough:'2026-10-27',issuance:'DOCUMENT_CLAIMS_ISSUED',prerequisiteMode:'NOT_REVIEWED',relatedRestrictionIds:[],conditionIds:[],...o});
function fixture(){
 const w=createProduction({id:'archive-26',title:'Archive production',callSheetText:sheet,documents:[{id:'base',name:'WR17',text:permit},{id:'ad4',name:'AD4',text:addendum},{id:'email',name:'Request',text:request}]});
 for(const [documentId,role,reference,issuedOn] of [['base','PERMIT','WR-17','2026-10-01'],['ad4','AMENDMENT','AD-4','2026-10-21'],['email','REQUEST','Request','2026-10-22']])
  annotateAuthorityDocument(w,{documentId,role,reference,issuer:'Recorded heritage authority (unverified)',issuedOn,...reviewer});
 const a=w.documents.find(d=>d.id==='ad4').units[0];
 recordAuthorityLink(w,{fromId:'ad4',toId:'base',kind:'AMENDS',start:a.start,end:a.end,quote:a.text,...reviewer});
 for(const sceneId of ['S47','S48'])recordSceneSchedule(w,{sceneId,date:'2026-10-25',timeZone:'Africa/Lagos',endsNextDay:false,...reviewer});
 return w;
}
function claim(w,{sceneId,doc,kind,applicability,unitId='U001'}){
 recordSceneAuthority(w,{sceneId,documentId:doc,unitId,kind,scope:'EXACT_SCENE',...reviewer,...(applicability?{applicability}:{})});
 return w.sceneAuthority.at(-1).id;
}
const result=w=>projectDocumentaryReasoning(w,{asOf:NOW});
function prepare(){const w=fixture(),r1=claim(w,{sceneId:'S47',doc:'base',kind:'RESTRICTION',applicability:app({issuance:'NOT_ESTABLISHED',relatedRestrictionIds:[]})}),r2=claim(w,{sceneId:'S48',doc:'base',kind:'RESTRICTION',applicability:app({issuance:'NOT_ESTABLISHED'})});return {w,r1,r2};}

test('base restrictions cannot be erased by a general location consent passage',()=>{
 const {w}=prepare();claim(w,{sceneId:'S48',doc:'base',unitId:'U002',kind:'BACKGROUND_CONTEXT',applicability:app({issuance:'NOT_ESTABLISHED'})});
 const scene=result(w).scenes[1];assert.equal(scene.state,'RESTRICTIONS_UNRESOLVED_NO_APPLICABLE_GRANT_ESTABLISHED');assert.equal(scene.restrictions.length,1);assert.equal(scene.humanRecordedIssuedClaims,0);assert.equal(scene.notClearance,true);
});
test('scene 47 human-recorded addendum with matching activity/location/day connects only to exact original restriction',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const [s47,s48]=result(w).scenes;assert.equal(s47.state,'RESTRICTION_AND_SCOPED_DOCUMENT_CLAIM_REQUIRES_VERIFICATION');assert.equal(s47.amendments[0].assertionState,'DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED');assert.equal(s47.amendments[0].documentaryConnection,'CURRENT_HUMAN_ASSERTED_AMENDMENT_LINK');assert.equal(s48.state,'RESTRICTIONS_UNRESOLVED_NO_APPLICABLE_GRANT_ESTABLISHED');assert.equal(result(w).notClearance,true);
});
test('the same amendment is explicitly out-of-scope for a different location',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({location:'Other Hall',relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const e=result(w).scenes[0].amendments[0];assert.equal(e.applicable.location,'MISMATCH');assert.equal(e.assertionState,'GRANT_OUTSIDE_RECORDED_ACTIVITY_LOCATION_OR_DATE');
});
test('an amendment for another camera activity is NOT usable for a carriage',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({activity:'Static tripod',relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const e=result(w).scenes[0].amendments[0];assert.equal(e.applicable.activity,'MISMATCH');assert.equal(e.assertionState,'GRANT_OUTSIDE_RECORDED_ACTIVITY_LOCATION_OR_DATE');
});
test('date not reviewed does not become a universal evergreen authorization',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({validFrom:null,validThrough:null,relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const e=result(w).scenes[0].amendments[0];assert.equal(e.applicable.date,'UNREVIEWED');assert.equal(e.assertionState,'GRANT_SCOPE_NOT_ESTABLISHED');
});
test('approved text is not applicable outside its stated date window',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({validFrom:'2026-10-20',validThrough:'2026-10-24',relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_OUTSIDE_RECORDED_ACTIVITY_LOCATION_OR_DATE');
});
test('rescheduling a scene beyond the human-recorded grant window removes apparent matching',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 recordSceneSchedule(w,{sceneId:'S47',date:'2026-10-29',timeZone:'Africa/Lagos',endsNextDay:false,...reviewer});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_OUTSIDE_RECORDED_ACTIVITY_LOCATION_OR_DATE');
});
test('absence of any reviewed scene date cannot silently satisfy the date facet',()=>{
 const {w,r1}=prepare();w.sceneSchedules=[];claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].applicable.date,'SCENE_DATE_NOT_REVIEWED');
});
test('unissued email request is never an approved exception, regardless of selected source wording',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'email',kind:'REQUEST_NOT_GRANTED',applicability:app({issuance:'REQUEST_ONLY',relatedRestrictionIds:[r1]})});
 const s=result(w).scenes[0];assert.equal(s.requests[0].assertionState,'REQUEST_NOT_ISSUED');assert.equal(s.humanRecordedIssuedClaims,0);assert.equal(s.state,'RESTRICTIONS_UNRESOLVED_NO_APPLICABLE_GRANT_ESTABLISHED');
 assert.throws(()=>claim(w,{sceneId:'S47',doc:'email',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({issuance:'REQUEST_ONLY'})}),/unissued request/);
});
test('even a misleading issuance label cannot promote a document filed as REQUEST to an issued amendment',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'email',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({issuance:'DOCUMENT_CLAIMS_ISSUED',relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const c=result(w).scenes[0].amendments[0];assert.equal(c.assertionState,'REQUEST_NOT_ISSUED');assert.equal(c.documentRole,'REQUEST');
});
test('a scoped issued claim cannot relate to a restriction on a DIFFERENT scene',()=>{
 const {w,r2}=prepare();assert.throws(()=>claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r2]})}),/exact scene/);
});
test('a scope-matching document without active amendment link is not an exception',()=>{
 const {w,r1}=prepare();w.authorityLinks=[];claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_NOT_LINKED_TO_CURRENT_RESTRICTION');
});
test('a supposed amendment cannot bypass a specific restriction with no restriction ID',()=>{
 const {w}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_NOT_LINKED_TO_CURRENT_RESTRICTION');
});
test('open prerequisite blocks even an otherwise matching document; human acknowledgment remains NOT authenticated permission',()=>{
 const {w,r1}=prepare();recordCondition(w,{sceneId:'S47',documentId:'ad4',unitId:'U001',title:'Registrar and protection boards',reviewer:'Coordinator',reason:'Requires site registrar'});
 const id=w.conditions[0].id;claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'LINKED_CONDITIONS',conditionIds:[id]})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_PREREQUISITES_OUTSTANDING_OR_UNREVIEWED');
 decideCondition(w,{conditionId:id,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'Coordinator',reason:'Human check recorded'});
 const e=result(w).scenes[0].amendments[0];assert.equal(e.assertionState,'DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED');assert.equal(e.linkedConditions[0].reviewerDecisionIsNotAuthority,true);
});
test('a prerequisite from another scene cannot be laundered into an amendment',()=>{
 const {w,r1}=prepare();recordCondition(w,{sceneId:'S48',title:'Additional registrar',reviewer:'Coordinator',reason:'Crew requirement'});
 assert.throws(()=>claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'LINKED_CONDITIONS',conditionIds:[w.conditions[0].id]})}),/exact scene/);
});
test('stale original addendum loses current relevance, while audit history persists without automatic regrant',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 reviseDocument(w,'ad4',addendum+'\n\nAddendum withdrawn pending review.');
 const s=result(w).scenes[0];assert.equal(s.amendments[0].assertionState,'HISTORICAL_NOT_CURRENT');assert.equal(s.state,'RESTRICTIONS_UNRESOLVED_NO_APPLICABLE_GRANT_ESTABLISHED');assert.equal(w.sceneAuthority.length,3);
});
test('amendment link becomes stale when original permit changes; old restriction cannot be linked anew',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 reviseDocument(w,'base',permit+'\n\nNew policy pending.');
 const e=result(w).scenes[0].amendments[0];assert.equal(e.assertionState,'GRANT_NOT_LINKED_TO_CURRENT_RESTRICTION');
 assert.throws(()=>claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})}),/current restrictions/);
});
test('scene edit retires all claims tied to former original row, keeping histories separate',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 setCallSheet(w,sheet.replace('Camera carriage on boards','Dolly carriage unprotected'));
 const s=result(w).scenes[0];assert.equal(s.amendments[0].assertionState,'HISTORICAL_NOT_CURRENT');assert.equal(s.humanRecordedIssuedClaims,0);
});
test('altered recorded scope and forged historical source binding are rejected on persistence read',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1]})});
 const z=importWorkspace(exportWorkspace(w));z.sceneAuthority.at(-1).applicability.location='Some Other Site';assert.throws(()=>assertSceneAuthorityIntegrity(z),/identity mismatch/);
 const y=importWorkspace(exportWorkspace(w));y.sceneAuthority.at(-1).applicability.relatedRestrictionIds.push('fake');assert.throws(()=>assertSceneAuthorityIntegrity(y),/Invalid source-bound/);
});
test('ill-formed scope windows, spoofed issuance and missing required linked conditions are rejected',()=>{
 const {w,r1}=prepare();const make=a=>claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],...a})});
 assert.throws(()=>make({validFrom:'2026-02-30'}),/Invalid documentary/);
 assert.throws(()=>make({validFrom:'2026-10-28',validThrough:'2026-10-27'}),/Invalid documentary/);
 assert.throws(()=>make({issuance:'CLEARANCE_GRANTED'}),/Invalid asserted/);
 assert.throws(()=>make({prerequisiteMode:'LINKED_CONDITIONS',conditionIds:[]}),/Prerequisites/);
 assert.throws(()=>make({activity:'  Camera carriage on boards '}),/reviewed text/);
 assert.throws(()=>make({relatedRestrictionIds:[r1,r1]}),/Invalid source-bound/);
});
test('separate model findings remain model scores, not issuance; dossier and workbench use exactly the same reasoning packet',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const d=buildProductionDossier(w,{persistedVersion:7,asOf:NOW}),b=buildSceneWorkbench(d,{sceneId:'S47'});
 assert.equal(d.documentaryReasoning.scenes[0].state,b.documentaryReasoning.state);assert.equal(b.documentaryReasoning.humanRecordedIssuedClaims,1);
 assert.match(dossierMarkdown(d),/Documentary authority reasoning/);assert.match(dossierMarkdown(d),/NOT VERIFIED|NO CLEARANCE/);
 const synthetic=[{id:'synthetic123',sceneId:'S47',documentId:'ad4',unitId:'U001',modelState:'COMPLETE',modelOrigin:'simulated',model:{code:'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW',relevance:.97,grant:.97},requestHash:'synthetic'}];
 const p=projectDocumentaryReasoning(w,{asOf:NOW,modelRecords:synthetic});const c=p.scenes[0].amendments[0];assert.equal(c.evidenceClass,'HUMAN_AND_CLOCKED_SEPARATE_CLAIMS');assert.equal(c.assertionState,'DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED');assert.equal(c.modelHits[0].notAuthority,true);
});
test('durable workspace save and load preserve new structured testimony, evidence hashes and current interpretations',async()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const dir=await mkdtemp(path.join(os.tmpdir(),'beforeroll-m3s26-'));
 try{const repo=createWorkspaceStore({directory:dir});await repo.persist(w,{expectedVersion:0});const saved=await repo.load(w.id);
  assert.equal(saved.version,1);assert.equal(result(saved.workspace).scenes[0].amendments[0].assertionState,'DOCUMENT_STATES_SCOPED_GRANT_HUMAN_AUTHENTICATION_REQUIRED');
  assert.equal(saved.workspace.sceneAuthority[2].id,w.sceneAuthority[2].id);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('local HTTP scope recording, atomic workflow, source-bound dossier export and dedicated reasoning agree',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'br-s26-http-'));
 const store=createWorkspaceStore({directory});const server=createAppServer({workspaceStore:store,enabled:false});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 const invoke=async(method,url,payload)=>{const res=await fetch(base+url,{method,headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});return {status:res.status,body:await res.json()};};
 const end='/api/workspaces/archive-26';
 try{
  const w=fixture();const {version}=await store.persist(w,{expectedVersion:0});assert.equal(version,1);
  const restrict=await invoke('POST',end+'/scene-authority',{expectedVersion:1,sceneId:'S47',documentId:'base',unitId:'U001',kind:'RESTRICTION',scope:'EXACT_SCENE',...reviewer,applicability:app({issuance:'NOT_ESTABLISHED'})});
  assert.equal(restrict.status,200,restrict.body.error);const restrictionId=restrict.body.workspace.sceneAuthority[0].id;
  const amendment=await invoke('POST',end+'/scene-authority',{expectedVersion:2,sceneId:'S47',documentId:'ad4',unitId:'U001',kind:'CONDITIONAL_GRANT_CLAIM',scope:'EXACT_SCENE',...reviewer,applicability:app({relatedRestrictionIds:[restrictionId],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
  assert.equal(amendment.status,200,amendment.body.error);
  const stamp='?asOf='+encodeURIComponent(NOW);
  const rpt=await invoke('GET',end+'/documentary-reasoning'+stamp),wf=await invoke('GET',end+'/workflow'+stamp),d=await invoke('GET',end+'/dossier'+stamp);
  for(const x of [rpt,wf,d])assert.equal(x.status,200,x.body.error);
  assert.equal(rpt.body.version,3);assert.equal(rpt.body.dossierSha256,wf.body.dossierSha256);assert.equal(d.body.sha256,wf.body.dossierSha256);
  assert.equal(wf.body.documentaryReasoning.scenes[0].state,rpt.body.scenes[0].state);
  assert.equal(wf.body.sceneWorkbench.documentaryReasoning.state,rpt.body.scenes[0].state);
  assert.equal(d.body.documentaryReasoning.scenes[0].state,rpt.body.scenes[0].state);
  assert.equal((await invoke('POST',end+'/scene-authority',{expectedVersion:2,sceneId:'S47',documentId:'ad4',unitId:'U001',kind:'CONDITIONAL_GRANT_CLAIM',scope:'EXACT_SCENE',...reviewer})).status,409);
  assert.equal((await invoke('GET','/api/health')).body.liveEnabled,false);
 }finally{await new Promise(ok=>server.close(ok));await rm(directory,{recursive:true,force:true});}
});
test('browser scope editor has date/activity/location/issuance, exact restriction and prerequisite selectors with conservative defaults',()=>{
 const {w,r1}=prepare();claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 // Covered by the actual static browser module rather than a separately drawn mock UI.
 return import('../public/workspace-desk.mjs').then(({productionView})=>{
  const model={items:[],selected:{version:1,workspace:w},overview:{scenes:w.callSheet.scenes,documents:w.documents},
   sceneAuthority:projectSceneAuthority(w),authority:{documents:w.documents.map(x=>({id:x.id,name:x.name,metadata:x.authority})),links:[],summary:{links:0,staleLinks:0,unresolvedConflicts:0,unreviewedDocuments:[]}},
   operations:{scenes:[],conditions:[],summary:{}},workflowStage:'scope',actionQueue:null,sceneWorkbench:null,liveEnabled:false};
  const html=productionView(model);
  for(const label of ['project-scene-auth-activity','project-scene-auth-location','project-scene-auth-from','project-scene-auth-through','project-scene-auth-issuance','project-scene-auth-related','project-scene-auth-prerequisite','project-scene-auth-condition'])
   assert(html.includes(`id="${label}"`),label);
  assert.match(html,/Document says issued \(NOT authenticated\)/);
  assert.match(html,/Scene-specific documentary scope/);
 });
});
test('Clocked-only high grant score is explicitly not an issued documentary grant',()=>{
 const {w}=prepare(),synthetic=[{id:'mock',sceneId:'S47',documentId:'ad4',unitId:'U001',modelState:'COMPLETE',modelOrigin:'TEST_ONLY',model:{code:'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW',relevance:.99,grant:.999},requestHash:'mock'}];
 const p=projectDocumentaryReasoning(w,{asOf:NOW,modelRecords:synthetic});
 assert.equal(p.scenes[0].humanRecordedIssuedClaims,0);assert.equal(p.scenes[0].modelOnlyFindings[0].evidenceClass,'CLOCKED_ONLY_NO_HUMAN_DOCUMENTARY_ASSERTION');assert.equal(p.scenes[0].state,'RESTRICTIONS_UNRESOLVED_NO_APPLICABLE_GRANT_ESTABLISHED');
});

test('the asserted issued date must not postdate the scene, even if scope-window text otherwise matches',()=>{
 const {w,r1}=prepare();annotateAuthorityDocument(w,{documentId:'ad4',role:'AMENDMENT',reference:'AD-4',issuer:'Heritage office (not authenticated)',issuedOn:'2026-10-29',...reviewer});
 claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_ISSUANCE_CHRONOLOGY_REQUIRES_REVIEW');
});
test('a broad LOCATION_WIDE claim never becomes the scene-specific exception to an activity restriction',()=>{
 const {w,r1}=prepare();recordSceneAuthority(w,{sceneId:'S47',documentId:'ad4',unitId:'U001',kind:'CONDITIONAL_GRANT_CLAIM',scope:'LOCATION_WIDE',...reviewer,applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_EXACT_SCENE_SCOPE_NOT_ATTESTED');
});
test('an active conflicting documentary relationship blocks an otherwise scoped amendment without inventing precedence',()=>{
 const {w,r1}=prepare(),doc=w.documents.find(d=>d.id==='ad4'),u=doc.units[0];
 recordAuthorityLink(w,{fromId:'ad4',toId:'email',kind:'CONFLICTS_WITH',start:u.start,end:u.end,quote:u.text,...reviewer});
 claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 const e=result(w).scenes[0].amendments[0];assert.equal(e.assertionState,'DOCUMENTARY_CONFLICT_NO_PRECEDENCE_INFERRED');assert.equal(e.conflictingLinkIds.length,1);
});
test('an open condition elsewhere in current scene operations is not bypassed by selecting none-stated for one amendment',()=>{
 const {w,r1}=prepare();recordCondition(w,{sceneId:'S47',title:'Confirm marshals on route',reviewer:'Supervisor',reason:'Recorded separately from grant clause'});
 claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_PREREQUISITES_OUTSTANDING_OR_UNREVIEWED');
});
test('missing claimed issued date makes the amendment chronology unresolved, not retroactively valid',()=>{
 const {w,r1}=prepare();annotateAuthorityDocument(w,{documentId:'ad4',role:'AMENDMENT',reference:'AD-4',issuer:'Heritage office (not authenticated)',issuedOn:null,...reviewer});
 claim(w,{sceneId:'S47',doc:'ad4',kind:'CONDITIONAL_GRANT_CLAIM',applicability:app({relatedRestrictionIds:[r1],prerequisiteMode:'NONE_STATED_HUMAN_REVIEW'})});
 assert.equal(result(w).scenes[0].amendments[0].assertionState,'GRANT_ISSUANCE_CHRONOLOGY_REQUIRES_REVIEW');
});
