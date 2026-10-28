import {productionView} from './workspace/view.mjs';
import {selectedSceneTask} from './workspace/presentation.mjs';
export {productionView};
export {workspaceLocation,restoreWorkspaceLocation,followWorkspaceAnchor} from './workspace/navigation.mjs';
const workflowStages=new Set(['overview','work','sources','scope','analysis','review','operations','changes','evidence','history']);
const stageForRoute={sources:'sources',authority:'scope','scene-authority':'scope',review:'review',execution:'analysis',operations:'operations',history:'history',changes:'changes',evidence:'evidence'};
export function createWorkspaceController({fetchImpl=fetch,notify=()=>{},root=document}={}){
 const model={evaluationMode:false,authLocked:false,items:[],selected:null,originals:null,documentPreview:null,stagedReviews:[],reviewSessionPreview:null,stagingVersion:null,activeSceneId:null,sceneWorkbench:null,sceneTaskOffset:0,sceneActionOffset:0,overview:null,execution:null,authority:null,sceneAuthority:null,operations:null,dossier:null,actionQueue:null,impactPreview:null,pendingSource:null,actionOffset:0,actionKind:'ALL',workflowStage:'sources',journey:null,consistency:null,focusDocumentId:null,liveEnabled:false,selectedTask:null,selectedCondition:null,busy:false,error:null,offset:0};
 Object.assign(model,{recoverySpace:'',history:null,historyOffset:0,historyKind:'ALL',historyState:'ALL',historySearch:'',historySelected:null});
 const transportFetch=fetchImpl;
 fetchImpl=(url,options={})=>transportFetch(url,{...options,headers:{...options.headers,...(String(url).startsWith('/api/workspaces')&&model.recoverySpace?{'X-BeforeRoll-Recovery-Space':model.recoverySpace}:{})}});
 const query=id=>root.querySelector('#'+id);
 const value=id=>query(id)?.value?.trim()??'';
 Object.assign(model,{workflowStage:'overview',sceneView:'investigation',pickerOpen:false,sourceMode:'register',intakeKind:'permit',sceneSearch:'',sceneRegisterOffset:0});
 const sendNotice=notify;notify=(text,error=false)=>{if(error)model.error=text;else model.notice=text;sendNotice(text,error);};
 const selectProduction=(selected,workflowStage='overview')=>Object.assign(model,{selected,workflowStage,offset:0,actionOffset:0,actionKind:'ALL',historyOffset:0,historyKind:'ALL',historyState:'ALL',historySearch:'',historySelected:null,
  sceneView:'investigation',sourceMode:'register',pickerOpen:false,recoveryView:false,sceneSearch:'',sceneRegisterOffset:0,sceneSearchOpen:false,compareSceneId:null,compareLeftDocument:null,compareRightDocument:null,compareLeftUnit:null,compareRightUnit:null,
  activeSceneId:null,sceneWorkbench:null,coordinatorTasks:null,coordinatorReviewId:null,discoveryPreview:null,discoveryInput:null,sourceReturnSceneId:null,sceneTaskOffset:0,sceneActionOffset:0,selectedTask:null,selectedCondition:null,
  impactPreview:null,pendingSource:null,stagedReviews:[],reviewSessionPreview:null,stagingVersion:null,focusDocumentId:null,focusUnitId:null,diagnostics:null,dirtyDrafts:false,notice:''});
 const api=async(method,path,payload)=>{
  const response=await fetchImpl(path,{method,cache:'no-store',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});
  const data=await response.json();if(response.status===401&&data.ownerUnlockRequired){model.authLocked=true;throw Error('Owner access locked. Enter your local owner token.');}if(!response.ok){const guidance=/\/(recovery|lifecycle|backup|diagnostics|originals|reconnect-original)(?:\/|$)/.test(path)?data.recoveryGuidance:/\/(import|preview-source-change|commit-source-change)$/.test(path)?'Source not imported. Choose a supported original for the selected document type and inspect its transcription.':null;throw Error([data.error||`Project API HTTP ${response.status}`,guidance].filter(Boolean).join(' — '));}return data;
 };
 const refresh=async()=>{
  try{const health=await api('GET','/api/health');model.controlledTestMode=health.controlledTestMode===true;model.liveEnabled=Boolean(health.liveEnabled);model.evaluationMode=health.evaluationMode===true;model.evaluationDefaultProjectId=health.evaluationDefaultProjectId;}catch{model.liveEnabled=false;model.evaluationMode=false;}
  const list=await api('GET','/api/workspaces');model.authLocked=false;model.items=list.items;
  if(model.selected){const id=model.selected.workspace.id;
   const url=`/api/workspaces/${encodeURIComponent(id)}/workflow?offset=${model.offset}&actionOffset=${model.actionOffset}&kind=${encodeURIComponent(model.actionKind)}&sceneTaskOffset=${model.sceneTaskOffset}&sceneActionOffset=${model.sceneActionOffset}${model.activeSceneId?'&sceneId='+encodeURIComponent(model.activeSceneId):''}`;
   const historyQuery=`&historyOffset=${model.historyOffset}&historyKind=${model.historyKind}&historyState=${model.historyState}&historySearch=${encodeURIComponent(model.historySearch)}${model.historySelected?'&historySelected='+encodeURIComponent(model.historySelected):''}`;
   const snapshot=await api('GET',url+historyQuery);
   if(snapshot.schema!=='beforeroll-atomic-production-workflow-v1'||snapshot.notClearance!==true||snapshot.version<model.selected.version||snapshot.productionId!==id||
      snapshot.dossier?.sha256!==snapshot.dossierSha256||snapshot.journey?.dossierSha256!==snapshot.dossierSha256||snapshot.actionQueue?.dossierSha256!==snapshot.dossierSha256||
      snapshot.sceneWorkbench&&snapshot.sceneWorkbench.dossierSha256!==snapshot.dossierSha256||
      snapshot.consistency?.schema!=='beforeroll-production-consistency-v1'||snapshot.consistency.notClearance!==true||
      snapshot.consistency.dossierSha256!==snapshot.dossierSha256||snapshot.consistency.persistedVersion!==snapshot.version||
      snapshot.consistency.currentEvidence.modelComplete!==snapshot.dossier.counts.completedModelChecks||
      snapshot.consistency.currentEvidence.humanReviewed!==snapshot.dossier.counts.currentReviewedTasks)throw Error('Workflow evidence/version mismatch; reload before review');
   // One server-side persisted version and one dossier for all projections; no
   // asynchronous mix of separate workspace, scene and evidence API snapshots.
   model.selected={version:snapshot.version,workspace:snapshot.workspace};
   model.originals=snapshot.originals;model.journey=snapshot.journey;model.consistency=snapshot.consistency;model.overview=snapshot.overview;model.execution=snapshot.execution;
   model.authority=snapshot.authority;model.sceneAuthority=snapshot.sceneAuthority;model.operations=snapshot.operations;
   model.dossier=snapshot.dossier;model.actionQueue=snapshot.actionQueue;model.sceneWorkbench=snapshot.sceneWorkbench;model.coordinatorTasks=snapshot.coordinatorTasks;
   model.history=snapshot.history;
   const scenes=model.overview?.scenes??[];
   if(!scenes.some(sc=>sc.id===model.activeSceneId)){
    model.activeSceneId=scenes[0]?.id??null;model.sceneTaskOffset=0;model.sceneActionOffset=0;
   }
   if(model.stagingVersion!==null&&model.stagingVersion!==model.selected.version){model.stagedReviews=[];model.reviewSessionPreview=null;model.stagingVersion=null;notify('Production version changed. Uncommitted staged decisions were cleared; inspect current sources and restage them.',true);}

  }
 };
 const load=async()=>{model.error=null;try{await refresh();}catch(e){model.error=e.message;}};
 const run=async(fn)=>{if(model.busy)return;const priorVersion=model.selected?.version;model.busy=true;model.error=null;model.notice='';try{await fn();await refresh();if(model.selected?.version!==priorVersion)model.dirtyDrafts=false;if(!model.notice&&model.selected?.version!==priorVersion&&priorVersion!==undefined)notify('Saved against production version '+model.selected.version+'.');}catch(e){model.error=e.message;notify(e.message,true);}finally{model.busy=false;}};
 // Private file/passphrase remain in this controller closure only between the
 // explicit verify and restore clicks; no storage, DOM echo or model projection.
 let recoveryInput=null;
 const drafts=new Map();
 const disclosures=new Map();
 const disclosureKey=()=>JSON.stringify([model.recoverySpace,model.selected?.workspace.id??'create',model.workflowStage,model.focusDocumentId,model.sceneView]);
 const draftKey=id=>JSON.stringify([model.recoverySpace,model.selected?.workspace.id??'create',model.selected?.version??0,model.activeSceneId,model.selectedTask,model.selectedCondition,id.startsWith('project-coordinator')?model.coordinatorReviewId:null,/^project-(authority|link|scene-auth|pdf|permit|doc-)/.test(id)?model.focusDocumentId:null,id.startsWith('project-scene-auth')?model.focusUnitId:null,id]);
 const editable=()=>[...(root.querySelectorAll?.('input[id],textarea[id],select[id]')??[])].filter(el=>
  !['project-scene-auth-scene','project-scene-auth-doc','project-scene-auth-unit'].includes(el.id)&&!['password','file','button','submit'].includes(el.type)&&!el.closest?.('.workflow-pane-hidden'));
 const captureDrafts=()=>{model.recoveryExpanded=query('project-recovery-panel')?.open??false;disclosures.set(disclosureKey(),{known:new Set([...(root.querySelectorAll?.('details[id]')??[])].map(x=>x.id)),open:new Set([...(root.querySelectorAll?.('details[id]')??[])].filter(x=>x.open).map(x=>x.id))});for(const el of editable())drafts.set(draftKey(el.id),{value:el.value,checked:el.checked});};
 const restoreDrafts=()=>{
  const restore=()=>{for(const el of editable()){
   const d=drafts.get(draftKey(el.id));if(!d)continue;
   if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===d.value))continue;
   el.value=d.value;if(el.type==='checkbox')el.checked=d.checked;
  }};
  restore();syncLinkUnits();syncConditionUnits();restore();
  if(model.scopeChoiceReset){for(const id of ['project-scene-auth-kind','project-scene-auth-attested']){const el=query(id);if(el){if(el.type==='checkbox')el.checked=false;else el.value='';drafts.set(draftKey(id),{value:el.value,checked:el.checked});}}model.scopeChoiceReset=false;}

  const prior=disclosures.get(disclosureKey());if(prior)for(const el of root.querySelectorAll?.('details[id]')??[])if(prior.known.has(el.id))el.open=prior.open.has(el.id);
 };
 async function readRecovery(){
  const file=query('project-recovery-file')?.files?.[0],passphrase=query('project-recovery-passphrase')?.value??'';
  if(!file||file.size<20||file.size>90*1024*1024)throw Error('Choose an encrypted backup JSON file of 20 bytes to 90 MiB');
  if(!passphrase)throw Error('Enter the backup passphrase');
  return {backup:JSON.parse(await file.text()),passphrase};
 }
 function reviewedPermitInput(){
  if(query('project-permit-use-transcription')?.checked!==true)return undefined;
  if(query('project-permit-complete')?.checked!==true)throw Error('Confirm you checked the original permit against all transcribed sections');
  const raw=value('project-permit-sections').replace(/\r\n?/g,'\n'),chunks=[],lines=raw.split('\n');
  let active=null;
  for(const line of lines){const m=/^\[(Page\s+\d{1,5}|Section\s+[\w.\- ]{1,90}|Paragraph\s+\d{1,5}|Table\s+\d{1,5})\]\s*$/i.exec(line);
   if(m){if(active)chunks.push(active);active={reference:m[1].trim(),text:''};continue;}
   if(!active){if(line.trim())throw Error('Transcription text must begin with a [Page N], [Section N] or [Table N] header');continue;}
   active.text+=(active.text?'\n':'')+line;
  }
  if(active)chunks.push(active);
  const expected=Number(value('project-permit-section-count'));
  if(!Number.isSafeInteger(expected)||expected<1||expected>250||expected!==chunks.length)throw Error('Declared original section count must match every entered [Page/Section/Table] block');
  return {sections:chunks,reviewer:value('project-permit-reviewer'),reason:value('project-permit-review-reason'),attestedComplete:true};
 }
 async function importFile(kind,{previewed=false}={}){
  if(!model.selected)throw Error('Select a production first');
  const pending=previewed?model.pendingSource:null;
  if(previewed&&(!pending||pending.kind!==kind||pending.projectId!==model.selected.workspace.id||pending.version!==model.selected.version))throw Error('Preview is stale: reselect original file and preview again');
  const input=query(kind==='permit'?'project-permit-file':'project-call-file');const file=previewed?pending.file:input?.files?.[0];if(!file)throw Error('Select a file to import');
  if(file.size<1||file.size>(kind==='permit'&&['.docx','.pdf'].some(ext=>file.name.toLowerCase().endsWith(ext))?8*1024*1024:128*1024))throw Error('File too large for safe local intake');
  const bytes=new Uint8Array(await file.arrayBuffer());const blocks=[];for(let i=0;i<bytes.length;i+=8192)blocks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));const binary=blocks.join('');
  const documentId=kind==='permit'?(previewed?pending.documentId:value('project-doc-id')):null;
  const reviewedTranscription=kind==='permit'?(previewed?pending.reviewedTranscription:reviewedPermitInput()):undefined;
  if(kind==='permit'&&!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(documentId))throw Error('Use a stable alphanumeric document ID');
  if(!previewed&&(kind==='callSheet'&&model.selected.workspace.callSheet||kind==='permit'&&model.selected.workspace.documents.some(d=>d.id===documentId)))throw Error('Replacing an existing original requires PREVIEW first, then IMPORT EXACT PREVIEWED FILE');
  await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/${previewed?'commit-source-change':'import'}`,{expectedVersion:model.selected.version,documentId,file:{name:file.name,kind,text:undefined,contentBase64:btoa(binary),...(reviewedTranscription?{reviewedTranscription}:{})},...(previewed?{previewSha256:model.impactPreview?.previewSha256}:{})});
  model.impactPreview=null;model.pendingSource=null;model.actionOffset=0;
  model.offset=0;model.selectedTask=null;
 }
 async function importReviewedCallSheet(){
  if(!model.selected)throw Error('Select a production');
  const file=query('project-manual-call-file')?.files?.[0];
  if(!file||!(/\.(?:pdf|docx)$/i).test(file.name)||file.size<1||file.size>8*1024*1024)throw Error('Choose an original PDF or supported DOCX (max 8 MiB)');
  const reviewer=value('project-manual-call-reviewer'),reason=value('project-manual-call-reason'),count=Number(value('project-manual-call-count'));
  const attestedComplete=query('project-manual-call-attest')?.checked===true;
  if(!reviewer||!reason||!attestedComplete)throw Error('Named reviewer, reason, and affirmative original comparison are required');
  const rows=value('project-manual-call-rows').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map((s,index)=>{
   const parts=s.split('|').map(x=>x.trim());if(parts.length!==6)throw Error(`Row ${index+1} needs six pipe-separated fields ending with an original page or table reference`);
   const [number,location,start,end,activity,reference]=parts;return {number,location,start,end,activity,reference};
  });
  if(rows.length!==count||!Number.isInteger(count)||count<1||count>600)throw Error('All scene rows must match the count checked against the original');
  const bytes=new Uint8Array(await file.arrayBuffer()),parts=[];
  for(let i=0;i<bytes.length;i+=8192)parts.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
  const payload={expectedVersion:model.selected.version,file:{name:file.name,contentBase64:btoa(parts.join(''))},
   transcription:{rows,reviewer,reason,expectedSceneCount:count,attestedComplete:true}};
  if(model.selected.workspace.callSheet){
   model.impactPreview=await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/impact`,payload);
   model.pendingSource={kind:'reviewedCallSheet',payload,projectId:model.selected.workspace.id,version:model.selected.version};
   model.workflowStage='changes';notify('Replacement transcription previewed. Inspect the impact, then commit the exact verified file.');return;
  }
  await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/call-sheet-transcript`,payload);
  model.impactPreview=null;model.pendingSource=null;model.offset=0;model.selectedTask=null;model.actionOffset=0;
 }
 async function previewFileImpact(kind){
  if(!model.selected)throw Error('Select a production');
  const input=query(kind==='permit'?'project-permit-file':'project-call-file'),file=input?.files?.[0];if(!file)throw Error('Select a source file first');
  if(file.size<1||file.size>(kind==='permit'&&['.docx','.pdf'].some(ext=>file.name.toLowerCase().endsWith(ext))?8*1024*1024:128*1024))throw Error('File too large for source preview');
  const bytes=new Uint8Array(await file.arrayBuffer()),blocks=[];
  for(let i=0;i<bytes.length;i+=8192)blocks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
  const documentId=kind==='permit'?value('project-doc-id'):null;
  const reviewedTranscription=kind==='permit'?reviewedPermitInput():undefined;
  const payload={expectedVersion:model.selected.version,documentId,file:{name:file.name,kind,contentBase64:btoa(blocks.join('')),...(reviewedTranscription?{reviewedTranscription}:{})}};
  model.impactPreview=await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/impact`,payload);
  model.pendingSource={kind,file,documentId,reviewedTranscription,projectId:model.selected.workspace.id,version:model.selected.version};
 }
 const stageReview=(fromScene)=>{
  if(!model.selected)throw Error('Select a production');
  const button=query(fromScene?'project-scene-review-stage':'project-review-stage');
  const evidenceId=button?.dataset.taskId;
  const record=fromScene?model.sceneWorkbench?.tasks.find(t=>t.id===evidenceId):model.overview?.tasks.find(t=>t.id===evidenceId);
  if(!record)throw Error('This exact source task has changed; reload first');
  const reviewer=value(fromScene?'project-scene-reviewer':'project-reviewer');
  const reason=value(fromScene?'project-scene-reason':'project-reason');
  const decision=value(fromScene?'project-scene-decision':'project-decision');
  if(!reviewer||!reason)throw Error('Enter a distinct source-specific reviewer and rationale for this task');
  const row={evidenceId,decision,reviewer,reason,sceneId:record.sceneId,documentId:record.documentId,unitId:record.unitId,quote:record.quote??record.sourceQuote};
  const existing=model.stagedReviews.findIndex(x=>x.evidenceId===evidenceId);
  if(existing<0&&model.stagedReviews.length>=64)throw Error('Review sessions are limited to 64 source decisions');
  if(existing<0)model.stagedReviews.push(row);else model.stagedReviews[existing]=row;
  model.stagingVersion=model.selected.version;model.reviewSessionPreview=null;
  notify('Review staged. Verify its exact source before committing the session.');
 };
 const boundDossierQuery=()=>{
  if(!model.selected||!model.dossier?.sha256||!model.dossier?.asOf)throw Error('Inspect the current production evidence before exporting');
  return `?asOf=${encodeURIComponent(model.dossier.asOf)}&expectedVersion=${model.selected.version}&expectedDossierSha256=${encodeURIComponent(model.dossier.sha256)}`;
 };
 const reviewEdits=()=>model.stagedReviews.map(({evidenceId,decision,reviewer,reason})=>({evidenceId,decision,reviewer,reason}));
 const actions={
  'project-discovery-preview':async()=>{
   if(!model.selected)throw Error('Select a production');
   const picked=attribute=>[...(root.querySelectorAll?.('['+attribute+']')??[])].filter(x=>x.checked).map(x=>x.getAttribute(attribute));
   const input={expectedVersion:model.selected.version,documentIds:picked('data-discovery-document'),sceneIds:picked('data-discovery-scene'),verifiedBy:value('project-discovery-verifier'),sourceConfirmed:query('project-discovery-source-confirmed')?.checked===true,includeDocumentary:query('project-discovery-documentary')?.checked===true,
    maxCalls:Number(value('project-discovery-cap')),creditReservePerCall:Number(value('project-discovery-reserve')),creditBudget:Number(value('project-discovery-budget'))};
   model.discoveryPreview=await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/discovery/preview`,input);model.discoveryInput=input;
  },
  'project-discovery-run':async()=>{
   if(!model.discoveryPreview||!model.discoveryInput||model.discoveryInput.expectedVersion!==model.selected?.version)throw Error('Preview the current production first');
   if(query('project-discovery-billing')?.checked!==true)throw Error('Explicit bounded billing acknowledgement required');
   const token=value('project-discovery-token');if(!token)throw Error('Enter the separate local operator token');
   const r=await fetchImpl(`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/discovery/run`,{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify({...model.discoveryInput,previewSha256:model.discoveryPreview.previewSha256,confirm:'RUN_CORE_DISCOVERY',acceptBillingUncertainty:true})});
   const body=await r.json();if(!r.ok)throw Error(body.error??'Discovery did not start');model.discoveryPreview=null;model.discoveryInput=null;notify('Bounded discovery started. Refresh status to inspect progress. Stop prevents the next dispatch; an in-flight request may finish.');
  },
  'project-discovery-refresh':async()=>{},
  'project-discovery-export':async()=>{
   const evidence=await api('GET',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/discovery/evidence`);
   const url=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`BEFOREROLL_${model.selected.workspace.id}_DISCOVERY_EVIDENCE.json`;a.click();URL.revokeObjectURL(url);
  },
  'project-coordinator-save':async()=>{
   if(model.stagedReviews.length)throw Error('Commit or remove staged source reviews before recording a separate suggestion review');
   const candidate=model.coordinatorTasks?.candidates.find(c=>c.id===model.coordinatorReviewId);
   if(!candidate)throw Error('Select a current source-grounded suggestion');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/review-coordinator-suggestion`,{
    expectedVersion:model.selected.version,candidateId:candidate.id,sceneId:candidate.sceneId,reviewer:value('project-coordinator-reviewer'),reason:value('project-coordinator-reason'),attestedReview:query('project-coordinator-attested')?.checked===true});
   model.coordinatorReviewId=null;notify('Suggestion review saved. Fulfillment and documentary authority remain unverified.');
  },
  'project-coordinator-dismiss':async()=>{model.coordinatorReviewId=null;notify('Review form closed. Draft kept in this browser session; no decision saved.');},
  'project-diagnostics':async()=>{if(!model.selected)throw Error('Select a production');model.diagnostics=await api('GET',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/diagnostics`);},
  'project-history-filter':async()=>{model.historyOffset=0;model.historyKind=value('project-history-kind')||'ALL';model.historyState=value('project-history-state')||'ALL';model.historySearch=value('project-history-search');model.historySelected=null;},
  'project-history-prev':async()=>{model.historyOffset=Math.max(0,model.historyOffset-20);},
  'project-history-next':async()=>{if(model.history?.pagination.hasMore)model.historyOffset+=20;},
  'project-recovery-verify':async()=>{
   recoveryInput=null;model.recoveryPreview=null;
   const input={...await readRecovery(),destination:'separate'};
   model.recoveryPreview=await api('POST','/api/workspaces/recovery/verify',input);
   if(model.recoveryPreview.canRestore)recoveryInput=input;
   if(query('project-recovery-passphrase'))query('project-recovery-passphrase').value='';
  },
  'project-recovery-restore':async()=>{
   if(!recoveryInput||!model.recoveryPreview?.canRestore)throw Error('Verify an encrypted backup first');
   const confirmId=value('project-recovery-id');
   if(confirmId!==model.recoveryPreview.workspaceId)throw Error('Type the exact verified production ID');
   const input=recoveryInput;recoveryInput=null;
   const restored=await api('POST','/api/workspaces/recovery/restore',{...input,confirmId,previewSha256:model.recoveryPreview.backupSha256});
   model.recoverySpace=restored.recoverySpace??'';
   model.recoveryPreview=null;selectProduction(await api('GET','/api/workspaces/'+encodeURIComponent(restored.workspaceId)),'evidence');
   notify('Production recovered with original evidence and non-retryable billing history. No Clocked requests made.');
  },
  'project-review-stage':()=>stageReview(false),
  'project-scene-review-stage':()=>stageReview(true),
  'project-review-session-preview':async()=>{
   if(!model.selected||!model.stagedReviews.length||model.stagingVersion!==model.selected.version)throw Error('Stage current source tasks before preview');
   const id=encodeURIComponent(model.selected.workspace.id);
   model.reviewSessionPreview=await api('POST',`/api/workspaces/${id}/review-session/preview`,{expectedVersion:model.selected.version,edits:reviewEdits()});
  },
  'project-review-session-commit':async()=>{
   const v=model.reviewSessionPreview;
   if(!model.selected||!v||model.stagingVersion!==model.selected.version)throw Error('Verify the current review session first');
   const id=encodeURIComponent(model.selected.workspace.id);
   const output=await api('POST',`/api/workspaces/${id}/review-session/commit`,{expectedVersion:v.expectedVersion,asOf:v.asOf,edits:reviewEdits(),previewSha256:v.sha256});
   model.stagedReviews=[];model.reviewSessionPreview=null;model.stagingVersion=null;
   notify(`${output.applied} human source decision${output.applied===1?'':'s'} recorded in one versioned transaction. No filming clearance.`);
  },
  'project-impact-permit':()=>previewFileImpact('permit'),
  'project-impact-call':()=>previewFileImpact('callSheet'),
  'project-impact-commit':async()=>{
   const pending=model.pendingSource;if(!pending)throw Error('No verified preview available');
   if(pending.kind==='reviewedCallSheet'){
    if(pending.projectId!==model.selected?.workspace.id||pending.version!==model.selected.version)throw Error('Preview is stale; compare the original and preview again');
    await api('POST',`/api/workspaces/${encodeURIComponent(pending.projectId)}/commit-source-change`,{...pending.payload,previewSha256:model.impactPreview?.previewSha256});
    model.pendingSource=null;model.impactPreview=null;model.offset=0;model.actionOffset=0;model.selectedTask=null;
   }else await importFile(pending.kind,{previewed:true});
   model.sourceMode='reader';model.workflowStage='sources';
   notify('Source replacement committed. Affected checks and reviews need renewed attention; unchanged evidence is retained.');
  },
  'project-action-apply':async()=>{model.actionKind=value('project-action-filter')||'ALL';model.actionOffset=0;},
  'project-action-prev':async()=>{model.actionOffset=Math.max(0,model.actionOffset-30);},
  'project-action-next':async()=>{if(model.actionQueue?.pagination?.hasMore)model.actionOffset+=30;},
  'project-create':async()=>{if(model.stagedReviews.length)throw Error('Commit or remove staged reviews before creating another production.');const id=value('project-id'),title=value('project-title');if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(id)||!title)throw Error('Enter a valid production ID and title');const priorSpace=model.recoverySpace;model.recoverySpace='';try{const created=await api('POST','/api/workspaces',{id,title});selectProduction({version:created.version,workspace:created.workspace});model.sourceMode='import';model.workflowStage='sources';}catch(e){model.recoverySpace=priorSpace;throw e;}},
  'project-reload':async()=>{model.offset=0;model.selectedTask=null;},
  'project-refresh-plan':async()=>{model.offset=0;model.selectedTask=null;},
  'project-authority-save':async()=>{
   if(!model.selected)throw Error('Select a production first');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/authority-document`,{
    expectedVersion:model.selected.version,documentId:value('project-authority-document'),role:value('project-authority-role'),
    reference:value('project-authority-reference'),issuer:value('project-authority-issuer'),issuedOn:value('project-authority-date')||null,
    reviewer:value('project-authority-reviewer'),reason:value('project-authority-reason')});
  },
  'project-link-save':async()=>{
   if(!model.selected)throw Error('Select a production first');
   if(!value('project-link-from')||!value('project-link-to')||value('project-link-from')===value('project-link-to')||!value('project-link-kind')||!value('project-link-unit'))throw Error('Choose two different source documents, an original quotation and an explicit relationship.');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/authority-link`,{
    expectedVersion:model.selected.version,fromId:value('project-link-from'),toId:value('project-link-to'),
    unitId:value('project-link-unit'),kind:value('project-link-kind'),reviewer:value('project-link-reviewer'),reason:value('project-link-reason')});
  },
  'project-pdf-confirm':async()=>{
   if(!model.selected)throw Error('Select a production');const documentId=value('project-pdf-document');
   const d=model.selected.workspace.documents.find(x=>x.id===documentId);
   if(!d?.importReceipt?.requiresHumanTextReview||d.pdfTranscriptionReview)throw Error('Select a PDF awaiting original text review');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/pdf-transcription`,{
    expectedVersion:model.selected.version,documentId,reviewer:value('project-pdf-reviewer'),reason:value('project-pdf-reason'),
    rawHash:d.importReceipt.rawHash,normalizedHash:d.sourceHash});
  },
  'project-scene-auth-save':async()=>{
   if(!model.selected)throw Error('Select production before recording source-scene claim');
   if(model.focusDocumentId&&value('project-scene-auth-doc')!==model.focusDocumentId||model.focusUnitId&&value('project-scene-auth-unit')!==model.focusUnitId||model.activeSceneId&&value('project-scene-auth-scene')!==model.activeSceneId)throw Error('The source selectors no longer match the visible review context. Reselect the original before saving.');
   if(!value('project-scene-auth-kind'))throw Error('Choose your interpretation of this exact source before saving.');
   const sourceAffirmation=query('project-scene-auth-attested');if(sourceAffirmation?.type==='checkbox'&&sourceAffirmation.checked!==true)throw Error('Confirm that you checked the exact scene and original quotation.');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/scene-authority`,{
    expectedVersion:model.selected.version,sceneId:value('project-scene-auth-scene'),documentId:value('project-scene-auth-doc'),unitId:value('project-scene-auth-unit'),
    kind:value('project-scene-auth-kind'),scope:value('project-scene-auth-scope'),reviewer:value('project-scene-auth-reviewer'),reason:value('project-scene-auth-reason'),
    ...(value('project-scene-auth-issuance')?{applicability:{activity:value('project-scene-auth-activity')||null,location:value('project-scene-auth-location')||null,
      validFrom:value('project-scene-auth-from')||null,validThrough:value('project-scene-auth-through')||null,
      issuance:value('project-scene-auth-issuance'),prerequisiteMode:value('project-scene-auth-prerequisite'),
      relatedRestrictionIds:value('project-scene-auth-related')?[value('project-scene-auth-related')]:[],
      conditionIds:value('project-scene-auth-condition')?[value('project-scene-auth-condition')]:[]}}:{} )});
  },
  'project-op-save':async()=>{
   if(!model.selected)throw Error('Select production');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/scene-schedule`,{expectedVersion:model.selected.version,
    sceneId:value('project-op-scene'),date:value('project-op-date'),timeZone:value('project-op-zone'),endsNextDay:value('project-op-overnight')==='true',
    reviewer:value('project-op-reviewer'),reason:value('project-op-reason')});
  },
  'project-condition-save':async()=>{
   if(!model.selected)throw Error('Select production');const documentId=value('project-condition-document')||null;
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/condition`,{expectedVersion:model.selected.version,
    sceneId:value('project-condition-scene'),title:value('project-condition-title'),documentId,unitId:documentId?value('project-condition-unit'):null,
    dueLocal:value('project-condition-due')||null,reviewer:value('project-condition-reviewer'),reason:value('project-condition-reason')});
  },
  'project-condition-decide':async()=>{
   if(!model.selected||!model.selectedCondition)throw Error('Select a condition REVIEW PREREQUISITE button first');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/condition-decision`,{expectedVersion:model.selected.version,
    conditionId:model.selectedCondition,decision:value('project-condition-decision'),reviewer:value('project-condition-decision-reviewer'),reason:value('project-condition-decision-reason')});
  },
  'project-original-relink':async()=>{
   if(!model.selected)throw Error('Select a production');
   const file=query('project-original-relink-file')?.files?.[0],rawHash=value('project-original-missing');
   if(!file||!rawHash)throw Error('Choose the missing original SHA-256 and its exact original file');
   if(file.size<1||file.size>8*1024*1024)throw Error('Original file is outside the 8 MiB owner archive limit');
   const bytes=new Uint8Array(await file.arrayBuffer()),chunks=[];
   for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
   const result=await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/originals/relink`,{
    expectedVersion:model.selected.version,rawHash,file:{contentBase64:btoa(chunks.join(''))}});
   notify(`Original file reconnected after exact SHA-256 check (${result.byteCount} bytes). Workspace unchanged, no Clocked request.`);
  },
  'project-lifecycle-backup':async()=>{
   if(!model.selected)throw Error('Select a production');const id=model.selected.workspace.id;
   const passphrase=query('project-backup-passphrase')?.value??'';
   if(passphrase.length<14)throw Error('Enter a unique backup passphrase (at least 14 characters). Losing it makes the backup unrecoverable.');
   const backup=await api('POST',`/api/workspaces/${encodeURIComponent(id)}/lifecycle/backup-encrypted`,{expectedVersion:model.selected.version,passphrase});
   const blob=new Blob([JSON.stringify(backup)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=`BEFOREROLL_${id}_ENCRYPTED_OWNER_BACKUP.json`;a.click();URL.revokeObjectURL(url);
   if(query('project-backup-passphrase'))query('project-backup-passphrase').value='';
   notify('Encrypted owner lifecycle backup exported. Keep the passphrase separately; without it recovery is impossible.');
  },
  'project-dossier-json':async()=>{
   if(!model.selected)throw Error('Select production');const id=model.selected.workspace.id;
   const data=await api('GET',`/api/workspaces/${encodeURIComponent(id)}/dossier/complete${boundDossierQuery()}`);
   const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=`BEFOREROLL_${id}_INTEGRATED_EVIDENCE.json`;a.click();URL.revokeObjectURL(url);
  },
  'project-dossier-markdown':async()=>{
   if(!model.selected)throw Error('Select production');const id=model.selected.workspace.id;
   const response=await fetchImpl(`/api/workspaces/${encodeURIComponent(id)}/dossier/markdown${boundDossierQuery()}`,{cache:'no-store'});
   if(!response.ok){const body=await response.json();throw Error(body.error||'Markdown export failed');}
   const blob=new Blob([await response.text()],{type:'text/markdown'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=`BEFOREROLL_${id}_INTEGRATED_REVIEW.md`;a.click();URL.revokeObjectURL(url);
  },
  'project-operations-export':async()=>{
   if(!model.selected)throw Error('Select production');const id=model.selected.workspace.id;
   const report=await api('GET',`/api/workspaces/${encodeURIComponent(id)}/operations/export`);
   const blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=`BEFOREROLL_${id}_OPERATIONAL_REGISTER.json`;a.click();URL.revokeObjectURL(url);
  },
  'project-scene-task-prev':async()=>{model.sceneTaskOffset=Math.max(0,model.sceneTaskOffset-40);model.selectedTask=null;},
  'project-scene-task-next':async()=>{if(model.sceneWorkbench?.taskPagination?.hasMore)model.sceneTaskOffset+=40;model.selectedTask=null;},
  'project-scene-action-prev':async()=>{model.sceneActionOffset=Math.max(0,model.sceneActionOffset-30);},
  'project-scene-action-next':async()=>{if(model.sceneWorkbench?.actions?.pagination?.hasMore)model.sceneActionOffset+=30;},
  'project-import-permit':()=>importFile('permit'),
  'project-import-call':()=>importFile('callSheet'),
  'project-manual-call-preview':async()=>{
   if(!model.selected)throw Error('Select a production');
   const file=query('project-manual-call-file')?.files?.[0];
   if(!file||!/\.(?:pdf|docx)$/i.test(file.name)||file.size<1||file.size>8*1024*1024)throw Error('Choose an original PDF/DOCX to preview');
   const bytes=new Uint8Array(await file.arrayBuffer()),chunks=[];
   for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
   model.documentPreview=await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/document-preview`,{
    expectedVersion:model.selected.version,file:{name:file.name,contentBase64:btoa(chunks.join(''))}});
   notify('Read-only original text draft loaded. It is NOT a verified call sheet; compare every row to the original.');
  },
  'project-manual-call-submit':importReviewedCallSheet,
  'project-prev-page':async()=>{model.offset=Math.max(0,model.offset-40);model.selectedTask=null;},
  'project-next-page':async()=>{if(!model.overview?.pagination?.hasMore)return;model.offset+=40;model.selectedTask=null;},
  'project-export-model':async()=>{
   if(!model.selected||!model.execution?.attempts)throw Error('No project model evidence yet');
   const id=model.selected.workspace.id;
   const evidence=await api('GET',`/api/workspaces/${encodeURIComponent(id)}/execution/export`);
   const blob=new Blob([JSON.stringify(evidence,null,2)+'\n'],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`BEFOREROLL_${id}_SOURCE_BOUND_EVIDENCE.json`;a.click();URL.revokeObjectURL(url);
  },
  'project-run-clocked':async()=>{
   if(!model.selected)throw Error('Select a production');const token=value('project-operator-token');if(!token)throw Error('Enter the separate local operator token');
   const maxCalls=Number(value('project-call-limit'));if(!Number.isSafeInteger(maxCalls)||maxCalls<1||maxCalls>256)throw Error('Use 1-256 requests per owner-authorized run');
   const uri=`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/execution`;
   let remaining=maxCalls,attempted=0,result=null;
   // Exactly one owner click authorizes at most maxCalls new attempts. Each server
   // invocation is capped at 32; a network failure ends the session immediately.
   // No page reload/restoration can restart this browser-level authorization.
   while(remaining>0){
    const r=await fetchImpl(uri,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify({confirm:'RUN_PROJECT_CLOCKED',maxCalls:Math.min(32,remaining)})});
    result=await r.json();if(!r.ok)throw Error(`Owner session stopped after ${attempted} attempts. Inspect journal before another run: ${result.error||`HTTP ${r.status}`}`);
    attempted+=result.executed;remaining-=result.executed;
    notify(`Current owner session: ${attempted}/${maxCalls} new attempts; ${result.completed}/${result.planned} recorded. No automatic retries.`);
    if(result.executed===0||result.state!=='RUNNING'&&result.state!=='READY'||result.unknownBilling||result.completed===result.planned)break;
   }
   notify(`Owner session ended: ${attempted} attempts, ${result?.completed??0}/${result?.planned??0} completed. Original journal retained.`);
  },
  'project-scene-review-save':async()=>{
   if(!model.selected)throw Error('Select production');
   const evidenceId=query('project-scene-review-save')?.dataset.taskId;
   if(!model.sceneWorkbench?.tasks.some(t=>t.id===evidenceId&&t.sceneId===model.activeSceneId))throw Error('Source task is no longer in this scene packet');
   const reviewer=value('project-scene-reviewer'),reason=value('project-scene-reason'),decision=value('project-scene-decision');
   if(!reviewer||!reason)throw Error('Reviewer and exact source rationale are required');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/review-task`,{expectedVersion:model.selected.version,evidenceId,decision,reviewer,reason});
  },
  'project-save-review':async()=>{if(!model.selected)throw Error('No active project');const evidenceId=query('project-save-review')?.dataset.taskId;
   const reviewer=value('project-reviewer'),reason=value('project-reason'),decision=value('project-decision');
   if(!reviewer||!reason)throw Error('Reviewer and evidence reason are required');
   await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/review-task`,{expectedVersion:model.selected.version,evidenceId,decision,reviewer,reason});}
 };
 const click=async(el)=>{
  captureDrafts();
  if(el.dataset.discoveryStop){await run(async()=>{await api('POST',`/api/workspaces/${encodeURIComponent(model.selected.workspace.id)}/discovery/stop`,{planId:el.dataset.discoveryStop});notify('Stop requested. No automatic retry; inspect final status after the in-flight request finishes.');});return true;}
  if(el.dataset.coordinatorSource||el.dataset.coordinatorReview){
   const id=el.dataset.coordinatorSource??el.dataset.coordinatorReview;
   const item=[...(model.coordinatorTasks?.candidates??[]),...(model.coordinatorTasks?.warnings??[])].find(c=>c.id===id);
   const document=model.selected?.workspace.documents.find(d=>d.id===item?.documentId);
   if(!item||document?.sourceHash!==item.permitSha256)throw Error('The suggestion source has changed; reload current evidence');
   if(el.dataset.coordinatorReview){model.coordinatorReviewId=id;return true;}
   model.activeSceneId=item.sceneId;model.sourceReturnSceneId=item.sceneId;model.focusDocumentId=item.documentId;model.focusUnitId=item.unitId;
   model.workflowStage='sources';model.sourceMode='reader';return true;
  }
  if(el.dataset.compareReviewScene){
   const scenes=model.overview?.scenes??[],documents=model.overview?.documents??[];
   const sceneIndex=scenes.findIndex(s=>s.id===el.dataset.compareReviewScene),docIndex=documents.findIndex(d=>d.id===el.dataset.compareDocument);
   const doc=documents[docIndex],unitIndex=doc?.units.findIndex(u=>u.id===el.dataset.compareUnit)??-1;
   if(sceneIndex<0||docIndex<0||unitIndex<0||doc.sourceHash!==el.dataset.compareHash)throw Error('The compared source has changed. Inspect the current original before reviewing.');
   const version=model.selected.version,local=documents.slice(0,docIndex).reduce((n,d)=>n+d.units.length,0)+unitIndex;
   model.activeSceneId=scenes[sceneIndex].id;model.sceneTaskOffset=Math.floor(local/40)*40;model.sceneActionOffset=0;
   await load();if(model.error||model.selected.version!==version)throw Error(model.error??'The production changed. Inspect the exact comparison again.');
   const task=model.sceneWorkbench?.tasks.find(t=>t.sceneId===el.dataset.compareReviewScene&&t.documentId===doc.id&&t.unitId===el.dataset.compareUnit&&t.documentHash===doc.sourceHash);
   if(!task)throw Error('This passage has no current source task. Verify source coverage before review.');
   // Use the server's actual global coordinate, not a second client planner.
   const offset=Math.floor(task.globalTaskIndex/40)*40;
   if(model.offset!==offset){model.offset=offset;await load();if(model.error||model.selected.version!==version)throw Error(model.error??'The production changed while opening this source. Inspect it again.');}
   model.selectedTask=task.id;model.workflowStage='review';model.sceneView='review';return true;
  }
  if(el.dataset.designAction){const action=el.dataset.designAction;model.error=null;model.notice='';
   if(action==='picker')model.pickerOpen=!model.pickerOpen;
   if(action==='close-picker')model.pickerOpen=false;
   if(action==='recover'){if(model.stagedReviews.length){model.error='Commit or remove staged reviews before entering recovery.';return true;}model.recoveryView=true;model.recoveryExpanded=true;model.pickerOpen=false;}
   if(action==='session'){model.workflowStage='review';model.sceneView='session';model.recoveryView=false;}
   if(action==='investigation'){model.workflowStage='review';model.sceneView='investigation';}
   if(action==='return-to-coordinator-scene'){model.activeSceneId=model.sourceReturnSceneId;model.workflowStage='review';model.sceneView='investigation';model.sourceReturnSceneId=null;await load();}
   if(action==='comparison'){model.selectedTask=selectedSceneTask(model)?.id??null;model.sceneView='comparison';}
   if(action==='scene-search')model.sceneSearchOpen=!model.sceneSearchOpen;
   if(action==='scene-prev')model.sceneRegisterOffset=Math.max(0,model.sceneRegisterOffset-20);
   if(action==='scene-next')model.sceneRegisterOffset+=20;
   if(action==='import'){model.sourceMode='import';model.intakeKind='permit';}
   if(action==='close-reader'||action==='close-intake'){model.sourceMode='register';model.workflowStage='sources';}
   if(action==='revise-call'){model.workflowStage='changes';model.sourceMode='revise';model.intakeKind='call';}
   if(action==='source-reader'){const t=selectedSceneTask(model);model.focusDocumentId=t?.documentId??null;model.focusUnitId=t?.unitId??null;model.sourceReturnSceneId=t?.sceneId??null;model.workflowStage='sources';model.sourceMode='reader';}
   return true;
  }
  if(el.dataset.designDocument){model.focusDocumentId=el.dataset.designDocument;model.focusUnitId=null;model.sourceReturnSceneId=null;model.sourceMode=el.dataset.sourceMode;model.intakeKind='permit';model.workflowStage=model.sourceMode==='revise'?'changes':'sources';return true;}
  if(el.dataset.historyKind){model.historyKind=el.dataset.historyKind;model.historyState='ALL';model.historySearch='';model.historySelected=null;model.historyOffset=0;model.workflowStage='history';await load();return true;}
  if(el.dataset.historySelect){model.historySelected=el.dataset.historySelect;await load();return true;}
  if(el.dataset.workflowOpen){if(!workflowStages.has(el.dataset.workflowOpen))throw Error('Unknown workflow step');if(!model.selected&&el.dataset.workflowOpen!=='overview'){model.pickerOpen=true;model.notice='Choose a production to open its scenes, work and evidence.';return true;}model.workflowStage=el.dataset.workflowOpen;model.recoveryView=false;if(model.workflowStage==='review')model.sceneView='investigation';if(model.workflowStage==='changes'){model.sourceMode='revise';model.intakeKind='permit';}model.error=null;model.notice='';return true;}
  if(el.dataset.workflowAction){
   const stage=stageForRoute[el.dataset.workflowAction];if(!stage)throw Error('Unknown evidence action destination');
   model.workflowStage=stage;
   model.recoveryView=false;if(stage==='review')model.sceneView='review';
   if(el.dataset.actionScene&&model.overview?.scenes?.some(s=>s.id===el.dataset.actionScene)){
    model.activeSceneId=el.dataset.actionScene;model.sceneTaskOffset=0;model.sceneActionOffset=0;
   }
   model.selectedCondition=el.dataset.actionCondition||null;
   model.focusDocumentId=model.selected?.workspace?.documents?.some(d=>d.id===el.dataset.actionDocument)?el.dataset.actionDocument:null;model.focusUnitId=el.dataset.actionUnit||null;
   if(el.dataset.actionTask){
    const global=Number(el.dataset.actionGlobal),local=Number(el.dataset.actionLocal);
    const known=model.actionQueue?.actions?.find(a=>a.taskId===el.dataset.actionTask&&
     a.sceneId===el.dataset.actionScene&&a.globalTaskIndex===global&&a.sceneTaskIndex===local);
    if(!known||!Number.isSafeInteger(global)||global<0||global>=50000||!Number.isSafeInteger(local)||local<0||local>=50000)
     throw Error('The source review pointer has changed; reload the current action queue');
    model.offset=Math.floor(global/40)*40;
    model.sceneTaskOffset=Math.floor(local/40)*40;
    model.selectedTask=el.dataset.actionTask;
   } else model.selectedTask=null;
   await load();return true;
  }
  if(el.dataset.unstageTask){model.stagedReviews=model.stagedReviews.filter(r=>r.evidenceId!==el.dataset.unstageTask);model.reviewSessionPreview=null;return true;}
  if(el.dataset.sceneFocus){model.activeSceneId=el.dataset.sceneFocus;model.sceneTaskOffset=0;model.sceneActionOffset=0;model.selectedTask=null;model.sceneView='investigation';model.workflowStage='review';model.sceneSearchOpen=false;model.compareLeftDocument=null;model.compareRightDocument=null;model.compareLeftUnit=null;model.compareRightUnit=null;model.error=null;await load();return true;}
  if(el.dataset.sceneOpenTask){
   const index=Number(el.dataset.taskPosition),localIndex=Number(el.dataset.sceneTaskPosition);
   if(!Number.isSafeInteger(index)||index<0||index>=50000||!Number.isSafeInteger(localIndex)||localIndex<0||localIndex>=50000)throw Error('Scene task pointer invalid');
   const match=model.sceneWorkbench?.tasks?.find(t=>t.id===el.dataset.sceneOpenTask&&t.globalTaskIndex===index&&t.sceneTaskIndex===localIndex)||
    model.sceneWorkbench?.actions?.actions?.find(t=>t.taskId===el.dataset.sceneOpenTask&&t.globalTaskIndex===index&&t.sceneTaskIndex===localIndex);
   if(!match)throw Error('Source task pointer is no longer in this verified scene packet');
   model.offset=Math.floor(index/40)*40;model.sceneTaskOffset=Math.floor(localIndex/40)*40;model.selectedTask=el.dataset.sceneOpenTask;model.workflowStage='review';model.sceneView=el.dataset.sceneView??'investigation';model.error=null;await load();return true;
  }
  if(el.dataset.conditionId){model.selectedCondition=el.dataset.conditionId;model.workflowStage='operations';notify('Selected source-bound condition for human review.');return true;}
  if(el.dataset.projectTask){model.selectedTask=el.dataset.projectTask;return true;}
  if(el.dataset.projectOpen){if(model.stagedReviews.length){model.error='Uncommitted review session: commit the verified decisions or remove the staged items before opening another production.';notify(model.error,true);return true;}await run(async()=>{model.recoverySpace=el.dataset.projectSpace||'';selectProduction(await api('GET','/api/workspaces/'+encodeURIComponent(el.dataset.projectOpen)));});return true;}
  if(el.id==='owner-access-lock'){if(model.stagedReviews.length)throw Error('Commit or remove staged source reviews before locking this session.');await api('POST','/api/owner/lock',{});model.authLocked=true;model.selected=null;model.items=[];return true;}
  if(el.id==='owner-access-unlock'){
   await run(async()=>{
    const token=value('owner-access-input');if(!token)throw Error('Paste the local owner token from your terminal');
    await api('POST','/api/owner/unlock',{token});model.authLocked=false;model.selected=null;model.items=[];
   });return true;
  }
  const name=el.id;if(!actions[name])return false;await run(actions[name]);if(name==='project-scene-review-stage'||name==='project-review-stage'){if(!model.error)model.sceneView='session';}if(name==='project-review-session-commit'&&!model.error){model.workflowStage='history';model.historyKind='REVIEWS';model.historyOffset=0;await load();}return true;
 };
 const sourceUnitsFor=id=>model.overview?.documents?.find(d=>d.id===id)?.units??[];
 const syncLinkUnits=()=>{
  const target=query('project-link-unit');if(!target)return;
  const from=value('project-link-from');const to=query('project-link-to');if(to){const prior=to.value;to.replaceChildren(...[null,...model.overview.documents.filter(d=>d.id!==from)].map(d=>{const o=document.createElement('option');o.value=d?.id??'';o.textContent=d?d.name+' / '+d.id:'Choose a different document';o.selected=o.value===prior&&o.value!==from;return o;}));if(prior===from)to.value='';}const units=sourceUnitsFor(from);
  target.replaceChildren(...units.map(u=>{const option=document.createElement('option');option.value=u.id;option.textContent=`${u.id} · ${u.text.slice(0,60)}`;return option;}));
 };
 const syncConditionUnits=()=>{
  const target=query('project-condition-unit');if(!target)return;
  const units=sourceUnitsFor(value('project-condition-document'));
  target.replaceChildren(...[...units.map(u=>{const o=document.createElement('option');o.value=u.id;o.textContent=`${u.id} · ${u.text.slice(0,70)}`;return o;})]);
 };
 const syncSceneUnits=()=>{
  const target=query('project-scene-auth-unit');if(!target)return;
  const units=sourceUnitsFor(value('project-scene-auth-doc'));
  target.replaceChildren(...units.map(u=>{const option=document.createElement('option');option.value=u.id;option.textContent=`${u.id} · ${u.text.slice(0,70)}`;option.selected=model.focusDocumentId===value('project-scene-auth-doc')&&u.id===model.focusUnitId;return option;}));
 };
 const markDraftChange=el=>{if(el?.id?.startsWith('project-')&&!['password','file','button','submit'].includes(el.type))model.dirtyDrafts=true;};
 const hasUncommittedWork=()=>Boolean(model.dirtyDrafts||model.stagedReviews.length||model.pendingSource);
 const resetSessionDrafts=()=>{drafts.clear();disclosures.clear();model.stagedReviews=[];model.reviewSessionPreview=null;model.coordinatorReviewId=null;model.dirtyDrafts=false;};
 return {model,load,click,resetSessionDrafts,selectProduction,syncLinkUnits,syncSceneUnits,syncConditionUnits,captureDrafts,restoreDrafts,markDraftChange,hasUncommittedWork,render:()=>productionView(model)};
}
