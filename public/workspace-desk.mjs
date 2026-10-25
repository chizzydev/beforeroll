/** M3-S24: one continuous production workflow, retaining the accepted source-bound controls.
 * Project -> original source files -> scenes -> exact source-backed planning -> human review.
 * This module never calls a model and never retains an API key.
 */
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const workflowStages=new Set(['sources','scope','analysis','review','operations','changes','evidence']);
const pane=(stages,active)=>stages.split(' ').includes(active)?'': ' workflow-pane-hidden';
const stageForRoute={sources:'sources',authority:'scope','scene-authority':'scope',review:'review',execution:'analysis',operations:'operations',history:'changes',changes:'changes',evidence:'evidence'};
function journeyNav(journey,active,locked){
 if(!journey)return '<p class="production-error">Workflow progress unavailable. Reload to inspect the current source inventory.</p>';
 return `<nav class="production-journey" aria-label="Production workflow steps"><div class="production-journey-head"><div><span class="kicker">ONE CONTINUOUS WORKSPACE</span><h3>Production workflow</h3><p>Every step reads the same current source and review history. Select a step to work; outstanding means review work remains, not a permission decision.</p></div><button type="button" data-workflow-open="${esc(journey.suggestedStage)}" class="ghost" ${locked}>OPEN SUGGESTED NEXT STEP ↗</button></div><div class="production-journey-steps">${journey.checkpoints.map(x=>`<button type="button" data-workflow-open="${esc(x.id)}" aria-current="${x.id===active?'step':'false'}" class="production-journey-step ${x.id===active?'selected':''}" ${locked}><span class="production-step-number">${esc(x.number)}</span><span class="production-step-text"><b>${esc(x.title)}</b><small>${esc(x.status)} · ${esc(x.summary)}</small></span></button>`).join('')}</div></nav>`;
}

export function productionView(model){
 if(model.authLocked)return `<main class="production-shell" aria-label="Private owner access"><section class="production-box owner-unlock-panel"><span class="kicker">PRIVATE LOCAL PRODUCTION DATA</span><h1>Unlock BeforeRoll</h1><p>Your production records, original permits, call sheets and exported evidence require the separate local owner token (from your private .env configuration or generated at startup). It is not your Clocked API key.</p><label for="owner-access-input">LOCAL OWNER ACCESS TOKEN</label><input id="owner-access-input" type="password" autocomplete="off" spellcheck="false" placeholder="Local owner token, never the Clocked key"><button type="button" id="owner-access-unlock" class="button-main">UNLOCK PRIVATE WORKSPACE</button>${model.error?`<p class="production-error" role="alert">${esc(model.error)}</p>`:''}<p class="production-hint">Only accessible directly from this computer's localhost browser. Session ends when server restarts or after four hours.</p></section></main>`;
 if(!workflowStages.has(model.workflowStage))model={...model,workflowStage:'sources'};
 const {items=[],selected=null,originals=null,overview=null,execution=null,authority=null,sceneAuthority=null,operations=null,dossier=null,actionQueue=null,impactPreview=null,journey=null,consistency=null,liveEnabled=false,selectedTask=null,busy=false,error=null}=model;
 const locked=busy?'disabled':'';
 const current=selected?.workspace??null;
 const page=overview?.pagination;
 const task=overview?.tasks?.find(x=>x.id===selectedTask)??overview?.tasks?.[0]??null;
 const tasks=overview?.tasks??[];
 const sceneRows=overview?.scenes??[];
 const focusId=sceneRows.some(s=>s.id===model.activeSceneId)?model.activeSceneId:(sceneRows[0]?.id??null);
 const scenePacket=model.sceneWorkbench?.scene?.sceneId===focusId?model.sceneWorkbench:null;
 const focusTasks=scenePacket?.tasks??[];
 const focusActions=scenePacket?.actions?.actions??[];
 const currentSceneTask=focusTasks.find(t=>t.id===selectedTask)??null;
 const execEntries=new Map((execution?.entries||[]).map(e=>[e.id,e]));
 const currentEntry=task?execEntries.get(task.id):null;
 const staged=model.stagedReviews??[];
 const stagedPreview=model.reviewSessionPreview??null;
 return `<main class="production-shell" aria-label="Production workspace">
  <header class="production-intro"><span class="kicker">${model.evaluationMode?'EVALUATION WORKSPACE / FICTIONAL DATA':'PROJECT WORKSPACE / PRIVATE OWNER DATA'}</span><h1>One production. One source of truth.</h1><p>Import original documents, inspect the schedule, plan exact source-to-scene checks, then record human decisions. No AI response is manufactured here.</p></header>
  ${error?`<div class="production-error" role="alert">${esc(error)}</div>`:''}
  <div class="production-grid"><aside class="production-sidebar"><section class="production-box"><h2>Productions</h2><div class="production-list">${items.length?items.map(x=>`<button type="button" data-project-open="${esc(x.id)}" class="production-list-item ${current?.id===x.id?'active':''}" ${locked}><strong>${esc(x.title)}</strong><small>${esc(x.id)} · ${x.documentCount} documents · ${x.sceneCount} scenes · v${x.version}</small></button>`).join(''):'<p class="muted">Create the first production below.</p>'}</div>
  <form class="production-create"><label for="project-id">Project ID</label><input id="project-id" placeholder="studio_project" maxlength="80" autocomplete="off"><label for="project-title">Project name</label><input id="project-title" placeholder="Production title" maxlength="150"><button type="button" id="project-create" class="button-main" ${locked}>CREATE PRODUCTION</button></form></section></aside>
  <div class="production-main">${current?`<section class="production-box"><div class="production-heading"><div><span class="kicker">ACTIVE / VERSION ${selected.version}</span><h2>${esc(current.title)}</h2><p>Stored locally with version checks. Imported material is unverified until reviewed by a responsible person.</p></div><button type="button" id="project-reload" class="ghost" ${locked}>RELOAD</button></div>
  <div class="production-stats"><span>DOCS <strong>${current.documents.length}</strong></span><span>SCENES <strong>${current.callSheet?.scenes?.length??0}</strong></span><span>PLANNED SOURCE CHECKS <strong>${overview?.plannedCalls??'—'}</strong></span><span>MODEL ATTEMPTS <strong>${execution?.attempts??0}</strong></span></div>${journeyNav(journey,model.workflowStage,locked)}
   <div class="production-active-step"><span class="kicker">CURRENT STEP / ${esc(model.workflowStage.toUpperCase())}</span><p>${esc(journey?.checkpoints?.find(x=>x.id===model.workflowStage)?.description??'Select a production step to continue.')}</p>${(journey?.checkpoints?.find(x=>x.id===model.workflowStage)?.blockers??[]).map(x=>`<p class="production-hint">${esc(x)}</p>`).join('')}</div>
  <section class="production-box${pane('review',model.workflowStage)}" aria-label="Unified source-linked scene operator workbench"><h2>Scene operator workbench / source to action</h2>
  <p>Choose one scene to see its exact call-sheet row, source checks, model status, human claims, dated conditions and actionable next steps in one place. No permission is inferred.</p>
  ${sceneRows.length?`<div class="production-action-list">${sceneRows.map(sc=>`<button type="button" class="ghost" data-scene-focus="${esc(sc.id)}" ${locked} aria-pressed="${focusId===sc.id?'true':'false'}">${esc(sc.id)} · ${esc(sc.location)}</button>`).join('')}</div>`:'<p class="production-hint">Import a supported call sheet to begin the scene workflow.</p>'}
  ${scenePacket?`<div class="production-source"><span class="kicker">EXACT ORIGINAL CALL-SHEET ROW</span><h3>${esc(focusId)} · ${esc(scenePacket.sceneReviewState)}</h3><blockquote>${esc(scenePacket.scene.originalRow)}</blockquote><small>Workspace v${esc(scenePacket.persistedVersion)} · Dossier ${esc(scenePacket.dossierSha256)} · scene packet ${esc(scenePacket.sha256)}</small>
   <div class="production-stats"><span>CLOCKED <strong>${scenePacket.summary.completedModelChecks}/${scenePacket.summary.planned}</strong></span><span>HUMAN REVIEWS <strong>${scenePacket.summary.currentTaskReviews}</strong></span><span>CURRENT SCOPE CLAIMS <strong>${scenePacket.summary.currentScopeClaims}</strong></span><span>OPEN PREREQUISITES <strong>${scenePacket.summary.openPrerequisites}</strong></span><span>SCENE ACTIONS <strong>${scenePacket.summary.actionCount}</strong></span></div>
   <p><b>Outstanding:</b> ${scenePacket.scene.issues.length?scenePacket.scene.issues.map(esc).join(' · '):'No tracked issues (NOT filming clearance).'}</p>
   <details><summary>Exact permit documents and evidence coverage</summary>${scenePacket.documents.map(d=>`<div class="production-source"><strong>${esc(d.name)} (${esc(d.id)})</strong><p>Original SHA-256: ${esc(d.sourceSha256)} · scene checks ${d.evaluatedSceneChecks}/${d.plannedSceneChecks} · current human reviews ${d.reviewedSceneChecks}</p>${d.requiresPdfTextReview?'<p>PDF transcription verification required.</p>':''}</div>`).join('')}</details>
   <details><summary>Current and historical documentary scope / prerequisites</summary>${scenePacket.scopeClaims.map(x=>`<div class="production-source"><b>${esc(x.kind)} · ${esc(x.sourceState)}</b><p>${esc(x.documentId)} / ${esc(x.unitId)} · ${esc(x.scope)}</p><blockquote>${esc(x.quote)}</blockquote><small>${esc(x.reviewer)} · ${esc(x.reason)}</small></div>`).join('')||'<p>No source-scene claims recorded.</p>'}${scenePacket.documentaryLinks.map(x=>`<div class="production-source"><b>Document relation: ${esc(x.kind)} · ${esc(x.status)}</b><p>${esc(x.fromId)} → ${esc(x.toId)} · SOURCE-LEVEL CLAIM, NOT AUTOMATIC SCENE PERMISSION</p><blockquote>${esc(x.quote)}</blockquote></div>`).join('')}${scenePacket.conditions.map(x=>`<div class="production-source"><b>${esc(x.title)} · ${esc(x.sourceState)}</b><p>${esc(x.decision)} · deadline ${esc(x.deadlineState)}</p></div>`).join('')}</details>
   <section class="production-source" aria-label="Documentary authority interpretation"><h3>Documentary reasoning / human and Clocked evidence are separate</h3>
   <p><strong>${esc(scenePacket.documentaryReasoning?.state??'AWAITING SOURCE REVIEW')}</strong> · NOT VERIFIED FILMING AUTHORITY. A general consent cannot override a specific restriction.</p>
   ${(scenePacket.documentaryReasoning?.claims??[]).map(c=>`<div class="production-source"><b>${esc(c.kind)} / ${esc(c.assertionState)}</b><small>${esc(c.documentId)} · ${esc(c.documentRole??'ROLE NOT REVIEWED')} · ${esc(c.evidenceClass)}</small>
    <blockquote>${esc(c.quote)}</blockquote><p>Activity ${esc(c.applicable.activity)} · Location ${esc(c.applicable.location)} · Date ${esc(c.applicable.date)} · ${esc(c.applicable.state)}</p>
    <p>Source relation: ${esc(c.documentaryConnection)} · Prerequisites: ${esc(c.prerequisiteMode)} · ${c.linkedConditions.map(x=>esc(x.status)).join(', ')||'none linked'}</p><small>${c.modelHits.map(m=>esc('Clocked: '+m.code+' (unverified model score)')).join(' | ')||'NO RECORDED CLOCKED EVIDENCE'}</small></div>`).join('')||'<p>No scene-specific documentary assertions yet. No permission inferred.</p>'}
   ${(scenePacket.documentaryReasoning?.modelOnlyFindings??[]).map(m=>`<div class="production-source"><b>CLOCKED MODEL ONLY / NO HUMAN DOCUMENTARY SCOPE</b><p>${esc(m.documentId)} / ${esc(m.unitId)} · ${esc(m.code)}</p><small>Model output is not a source-authenticated approval.</small></div>`).join('')}
   <p class="production-hint">Signed or issued language is only a human-recorded document claim. BeforeRoll does not authenticate signatures, resolve legal priority, or confirm conditions fulfilled.</p></section>
   <h3>Scene findings and human review</h3><div class="production-action-list">${focusTasks.map(t=>`<div class="production-source"><small>${esc(t.documentId)} / ${esc(t.unitId)} · ${esc(t.evidenceClass)}</small><blockquote>${esc(t.quote)}</blockquote><p>${esc(t.model?.code??'NO RECORDED MODEL FINDING')} · human ${esc(t.currentHumanReview?.decision??'NOT REVIEWED')}</p><button type="button" class="ghost" data-scene-open-task="${esc(t.id)}" data-task-position="${t.globalTaskIndex}" data-scene-task-position="${t.sceneTaskIndex}" ${locked}>OPEN EXACT SOURCE REVIEW</button></div>`).join('')||'<p>No plan tasks for this scene yet.</p>'}</div>
   ${currentSceneTask?`<section class="production-task-detail" aria-label="Human scene workbench review"><span class="kicker">CURRENT EXACT SOURCE / HUMAN DECISION</span><h3>${esc(currentSceneTask.sceneId)} × ${esc(currentSceneTask.documentId)} × ${esc(currentSceneTask.unitId)}</h3><blockquote>${esc(currentSceneTask.quote)}</blockquote><p>Provider: ${esc(currentSceneTask.evidenceClass)} ${currentSceneTask.model?.code?'· '+esc(currentSceneTask.model.code):''} · source hash ${esc(currentSceneTask.documentHash)}</p><p>Prior human decision: ${esc(currentSceneTask.currentHumanReview?.decision??'NONE')} · ${esc(currentSceneTask.currentHumanReview?.reason??'Awaiting reviewer')}</p><label for="project-scene-reviewer">Reviewer</label><input id="project-scene-reviewer" maxlength="150" placeholder="Production coordinator"><label for="project-scene-decision">Human decision</label><select id="project-scene-decision"><option value="NEEDS_SOURCE">Needs original source</option><option value="ACKNOWLEDGED">Acknowledged for follow-up</option><option value="OPEN">Open for review</option><option value="RESOLVED_BY_HUMAN">Human-reviewed (not clearance)</option></select><label for="project-scene-reason">Rationale / required action</label><textarea id="project-scene-reason" maxlength="3000" placeholder="Describe the exact source and outstanding obligations"></textarea><button type="button" class="button-main" id="project-scene-review-save" data-task-id="${esc(currentSceneTask.id)}" ${locked}>SAVE SCENE SOURCE REVIEW</button> <button type="button" class="ghost" id="project-scene-review-stage" data-task-id="${esc(currentSceneTask.id)}" ${locked}>STAGE THIS INDIVIDUAL REVIEW</button></section>`:''}
   <section class="production-source" aria-label="Human review session / atomic apply"><h3>Review session / exact sources</h3>
   <p>Stage individually reasoned decisions across scenes and documents. Preview their exact original quotations, model states, prior human decisions and project version, then apply all valid changes atomically. This is not filming permission.</p>
   <div class="production-stats"><span>STAGED <strong>${staged.length}/64</strong></span><span>PREVIEW <strong>${stagedPreview?'VERIFIED AGAINST VERSION '+esc(stagedPreview.expectedVersion):'REQUIRED'}</strong></span></div>
   ${staged.map((r,i)=>`<div class="production-source"><small>${i+1}. ${esc(r.sceneId)} / ${esc(r.documentId)} / ${esc(r.unitId)} · ${esc(r.decision)} · ${esc(r.reviewer)}</small><blockquote>${esc(r.quote)}</blockquote><p>${esc(r.reason)}</p><button type="button" class="ghost" data-unstage-task="${esc(r.evidenceId)}" ${locked}>REMOVE STAGED ITEM</button></div>`).join('')}
   ${stagedPreview?`<p><b>Preview SHA-256:</b> ${esc(stagedPreview.sha256)}. New ${stagedPreview.summary.newReviews}, updated ${stagedPreview.summary.updatedReviews}, unchanged ${stagedPreview.summary.unchanged}, still requiring follow-up ${stagedPreview.summary.needsFollowUp}.</p>`:''}
   <button type="button" id="project-review-session-preview" class="ghost" ${!staged.length||busy?'disabled':''}>VERIFY STAGED SOURCE REVIEWS</button>
   <button type="button" id="project-review-session-commit" class="button-main" ${!stagedPreview||busy?'disabled':''}>COMMIT VERIFIED REVIEW SESSION</button>
   </section>
   <nav class="production-pages"><button type="button" class="ghost" id="project-scene-task-prev" ${scenePacket.taskPagination.offset===0||busy?'disabled':''}>PREVIOUS SCENE FINDINGS</button><span>${focusTasks.length?scenePacket.taskPagination.offset+1:0}–${scenePacket.taskPagination.offset+focusTasks.length} / ${scenePacket.taskPagination.total}</span><button type="button" class="ghost" id="project-scene-task-next" ${!scenePacket.taskPagination.hasMore||busy?'disabled':''}>NEXT SCENE FINDINGS</button></nav>
   <h3>Next scene actions / from original evidence</h3>${focusActions.map(a=>`<div class="production-source"><small>${esc(a.category)} · ${esc(a.code)}</small><b>${esc(a.subject)}</b><p>${esc(a.detail)}</p>${a.globalTaskIndex!==null?`<button type="button" class="ghost" data-scene-open-task="${esc(a.taskId)}" data-task-position="${a.globalTaskIndex}" data-scene-task-position="${a.sceneTaskIndex}" ${locked}>OPEN SOURCE-BOUND TASK</button>`:''}</div>`).join('')||'<p>No current scene-specific actions. This is NOT clearance.</p>'}
   <nav class="production-pages"><button type="button" class="ghost" id="project-scene-action-prev" ${scenePacket.actions.pagination.offset===0||busy?'disabled':''}>PREVIOUS SCENE ACTIONS</button><span>${focusActions.length?scenePacket.actions.pagination.offset+1:0}–${scenePacket.actions.pagination.offset+focusActions.length} / ${scenePacket.actions.filteredTotal}</span><button type="button" class="ghost" id="project-scene-action-next" ${!scenePacket.actions.pagination.hasMore||busy?'disabled':''}>NEXT SCENE ACTIONS</button></nav>
   <p class="production-hint">Model findings are source-bound aids. Human reviews and scene evidence are not clearance.</p></div>`:focusId?'<p class="production-hint">Scene evidence is not yet loaded; reload the production.</p>':''}
  </section>
  <section class="production-box${pane('evidence',model.workflowStage)}" aria-label="Unified production evidence status"><h2>Integrated source-to-scene review status</h2>
  <p>One read-only evidence inventory joins imported documents, the call sheet, dated scenes, documentary relationships, Clocked model records, and human work. A recorded review is never filming clearance.</p>
  <div class="production-stats"><span>MODEL CHECKS <strong>${dossier?.counts?.completedModelChecks??0}/${dossier?.counts?.planTasks??0}</strong></span><span>HUMAN REVIEWS <strong>${dossier?.counts?.currentReviewedTasks??0}</strong></span><span>UNRESOLVED ITEMS <strong>${dossier?.outstanding?.length??'—'}</strong></span></div>
  ${consistency?`<p class="production-hint"><b>Internal evidence reconciliation: ${esc(consistency.state)}</b><br>Workspace v${esc(consistency.persistedVersion)} · current model ${esc(consistency.currentEvidence.modelComplete)} · current human reviews ${esc(consistency.currentEvidence.humanReviewed)} · historical human reviews ${esc(consistency.historicalEvidence.humanReviews)} · archive runs ${esc(consistency.historicalEvidence.archivedModelRuns)}. This checks recorded data consistency, NOT authenticity, completeness or filming permission.</p>`:'<p class="production-error">No internal production consistency certificate has been loaded.</p>'}
  ${dossier?.outstanding?.length?`<ul>${dossier.outstanding.map(x=>`<li><b>${esc(x.code)}</b>: ${esc(x.detail??x.count)}</li>`).join('')}</ul>`:'<p>Review-register items not reported. This does NOT establish filming permission.</p>'}
  ${dossier?.scenes?.length?`<details><summary>Per-scene integrated review states</summary>${dossier.scenes.map(x=>`<p><b>${esc(x.sceneId)}</b> · ${esc(x.readiness)} · model ${x.modelComplete}/${x.planned} · human ${x.humanReviewed}/${x.planned} · ${x.issues.map(esc).join('; ')}</p>`).join('')}</details>`:''}
  <div class="production-source"><b>Exact original uploads retained locally</b><p>${originals?`${originals.preserved}/${originals.referenced} byte-identical originals currently available`: 'No source archive inventory loaded'}. ${originals?.missingOriginalSha256?.length?'Some earlier imports predate original-file retention; keep those files separately.':''}</p>
  ${originals?.files?.length?`<details><summary>Download exact original permit / call-sheet files</summary>${originals.files.map(f=>`<p><a href="/api/workspaces/${encodeURIComponent(current.id)}/originals/${esc(f.rawHash)}" download>${esc(f.rawHash.slice(0,14))}... · ${esc(f.byteCount)} original bytes</a></p>`).join('')}</details>`:''}
  ${originals?.missingOriginalSha256?.length?`<label for="project-original-missing">Reconnect legacy exact original without altering the model evidence</label><select id="project-original-missing">${originals.missingOriginalSha256.map(h=>`<option value="${esc(h)}">${esc(h.slice(0,18))}...</option>`).join('')}</select><input type="file" id="project-original-relink-file" accept=".pdf,.docx,.txt,.md,.csv,.json"><button type="button" id="project-original-relink" class="ghost" ${locked}>RESTORE MATCHING ORIGINAL FILE BY SHA-256</button>`:''}</div>
  <label for="project-backup-passphrase">Backup encryption passphrase (14+ characters; never stored)</label><input type="password" autocomplete="new-password" id="project-backup-passphrase" placeholder="Protect original files and Clocked evidence"><button type="button" class="ghost" id="project-lifecycle-backup" ${locked}>EXPORT PRIVATE LIFECYCLE BACKUP (ENCRYPTED)</button> <button type="button" class="ghost" id="project-dossier-json" ${locked}>EXPORT COMPLETE EVIDENCE PACK (JSON)</button> <button type="button" class="ghost" id="project-dossier-markdown" ${locked}>EXPORT HUMAN-READABLE REVIEW (MARKDOWN)</button></section>
  <section class="production-box${pane('review',model.workflowStage)}" aria-label="Source-bound production action queue"><h2>Current production work / prioritized</h2>
  <p>One current action queue, derived from the same original sources, Clocked journal and human decisions as the evidence dossier. These are outstanding tasks, NOT filming permission.</p>
  <div class="production-stats"><span>ALL <strong>${actionQueue?.total??'—'}</strong></span><span>SOURCE <strong>${actionQueue?.byCategory?.SOURCE??0}</strong></span><span>PROVIDER <strong>${actionQueue?.byCategory?.EXECUTION??0}</strong></span><span>HUMAN <strong>${actionQueue?.byCategory?.HUMAN??0}</strong></span><span>OPERATIONS <strong>${actionQueue?.byCategory?.OPERATIONS??0}</strong></span></div>
  <label for="project-action-filter">Review actions by owner</label><select id="project-action-filter"><option value="ALL" ${model.actionKind==='ALL'?'selected':''}>All current actions</option><option value="SOURCE" ${model.actionKind==='SOURCE'?'selected':''}>Sources and imports</option><option value="EXECUTION" ${model.actionKind==='EXECUTION'?'selected':''}>Clocked execution</option><option value="HUMAN" ${model.actionKind==='HUMAN'?'selected':''}>Human documentary review</option><option value="OPERATIONS" ${model.actionKind==='OPERATIONS'?'selected':''}>Operational prerequisites</option><option value="HISTORY" ${model.actionKind==='HISTORY'?'selected':''}>Historical changes</option></select>
  <button type="button" class="ghost" id="project-action-apply" ${locked}>SHOW SELECTED ACTIONS</button>
  <div class="production-action-list">${actionQueue?.actions?.length?actionQueue.actions.map(a=>`<div class="production-source"><small>${esc(a.category)} · ${esc(a.code)} · ${a.sceneId?esc(a.sceneId):'PRODUCTION'} ${a.documentId?'· '+esc(a.documentId):''}</small><p><b>${esc(a.subject)}</b></p><p>${esc(a.detail)}</p>${a.sourceQuote?`<blockquote>${esc(a.sourceQuote)}</blockquote>`:''}${a.taskId?`<small>Exact source-bound task ${esc(a.taskId)}</small>`:''}<button type="button" class="ghost" data-workflow-action="${esc(a.route??'review')}" data-action-scene="${esc(a.sceneId??'')}" data-action-task="${esc(a.taskId??'')}" data-action-global="${a.globalTaskIndex??''}" data-action-local="${a.sceneTaskIndex??''}" data-action-condition="${esc(a.conditionId??'')}" data-action-document="${esc(a.documentId??'')}" ${locked}>OPEN IN WORKFLOW ↗</button></div>`).join(''):'<p class="muted">No actions in this filter. This does not establish filming permission.</p>'}</div>
  <nav class="production-pages"><button type="button" class="ghost" id="project-action-prev" ${!actionQueue?.pagination?.offset||busy?'disabled':''}>PREVIOUS ACTIONS</button><span>${actionQueue?`${actionQueue.filteredTotal?`${actionQueue.pagination.offset+1}–${actionQueue.pagination.offset+actionQueue.actions.length}`:'0'} / ${actionQueue.filteredTotal}`:'—'}</span><button type="button" class="ghost" id="project-action-next" ${!actionQueue?.pagination?.hasMore||busy?'disabled':''}>NEXT ACTIONS</button></nav></section>
  <section class="production-box${pane('sources changes',model.workflowStage)}" aria-label="Source intake and guarded revisions"><div class="${pane('changes',model.workflowStage).trim()}"><h2>Source change preview / read-only</h2><p>Before replacing a permit or call sheet, inspect the number of current source-to-scene checks and reviews the change would retire. Preview never edits the stored project or contacts Clocked.</p>
  <button type="button" class="ghost" id="project-impact-permit" ${locked}>PREVIEW SELECTED PERMIT UPDATE</button> <button type="button" class="ghost" id="project-impact-call" ${locked}>PREVIEW SELECTED CALL SHEET UPDATE</button>
  ${impactPreview?`<div class="production-source"><b>${esc(impactPreview.requested.fileName)}</b><p>Changed: ${esc(impactPreview.changed?'YES':'NO')} · version ${esc(impactPreview.persistedVersion)}</p><p>Before: ${esc(impactPreview.before.planTasks??'blocked')} checks · After: ${esc(impactPreview.after.planTasks??'blocked')} checks</p><p>Source-bound checks retained ${esc(impactPreview.tasks?.retained??'unknown')}, retired ${esc(impactPreview.tasks?.retired??'unknown')}, added ${esc(impactPreview.tasks?.added??'unknown')}.</p><p>Current human review records retained ${esc(impactPreview.after.remainingCurrentHumanReviewRecords??'unknown')}; archived human review history is preserved.</p><p><b>Reconciliation across the whole production:</b> new scenes ${esc(impactPreview.reconciliation?.scenes?.added?.join(', ')||'none')}; removed scenes ${esc(impactPreview.reconciliation?.scenes?.removed?.join(', ')||'none')}; retired reviewed model tasks ${esc(impactPreview.reconciliation?.exactModelTasks?.retiredReviewed??'unknown')}.</p><p>Document relationships needing renewed human attention ${esc(impactPreview.reconciliation?.documentaryLinks?.becomingHistorical??0)}; scene authority assertions becoming historical ${esc(impactPreview.reconciliation?.sceneAuthorityClaims?.becomingHistorical??0)}; scene dates needing reconfirmation ${esc(impactPreview.reconciliation?.schedules?.requireReconfirmation?.join(', ')||'none')}; operational prerequisites becoming historical ${esc(impactPreview.reconciliation?.prerequisites?.becomingHistorical??0)}.</p><p>Exact original source fingerprint ${esc(impactPreview.requested.originalFileSha256)} · Preview fingerprint ${esc(impactPreview.previewSha256??'unavailable')}</p><p class="production-hint">PREVIEW ONLY. Import requires an explicit second action, and changes after this preview invalidate the preview.</p><button type="button" class="button-main" id="project-impact-commit" ${locked}>IMPORT EXACT PREVIEWED FILE (COMMIT CHANGE)</button></div>`:''}</div>
  <div class="production-source-grid"><div><h3>01 / Original documents</h3>${overview?.documents?.length?overview.documents.map(d=>`<div class="production-source"><b>${esc(d.name)}</b><small>${esc(d.id)} · rev ${d.revision} · ${d.unitCount} source units · ${esc(d.sourceFormat)} · ${d.gaps} coverage gaps</small><code>SHA-256 ${esc(d.sourceHash)}</code>${d.pdfTranscription?`<small>PDF transcription: ${esc(d.pdfTranscription)}. Original-file byte SHA-256: ${esc(d.rawSourceHash)}.</small>`:''}${current.documents.find(x=>x.id===d.id)?.importReceipt?.reviewedPermitAttestation?`<small>OWNER-TRANSCRIBED ORIGINAL · ${esc(current.documents.find(x=>x.id===d.id).importReceipt.reviewedPermitAttestation.reviewer)} · ${esc(current.documents.find(x=>x.id===d.id).importReceipt.reviewedPermitAttestation.sections.length)} original page/section locators · NOT INDEPENDENTLY VERIFIED.</small>`:''}<details><summary>Read original segmented text</summary>${d.units.map(u=>`<div class="production-unit"><b>${esc(u.id)} [${u.start},${u.end})</b><p>${esc(u.text)}</p></div>`).join('')}</details></div>`).join(''):'<p class="muted">No permit documents imported yet.</p>'}
  <h3>Import permit or amendment</h3><label for="project-doc-id">Stable document ID (same ID revises its source)</label><input id="project-doc-id" placeholder="permit_01" maxlength="80"><label for="project-permit-file">Original constrained .pdf / .docx / UTF-8 .txt / .md / typed .json</label><input type="file" id="project-permit-file" accept=".pdf,.docx,.txt,.md,.json">
  <details><summary>PDF scan / unusual DOCX / text correction: import reviewed transcription of this EXACT original</summary>
   <p class="production-hint">Use only with the PDF/DOCX selected above. If automatic extraction fails or omits source material, open the actual original separately. Record every relevant section with its original page/section reference. No OCR, model guessing or independent verification occurs.</p>
   <label><input type="checkbox" id="project-permit-use-transcription"> Use my human-reviewed original transcription instead of automatic extraction</label>
   <label for="project-permit-sections">Sections: a [Page 1], [Section 3] or [Table 2] header on its own line, followed by exact visible source text (including short restrictions)</label>
   <textarea id="project-permit-sections" rows="8" placeholder="[Page 1]&#10;Permit authorizes exterior filming only.&#10;No drones.&#10;&#10;[Page 2]&#10;Amendment application is pending."></textarea>
   <label for="project-permit-section-count">Number of original sections transcribed and compared</label><input type="number" id="project-permit-section-count" min="1" max="250">
   <label for="project-permit-reviewer">Human reviewer</label><input id="project-permit-reviewer" maxlength="150">
   <label for="project-permit-review-reason">How every section and omission was checked against the original</label><textarea id="project-permit-review-reason" maxlength="2000"></textarea>
   <label><input type="checkbox" id="project-permit-complete"> I personally compared the full original and attest that the transcript covers its review-relevant source text; I understand this is NOT independent verification.</label>
   <p class="production-hint">You can correct a previously imported transcription using the normal PREVIEW SOURCE UPDATE and exact COMMIT SOURCE CHANGE controls. The original file hash is preserved; changed normalized text retires affected current analysis.</p>
  </details><button type="button" id="project-import-permit" class="button-main" ${locked}>IMPORT PERMIT SOURCE</button></div>
  <div><h3>02 / Call sheet</h3>${current?.callSheet?.importReceipt?.reviewedAttestation?`<p class="production-hint">HUMAN-TRANSCRIBED FROM ORIGINAL ${esc(current.callSheet.importReceipt.reviewedAttestation.sourceFormat)} · ${esc(current.callSheet.importReceipt.reviewedAttestation.sceneCount)} scene rows · ${esc(current.callSheet.importReceipt.reviewedAttestation.reviewer)}. Exact original retained, typed rows NOT independently verified.</p>`:''}${overview?.scenes?.length?`<ol class="production-scenes">${overview.scenes.map(s=>`<li><b>Scene ${esc(s.number)} · ${esc(s.location)}</b><span>${esc(s.start)}–${esc(s.end)} · ${esc(s.activity)}</span><small>MODEL: ${esc(s.ai)} · Scene source ID ${esc(s.id)}</small></li>`).join('')}</ol>`:'<p class="muted">No accepted scene rows imported yet.</p>'}
  ${overview?.documents?.some(d=>d.pdfTranscription==='REQUIRES_HUMAN_TRANSCRIPTION_REVIEW')?`<div class="production-error">PDF transcription review required: compare the displayed reconstructed source text with the original visible PDF before any Clocked analysis. Unsupported layout and scanned PDFs are rejected.</div>
  <h3>Verify PDF text transcription</h3><label for="project-pdf-document">PDF document</label><select id="project-pdf-document">${overview.documents.filter(d=>d.pdfTranscription==='REQUIRES_HUMAN_TRANSCRIPTION_REVIEW').map(d=>`<option value="${esc(d.id)}" ${model.focusDocumentId===d.id?'selected':''}>${esc(d.name)} (${esc(d.id)})</option>`).join('')}</select><label for="project-pdf-reviewer">Reviewer</label><input id="project-pdf-reviewer" maxlength="150"><label for="project-pdf-reason">What you compared against original pages</label><textarea id="project-pdf-reason" maxlength="2000"></textarea><button type="button" id="project-pdf-confirm" class="button-main" ${locked}>CONFIRM RECONSTRUCTED TEXT MATCHES ORIGINAL PDF</button>`:''}
  <h3>Transcribe an original PDF/DOCX call sheet</h3><p class="production-hint">For photographed, scanned or layout-heavy call sheets: open the original separately and transcribe EVERY scene into this structured register. BeforeRoll preserves exact original bytes, but does not independently verify your transcription. No AI/OCR scene guesses.</p>
   <label for="project-manual-call-file">Exact original PDF or supported DOCX</label><input type="file" id="project-manual-call-file" accept=".pdf,.docx">
   <button type="button" id="project-manual-call-preview" class="ghost" ${locked}>PREVIEW TEXT FROM ORIGINAL (DRAFT ONLY)</button>
   ${model.documentPreview?`<div class="production-source"><b>${esc(model.documentPreview.state)} · NOT A VERIFIED CALL SHEET</b><p>Original SHA-256: ${esc(model.documentPreview.originalRawSha256)} · ${esc(model.documentPreview.sourceFormat??'No supported text layer')}</p>${model.documentPreview.reason?`<p>${esc(model.documentPreview.reason)}</p>`:''}<p>Structured row suggestions: ${model.documentPreview.sceneRowSuggestions.length}; check for missing rows before transcription.</p><details><summary>Inspect extracted text against original (NOT OCR)</summary><pre class="production-hint">${esc(model.documentPreview.extractedText??'No reliable text layer. Transcribe manually from the original file.')}</pre></details>${model.documentPreview.sceneRowSuggestions.length?`<details><summary>Provisional scene rows (copy, edit, verify ALL rows)</summary><pre class="production-hint">${esc(model.documentPreview.sceneRowSuggestions.map(r=>[r.number,r.location,r.start,r.end,r.activity,r.reference].join(' | ')).join('\n'))}</pre></details>`:''}</div>`:''}
   <label for="project-manual-call-rows">One scene per line: scene number | location | HH:MM start | HH:MM end | activity | original page/table reference</label><textarea id="project-manual-call-rows" rows="5" placeholder="31 | Archive floor | 10:00 | 11:30 | Rolling camera carriage | Page 2"></textarea>
   <label for="project-manual-call-count">Total scene rows checked against original</label><input type="number" id="project-manual-call-count" min="1" max="600" placeholder="Count all scenes in original">
   <label for="project-manual-call-reviewer">Person who checked the original</label><input id="project-manual-call-reviewer" maxlength="150" placeholder="Reviewer name">
   <label for="project-manual-call-reason">How you checked completeness and accuracy</label><textarea id="project-manual-call-reason" maxlength="2000" placeholder="Compared each original page and each scene entry against this transcription."></textarea>
   <label class="production-hint"><input id="project-manual-call-attest" type="checkbox"> I compared all scene rows against the original file and accept responsibility for this transcription.</label>
   <button type="button" id="project-manual-call-submit" class="button-main" ${locked}>IMPORT REVIEWED ORIGINAL CALL SHEET</button>
   <h3>Import call sheet</h3><label for="project-call-file">RFC-4180 CSV / typed JSON / pipe-delimited text</label><input type="file" id="project-call-file" accept=".csv,.json,.txt,.md"><button type="button" id="project-import-call" class="button-main" ${locked}>IMPORT CALL SHEET</button><p class="production-hint">Unstructured PDF/DOCX call sheets need an explicit human-transcribed scene register above. CSV, JSON and text remain directly importable. No documentary transcription creates filming clearance.</p></div></div></section>
  <section class="production-box${pane('scope',model.workflowStage)}" aria-label="Document authority relationships"><h2>03 / Documentary authority and precedence review</h2><p>Identify original permits, signed amendments, unissued requests and disputed sources. All relationships are recorded as human assertions, never automatically effective approvals.</p>
   <div class="production-stats"><span>LINKS <strong>${authority?.summary?.links??0}</strong></span><span>STALE <strong>${authority?.summary?.staleLinks??0}</strong></span><span>CONFLICTS <strong>${authority?.summary?.unresolvedConflicts??0}</strong></span><span>UNREVIEWED DOCUMENTS <strong>${authority?.summary?.unreviewedDocuments?.length??0}</strong></span></div>
   ${authority?.documents?.length?`<div class="production-authority-list">${authority.documents.map(d=>`<p><b>${esc(d.id)}</b> · ${esc(d.metadata?.role??'ROLE NOT RECORDED')} · ${esc(d.metadata?.reference??'No authority reference recorded')} · ${esc(d.metadataStatus)}</p>`).join('')}</div>
   <div class="production-source-grid"><div><h3>Record documentary provenance</h3><label for="project-authority-document">Source document</label><select id="project-authority-document">${authority.documents.map(d=>`<option value="${esc(d.id)}" ${model.focusDocumentId===d.id?'selected':''}>${esc(d.name)} (${esc(d.id)})</option>`).join('')}</select>
   <label for="project-authority-role">Document role</label><select id="project-authority-role"><option>PERMIT</option><option>AMENDMENT</option><option>REQUEST</option><option>POLICY</option><option>CONDITION</option><option>OTHER</option></select>
   <label for="project-authority-reference">Reference as given by reviewer</label><input id="project-authority-reference" maxlength="200" placeholder="Example: permit 18B"><label for="project-authority-issuer">Claimed issuing party (unverified)</label><input id="project-authority-issuer" maxlength="200" placeholder="Source name"><label for="project-authority-date">Issued date (optional)</label><input id="project-authority-date" type="date"><label for="project-authority-reviewer">Reviewer</label><input id="project-authority-reviewer" maxlength="150"><label for="project-authority-reason">Source/provenance note</label><textarea id="project-authority-reason" maxlength="2000"></textarea><button type="button" id="project-authority-save" class="button-main" ${locked}>SAVE DOCUMENT PROVENANCE</button></div>
   <div><h3>Connect two documents</h3><label for="project-link-from">Quoted original source</label><select id="project-link-from">${authority.documents.map(d=>`<option value="${esc(d.id)}">${esc(d.id)}</option>`).join('')}</select><label for="project-link-unit">Original quotation unit</label><select id="project-link-unit">${overview?.documents?.[0]?.units?.map(u=>`<option value="${esc(u.id)}">${esc(u.id)} · ${esc(u.text.slice(0,60))}</option>`).join('')??''}</select><p class="production-hint">Quotation units refresh when the source document selection changes.</p>
    <label for="project-link-to">Referenced document</label><select id="project-link-to">${authority.documents.map(d=>`<option value="${esc(d.id)}">${esc(d.id)}</option>`).join('')}</select>
    <label for="project-link-kind">Relationship claimed</label><select id="project-link-kind"><option>AMENDS</option><option>SUPERSEDES</option><option>REFERENCES</option><option>REQUESTS_VARIATION</option><option>CONFLICTS_WITH</option></select>
    <label for="project-link-reviewer">Reviewer</label><input id="project-link-reviewer" maxlength="150"><label for="project-link-reason">Why these documents are linked</label><textarea id="project-link-reason" maxlength="2000"></textarea><button type="button" id="project-link-save" class="button-main" ${locked}>RECORD SOURCE-LINKED RELATIONSHIP</button></div></div>
    ${authority.links.length?`<h3>Source-linked relationship history</h3>${authority.links.map(x=>`<div class="production-source"><b>${esc(x.fromId)} ${esc(x.kind)} ${esc(x.toId)}</b><small>${esc(x.status)} · ${esc(x.reviewer)} · ${esc(x.reason)}</small><blockquote>${esc(x.quote)}</blockquote></div>`).join('')}`:''}`:'<p class="production-hint">Import at least one document to begin authority review.</p>'}
    <p class="production-hint">Human statements and Clocked scores never authenticate a signature, establish amendment precedence or grant filming clearance. Source modifications retire affected link claims from current view.</p></section>
  <section class="production-box${pane('scope',model.workflowStage)}" aria-label="Scene-specific authority register"><h2>04 / Scene-specific documentary applicability</h2>
   <p>Link one exact source quotation to one original call-sheet scene. Mark its claimed nature and claimed scope. This records a <b>human assertion</b>, never validates authorization or overrides a restriction.</p>
   <div class="production-stats"><span>CLAIMS <strong>${sceneAuthority?.summary?.total??0}</strong></span><span>CURRENT UNVERIFIED <strong>${sceneAuthority?.summary?.current??0}</strong></span><span>STALE <strong>${sceneAuthority?.summary?.stale??0}</strong></span></div>
   ${current.callSheet?.scenes?.length&&overview?.documents?.length?`<div class="production-source-grid"><div><label for="project-scene-auth-scene">Exact call-sheet scene</label><select id="project-scene-auth-scene">${current.callSheet.scenes.map(s=>`<option value="${esc(s.id)}">${esc(s.id)} · ${esc(s.location)} · ${esc(s.activity.slice(0,60))}</option>`).join('')}</select>
   <label for="project-scene-auth-doc">Source document</label><select id="project-scene-auth-doc">${overview.documents.map(d=>`<option value="${esc(d.id)}">${esc(d.id)} · ${esc(d.name)}</option>`).join('')}</select>
   <label for="project-scene-auth-unit">Exact source quotation</label><select id="project-scene-auth-unit">${overview.documents[0].units.map(u=>`<option value="${esc(u.id)}">${esc(u.id)} · ${esc(u.text.slice(0,70))}</option>`).join('')}</select></div>
   <div><label for="project-scene-auth-kind">Human interpretation of passage</label><select id="project-scene-auth-kind"><option>RESTRICTION</option><option>CONDITIONAL_GRANT_CLAIM</option><option>REQUIREMENT</option><option>REQUEST_NOT_GRANTED</option><option>CONFLICT_OR_UNCERTAIN</option><option>BACKGROUND_CONTEXT</option></select>
   <label for="project-scene-auth-scope">Claimed scope</label><select id="project-scene-auth-scope"><option>SCOPE_UNRESOLVED</option><option>EXACT_SCENE</option><option>LOCATION_WIDE</option></select>
   <fieldset><legend>Structured documentary scope — all fields are explicitly reviewed against the original</legend>
   <p class="production-hint">Leave an unverified activity, location or date blank; that produces UNRESOLVED, never a broad permission. A claim only concerns the selected exact scene.</p>
   <label for="project-scene-auth-activity">Exact activity covered by original quotation (optional)</label><input id="project-scene-auth-activity" maxlength="300" placeholder="Exact call-sheet activity, only if supported">
   <label for="project-scene-auth-location">Exact location covered by original quotation (optional)</label><input id="project-scene-auth-location" maxlength="300" placeholder="Exact location, only if supported">
   <label for="project-scene-auth-from">Claimed start date (human-reviewed)</label><input id="project-scene-auth-from" type="date">
   <label for="project-scene-auth-through">Claimed final date (human-reviewed)</label><input id="project-scene-auth-through" type="date">
   <label for="project-scene-auth-issuance">What the document states</label><select id="project-scene-auth-issuance"><option value="NOT_ESTABLISHED">Not established or unverified</option><option value="REQUEST_ONLY">Requested but not issued</option><option value="DOCUMENT_CLAIMS_ISSUED">Document says issued (NOT authenticated)</option></select>
   <label for="project-scene-auth-related">Exact scene restriction this variation claims to modify (optional)</label><select id="project-scene-auth-related"><option value="">No restriction link established</option>${(sceneAuthority?.records??[]).filter(x=>x.kind==='RESTRICTION'&&x.sourceState==='CURRENT_UNVERIFIED').map(x=>`<option value="${esc(x.id)}">${esc(x.sceneId)} · ${esc(x.documentId)} / ${esc(x.unitId)} · ${esc(x.quote.slice(0,80))}</option>`).join('')}</select>
   <label for="project-scene-auth-prerequisite">Documentary prerequisites status</label><select id="project-scene-auth-prerequisite"><option value="NOT_REVIEWED">Not fully reviewed</option><option value="NONE_STATED_HUMAN_REVIEW">Human reviewed and none stated (not clearance)</option><option value="LINKED_CONDITIONS">Linked to specific prerequisite below</option></select>
   <label for="project-scene-auth-condition">Exact existing source-bound prerequisite (if linked)</label><select id="project-scene-auth-condition"><option value="">No linked condition</option>${(operations?.conditions??[]).filter(x=>x.sourceState==='CURRENT_HUMAN_CLAIM').map(x=>`<option value="${esc(x.id)}">${esc(x.sceneId)} · ${esc(x.title)} · ${esc(x.decision)}</option>`).join('')}</select>
   </fieldset>
   <label for="project-scene-auth-reviewer">Reviewer</label><input id="project-scene-auth-reviewer" maxlength="150"><label for="project-scene-auth-reason">Why this quotation applies</label><textarea id="project-scene-auth-reason" maxlength="2000"></textarea>
   <button type="button" class="button-main" id="project-scene-auth-save" ${locked}>RECORD ORIGINAL SOURCE → SCENE CLAIM</button></div></div>`:'<p class="production-hint">Import a source document and supported call sheet to record exact scene applicability.</p>'}
   ${sceneAuthority?.records?.length?`<h3>Original source and scene history</h3>${sceneAuthority.records.map(x=>`<div class="production-source"><b>${esc(x.sceneId)} · ${esc(x.kind)} · ${esc(x.scope)}</b><small>${esc(x.sourceState)} · ${esc(x.documentId)} ${esc(x.unitId)} · ${esc(x.reviewer)}: ${esc(x.reason)}</small><blockquote>${esc(x.quote)}</blockquote></div>`).join('')}`:''}
   <p class="production-hint">A general location approval is not automatically a scene-specific exception. Stale-source records remain visible but cannot validate current document or scene scope.</p></section>
  <section class="production-box${pane('operations',model.workflowStage)}" aria-label="Production schedule and prerequisites"><h2>Scene operations and prerequisites</h2>
   <p>Bind each original call-sheet row to an explicitly reviewed shoot date and IANA timezone. The overnight flag must be explicit. A local time skipped or repeated by daylight-saving transitions cannot be accepted silently.</p>
   <div class="production-stats"><span>DATED SCENES <strong>${operations?.summary?.dated??0}/${operations?.summary?.scenes??0}</strong></span><span>OPEN CONDITIONS <strong>${operations?.summary?.openPrerequisites??0}</strong></span><span>PAST DUE <strong>${operations?.summary?.pastDuePrerequisites??0}</strong></span><span>STALE CONDITIONS <strong>${operations?.summary?.staleConditions??0}</strong></span></div>
   ${current.callSheet?.scenes?.length?`<div class="production-source-grid"><div><h3>Human-confirmed schedule entry</h3><label for="project-op-scene">Original scene</label><select id="project-op-scene">${current.callSheet.scenes.map(s=>`<option value="${esc(s.id)}">${esc(s.id)} · ${esc(s.start)}–${esc(s.end)} · ${esc(s.location)}</option>`).join('')}</select>
   <label for="project-op-date">Shoot date (YYYY-MM-DD)</label><input id="project-op-date" type="date"><label for="project-op-zone">IANA timezone</label><input id="project-op-zone" maxlength="80" value="Africa/Lagos" placeholder="Africa/Lagos"><label for="project-op-overnight">End day</label><select id="project-op-overnight"><option value="false">Same date</option><option value="true">Next date (overnight)</option></select><label for="project-op-reviewer">Schedule reviewer</label><input id="project-op-reviewer" maxlength="150"><label for="project-op-reason">Date and timezone evidence / rationale</label><textarea id="project-op-reason" maxlength="2000"></textarea><button type="button" class="button-main" id="project-op-save" ${locked}>RECORD DATED SCENE PLAN</button></div>
   <div><h3>Documented condition / prerequisite</h3><label for="project-condition-scene">Scene with reviewed schedule</label><select id="project-condition-scene">${(operations?.scenes??[]).filter(x=>x.scheduleState==='DATED_HUMAN_PLAN_NOT_AUTHORITY').map(x=>`<option value="${esc(x.sceneId)}">${esc(x.sceneId)}</option>`).join('')}</select><label for="project-condition-title">Required action / condition</label><input id="project-condition-title" maxlength="250" placeholder="Stewards confirmed at ingress"><label for="project-condition-document">Supporting source (optional)</label><select id="project-condition-document"><option value="">Manual action — no quoted document</option>${(overview?.documents??[]).map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select><label for="project-condition-unit">Exact quotation (when source selected)</label><select id="project-condition-unit"><option value="">None</option></select><label for="project-condition-due">Local deadline (optional, ISO date and time)</label><input id="project-condition-due" type="datetime-local"><label for="project-condition-reviewer">Reviewer</label><input id="project-condition-reviewer" maxlength="150"><label for="project-condition-reason">Source and prerequisite rationale</label><textarea id="project-condition-reason" maxlength="2000"></textarea><button type="button" class="button-main" id="project-condition-save" ${locked}>ADD SOURCE-BOUND PREREQUISITE</button></div></div>`:'<p class="production-hint">Import a call sheet before recording scene dates and operational conditions.</p>'}
   ${operations?.conditions?.length?`<h3>Condition register — original history retained</h3>${operations.conditions.slice(-50).map(x=>`<div class="production-source"><b>${esc(x.sceneId)} · ${esc(x.title)}</b><small>${esc(x.sourceState)} · ${esc(x.decision)} · ${esc(x.deadlineState)} · ${esc(x.dueLocal??'No specified deadline')}</small><small>${esc(x.documentId?`${x.documentId} / ${x.unitId}`:'Manual action')} · ${esc(x.reviewer)}: ${esc(x.reason)}</small>${x.sourceState==='CURRENT_HUMAN_CLAIM'?`<button type="button" class="ghost" data-condition-id="${esc(x.id)}" ${locked}>REVIEW PREREQUISITE</button>`:''}</div>`).join('')}`:''}
   <div class="production-source-grid"><div><label for="project-condition-decision">Selected prerequisite review ${model.selectedCondition?esc(model.selectedCondition.slice(0,18))+'...':'(choose an existing prerequisite)'}</label><select id="project-condition-decision"><option>OPEN</option><option>NEEDS_SOURCE</option><option>BLOCKED</option><option>HUMAN_CONFIRMED_NOT_AUTHORITY</option></select><label for="project-condition-decision-reviewer">Reviewer</label><input id="project-condition-decision-reviewer" maxlength="150"><label for="project-condition-decision-reason">Review evidence / remaining work</label><textarea id="project-condition-decision-reason" maxlength="2000"></textarea><button type="button" id="project-condition-decide" class="button-main" ${locked}>SAVE PREREQUISITE REVIEW</button></div><div><p>Operational statuses track documented human work only. Confirming a task is NOT permit clearance, signed authorization, or proof every filming condition was discovered.</p><button type="button" class="ghost" id="project-operations-export" ${locked}>EXPORT SOURCE-BOUND OPERATIONS REGISTER (JSON)</button></div></div>
   ${operations?.scenes?.length?`<h3>Per-scene operational status</h3><ol class="production-scenes">${operations.scenes.map(x=>`<li><b>${esc(x.sceneId)}</b><span>${esc(x.operationsState)} · ${esc(x.openPrerequisites)} outstanding · ${esc(x.pastDuePrerequisites)} past due</span><small>${esc(x.startUtc??'Missing confirmed date')} ${x.endUtc?` → ${esc(x.endUtc)}`:''} · ${esc(x.timeZone??'Not set')}</small></li>`).join('')}</ol>`:''}
   <p class="production-hint">Schedule and condition records are immutable and remain visible if the original scene or source changes. Never infer clearance from zero open tasks.</p></section>
  <section class="production-box${pane('analysis',model.workflowStage)}"><div class="production-heading"><div><h2>Current source-to-scene analysis plan</h2><p>Every supported scene is paired with every discovered permit unit, including short restrictions. Planning is local and unbilled.</p></div><button type="button" class="ghost" id="project-refresh-plan" ${locked}>REFRESH PLAN</button></div>
   ${overview?.state==='READY_FOR_HUMAN_SOURCE_REVIEW'?`<div class="production-plan-note">${overview.plannedCalls} checks planned across ${overview.documents.length} documents and ${overview.scenes.length} scenes · ${overview.reviewedCount} human-reviewed · ${dossier?.counts?.completedModelChecks??0} recorded model checks. Text coverage is NOT completeness of legal authority.</div>
   <div class="production-task-grid"><div class="production-task-list">${tasks.map(t=>`<button type="button" class="production-task ${task?.id===t.id?'selected':''}" data-project-task="${esc(t.id)}"><strong>${esc(t.sceneId)} / ${esc(t.documentId)} / ${esc(t.unitId)}</strong><span>${esc(t.sourceQuote)}</span><small>${esc(t.humanReview?.decision||'OPEN')} · ${esc(execEntries.get(t.id)?.status==='COMPLETE'?'CLOCKED RESULT RECORDED':execEntries.get(t.id)?.status||'NOT AI EVALUATED')}</small></button>`).join('')||'<p class="muted">No tasks on this page.</p>'}</div>
    <section class="production-task-detail">${task?`<span class="kicker">EXACT ORIGINAL SOURCE</span><h3>${esc(task.sceneId)} × ${esc(task.unitId)}</h3><blockquote>${esc(task.sourceQuote)}</blockquote><small>Codepoint offset [${task.sourceRange[0]},${task.sourceRange[1]}) · Source-bound task ID ${esc(task.id)}</small><p>Semantic status: <b>${esc(currentEntry?.status==='COMPLETE'?currentEntry.finding||'RECORDED':currentEntry?.status||'NOT EVALUATED')}</b>. ${currentEntry?.status==='COMPLETE'?`Activity link ${esc(currentEntry.relevance)} · documentary grant ${esc(currentEntry.grant)}. ${currentEntry.scopeReason?`Unverified scope: ${esc(currentEntry.scopeReason)}.`:''}`:''} Human review does not assert permission.</p>
    <label for="project-reviewer">Reviewer</label><input id="project-reviewer" maxlength="150" placeholder="Production coordinator"><label for="project-decision">Human decision</label><select id="project-decision"><option value="NEEDS_SOURCE">Needs original source</option><option value="ACKNOWLEDGED">Acknowledged for follow-up</option><option value="OPEN">Open for review</option><option value="RESOLVED_BY_HUMAN">Human-reviewed (not clearance)</option></select><label for="project-reason">Reason / required action</label><textarea id="project-reason" maxlength="3000" placeholder="Describe the evidence or outstanding requirement"></textarea><button type="button" class="button-main" id="project-save-review" data-task-id="${esc(task.id)}" ${locked}>SAVE HUMAN REVIEW</button> <button type="button" class="ghost" id="project-review-stage" data-task-id="${esc(task.id)}" ${locked}>STAGE THIS INDIVIDUAL REVIEW</button>${task.humanReview?`<p class="production-hint">Latest review: ${esc(task.humanReview.decision)} by ${esc(task.humanReview.reviewer)} — ${esc(task.humanReview.reason)}</p>`:''}`:'Select a source check to review.'}</section></div>
   <nav class="production-pages"><button type="button" class="ghost" id="project-prev-page" ${page?.offset===0||busy?'disabled':''}>PREVIOUS</button><span>${page?`${page.shown?`${page.offset+1}–${page.offset+page.shown}`:'0'} / ${overview.plannedCalls}`:''}</span><button type="button" class="ghost" id="project-next-page" ${!page?.hasMore||busy?'disabled':''}>NEXT</button></nav>`:`<div class="production-hint">Add at least one supported document and a valid call sheet to prepare the source-bound plan. No automatic model calls.</div>`}</section>
  <section class="production-box${pane('analysis',model.workflowStage)}" aria-label="Clocked project execution"><h2>Durable Clocked analysis</h2><p>Run the original source-to-scene plan in bounded batches. Every attempt is journaled BEFORE contacting Clocked, and completed evidence survives application restarts. An interrupted or uncertain call is never automatically repeated.</p>
   <div class="production-stats"><span>PLANNED <strong>${execution?.planned??0}</strong></span><span>ATTEMPTED <strong>${execution?.attempts??0}</strong></span><span>COMPLETED <strong>${execution?.completed??0}</strong></span><span>UNKNOWN <strong>${execution?.unknownBilling??0}</strong></span></div>
   <p>Execution state: <b>${esc(execution?.state??'NOT READY')}</b> · ${esc(execution?.completionPercent??0)}% complete · ${esc(execution?.remaining??0)} not attempted · Known reported credits ${esc(execution?.knownCredits??0)} · Unknown credit records ${esc(execution?.unknownCreditEntries??0)} · ${esc(execution?.archivedRuns??0)} retained historical source-plan runs.</p>
   ${execution?.creditProjection?`<p class="production-hint">Observed credit projection (NOT a quote): ${esc(execution.creditProjection.sampleCount)} reported-cost samples · mean ${esc(execution.creditProjection.averageCreditsPerReportedCall)} credits/check · remaining ${esc(execution.creditProjection.remainingCreditsAtObservedMean)} at observed mean. Provider billing and unreported/future costs may differ.</p>`:'<p class="production-hint">No confirmed per-request credit sample yet. Remaining cost is unknown until provider reports it.</p>'}
   ${execution?.hourlyAllowance?`<p class="production-hint">Local process allowance: ${esc(execution.hourlyAllowance.remaining)}/${esc(execution.hourlyAllowance.configured)} attempts available in the last-hour window (NOT a provider credit limit).</p>`:''}
   ${execution?.byDocument?`<details><summary>Analysis progress by source document</summary>${Object.entries(execution.byDocument).map(([id,x])=>`<p>${esc(id)}: ${esc(x.complete)}/${esc(x.planned)} complete · ${esc(x.uncertain)} uncertain</p>`).join('')}</details>`:''}
   ${execution?.state==='HALTED_UNKNOWN_BILLING'?'<p class="production-error">Request outcome or billing unknown. This plan is halted; inspect provider billing and original journal. No automatic retry.</p>':''}
   ${liveEnabled?`<label for="project-operator-token">LOCAL OPERATOR TOKEN (never your API key)</label><input type="password" id="project-operator-token" autocomplete="off" placeholder="Separate local operator token"><label for="project-call-limit">Maximum new requests in this owner-authorized run (1–256, submitted as durable batches of up to 32)</label><input id="project-call-limit" type="number" min="1" max="256" value="32"><button type="button" class="button-main" id="project-run-clocked" ${locked}>RUN OWNER-AUTHORIZED CLOCKED SESSION</button>`:'<p class="production-hint">Start the local server with -Live to enable paid project analysis. Offline source review still works.</p>'}
   ${execution?.attempts?`<button type="button" class="ghost" id="project-export-model" ${locked}>EXPORT SOURCE-BOUND PROJECT EVIDENCE (JSON)</button>`:''}
   <p class="production-hint">MODEL: NOT EVALUATED until an explicit successful request. Saved results are source-fingerprint bound, not authorization. Changing any original document creates a distinct plan and retains the historical execution.</p></section>`:`<section class="production-box production-empty"><h2>Start with the production, not the experiment.</h2><p>Choose an existing project or create one. The original documents and schedule become the single audited workspace.</p></section>`}
  </div></div><div class="production-disclaimer">DRAFT HUMAN REVIEW — NOT FILMING CLEARANCE. Project files stay on this local owner's machine. Local owner token required; no cloud synchronization or remote accounts. Save encrypted backups privately.</div></main>`;
}

export function createWorkspaceController({fetchImpl=fetch,notify=()=>{},root=document}={}){
 const model={evaluationMode:false,authLocked:false,items:[],selected:null,originals:null,documentPreview:null,stagedReviews:[],reviewSessionPreview:null,stagingVersion:null,activeSceneId:null,sceneWorkbench:null,sceneTaskOffset:0,sceneActionOffset:0,overview:null,execution:null,authority:null,sceneAuthority:null,operations:null,dossier:null,actionQueue:null,impactPreview:null,pendingSource:null,actionOffset:0,actionKind:'ALL',workflowStage:'sources',journey:null,consistency:null,focusDocumentId:null,liveEnabled:false,selectedTask:null,selectedCondition:null,busy:false,error:null,offset:0};
 const query=id=>root.querySelector('#'+id);
 const value=id=>query(id)?.value?.trim()??'';
 const api=async(method,path,payload)=>{
  const response=await fetchImpl(path,{method,cache:'no-store',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});
  const data=await response.json();if(response.status===401&&data.ownerUnlockRequired){model.authLocked=true;throw Error('Owner access locked. Enter your local owner token.');}if(!response.ok)throw Error(data.error||`Project API HTTP ${response.status}`);return data;
 };
 const refresh=async()=>{
  try{const health=await api('GET','/api/health');model.liveEnabled=Boolean(health.liveEnabled);model.evaluationMode=health.evaluationMode===true;}catch{model.liveEnabled=false;model.evaluationMode=false;}
  const list=await api('GET','/api/workspaces');model.authLocked=false;model.items=list.items;
  if(model.selected){const id=model.selected.workspace.id;
   const url=`/api/workspaces/${encodeURIComponent(id)}/workflow?offset=${model.offset}&actionOffset=${model.actionOffset}&kind=${encodeURIComponent(model.actionKind)}&sceneTaskOffset=${model.sceneTaskOffset}&sceneActionOffset=${model.sceneActionOffset}${model.activeSceneId?'&sceneId='+encodeURIComponent(model.activeSceneId):''}`;
   const snapshot=await api('GET',url);
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
   model.dossier=snapshot.dossier;model.actionQueue=snapshot.actionQueue;model.sceneWorkbench=snapshot.sceneWorkbench;
   const scenes=model.overview?.scenes??[];
   if(!scenes.some(sc=>sc.id===model.activeSceneId)){
    model.activeSceneId=scenes[0]?.id??null;model.sceneTaskOffset=0;model.sceneActionOffset=0;
   }
   if(model.stagingVersion!==null&&model.stagingVersion!==model.selected.version){model.stagedReviews=[];model.reviewSessionPreview=null;model.stagingVersion=null;}

  }
 };
 const load=async()=>{model.error=null;try{await refresh();}catch(e){model.error=e.message;}};
 const run=async(fn)=>{if(model.busy)return;model.busy=true;model.error=null;try{await fn();await refresh();notify('Production sources and reviews updated.');}catch(e){model.error=e.message;notify(e.message,true);}finally{model.busy=false;}};
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
 };
 const boundDossierQuery=()=>{
  if(!model.selected||!model.dossier?.sha256||!model.dossier?.asOf)throw Error('Inspect the current production evidence before exporting');
  return `?asOf=${encodeURIComponent(model.dossier.asOf)}&expectedVersion=${model.selected.version}&expectedDossierSha256=${encodeURIComponent(model.dossier.sha256)}`;
 };
 const reviewEdits=()=>model.stagedReviews.map(({evidenceId,decision,reviewer,reason})=>({evidenceId,decision,reviewer,reason}));
 const actions={
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
   notify(`${output.applied} human source decisions recorded in one versioned transaction. No filming clearance.`);
  },
  'project-impact-permit':()=>previewFileImpact('permit'),
  'project-impact-call':()=>previewFileImpact('callSheet'),
  'project-impact-commit':async()=>{if(!model.pendingSource)throw Error('No verified preview available');await importFile(model.pendingSource.kind,{previewed:true});},
  'project-action-apply':async()=>{model.actionKind=value('project-action-filter')||'ALL';model.actionOffset=0;},
  'project-action-prev':async()=>{model.actionOffset=Math.max(0,model.actionOffset-30);},
  'project-action-next':async()=>{if(model.actionQueue?.pagination?.hasMore)model.actionOffset+=30;},
  'project-create':async()=>{const id=value('project-id'),title=value('project-title');if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(id)||!title)throw Error('Enter a valid production ID and title');const created=await api('POST','/api/workspaces',{id,title});model.selected={version:created.version,workspace:created.workspace};model.workflowStage='sources';model.offset=0;model.selectedTask=null;},
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
   const data=await api('GET',`/api/workspaces/${encodeURIComponent(id)}/dossier${boundDossierQuery()}`);
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
  'project-scene-task-prev':async()=>{model.sceneTaskOffset=Math.max(0,model.sceneTaskOffset-40);},
  'project-scene-task-next':async()=>{if(model.sceneWorkbench?.taskPagination?.hasMore)model.sceneTaskOffset+=40;},
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
  if(el.dataset.workflowOpen){if(!workflowStages.has(el.dataset.workflowOpen))throw Error('Unknown workflow step');model.workflowStage=el.dataset.workflowOpen;model.error=null;return true;}
  if(el.dataset.workflowAction){
   const stage=stageForRoute[el.dataset.workflowAction];if(!stage)throw Error('Unknown evidence action destination');
   model.workflowStage=stage;
   if(el.dataset.actionScene&&model.overview?.scenes?.some(s=>s.id===el.dataset.actionScene)){
    model.activeSceneId=el.dataset.actionScene;model.sceneTaskOffset=0;model.sceneActionOffset=0;
   }
   model.selectedCondition=el.dataset.actionCondition||null;
   model.focusDocumentId=model.selected?.workspace?.documents?.some(d=>d.id===el.dataset.actionDocument)?el.dataset.actionDocument:null;
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
  if(el.dataset.sceneFocus){model.activeSceneId=el.dataset.sceneFocus;model.sceneTaskOffset=0;model.sceneActionOffset=0;model.error=null;await load();return true;}
  if(el.dataset.sceneOpenTask){
   const index=Number(el.dataset.taskPosition),localIndex=Number(el.dataset.sceneTaskPosition);
   if(!Number.isSafeInteger(index)||index<0||index>=50000||!Number.isSafeInteger(localIndex)||localIndex<0||localIndex>=50000)throw Error('Scene task pointer invalid');
   const match=model.sceneWorkbench?.tasks?.find(t=>t.id===el.dataset.sceneOpenTask&&t.globalTaskIndex===index&&t.sceneTaskIndex===localIndex)||
    model.sceneWorkbench?.actions?.actions?.find(t=>t.taskId===el.dataset.sceneOpenTask&&t.globalTaskIndex===index&&t.sceneTaskIndex===localIndex);
   if(!match)throw Error('Source task pointer is no longer in this verified scene packet');
   model.offset=Math.floor(index/40)*40;model.sceneTaskOffset=Math.floor(localIndex/40)*40;model.selectedTask=el.dataset.sceneOpenTask;model.error=null;await load();return true;
  }
  if(el.dataset.conditionId){model.selectedCondition=el.dataset.conditionId;notify('Selected source-bound condition for human review.');return true;}
  if(el.dataset.projectTask){model.selectedTask=el.dataset.projectTask;return true;}
  if(el.dataset.projectOpen){await run(async()=>{model.selected=await api('GET','/api/workspaces/'+encodeURIComponent(el.dataset.projectOpen));model.workflowStage='sources';model.offset=0;model.actionOffset=0;model.impactPreview=null;model.pendingSource=null;model.stagedReviews=[];model.reviewSessionPreview=null;model.stagingVersion=null;model.selectedTask=null;model.activeSceneId=null;model.sceneWorkbench=null;model.sceneTaskOffset=0;model.sceneActionOffset=0;});return true;}
  if(el.id==='owner-access-unlock'){
   await run(async()=>{
    const token=value('owner-access-input');if(!token)throw Error('Paste the local owner token from your terminal');
    await api('POST','/api/owner/unlock',{token});model.authLocked=false;model.selected=null;model.items=[];
   });return true;
  }
  const name=el.id;if(!actions[name])return false;await run(actions[name]);return true;
 };
 const sourceUnitsFor=id=>model.overview?.documents?.find(d=>d.id===id)?.units??[];
 const syncLinkUnits=()=>{
  const target=query('project-link-unit');if(!target)return;
  const units=sourceUnitsFor(value('project-link-from'));
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
  target.replaceChildren(...units.map(u=>{const option=document.createElement('option');option.value=u.id;option.textContent=`${u.id} · ${u.text.slice(0,70)}`;return option;}));
 };
 return {model,load,click,syncLinkUnits,syncSceneUnits,syncConditionUnits,render:()=>productionView(model)};
}
