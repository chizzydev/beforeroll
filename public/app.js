import {evaluatePreflight,parseCallSheet,clockToMinutes,normalizeLocation,validSpan,sourcePointSlice} from '/src/engine.mjs';
import {timelineGeometry} from '/src/timeline.mjs';
import {sentenceCandidates,previewSourceCoverage} from '/src/semantic-source.mjs';
import {auditDeskSweep} from '/src/desk-semantic.mjs';
import {sceneAuthoritySummary,authoritySummaryForDossier} from '/src/authority-summary.mjs';
import {createWorkspaceController} from '/workspace-desk.mjs';
const app=document.querySelector('#app');
const M3S4_SECOND_SCENE='Scene 32 | NORTH GLASS GALLERY | 15:00-15:25 | Produce a drifting white atmosphere by sublimating frozen carbon dioxide near the set wall.';
const FALLBACK_F02_CALLSHEET=`DAILY CALL SHEET CS-12 - Saturday 7 November 2026
Scene 21 | Warehouse NORTH | 19:55-20:10 | Interview, no playback.
Scene 22 | Warehouse SOUTH | 21:00-21:30 | Dialogue scene, no playback.
Scene 23 | Warehouse NORTH | 20:10-20:45 | Closing setup.
End of call sheet. Coordinator review: PENDING.`;
const state={evaluationMode:false,tab:'desk',caseId:'F01',profile:'standard',record:null,permitText:'',callSheetText:'',fields:{},sourceMode:'recorded',selectedScene:'S15',selectedFinding:null,sourceDoc:'permit',reviewed:new Set(),edits:{},manualFields:{},editingField:null,liveEnabled:false,operatorToken:'',busy:false,scenes:[],replayCredits:null,challenge:null,semantic:{packet:null,clauses:[],selected:null,result:null,scan:null,busy:false},deskClocked:{byScene:{},busy:false,mode:null,batch:null}};
let toastTimer;
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=s=>h(s).replace(/_/g,' ');
function toast(message,bad=false){let el=document.querySelector('.toast');if(el)el.remove();el=document.createElement('div');el.className='toast'+(bad?' bad':'');el.textContent=message;document.body.append(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),5200);}
const workspaceController=createWorkspaceController({root:document});
function compute(){const result=evaluatePreflight({permitText:state.permitText,callSheetText:state.callSheetText,fields:state.fields,profile:state.profile,scenes:state.scenes,manualFields:state.manualFields});
 const attached=Object.values(state.deskClocked.byScene).flatMap(x=>x.findings||[]);
 return {...result,findings:[...result.findings,...attached],summary:{...result.summary,reviews:result.summary.reviews+attached.length},clockedAttached:attached.length};}
async function localHash(value){const bytes=new TextEncoder().encode(value);const raw=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(raw),v=>v.toString(16).padStart(2,'0')).join('');}
function originalSceneRow(scene){return scene?.source&&!scene.edited?sourcePointSlice(state.callSheetText,scene.source.start,scene.source.end):null;}
function clearDeskClocked(){state.deskClocked.byScene={};state.deskClocked.mode=null;state.deskClocked.batch=null;state.selectedFinding=null;}
async function attachToDesk(scan,scene,origin){const row=originalSceneRow(scene);if(!row)throw Error('Cannot bind Clocked to an edited or unsupported scene row. Restore/reparse original source.');
 const bound=await auditDeskSweep({permitText:state.permitText,sceneRow:row,sceneId:scene.id,scan,hash:localHash,origin});
 state.deskClocked.byScene[scene.id]=bound;state.selectedFinding=(bound.findings.find(f=>f.clocked.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'&&!f.title.includes('scope unverified'))||bound.findings[0])?.id??null;return bound;}

function chosen(f){let fs=f.findings.filter(x=>x.sceneId===state.selectedScene);return fs.find(x=>x.id===state.selectedFinding)||fs[0]||null;}
function flagClass(f){return f?.some(x=>x.severity==='issue')?'issue':f?.some(x=>x.severity==='review')?'review':'clear';}
function labelClass(c){return c==='issue'?'Documented mismatch':c==='review'?'Needs review':'Within stated checks';}
function percentScore(p,decimals=1){return typeof p==='number'&&Number.isFinite(p)?(p*100).toFixed(decimals)+'%':'UNAVAILABLE';}
function formatScene(s){return `${s.start||'--:--'} — ${s.end||'--:--'}`;}
function labelCase(){return state.challenge?`${state.challenge.id} / ${state.challenge.title}`:state.caseId==='F01'?'FP-1042 / EAST COURTYARD':state.caseId.startsWith('M3B')?'GG-32 / NORTH GLASS GALLERY':'LP-77 / WAREHOUSE';}
function challengeDate(){return state.challenge?(state.challenge.id==='U01'?'SUN 08 NOV 2026':'MON 09 NOV 2026'):(state.caseId==='F01'||state.caseId.startsWith('M3B')?'THU 05 NOV 2026':'SAT 07 NOV 2026');}
function aiMode(){const all=Object.values(state.deskClocked.byScene);if(!all.length)return 'NOT EVALUATED';const origins=new Set(all.map(x=>x.origin));return origins.size===1?(origins.has('live')?'LIVE':'OWNER-RECORDED'):'MIXED LIVE / RECORDED';}
function sceneCell(s,findings){let fs=findings.filter(x=>x.sceneId===s.id),severity=flagClass(fs);const cl=state.deskClocked.byScene[s.id];const modelTag=cl?cl.complete?'CLOCKED CHECKED':'CLOCKED PARTIAL':'NOT AI-EVALUATED';let dur='';const t0=clockToMinutes(s.start),t1=clockToMinutes(s.end);if(t0!==null&&t1!==null)dur=String(Math.max(0,t1-t0)).padStart(2,'0')+' MIN';return `<button class="scene-row ${state.selectedScene===s.id?'active':''}" data-scene="${h(s.id)}" aria-pressed="${state.selectedScene===s.id}"><div class="scene-upper"><span class="scene-no">SCENE / ${h(s.number)}</span><span class="badge ${severity}">${severity==='issue'?'MISMATCH':severity==='review'?'REVIEW':'WITHIN CHECKS'}</span></div><h4>${h(s.location)}</h4><div class="scene-model-tag">${modelTag}</div><div class="scene-loc">${h(s.activity||'Activity not provided')}</div><div class="scene-window"><span>${h(formatScene(s))}</span><span>${h(dur)}</span></div><div class="mini-track"><div class="mini-progress" data-progress-percent="${t0!==null&&t1!==null?Math.max(5,Math.min(100,(t1-t0)/95*100)):5}"></div></div></button>`;}
function traceMark(text,range){if(!text)return '';if(!range||!Number.isInteger(range.start)||!Number.isInteger(range.end)||range.start<0||range.end>Array.from(text).length||range.end<=range.start)return h(text);return h(sourcePointSlice(text,0,range.start))+'<mark>'+h(sourcePointSlice(text,range.start,range.end))+'</mark>'+h(sourcePointSlice(text,range.end,Array.from(text).length));}
function proofQuote(e,docText){if(!e||!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.end>Array.from(docText).length||e.end<=e.start)return null;return sourcePointSlice(docText,e.start,e.end);}
function inspector(result,scene){const sel=chosen(result);state.selectedFinding=sel?.id??null;
 const permitQuote=sel?proofQuote(sel.evidence?.permit,state.permitText):null;
 const rowQuote=scene?.source?proofQuote({start:scene.source.start,end:scene.source.end},state.callSheetText):null;
 const evidenceLabel=!sel?'NO ACTIVE FINDING':permitQuote&&rowQuote?'PERMIT + SCENE LINKED':permitQuote?'PERMIT CITED ONLY':rowQuote?'SCENE SOURCE ONLY':'CITATION UNVERIFIED';
 let fcontent='';
 if(!sel) fcontent=`<div class="evidence-flag">● &nbsp; NO CURRENT FINDINGS</div><h3 class="evidence-topic">Within stated checks</h3><p class="evidence-detail">No detected mismatch for this scene under the currently trusted fields. This is not a permission or clearance decision.</p>`;
 else {
  const isReviewed=state.reviewed.has(sel.id);
  fcontent=`<div class="evidence-flag ${sel.severity==='issue'?'evidence-issue':'evidence-review'}">● ${sel.type==='clocked'?'CLOCKED MODEL FINDING — HUMAN REVIEW':sel.severity==='issue'?'DOCUMENTED DISCREPANCY':'UNCERTAIN — HUMAN REVIEW'}</div><h3 class="evidence-topic">${h(sel.title)}</h3><p class="evidence-detail">${h(sel.detail)}</p>
    <div class="proof-card"><div class="proof-title"><span>01 / ISSUED SOURCE</span><button class="ghost" data-open-proof="permit">OPEN ↗</button></div><div class="proof-value ${!permitQuote?'missing':''}">${permitQuote?`“<mark>${h(permitQuote)}</mark>”`:'No trustworthy linked issued-source quotation for this finding. Review original document manually.'}</div></div>
    <div class="proof-card"><div class="proof-title"><span>02 / CALL SHEET ROW</span><button class="ghost" data-open-proof="call">OPEN ↗</button></div><div class="proof-value">${rowQuote?`“${h(rowQuote)}”`:'Scene source row unavailable.'}${scene.edited?'<br /><strong class="human-edited-note">Values edited by human — quote is original row, not corrected text.</strong>':''}</div></div>
    ${sel.clocked?`<div class="clocked-proof"><b>Clocked Decide · ${h(sel.clocked.origin==='recorded'?'OWNER-RECORDED REPLAY':'LIVE RESULT')}</b><br/>Activity link: ${percentScore(sel.clocked.finding.relevance,2)} · Documented grant: ${percentScore(sel.clocked.finding.grant,2)}<br/>Clause ${sel.clocked.index} · request hash ${h(sel.clocked.requestHash)}<br/>Model judgments, not verified permit authenticity or fulfilled prerequisites.</div>`:''}<div class="note">${permitQuote&&rowQuote?'This finding links a permit excerpt and an original call-sheet row.':rowQuote?'Only the original call-sheet row is linked; no verified permit excerpt supports this finding.':permitQuote?'Only the permit excerpt is linked; the original scene row must be inspected.':'No verified excerpt is linked for this finding.'} This review is <strong>not a determination of legal validity or film-office authorization.</strong>${state.profile==='variation'?' Scoped variation evidence may require manual authority review.':''}</div>
    <div class="review-actions"><button class="${isReviewed?'ghost':'button-main'}" data-mark-reviewed="${h(sel.id)}">${isReviewed?'↺ UNMARK REVIEWED':'✓ MARK REVIEWED'}</button><button class="ghost" data-tab="sources">CORRECT SOURCE</button></div>
    <div class="secondary-hint">“Reviewed” records acknowledgement. It does not resolve or clear this finding.</div>`;
 }
 const highlights=sel?.evidence?.permit && state.sourceDoc==='permit'?sel.evidence.permit:state.sourceDoc==='call'&&scene.source?scene.source:null;
 const sourceText=state.sourceDoc==='permit'?state.permitText:state.callSheetText;
 return `<section class="panel evidence-panel"><div class="panel-head"><h2>Evidence inspector</h2><span class="roundcount">${h(evidenceLabel)}</span></div><div class="evidence-content">${fcontent}<div class="separator"></div><div class="section-row"><span class="section-title">Original document</span><span class="quickselect"><button class="ghost" data-doc="permit">PERMIT</button><button class="ghost" data-doc="call">CALL SHEET</button></span></div><div class="docraw" id="source-raw">${traceMark(sourceText,highlights)}</div><div class="secondary-hint">Highlighted fragments use original character offsets, not generated citations.</div></div><div class="review-log">SCENE AI: ${state.deskClocked.byScene[scene.id]?(state.deskClocked.byScene[scene.id].origin==='recorded'?'OWNER-RECORDED DECIDE REPLAY':'LIVE CLOCKED DECIDE'):'NOT EVALUATED'} · SOURCE INTAKE: ${h(state.sourceMode.toUpperCase())} · FICTIONAL DOCUMENTS<br/>Never treat this review board as a permit.</div></section>`;
}
function timeline(scene,result){
 const trusted=Boolean(result.terms.end.valid&&!result.terms.end.manual);
 const cutoffValue=trusted?result.terms.end.value:null;
 const g=timelineGeometry(scene.start,scene.end,cutoffValue);
 const axis=g.ticks.map(v=>`<span>${h(v)}</span>`).join('');
 const bar=g.bar?`<div class="windowbar ${g.pastCutoff?'out':''}" data-left-percent="${g.bar.left}" data-width-percent="${g.bar.width}" aria-label="Planned scene ${h(formatScene(scene))}"></div>`:'';
 const limit=g.cutoffPercent!==null?`<div class="limitline" data-cutoff-percent="${g.cutoffPercent}" aria-label="Documented cutoff ${h(cutoffValue)}"></div>`:'';
 const legend=cutoffValue?`<span class="legend-cutoff-dot"></span> DOCUMENTED ${state.profile==='variation'?'BASE-PERMIT ':''}CUTOFF ${h(cutoffValue)}`:'<span class="legend-unknown">NO VERIFIED CUTOFF</span>';
 return `<div class="timeline-wrap"><div class="section-row"><span class="section-title">DAYLINE / LOCAL TIME</span><span class="legend">PLANNED WINDOW ${legend}</span></div><div class="timeline-axis">${axis}</div><div class="track">${bar}${limit}</div><div class="track-bottom"><span>PLANNED SCENE ${g.bar?'':'· TIME NOT DISPLAYABLE'}</span><b>${h(formatScene(scene))}</b></div></div>`;
}
function applyCspSafeGeometry(){
 const safe=(value)=>{const v=Number(value);return Number.isFinite(v)&&v>=0&&v<=100?v:null;};
 for(const el of app.querySelectorAll('[data-left-percent][data-width-percent]')){
  const left=safe(el.dataset.leftPercent),width=safe(el.dataset.widthPercent);
  if(left!==null&&width!==null&&left+width<=100.0001){el.style.left=left+'%';el.style.width=width+'%';}
 }
 for(const el of app.querySelectorAll('[data-cutoff-percent]')){
  const at=safe(el.dataset.cutoffPercent);if(at!==null)el.style.left=at+'%';
 }
 for(const el of app.querySelectorAll('[data-progress-percent]')){
  const width=safe(el.dataset.progressPercent);if(width!==null)el.style.width=width+'%';
 }
}
function sceneAuthorityBoard(scene){
 const summary=sceneAuthoritySummary(state.deskClocked.byScene[scene.id]||null);
 const source=(item,label)=>item?`<div class="authority-evidence"><div class="authority-source-title">${h(label)} · CLAUSE ${item.index} · ${percentScore(item.relevance)} ACTIVITY · ${percentScore(item.grant)} GRANT</div><div class="authority-quote">“${h(item.quote)}”</div><small>Source characters [${item.range[0]},${item.range[1]}) · request SHA-256 ${h(item.requestHash)}</small></div>`:'';
 return `<section class="scene-authority ${summary.status==='NOT_EVALUATED'?'unassessed':''}" aria-label="Scene documentary authority review">
 <div class="authority-top"><span class="kicker">CLOCKED INTELLIGENCE / SOURCE-LINKED EVIDENCE</span><span class="authority-status">${h(summary.modelOrigin)} · NOT CLEARED</span></div>
 <h4>${h(summary.headline)}</h4><p>${h(summary.detail)}</p>
 ${source(summary.restriction,'RELEVANT SOURCE CONDITION')}
 ${source(summary.grant,'POTENTIAL SCENE-SCOPED DOCUMENTARY VARIATION')}
 ${summary.additional.length?`<div class="authority-scope"><strong>ADDITIONAL CLAUSES / SCOPE QUESTIONS</strong><p>A model-positive general consent or a clause naming another scene cannot override an activity-specific restriction. Review scene scope, precedence and any unissued request.</p>${summary.additional.map(v=>source(v,'UNRESOLVED / '+v.kind.replaceAll('_',' '))+(v.scopeReason?`<p class="scope-note">${h(v.scopeReason)}. A model-positive clause is not an activity-specific exception.</p>`:'')).join('')}</div>`:''}
 <div class="authority-todo"><strong>OUTSTANDING HUMAN CHECKS</strong><ul>${(summary.missing.length?summary.missing:['Confirm complete permit coverage, issuing authority, conditions and any unscanned source evidence.']).map(v=>`<li>${h(v)}</li>`).join('')}</ul></div>
 <small class="authority-fence">Source quotes were checked by the original source-binding audit. The summary presents model judgments, not verified approval or proof that every permit clause was discovered.</small></section>`;
}
function semanticDeskPanel(scene){
 const sourcePreview=previewSourceCoverage(state.permitText);
 const x=state.deskClocked.byScene[scene.id];const total=sentenceCandidates(state.permitText).length;const multiOk=state.scenes.length===2&&state.scenes.every(v=>Boolean(originalSceneRow(v))&&!v.edited)&&total>0&&total*2<=8;const b=state.deskClocked.batch;const checked=state.scenes.filter(v=>state.deskClocked.byScene[v.id]?.complete).length;
 return `<div class="desk-semantic"><div class="desk-semantic-title"><div><div class="kicker">CLOCKED INTELLIGENCE / SCENE ${h(scene.number)}</div><h3>Conditions behind the call sheet.</h3></div><span class="mode-chip">${x?h(x.origin==='recorded'?'OWNER-RECORDED CLOCKED':'LIVE CLOCKED'):'NOT EVALUATED'}</span></div>
 ${sceneAuthorityBoard(scene)}
 ${sourcePreview.hasUncovered?`<div class="coverage-warning" role="alert"><strong>UNSCANNED ORIGINAL SOURCE FRAGMENTS / MANUAL REVIEW</strong><p>These excerpts are not included in Clocked candidate queries: ${sourcePreview.uncovered.slice(0,6).map(v=>`[${v.start},${v.end}) “${h(v.text.slice(0,135))}”`).join(' · ')}${sourcePreview.uncovered.length>6?' · additional uncovered excerpts':''}. They may contain operative conditions. No missing passage is treated as permission.</p></div>`:''}
 ${state.challenge?`<div class="unfamiliar-note" role="status"><strong>M3-S6 / FROZEN UNFAMILIAR LANGUAGE · ${h(state.challenge.id)}</strong><p>${h(state.challenge.title)} — ${h(state.challenge.intent)}</p><div class="challenge-difference"><span><b>AI-OFF BASELINE</b><br/>Existing time, location and source-integrity checks remain available; no scene-condition semantic judgment is supplied.</span><span><b>CLOCKED DIFFERENCE</b><br/>${checked===0?'NOT TESTED on this new source. No model outcomes simulated.':`${checked}/${state.scenes.length} scene(s) have source-audited Clocked replies; review findings separately from deterministic mismatches.`}</span></div><small>Fictional authored case, frozen before live model requests. A four-clause scan is not a complete permit audit. This is NOT an authenticated permit or filming clearance.</small></div>`:''}
 ${state.scenes.length>1?`<div class="batch-status"><strong>MULTI-SCENE COVERAGE: ${checked}/${state.scenes.length} SCENES ASSESSED FOR DETECTED CLAUSES ONLY</strong><br/>${b?`Batch: ${b.attempts}/${b.totalPlannedCalls} requests attempted · ${b.reportedCredits??'unknown'} total reported credits · ${b.complete?'COMPLETE FOR SEGMENTED CLAUSES':'INCOMPLETE / REVIEW UNTESTED SCENES'}.`:state.deskClocked.mode==='owner-recorded-unfamiliar'?'Verified OWNER-RECORDED M3-S6 unfamiliar-case replies replayed locally. Eight original requests, zero new API calls.':state.deskClocked.mode==='owner-recorded-full'?'Verified OWNER-RECORDED M3-S4 live two-scene experiment replayed locally. No new API requests or charges.': 'A scene without its own source-bound response remains NOT EVALUATED.'}</div>`:''}
 <p>${x?`${x.checked.length} clause judgments · ${x.findings.length} review finding(s) · ${x.credits??'unknown'} reported credits. ${x.coverageWarning?'SOURCE COVERAGE INCOMPLETE — manually review omitted fragments.':'All segmented candidates evaluated; incomplete legal-document discovery remains possible.'}`:'No AI finding has been inferred for this scene. The existing timetable checks do not recognize unfamiliar activities. Use Clocked Decide to evaluate source clauses.'}</p>
 ${x?`<div class="clocked-chiprow">${x.checked.map(r=>`<span class="clocked-chip ${r.finding.code==='NO_SEMANTIC_LINK_DETECTED'?'quiet':''}">Clause ${r.index}: ${percentScore(r.finding.relevance)} relevance · ${percentScore(r.finding.grant)} grant</span>`).join('')}</div>`:''}
 <div class="desk-controls"><button class="ghost" id="load-owner-demo" ${state.deskClocked.busy?'disabled':''}>LOAD REAL CLOCKED REPLAY DEMO</button><button class="button-main" id="scan-desk-scene" ${!state.liveEnabled||state.deskClocked.busy||scene.edited||total<1||total>8?'disabled':''}>${state.deskClocked.busy?'CLOCKED ANALYZING...':`RUN CLOCKED FOR THIS SCENE (${total} CLAUSE${total===1?'':'S'}) ↗`}</button></div>
 <div class="unfamiliar-actions"><strong>UNFAMILIAR-PERMIT CHAMPIONSHIP · ZERO-MODEL BASELINE OR VERIFIED OWNER REPLAY</strong><div class="multi-action-row"><button class="ghost" data-unfamiliar="U01" ${state.deskClocked.busy?'disabled':''}>LOAD FROZEN U01 / ARCHIVE FLOOR</button><button class="ghost" data-unfamiliar="U02" ${state.deskClocked.busy?'disabled':''}>LOAD FROZEN U02 / PUBLIC EGRESS</button></div><div class="multi-action-row"><button class="ghost" data-owner-replay="U01" ${state.deskClocked.busy?'disabled':''}>REPLAY VERIFIED U01 / REAL CLOCKED RECORDING</button><button class="ghost" data-owner-replay="U02" ${state.deskClocked.busy?'disabled':''}>REPLAY VERIFIED U02 / REAL CLOCKED RECORDING</button></div><small>Both cases were evaluated by the owner with live Clocked Decide: U01 5/5 and U02 5/5 frozen synthetic assertions. Frozen input buttons load WITHOUT model results; REPLAY buttons re-audit preserved original results locally and display OWNER-RECORDED, not LIVE. No new provider calls. Scores are not a real-world accuracy benchmark.</small></div>
 <div class="multi-action-row"><button class="ghost" id="load-two-scene-recorded" ${state.deskClocked.busy?'disabled':''}>LOAD VERIFIED TWO-SCENE CLOCKED RECORDING (0 CREDITS)</button><button class="ghost" id="load-multi-demo" ${state.deskClocked.busy?'disabled':''}>LOAD TWO-SCENE SOURCE DEMO (31 RECORDED / 32 NOT EVALUATED)</button><button class="button-main" id="scan-all-scenes" ${!state.liveEnabled||state.deskClocked.busy||!multiOk?'disabled':''}>${state.deskClocked.busy?'CLOCKED ANALYZING...':`RUN CLOCKED FOR BOTH SCENES (${total*2} MAX CALLS) ↗`}</button>${b?'<button class="ghost" id="export-multi-evidence">EXPORT MULTI-SCENE CLOCKED EVIDENCE (JSON)</button>':''}</div>
 ${state.liveEnabled?`<label class="label" for="desk-operator-token">Operator token (never the Clocked API key)</label><input class="inline-input" id="desk-operator-token" type="password" autocomplete="off" placeholder="Paste local operator token" value="${h(state.operatorToken)}"/>`:'<small>Offline demonstration makes no API requests. Launch with -Live for a deliberate per-scene model scan.</small>'}
 <small>The multi-scene pilot is limited to exactly 2 unchanged source rows and at most 8 independently billed Decide calls. No automatic retries. No model result for a scene means NOT EVALUATED. Model answers never establish official permission. Scene edits or changes to the permit/call sheet invalidate linked model results. ${total>8?'More than 8 detected clauses — this pilot refuses truncated scanning.':''}</small></div>`;
}
function desk(result){const scenes=result.scenes;const scene=scenes.find(x=>x.id===state.selectedScene)||scenes[0];if(!scene)return `<div class="panel empty-workspace">No verified scene rows. Open Source intake and supply explicitly formatted scene rows. No clearance checks are possible.</div>`;
 const sceneFindings=result.findings.filter(x=>x.sceneId===scene.id); const count=sceneFindings.length;
 return `<div class="workspace"><aside class="panel rail"><div class="panel-head"><div><div class="subhead">SCHEDULE / ${state.challenge?'M3-S6 / '+state.challenge.id:state.caseId==='F01'?'CS-11':state.caseId.startsWith('M3B')?'M3-S5':'CS-12'}</div><h2 class="rail-heading">Scheduled scenes</h2></div><span class="roundcount">${scenes.length} ROWS</span></div><div class="scene-rail">${scenes.map(s=>sceneCell(s,result.findings)).join('')}<div class="rail-foot"><strong>Format-aware intake.</strong><br />Pipe-delimited scenes parsed locally, never grouped by AI. ${result.unsupported.length?`${result.unsupported.length} unsupported row(s) require manual action.`:'Original row offsets retained.'}</div></div></aside>
 <section class="panel detail"><div class="detail-hero"><div class="detail-top">● &nbsp; SCENE REVIEW &nbsp; / &nbsp; ${h(state.challenge?(state.challenge.id==='U01'?'SUNDAY 08 NOV':'MONDAY 09 NOV'):state.caseId==='F01'?'THURSDAY 05 NOV':state.caseId.startsWith('M3B')?'THURSDAY 05 NOV':'SATURDAY 07 NOV')} &nbsp; / &nbsp; NOT APPROVED</div><div class="detail-headline"><h2>Scene ${h(scene.number)} <span class="muted-divider">/</span> ${h(scene.location)}</h2><span>${h(scene.start||'--:--')}</span></div><p class="scene-activity">${h(scene.activity||'Activity unspecified.')} ${scene.edited?'<span class="human-edited-note">· HUMAN-EDITED</span>':''}</p></div>${timeline(scene,result)}${semanticDeskPanel(scene)}<div class="finding-title"><h3>Preflight findings</h3><span class="roundcount">${count} FINDING${count===1?'':'S'}</span></div><div class="finding-list">${sceneFindings.length?sceneFindings.map(f=>`<button class="finding ${f.severity} ${state.selectedFinding===f.id?'active':''}" data-finding="${h(f.id)}"><span class="finding-icon">${f.severity==='issue'?'!':'?'}</span><span class="finding-body"><strong>${h(f.title)}</strong><p>${h(f.detail)}</p><span class="f-foot">${f.type==='clocked'?'CLOCKED MODEL · HUMAN REVIEW':f.severity==='issue'?'DOCUMENTED MISMATCH':'UNRESOLVED QUESTION'} ${state.reviewed.has(f.id)?' · ACKNOWLEDGED':''}<span class="arrow">↗</span></span></span></button>`).join(''):`<div class="empty-state"><strong>Within the presently documented checks.</strong><br/>No detected mismatch for this scene. This is not evidence of permission or completeness.</div>`}</div></section>${inspector(result,scene)}</div>`;
}
function fieldsTable(result){const fields=result.terms;let keys=['permitId','location','date','start','end','sound','drone','equipment'];if(state.profile==='variation')keys=['permitId','location','date','end','variation.id','variation.location','variation.date','variation.end','variation.pendingSouth'];return `<div class="fieldlist">${keys.map(k=>{const parts=k.split('.'),v=parts.length===2?fields.variation?.[parts[1]]:fields[k];const editable=['location','date','start','end','sound','drone'].includes(k);const edit=state.editingField===k;return `<div class="fielditem"><b>${title(k)} ${editable?`<button data-edit-field="${h(k)}">${edit?'CANCEL':'EDIT'}</button>`:''}</b>${edit?`<input class="inline-input" data-override="${h(k)}" value="${h(state.manualFields[k]??v?.value??'')}" /><button class="save-override" data-save-override="${h(k)}">APPLY UNVERIFIED VALUE</button>`:`<span>${h(v?.value??'— unknown —')}</span>`}<small>${v?.manual?'HUMAN INPUT / UNCITED':v?.valid?'SOURCE OFFSET VERIFIED':v?.value?`PROVENANCE WARNING: ${h(v.reason||'unverified')}`:'NOT ESTABLISHED'}</small></div>`;}).join('')}</div>`;}
function sources(result){return `<div class="editor"><section class="panel"><h2>01 / Issued source</h2><p class="help">Paste plain-text permit language. Editing invalidates any previously recorded Clocked result until a new extraction is requested. Do not paste real private production documents into public demo deployments.</p><div class="quickselect"><button class="ghost" data-preset="F01">LOAD FP-1042</button><button class="ghost" data-preset="F02">LOAD VARIATION V-9</button></div><label class="label" for="permit-editor">Location authorization / permit terms</label><textarea id="permit-editor" class="inputarea" spellcheck="false">${h(state.permitText)}</textarea><div class="formline mt-11"><button class="button-main" id="apply-permit">APPLY TEXT / CLEAR OLD EXTRACT</button><button class="ghost" id="restore-recorded">RESTORE VERIFIED REPLAY</button></div><div class="fileinfo"><b>Source mode:</b> ${h(state.sourceMode.toUpperCase())}. Replay fixtures contain genuine owner-recorded Clocked outputs on entirely synthetic text; they are not simulated live calls.</div><div class="section-title mt-20">Current permit readings</div>${fieldsTable(result)}
 <div class="live"><h3>Clocked Extract / controlled live request</h3><p class="help">The server calls <code>POST /clocked/extract</code> using a server-side API key. A separate operator token is required so visitors cannot spend your credits. Live calls may cost credits; no auto retries.</p><div class="formline"><input id="operator-token" type="password" class="inline-input" placeholder="Operator token, not Clocked API key" autocomplete="off" value="${h(state.operatorToken)}" /><button class="button-main" id="live-extract" ${!state.liveEnabled||state.busy?'disabled':''}>${state.busy?'EXTRACTING...':'RUN LIVE EXTRACT'}</button></div><div class="disclaimer">${state.liveEnabled?'Live integration is configured on the server.':'Live integration is disabled. Start with -Live to enable operator-gated API calls.'} Never paste your Clocked API key into this page.</div></div></section>
 <section class="panel"><h2>02 / Scene intake</h2><p class="help">For this plain-text pilot, only explicit <strong>Scene | Location | HH:MM-HH:MM | Activity</strong> rows are supported. Unsupported lines must be reviewed, not silently guessed.</p><label class="label" for="call-editor">Call sheet / draft shot schedule</label><textarea id="call-editor" class="inputarea" spellcheck="false">${h(state.callSheetText)}</textarea><div class="formline mt-11"><button class="button-main" id="parse-scenes">PARSE SCENE ROWS</button><span class="pill">${result.scenes.length} ROWS PARSED</span><span class="pill">${result.unsupported.length} UNSUPPORTED</span></div><p class="secondary-hint">Source ranges are calculated within each row. This avoids the R7 failure where Clocked assigned the scene number inside another scene's time.</p><div class="separator"></div><div class="section-title">Correct current scene values</div><p class="help">Corrections are marked uncited and require separate reviewer sign-off. Changes affect findings immediately.</p>${result.scenes.map(s=>`<div class="proof-card proof-card-padded"><div class="section-row"><strong>SCENE ${h(s.number)}</strong><small class="text-muted">${s.edited?'HUMAN CORRECTION':'PARSED FROM ROW'}</small></div><div class="twofields"><label><span class="label">Location</span><input class="inline-input" data-scene-input="${h(s.id)}:location" value="${h(s.location)}" /></label><label><span class="label">Start (24h)</span><input class="inline-input" data-scene-input="${h(s.id)}:start" value="${h(s.start)}" /></label><label><span class="label">End (24h)</span><input class="inline-input" data-scene-input="${h(s.id)}:end" value="${h(s.end)}" /></label><label><span class="label">Activity</span><input class="inline-input" data-scene-input="${h(s.id)}:activity" value="${h(s.activity)}" /></label></div><div class="formline mt-12"><button class="ghost" data-save-scene="${h(s.id)}">APPLY MANUAL CORRECTION</button></div></div>`).join('')}${result.unsupported.length?`<div class="warning">${result.unsupported.length} unsupported scene lines found. ${h(result.unsupported.map(x=>x.line).join(' | '))}. They have NOT been evaluated.</div>`:''}</section></div>`;}
function semanticLens(){
 const x=state.semantic;const cs=x.clauses;const selected=cs.find(v=>v.start===x.selected)||null;
 const r=x.result;const f=r?.finding;
 const pct=p=>typeof p==='number'?(p*100).toFixed(1)+'%':'unavailable';
 const good=r&&selected&&r.clause.start===selected.start&&r.clause.end===selected.end && r.clause.text===selected.text;
 return `<div class="semantic-layout"><section class="panel semantic-left"><div class="kicker">M3-S2 / CLOCKED CONDITION SWEEP</div><h2>Find what a scene <em>actually triggers.</em></h2><p class="help">This is a distinct Clocked Decide capability. Ordinary time calculations do not recognize that a dry-ice atmosphere falls under a vapor-effects clause. The model must establish that relationship. No simulated model answers are shown.</p>
 <div class="quickselect"><button class="ghost" data-semantic-case="M3A">UNSEEN VAPOR PARAPHRASE / M3A</button><button class="ghost" data-semantic-case="M3B">SIGNED CONTRAST / M3B</button><button class="ghost" data-semantic-case="M3N">UNRELATED CONTROL / M3N</button><button class="ghost" data-semantic-case="C02">R8 REPLAY TEXT / C02</button><button class="ghost" data-semantic-case="C06">SIGNED CLEARANCE / C06</button><button class="ghost" data-semantic-case="C01">PA & EVENING BELL / C01</button><button class="ghost" data-semantic-case="C05">SIGNED SOUND PERMISSION / C05</button><button class="ghost" id="semantic-current">USE CURRENT PERMIT + SCENE</button></div>
 ${x.packet?`<div class="fileinfo"><strong>Source pair:</strong> ${h(x.packet.id)} · ${h(x.packet.id==='M3N'?'Negative control / pyrotechnics unrelated to sculpture':x.packet.title)}<br/>FICTIONAL EXAMPLE · UNVERIFIED SOURCE AUTHENTICITY · NOT FILMING CLEARANCE</div><div class="section-title mt-20">01 / Scene source — verbatim</div><div class="semantic-quote">${h(x.packet.scene)}</div><div class="section-title mt-20">02 / Permit clauses — operator selects full excerpt</div><p class="help">These candidates are separated by punctuation, not a hazard keyword dictionary. Their relevance is unknown until Clocked Decide runs. Choosing a clause is an explicit human input, not model discovery.</p><div class="semantic-choices">${cs.map((c,i)=>`<button class="semantic-choice ${x.selected===c.start?'selected':''}" data-semantic-clause="${c.start}" aria-pressed="${x.selected===c.start}"><small>CLAUSE ${i+1} · SOURCE CHARACTERS ${c.start}–${c.end}</small><span>${h(c.text)}</span></button>`).join('')}</div>${selected?`<div class="proof-card"><div class="proof-title">SELECTED EXACT SOURCE · [${selected.start},${selected.end})</div><div class="proof-value">${h(selected.text)}</div></div>`:''}`:'<div class="empty-state">Choose one of the four original frozen R8 fictional cases, or load the current reviewed permit and scene.</div>'}
 </section><section class="panel semantic-right"><div class="panel-head"><h2>Clocked intelligence</h2><span class="roundcount">DECIDE / NOUL × 2</span></div><div class="semantic-result"><div class="kicker">MODEL CONTRIBUTION</div><h3>${f&&good?h(f.title):'No semantic insight yet'}</h3><p class="help">${f&&good?h(f.explanation):'No link has been inferred locally. A live, operator-authorized Clocked Decide call is required to analyze whether this scene activity is related to the selected permit condition.'}</p>
 ${f&&good?`<div class="semantic-score"><div><small>ACTIVITY LINK PROBABILITY</small><strong>${pct(f.relevance)}</strong></div><div><small>DOCUMENTED GRANT PROBABILITY</small><strong>${pct(f.grant)}</strong></div></div><div class="fileinfo"><strong>Status:</strong> ${h(f.code)} / ${h(f.status)}<br/><strong>Clocked endpoint:</strong> ${h(r.endpoint)}<br/><strong>Credits reported:</strong> ${h(r.reportedCredits??'unknown')}<br/><strong>Request SHA-256:</strong> <code>${h(r.requestHash)}</code></div>`:'<div class="semantic-locked">OFFLINE BASELINE: NO SEMANTIC LINK / NOT EVALUATED<br/>Time, location and call-sheet checks remain functional without Clocked. No equivalent dry-ice-to-vapor insight is supplied by local code.</div>'}
 <div class="separator"></div><div class="section-title">03 / Clocked candidate sweep (NEW)</div><p class="help">No operator-selected clause is needed. Source segmentation enumerates each detected clause; Clocked Decide tests each against the complete scene row. Pilot cap: 8 clauses, one billable request per clause, sequential, NO automatic retries. This is NOT complete legal clause discovery: complex, missing or fragmented conditions remain unverified.</p>
 <button class="button-main semantic-run" id="run-sweep" ${!state.liveEnabled||!x.packet||x.busy?'disabled':''}>${x.busy?'SCAN IN PROGRESS...':`ANALYZE ALL ${cs.length} DETECTED CLAUSES WITH CLOCKED ↗`}</button>
 ${x.scan?`<div class="fileinfo"><strong>MODEL-LED CANDIDATE SCAN</strong><br/>Attempted ${x.scan.attempts} / ${x.scan.candidatesDetected} · Evaluated ${x.scan.candidatesEvaluated} · Reported credits ${x.scan.reportedCredits??'UNKNOWN (partial or failed request)'} · ${x.scan.complete?'All detected candidates evaluated; NOT full permit authority.':'INCOMPLETE — unresolved review required.'}${x.scan.error?`<br/><strong>${h(x.scan.error)}</strong>`:''}${x.scan.sourceUnscanned?.length?`<br/><strong>UNCOVERED SOURCE CHARACTERS: ${x.scan.sourceUnscanned.length} fragment(s). Manual review required; a short condition may have been omitted.</strong>`:''}</div><div class="scan-results">${(x.scan.results||[]).slice().sort((a,b)=>(b.finding.relevance??-1)-(a.finding.relevance??-1)).map(c=>`<button class="scan-result" data-semantic-clause="${c.range[0]}"><small>CLAUSE ${c.index} · [${c.range[0]},${c.range[1]}) · ${h(c.finding.code)}</small><strong>${pct(c.finding.relevance)} activity · ${pct(c.finding.grant)} grant</strong><span>${h(c.clause)}</span></button>`).join('')}</div><button class="ghost semantic-export" id="export-sweep">EXPORT RAW-ANSWER SWEEP EVIDENCE (JSON)</button>`:''}
 <div class="separator"></div><div class="section-title">04 / One selected-clause request</div><p class="help">The server sends only the selected exact source clause and complete scene row to Clocked Decide, with two narrowly scoped questions. The API key stays on the server. One click = at most one billable request; no retries.</p><label class="label" for="semantic-token">Operator token (NOT the Clocked API key)</label><input id="semantic-token" class="inline-input" type="password" value="${h(state.operatorToken)}" autocomplete="off" placeholder="Paste separate operator token" /><button class="button-main semantic-run" id="run-semantic" ${!state.liveEnabled||!selected||x.busy?'disabled':''}>${x.busy?'CLOCKED IS ANALYZING...':'RUN CLOCKED SEMANTIC LINK ↗'}</button><p class="secondary-hint">${state.liveEnabled?'Live server is configured. Each click may consume credits.':'Replay-only server: start scripts\Run-BeforeRoll.ps1 -Live to enable actual Clocked analysis.'}</p><button class="ghost semantic-export" id="export-semantic" ${r&&good?'':'disabled'}>EXPORT ORIGINAL CLOCKED SEMANTIC EVIDENCE (JSON)</button><div class="warning">Decide probabilities are model judgments, not evidence that a permit is genuine, signed, or legally sufficient. Both source quotations must be inspected by a human. An uncertain result never means permission.</div></div></section></div>`;
}
async function loadSemanticPreset(id){
 const r=await fetch('/fixtures/M3',{cache:'no-store'});if(!r.ok)throw Error('M3 synthetic fixture unavailable');
 const doc=await r.json();const item=doc.cases.find(v=>v.id===id);if(!item)throw Error('Unknown M3 case');
 const clauses=sentenceCandidates(item.permit);
 state.semantic={packet:{...item},clauses,selected:(clauses.slice().sort((a,b)=>b.text.length-a.text.length)[0]||{}).start??null,result:null,scan:null,busy:false};
 state.tab='semantic';render();toast(`${id} loaded. No model result until a real Clocked Decide call.`);
}
function loadSemanticCurrent(){
 const scene=state.scenes.find(v=>v.id===state.selectedScene);
 if(!scene||!state.permitText||!state.callSheetText)throw Error('Load a permit and scene first.');
 if(scene.edited)throw Error('This scene has unverified manual edits. Semantic Lens requires an unchanged original scene row; reparse or use the synthetic demonstration cases.');
 const row=sourcePointSlice(state.callSheetText,scene.source.start,scene.source.end);
 const clauses=sentenceCandidates(state.permitText);
 state.semantic={packet:{id:'CURRENT',title:'Current source intake (not authenticated)',permit:state.permitText,scene:row,origin:'User source content'},clauses,selected:clauses[0]?.start??null,result:null,scan:null,busy:false};
 state.tab='semantic';render();toast('Current source loaded. No semantic result inferred.');
}
function exportSweepEvidence(){const r=state.semantic.scan;if(!r)throw Error('No Clocked sweep evidence to export');const blob=new Blob([JSON.stringify({...r,researchPacketId:state.semantic.packet?.id,verdictAuthority:'MODEL_PROBABILITIES_NOT_CLEARANCE'},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`BEFOREROLL_M3_S2_SWEEP_${state.semantic.packet?.id||'CUSTOM'}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);toast('Sweep evidence exported; review before sharing.');}
async function runSweep(){
 const x=state.semantic;if(!x.packet||x.busy)throw Error('Load a scene and permit first');
 if(!state.liveEnabled)throw Error('Start the server with -Live');
 if(x.clauses.length===0||x.clauses.length>8)throw Error('This bounded sweep requires 1–8 detected clauses. Larger documents require review; no truncation.');
 const token=document.querySelector('#semantic-token')?.value||state.operatorToken;
 if(!token)throw Error('Enter the separate operator token, not the Clocked API key');
 state.operatorToken=token;
 if(!confirm(`Authorize up to ${x.clauses.length} sequential, separately billable Clocked Decide requests? Individual charges are unknown. No retries. This does not certify permits.`))return;
 x.busy=true;x.scan=null;render();
 try{
  const res=await fetch('/api/semantic-sweep',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify({permitText:x.packet.permit,sceneRow:x.packet.scene}),cache:'no-store'});
  const data=await res.json();if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);
  if(data.scene?.text!==x.packet.scene||data.candidatesDetected!==x.clauses.length)throw Error('Returned scan does not match current scene/candidate count; evidence rejected');
  for(const c of data.results||[]){const candidate=x.clauses.find(v=>v.start===c.range?.[0]&&v.end===c.range?.[1]);if(!candidate||candidate.text!==c.clause)throw Error('Returned span mismatch; results rejected');}
  x.scan=data;toast(data.complete?'Clocked evaluated each detected clause. No filming clearance.':'Sweep partially completed. Review uncertainty; no retries.');
 }catch(e){x.scan=null;toast(`Sweep stopped: ${e.message}. Billing may be unknown; do not retry automatically.`,true);}
 finally{x.busy=false;render();}
}
function exportSemanticEvidence(){const r=state.semantic.result;if(!r)throw Error('No live Clocked decision to export');const blob=new Blob([JSON.stringify({...r,researchPacketId:state.semantic.packet?.id,verdictAuthority:'MODEL_PROBABILITIES_NOT_CLEARANCE'},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`BEFOREROLL_M3_LIVE_DECIDE_${state.semantic.packet?.id||'CUSTOM'}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);toast('Clocked evidence exported; verify before sharing.');}
async function runSemantic(){
 const x=state.semantic;const clause=x.clauses.find(c=>c.start===x.selected);
 if(!state.liveEnabled||!clause||!x.packet||x.busy)return;
 const token=document.querySelector('#semantic-token')?.value||state.operatorToken;
 if(!token)throw Error('Paste the separate operator token from the server, not the API key.');
 state.operatorToken=token;
 if(!confirm('Send one fictional scene and selected permit clause to Clocked Decide now? This may consume credits. No retries.'))return;
 x.busy=true;render();
 try{
  const res=await fetch('/api/semantic',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify({permitText:x.packet.permit,sceneRow:x.packet.scene,start:clause.start,end:clause.end}),cache:'no-store'});
  const data=await res.json();if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);
  if(data.clause?.text!==clause.text||data.scene?.text!==x.packet.scene)throw Error('Returned evidence does not match the selected source.');
  x.result=data;toast('Clocked Decide responded. Review uncertainty and complete source quotes.');
 }catch(e){x.result=null;toast(`Semantic analysis stopped: ${e.message}. Do not retry automatically; billing may be unknown.`,true);}
 finally{x.busy=false;render();}
}
function method(result){return `<div class="about"><section class="panel"><div class="kicker">THE METHOD / FIVE STEPS</div><h2 class="mt-15">Receipts, not reassurance.</h2><p class="help">BeforeRoll is a production-operations review desk, not a permit issuer, legal opinion, or official approval system. It separates semantic source reading from deterministic scheduling checks.</p>
 ${[['01','Read the issued source','Clocked Extract returns verbatim fields with character offsets. Application requests are deliberately distinguished from issued terms.'],['02','Verify evidence positions','Only exact substring offsets are displayed as source citations. Same-paragraph authority is required before automatic application of a variation.'],['03','Parse scenes without AI rows','The strict Scene | Location | Window | Activity adapter uses local row boundaries; unsupported formats are explicitly rejected for manual review.'],['04','Clocked evaluates scene conditions','Clocked Decide tests each candidate permit clause against each scene description. Source-bound semantic judgments appear as review findings. Local code handles exact time/location arithmetic; missing model evidence is NOT EVALUATED.'],['05','Record human decisions','Scenes can be corrected, findings acknowledged, and an evidence dossier exported. Acknowledgement is never authorization.']].map(([n,t,d])=>`<div class="step"><b>${n}</b><div><h3>${h(t)}</h3><p>${h(d)}</p></div></div>`).join('')}</section><section class="panel"><h2>Independent evidence</h2><p class="help">These labels are tied to real owner-run API responses to synthetic text on 24 October 2026.</p><ul><li>R7 F01: 8/8 preregistered permit values correct.</li><li>R7 F02: 7/7 values correct; variation scope references pointed to the base permit — flagged here.</li><li>R7 F03: only 5/12 supplemented scene cells both correct and sourced to their own row. We do <strong>not</strong> trust Clocked for call-sheet row extraction.</li><li>20 observed API credits across R7 F01–F03; no costs incurred from using replay.</li><li>Small, synthetic samples: no real-world reliability, permit authenticity or market validation demonstrated.</li></ul><div class="warning">Synthetic research evidence only. Do not use BeforeRoll to certify real filming permissions. Verify with the issuing authority and qualified location manager.</div><div class="separator"></div><h2>Historical experiment scope (before the production workspace)</h2><p class="help">✅ Runnable review UI · ✅ actual owner-recorded Extract and Decide evidence · ✅ up to two scene rows in one bounded live Decide batch · ✅ source offsets · ✅ row-safe parsing · ✅ stale-evidence invalidation · ✅ human corrections and report export · ✅ test suite.<br /><br />Not delivered: general multi-scene scalability, complete clause discovery, PDF parsing/OCR, verified permit provenance, signed-amendment precedence engine, independently tested real-world permits, persistent collaboration, public deployment, user interviews, or competition submission.</p></section></div>`;}
function header(result){return `<a class="skip-link" href="#research-main">Skip to research</a><header class="studio-header"><button class="wordmark" data-tab="projects">BeforeRoll<span>.</span></button><nav aria-label="Historical research"><button data-tab="projects">Production workspace</button><button data-tab="desk">Recorded experiments</button><button data-tab="sources">Experiment sources</button><button data-tab="semantic">Semantic lens</button><button data-tab="method">Method & limits</button></nav><button id="export-report">Export research notes</button></header><div class="context-bar"><span>Historical research archive</span><span>Earlier experiments · fictional material · separate from production evidence</span></div><div id="research-main" class="research-intro"><h1>Trace the experiment.</h1><p>These earlier research surfaces retain their original evidence and contract labels. Use Production workspace for the current durable application.</p></div>`;}
function render(){if(state.tab==='projects'){
  workspaceController.model.evaluationResetPending=state.evaluationResetPending===true;
  app.innerHTML=workspaceController.render();workspaceController.restoreDrafts();return;
 }
 const result=compute();const fallback=result.scenes.find(s=>s.id===state.selectedScene);if(!fallback&&result.scenes.length)state.selectedScene=result.scenes[0].id;
 app.innerHTML=header(result)+(state.tab==='desk'?desk(result):state.tab==='sources'?sources(result):state.tab==='semantic'?semanticLens():method(result))+`<footer class="footer"><span><strong>BEFOREROLL / EXPERIMENT 001</strong> · Fictional source texts · Human review required</span><span>Clocked Extract + Decide · server-side key only · No user documents stored on server</span></footer>`;applyCspSafeGeometry();}
async function preset(id){if(!['F01','F02'].includes(id))return;const r=await fetch('/fixtures/'+id,{cache:'no-store'});if(!r.ok)throw Error('Recorded fixture failed to load');const data=await r.json();state.record=data;state.challenge=null;state.caseId=id;state.profile=id==='F01'?'standard':'variation';state.permitText=data.source;state.callSheetText=id==='F01'? (await (await fetch('/fixtures/F03',{cache:'no-store'})).json()).source:FALLBACK_F02_CALLSHEET;state.scenes=parseCallSheet(state.callSheetText).scenes;state.fields=data.fields;state.sourceMode='recorded';state.replayCredits=data.credits;state.selectedScene=id==='F01'?'S15':'S21';state.selectedFinding=null;state.sourceDoc='permit';state.reviewed.clear();state.manualFields={};state.editingField=null;clearDeskClocked();state.tab='desk';render();toast(`${id} loaded · actual recorded Clocked response on fictional text`);}
async function loadOwnerRecordedDesk(){
 const [packetReq,sweepReq]=await Promise.all([fetch('/fixtures/M3',{cache:'no-store'}),fetch('/fixtures/M3B_OWNER_SWEEP',{cache:'no-store'})]);
 if(!packetReq.ok||!sweepReq.ok)throw Error('Owner-recorded demo fixture unavailable');
 const packets=await packetReq.json(),scan=await sweepReq.json(),item=packets.cases.find(v=>v.id==='M3B');
 if(!item)throw Error('M3B frozen source is missing');
 const parsed=parseCallSheet(item.scene);if(parsed.scenes.length!==1||parsed.unsupported.length)throw Error('M3B scene row invalid');
 // Bind to actual exact model evidence; any hash/offset or score mismatch rejects the replay.
 const bound=await auditDeskSweep({permitText:item.permit,sceneRow:item.scene,sceneId:parsed.scenes[0].id,scan,hash:localHash,origin:'recorded'});
 state.caseId='M3B';state.challenge=null;state.profile='standard';state.record=null;state.permitText=item.permit;state.callSheetText=item.scene;state.scenes=parsed.scenes;state.fields={};state.manualFields={};state.editingField=null;state.sourceMode='manual';state.replayCredits=null;state.reviewed.clear();
 clearDeskClocked();state.deskClocked.byScene[parsed.scenes[0].id]=bound;state.deskClocked.mode='owner-recorded';state.selectedScene=parsed.scenes[0].id;state.selectedFinding=(bound.findings.find(f=>f.clocked.finding.code==='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW'&&!f.title.includes('scope unverified'))||bound.findings[0])?.id??null;state.tab='desk';render();toast('Actual owner-recorded Clocked sweep replayed on its original fictional sources. No API credits spent.');
}
async function loadUnfamiliarChallenge(id){
 const res=await fetch('/fixtures/M3S6_UNFAMILIAR_CASES',{cache:'no-store'});
 if(!res.ok)throw Error('Frozen unfamiliar challenge inputs unavailable');
 const bundle=await res.json(),item=bundle.cases?.find(c=>c.id===id);
 if(!item||item.offline_only||item.scenes?.length!==2)throw Error('Select a supported two-scene pre-frozen challenge');
 if(await localHash(item.permit)!==item.permitSha256)throw Error('Original frozen permit source changed');
 for(let i=0;i<item.scenes.length;i++)if(await localHash(item.scenes[i])!==item.sceneSha256[i])throw Error('Frozen scene input changed');
 const parsed=parseCallSheet(item.scenes.join('\n'));
 const clauses=sentenceCandidates(item.permit);
 if(parsed.scenes.length!==2||parsed.unsupported.length||clauses.length!==4)throw Error('Challenge case format changed; no truncated Clocked experiment permitted');
 state.record=null;state.challenge={id:item.id,title:item.title,intent:item.intent};state.caseId='M3S6-'+item.id;state.profile='standard';
 state.permitText=item.permit;state.callSheetText=item.scenes.join('\n');state.scenes=parsed.scenes;
 state.fields={};state.manualFields={};state.editingField=null;state.sourceMode='manual';state.replayCredits=null;
 state.reviewed.clear();clearDeskClocked();state.semantic={packet:null,clauses:[],selected:null,result:null,scan:null,busy:false};state.selectedScene=parsed.scenes[0].id;state.tab='desk';render();
 toast('Pre-frozen fictional '+id+' loaded. No model results or credits. No source clause manually selected.');
}
async function loadFrozenOwnerReplay(id){
 if(!['U01','U02'].includes(id))throw Error('Unknown owner replay');
 await loadUnfamiliarChallenge(id); // always reset source and all prior AI first
 const res=await fetch(`/fixtures/M3S6_${id}_OWNER_RECORDED`,{cache:'no-store'});
 if(!res.ok)throw Error('Owner-recorded evidence missing');
 const data=await res.json();
 const originals=state.scenes.map(v=>({sceneId:v.id,sceneRow:originalSceneRow(v)}));
 if(data?.source!=='live-clocked-decide-multi-scene'||data.endpoint!=='decide'||data.notClearance!==true||data.complete!==true||data.error!==null||data.attempts!==8||data.totalPlannedCalls!==8||data.reportedCredits!==8||data.interpretationScope!=='SEGMENTED_CLAUSES_PER_SCENE_NOT_COMPLETE_PERMIT_AUTHORITY'||data.permitHash!==await localHash(state.permitText)||!Array.isArray(data.scenes)||data.scenes.length!==2)throw Error('Original owner replay metadata mismatch');
 const stage={};let attempts=0;
 for(let i=0;i<originals.length;i++){
  const original=originals[i],entry=data.scenes[i];
  if(!entry||entry.sceneId!==original.sceneId||entry.sceneRow!==original.sceneRow||entry.sceneHash!==await localHash(original.sceneRow)||entry.status!=='COMPLETE')throw Error('Original recorded scene mismatch');
  const bound=await auditDeskSweep({permitText:state.permitText,sceneRow:original.sceneRow,sceneId:original.sceneId,scan:entry.scan,hash:localHash,origin:'recorded'});
  if(!bound.complete||bound.checked.length!==4||bound.attempts!==4)throw Error('Replay candidate coverage incomplete');
  stage[original.sceneId]=bound;attempts+=bound.attempts;
 }
 if(attempts!==8)throw Error('Owner replay attempt accounting mismatch');
 state.deskClocked.byScene=stage;state.deskClocked.mode='owner-recorded-unfamiliar';state.deskClocked.batch=null;
 state.selectedFinding=null;state.reviewed.clear();state.tab='desk';render();
 toast(`Verified ${id} OWNER-RECORDED Clocked answers replayed offline. 0 new requests.`);
}
async function loadMultiSceneDemo(){
 // The only recorded model output belongs to Scene 31. Scene 32 is deliberately UNTESTED.
 await loadOwnerRecordedDesk();
 const original=state.callSheetText;
 state.callSheetText=original+'\n'+M3S4_SECOND_SCENE;
 const parsed=parseCallSheet(state.callSheetText);
 if(parsed.scenes.length!==2||parsed.unsupported.length||originalSceneRow(parsed.scenes[0])!==original)throw Error('Two-scene source fixture not row-safe');
 state.scenes=parsed.scenes;state.caseId='M3B-2SC';state.selectedScene=parsed.scenes[0].id;
 state.deskClocked.mode='owner-recorded';state.deskClocked.batch=null;render();
 toast('Scene 31 owner-recorded response preserved. Scene 32 explicitly NOT EVALUATED. Zero credits.');
}
async function loadTwoSceneRecordedEvidence(){
 // A previously owner-run live API result, rehydrated OFFLINE. Never label it a fresh live call.
 await loadMultiSceneDemo();
 const res=await fetch('/fixtures/M3S4_TWO_SCENE_RECORDED',{cache:'no-store'});
 if(!res.ok)throw Error('Frozen owner-recorded two-scene result is unavailable');
 const data=await res.json();
 const originals=state.scenes.map(v=>({sceneId:v.id,sceneRow:originalSceneRow(v)}));
 if(!data||data.source!=='live-clocked-decide-multi-scene'||data.endpoint!=='decide'||data.notClearance!==true||data.complete!==true||data.attempts!==8||data.reportedCredits!==8||data.interpretationScope!=='SEGMENTED_CLAUSES_PER_SCENE_NOT_COMPLETE_PERMIT_AUTHORITY'||data.permitHash!==await localHash(state.permitText)||!Array.isArray(data.scenes)||data.scenes.length!==originals.length)throw Error('Owner recording metadata/hash mismatch');
 const stage={};let attempts=0;
 for(let i=0;i<originals.length;i++){
  const entry=data.scenes[i],original=originals[i];
  if(!entry||entry.sceneId!==original.sceneId||entry.sceneRow!==original.sceneRow||entry.sceneHash!==await localHash(original.sceneRow)||entry.status!=='COMPLETE')throw Error('Recorded scene source mismatch');
  const b=await auditDeskSweep({permitText:state.permitText,sceneRow:original.sceneRow,sceneId:original.sceneId,scan:entry.scan,hash:localHash,origin:'recorded'});
  if(!b.complete||b.checked.length!==4)throw Error('Recorded case has incomplete candidate coverage');
  stage[original.sceneId]=b;attempts+=b.attempts;
 }
 if(attempts!==8)throw Error('Owner-recorded call count incorrect');
 state.deskClocked.byScene=stage;state.deskClocked.mode='owner-recorded-full';state.deskClocked.batch=null;
 state.selectedFinding=null;state.reviewed.clear();state.tab='desk';render();
 toast('Previously owner-run Clocked two-scene responses verified and replayed offline. NO new API calls or credits.');
}
async function runMultiSceneScan(){
 if(!state.liveEnabled||state.deskClocked.busy)throw Error('Run this only with the local live operator enabled');
 if(state.scenes.length!==2)throw Error('Exactly two original scene rows are required for this pilot');
 const candidates=sentenceCandidates(state.permitText);
 if(candidates.length<1||candidates.length*2>8)throw Error('Multi-scene maximum is 8 total calls. No truncated analysis allowed.');
 const scenes=state.scenes.map(v=>({sceneId:v.id,sceneRow:originalSceneRow(v)}));
 if(state.scenes.some(v=>v.edited)||scenes.some(v=>!v.sceneRow))throw Error('Original unedited scene source rows required');
 const token=document.querySelector('#desk-operator-token')?.value||state.operatorToken;
 if(!token)throw Error('Enter the separate operator token, never the Clocked API key');
 state.operatorToken=token;
 if(!confirm(`Authorize up to ${scenes.length*candidates.length} sequential, separately billable Clocked Decide calls across TWO scenes? Charges are unknown. No retries. Unattempted scenes will remain NOT EVALUATED. No filming clearance.`))return;
 state.deskClocked.busy=true;render();
 try{
  const permitSnapshot=state.permitText;
  const response=await fetch('/api/semantic-batch',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify({permitText:permitSnapshot,scenes}),cache:'no-store'});
  const data=await response.json();if(!response.ok)throw Error(data.error||`HTTP ${response.status}`);
  if(data.source!=='live-clocked-decide-multi-scene'||data.endpoint!=='decide'||data.notClearance!==true||data.interpretationScope!=='SEGMENTED_CLAUSES_PER_SCENE_NOT_COMPLETE_PERMIT_AUTHORITY'||data.permitHash!==await localHash(permitSnapshot)||!Array.isArray(data.scenes)||data.scenes.length!==scenes.length)throw Error('Invalid multi-scene envelope');
  if(!Number.isInteger(data.attempts)||data.attempts<0||data.attempts>scenes.length*candidates.length||data.totalPlannedCalls!==scenes.length*candidates.length||!Number.isInteger(data.observedKnownCredits)||data.observedKnownCredits<0||data.reportedCredits!==null&&(!Number.isInteger(data.reportedCredits)||data.reportedCredits<0))throw Error('Invalid batch accounting');
  let observedAttempts=0,blocked=false,completed=0;const stage={};
  for(let i=0;i<scenes.length;i++){
   const entry=data.scenes[i],expected=scenes[i];
   if(!entry||entry.sceneId!==expected.sceneId||entry.sceneRow!==expected.sceneRow||entry.sceneHash!==await localHash(expected.sceneRow))throw Error('Batch scene identity mismatch');
   if(entry.scan===null){if(entry.status!=='NOT_EVALUATED')throw Error('Untested scene mislabeled');blocked=true;continue;}
   if(blocked||!['COMPLETE','PARTIAL'].includes(entry.status))throw Error('Invalid scene result ordering/status');
   const bound=await auditDeskSweep({permitText:permitSnapshot,sceneRow:expected.sceneRow,sceneId:expected.sceneId,scan:entry.scan,hash:localHash,origin:'live'});
   if((entry.status==='COMPLETE')!==bound.complete)throw Error('Scene completeness mismatch');
   stage[expected.sceneId]=bound;observedAttempts+=bound.attempts;
   if(!bound.complete)blocked=true;else completed++;
  }
  if(observedAttempts!==data.attempts||Boolean(data.complete)!==(completed===scenes.length)||data.complete&&data.error!==null)throw Error('Multi-scene completion mismatch');
  // An operator may navigate or edit source text while network calls are still running.
  // A completed reply must NEVER resurrect model evidence after such an edit.
  if(state.permitText!==permitSnapshot||state.scenes.length!==scenes.length||
     scenes.some((original,i)=>state.scenes[i]?.id!==original.sceneId||state.scenes[i]?.edited||originalSceneRow(state.scenes[i])!==original.sceneRow))
   throw Error('Permit or scene sources changed while Clocked was running; old result discarded. Billing may have occurred.');
  // No partial attachment until every source hash, quote and answer has been verified.
  state.deskClocked.byScene=stage;state.deskClocked.batch=data;state.deskClocked.mode='live-multi';state.reviewed.clear();state.selectedFinding=null;
  toast(data.complete?`Clocked evaluated 2 scenes · ${data.attempts} requests · ${data.reportedCredits??'unknown'} credits. Still NOT CLEARANCE.`:'Partial assessment preserved; unattempted scenes NOT EVALUATED. No retries.',!data.complete);
 }catch(e){toast(`Batch stopped: ${e.message}. No automatic retry. Billing may be unknown.`,true);}
 finally{state.deskClocked.busy=false;render();}
}
function exportMultiEvidence(){
 const batch=state.deskClocked.batch;if(!batch)throw Error('No live multi-scene model evidence to export');
 const blob=new Blob([JSON.stringify(batch,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=u;a.download=state.challenge?.id?`BEFOREROLL_M3S6_${state.challenge.id}_LIVE_EVIDENCE.json`:'BEFOREROLL_M3S4_LIVE_TWO_SCENE_EVIDENCE.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);
 toast('Original multi-scene model evidence exported. Review for secrets before sharing.');
}
async function runDeskSceneScan(){
 const scene=state.scenes.find(v=>v.id===state.selectedScene);if(!scene||state.deskClocked.busy||!state.liveEnabled)throw Error('Select an unchanged scene and enable live mode');
 const row=originalSceneRow(scene);if(!row)throw Error('Manually edited scenes cannot be treated as original source evidence');
 const candidates=sentenceCandidates(state.permitText);if(!candidates.length||candidates.length>8)throw Error('Supported bounded scan requires 1–8 clauses; none can be omitted');
 const token=document.querySelector('#desk-operator-token')?.value||state.operatorToken;
 if(!token)throw Error('Paste your separate operator token; never the Clocked API key');
 state.operatorToken=token;
 if(!confirm(`Authorize up to ${candidates.length} sequential, independently billable Clocked Decide calls for Scene ${scene.number}? Charges are unknown; no retries. Not filming clearance.`))return;
 const permitSnapshot=state.permitText, sceneIdSnapshot=scene.id;
 state.deskClocked.busy=true;render();
 try{
  const res=await fetch('/api/semantic-sweep',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':token},body:JSON.stringify({permitText:permitSnapshot,sceneRow:row}),cache:'no-store'});
  const data=await res.json();if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);
  const current=state.scenes.find(v=>v.id===sceneIdSnapshot);
  if(state.permitText!==permitSnapshot||!current||current.edited||originalSceneRow(current)!==row)
   throw Error('Original permit or scene changed in flight; outdated model result discarded. Billing may have occurred.');
  state.deskClocked.batch=null;const linked=await attachToDesk(data,current,'live');
  if(!linked.complete)toast('Partial Clocked result retained for review. No automatic retry; prior billing may be unknown.',true);
  else toast(`Clocked reviewed Scene ${scene.number}: ${linked.findings.length} model review findings. No permission granted.`);
 }catch(error){toast(`Semantic scan stopped: ${error.message}. Do not retry automatically; billing may be unknown.`,true);}
 finally{state.deskClocked.busy=false;render();}
}
function csvLine(s){return String(s??'').replaceAll('|','/').replaceAll('\r',' ').replaceAll('\n',' ');}
function report(result){let s=`# BEFORE ROLL / FILM LOCATION PREFLIGHT\n\nExported: ${new Date().toISOString()}\nSource intake mode: ${state.sourceMode} (how the permit fields entered the app)\nClocked Decide execution provenance: ${aiMode()} (per-scene provenance listed below)\nDataset: ${state.caseId} · Synthetic example\nStatus: DRAFT HUMAN REVIEW / NOT FILMING CLEARANCE\n\n## Source packet\nPermit reference: ${csvLine(result.terms.permitId.value||'unknown')}\nScenes: ${result.summary.scenes} · Documented deterministic discrepancies ONLY: ${result.summary.issues} · Clocked review findings: ${result.clockedAttached} · Open review questions (including Clocked): ${result.summary.reviews} · Unsupported source rows: ${result.summary.unsupportedRows}\n\n`;
 for(const scene of result.scenes){s+=`## Scene ${csvLine(scene.number)}: ${csvLine(scene.location)} (${csvLine(formatScene(scene))})\nActivity: ${csvLine(scene.activity)}${scene.edited?' [HUMAN-EDITED; uncited]':''}\nClocked semantic assessment: ${state.deskClocked.byScene[scene.id]?(state.deskClocked.byScene[scene.id].complete?'EVALUATED FOR SEGMENTED CLAUSES ONLY':'PARTIAL — HUMAN REVIEW REQUIRED'):'NOT EVALUATED — NO CLOCKED RESULT; NO PERMISSION INFERRED'}\n\n### Scene authority interpretation (not clearance)\n${authoritySummaryForDossier(sceneAuthoritySummary(state.deskClocked.byScene[scene.id]||null)).map(csvLine).map(x=>'- '+x).join('\n')}\n\n`;
  const fs=result.findings.filter(f=>f.sceneId===scene.id);
  if(!fs.length)s+='- No discrepancy detected in current checks; NOT clearance.\n';
  for(const f of fs){const p=proofQuote(f.evidence.permit,state.permitText);const row=scene.source?proofQuote({start:scene.source.start,end:scene.source.end},state.callSheetText):null;
   const citationClass=p&&row?'PERMIT + SCENE LINKED':p?'PERMIT CITED ONLY':row?'SCENE SOURCE ONLY':'CITATION UNVERIFIED';
   s+=`- **${f.severity.toUpperCase()} / ${csvLine(f.title)}** (${state.reviewed.has(f.id)?'ACKNOWLEDGED, NOT CLEARED':'OPEN'})\n  - Evidence class: ${citationClass}\n  - ${csvLine(f.detail)}\n${f.clocked?`  - CLOCKED DECIDE ${f.clocked.origin==='recorded'?'OWNER-RECORDED REPLAY':'LIVE'}: relevance ${f.clocked.finding.relevance}, documented grant ${f.clocked.finding.grant}\n  - Source clause ${f.clocked.index}; request SHA-256 ${f.clocked.requestHash}\n  - Documentary grant does NOT establish authority authenticity or prerequisite completion.\n`:''}  - Permit source: ${p?`“${csvLine(p)}” [${f.evidence.permit.start},${f.evidence.permit.end})`:'NOT SOURCE-LINKED'}\n  - Original scene row: ${csvLine(row||'MISSING')}\n`;
  }s+='\n';
 }
 if(state.challenge){s+=`## M3-S6 unfamiliar permit championship (preregistered, synthetic)\nCase: ${state.challenge.id} — ${csvLine(state.challenge.title)}\nExperiment: ${csvLine(state.challenge.intent)}\nAI-off baseline: original deterministic time/location/source-integrity checks only. No semantic synonym or clause-applicability inference.\nClocked status: ${aiMode()}; ${state.scenes.filter(v=>state.deskClocked.byScene[v.id]?.complete).length}/${state.scenes.length} scenes assessed for enumerated clauses.\nFrozen gold labels and the offline evaluation script are distributed in the repository; model correctness is NOT inferred from a green UI.\nNo unrestricted filming or effective document authority is inferred.\n\n`;}
 if(result.scenes.length>1){const b=state.deskClocked.batch;s+=`## Multi-scene Clocked assessment coverage\n${result.scenes.filter(v=>state.deskClocked.byScene[v.id]?.complete).length}/${result.scenes.length} scenes fully evaluated for segmented clauses ONLY. ${b?`Attempts ${b.attempts}/${b.totalPlannedCalls}; known credits ${b.observedKnownCredits}; ${b.complete?'BATCH COMPLETE':'BATCH INCOMPLETE / NOT CLEARED'}.`: state.deskClocked.mode==='owner-recorded-full'?'Owner-recorded M3-S4 live TWO-scene batch replayed offline; zero new calls or credits.':'No complete current multi-scene batch recorded; refer to individual scene provenance above.'}\nA missing result or negative model link never establishes filming permission.\n\n`; }
 if(Object.keys(state.deskClocked.byScene).length){s+='## Clocked Scene-Condition Preflight — source-bound findings\n';for(const [id,x] of Object.entries(state.deskClocked.byScene)){s+=`Scene ${csvLine(id)}: ${x.origin==='recorded'?'owner-recorded Clocked response':'live Clocked response'}; ${x.checked.length}/${x.candidates} detected clauses assessed; ${x.credits??'unknown'} reported credits. Coverage ${x.coverageWarning?'INCOMPLETE / MANUAL REVIEW':'SEGMENTED CANDIDATES ONLY'}.\n`;if(x.error)s+=`Incomplete: ${csvLine(x.error)}\n`;for(const c of x.checked)s+=`  - Clause ${c.index}: relevance ${c.finding.relevance}, grant ${c.finding.grant}, code ${c.finding.code}, quote “${csvLine(c.clause)}”, request ${c.requestHash}.\n`;}s+='No Clocked model score is filming authorization, a verification of permit authenticity, or proof prerequisites are fulfilled.\n\n';}
 if(state.semantic.result){const v=state.semantic.result; s+=`## Clocked Decide — semantic lens (separate experimental packet)\nSource pair: ${csvLine(state.semantic.packet?.id||'unknown')}\nFinding: ${csvLine(v.finding.title)} (${csvLine(v.finding.code)})\nActivity link probability: ${v.finding.relevance??'unavailable'}\nSpecific grant probability: ${v.finding.grant??'unavailable'}\nSelected source quote: ${csvLine(v.clause.text)} [${v.clause.start},${v.clause.end})\nScene row: ${csvLine(v.scene.text)}\nCredits: ${v.reportedCredits??'unknown'}\nRequest SHA-256: ${v.requestHash}\nNot an approval, finding remains human review.\n\n`; }
 s+=`## Integrity and scope limitations\n- Source intake and Clocked execution are separate provenance dimensions: MANUAL intake can coexist with LIVE Decide evidence. Use each scene's recorded/live status above; untested scenes are NOT EVALUATED.\n- M3-S2, M3-S4 and the U01/U02 M3-S6 owner-run source-bound evidence can be replayed with explicit OWNER-RECORDED provenance; a fresh LOAD FROZEN case remains NOT EVALUATED until an explicit live run or verified replay. Earlier R7 Extract research was a different stage.\n- Clocked model numbers are uncalibrated judgments; neither a high documented-grant score nor matching source offsets proves current permit authenticity, precedence, signer authority or prerequisite completion.\n- An extension or draft request may be unrelated to the current scene or lack authority; model relevance alone is never proof of an operative violation. The archived M3-S4 Scene 32 extension case is one example.\n- Segmentation may miss operative, fragmented or multi-paragraph conditions; 2/2 evaluated denotes only enumerated candidates, not complete permit authority.\n- Live results exist only for explicitly evaluated scenes identified above; other M3-S6 scenarios stay NOT EVALUATED. Unsupported source layout and missing data require review; acknowledgement never means clearance.\n- Scene-specific result hashes invalidate after permit or call-sheet edits; no model conclusion is inferred for uncovered evidence.\n- No Clocked API key or operator token is contained in this export.\n`;
 return s;}
function exportFile(result){const out=report(result);const blob=new Blob([out],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`BEFOREROLL_PREFLIGHT_${state.caseId}_${new Date().toISOString().slice(0,10)}.md`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Review dossier exported · not a filming authorization');}
async function runLive(){if(!state.liveEnabled||state.busy)return;const el=document.querySelector('#operator-token');if(el)state.operatorToken=el.value;if(!state.operatorToken){toast('Enter a separate operator token (never your Clocked API key).',true);return;}
 if(!confirm('Send the permit text to Clocked via the server now? This may consume credits. No automatic retries. Use fictional inputs for this prototype.'))return;
 state.busy=true;render();
 try{const r=await fetch('/api/extract',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':state.operatorToken},body:JSON.stringify({text:state.permitText,profile:state.profile}),cache:'no-store'});
 const data=await r.json();if(!r.ok)throw Error(data.error||`HTTP ${r.status}`);
 state.fields=data.fields;clearDeskClocked();state.sourceMode='live';state.replayCredits=data.credits;state.manualFields={};state.reviewed.clear();state.selectedFinding=null;state.tab='desk';toast(`Live Extract returned · reported credits ${data.credits??'unknown'}. Review all source anchors.`);
 }catch(e){toast(`Live extraction stopped: ${e.message}. No automatic retry; billing may be unknown.`,true);}
 finally{state.busy=false;render();}
}
app.addEventListener('click',async(e)=>{const el=e.target.closest('button');if(!el)return;if(el.id==='project-create')e.preventDefault();const result=state.tab==='projects'?null:compute();try{
 if(state.evaluationMode&&el.id==='evaluation-reset'){state.evaluationResetPending=true;workspaceController.captureDrafts();render();}
 else if(state.evaluationMode&&el.id==='evaluation-reset-cancel'){state.evaluationResetPending=false;render();}
 else if(state.evaluationMode&&el.id==='evaluation-reset-confirm'){state.evaluationResetPending=false;const response=await fetch('/api/evaluation/reset',{method:'POST'});const body=await response.json();if(!response.ok)throw Error(body.error||'Cannot reset examples');workspaceController.model.selected=null;workspaceController.model.activeSceneId=null;await workspaceController.load();await autoOpenExample();render();toast('Fictional examples reset. No owner data touched.');}
 else if(state.evaluationMode&&el.id==='evaluation-replay'){if(workspaceController.model.stagedReviews.length)throw Error('Commit or remove staged decisions before switching the recorded example.');const response=await fetch('/api/evaluation/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:'eval_arcade'})});const body=await response.json();if(!response.ok)throw Error(body.error||'Cannot replay recording');workspaceController.model.selected=null;await workspaceController.load();await autoOpenExample('eval_arcade');render();toast(body.alreadyReplayed?'U02 recording was already loaded. No new API calls.':'Original U02 answers replayed on matching fictional clauses. No new API calls.');}
 else if(el.dataset.tab){if(state.tab==='projects')workspaceController.captureDrafts();if(el.dataset.tab==='desk'&&!state.record)await preset('F01');else state.tab=el.dataset.tab;if(state.tab==='projects')await workspaceController.load();render();window.scrollTo({top:0,behavior:'smooth'});}
 else if(state.tab==='projects'){await workspaceController.click(el);render();
  if(workspaceController.model.error){const error=document.querySelector('[role="alert"]');if(error){error.tabIndex=-1;error.focus?.();error.scrollIntoView?.({block:'start'});}return;}
  const notice=document.querySelector('[role="status"]');
  if(notice&&el.id?.startsWith('project-'))notice.focus?.();
  if(el.dataset.designAction==='scene-search')document.querySelector('#design-scene-search')?.focus();
  if(el.dataset.designAction==='picker')document.querySelector('#design-production-search')?.focus();
  if(el.dataset.designAction==='close-picker')document.querySelector('.production-trigger')?.focus();
  const sourceTarget=el.dataset.designAction==='import'||el.dataset.designAction==='revise-call'||el.dataset.sourceMode==='revise'?'.intake-section':el.dataset.designAction==='source-reader'||el.dataset.sourceMode==='reader'?'.document-reader':['project-impact-permit','project-impact-call'].includes(el.id)?'.revision-preview':null;
  if(sourceTarget){const target=document.querySelector(sourceTarget);if(target){target.tabIndex=-1;target.focus?.();target.scrollIntoView?.({block:'start'});}}
  if(el.dataset.compareReviewScene||el.dataset.sceneFocus||el.dataset.sceneOpenTask||el.dataset.designAction&&['session','comparison','source-reader','recover'].includes(el.dataset.designAction)){const focus=document.querySelector('.page-heading')??document.querySelector('#workspace-main');focus?.focus?.();focus?.scrollIntoView?.({block:'start'});}
  const destination=el.dataset.historySelect?'[aria-label="Selected history record"]':el.dataset.workflowOpen||el.dataset.workflowAction||el.dataset.historyKind||el.dataset.projectOpen||el.id==='project-create'?'.production-active-step':null;
  if(destination){const target=document.querySelector(destination);if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start'});}}
 }
 else if(el.dataset.scene){state.selectedScene=el.dataset.scene;state.selectedFinding=null;state.sourceDoc='permit';render();}
 else if(el.dataset.finding){state.selectedFinding=el.dataset.finding;state.sourceDoc='permit';render();}
 else if(el.dataset.doc){state.sourceDoc=el.dataset.doc;render();}
 else if(el.dataset.openProof){state.sourceDoc=el.dataset.openProof;render();const target=document.querySelector('#source-raw mark');target?.scrollIntoView({behavior:'smooth',block:'center'});}
 else if(el.dataset.markReviewed){state.reviewed.has(el.dataset.markReviewed)?state.reviewed.delete(el.dataset.markReviewed):state.reviewed.add(el.dataset.markReviewed);render();}
 else if(el.id==='export-report')exportFile(result);
 else if(el.id==='load-owner-demo')await loadOwnerRecordedDesk();
 else if(el.dataset.unfamiliar)await loadUnfamiliarChallenge(el.dataset.unfamiliar);
 else if(el.dataset.ownerReplay)await loadFrozenOwnerReplay(el.dataset.ownerReplay);
 else if(el.id==='load-multi-demo')await loadMultiSceneDemo();
  else if(el.id==='load-two-scene-recorded')await loadTwoSceneRecordedEvidence();
 else if(el.id==='scan-all-scenes')await runMultiSceneScan();
 else if(el.id==='export-multi-evidence')exportMultiEvidence();
 else if(el.id==='scan-desk-scene')await runDeskSceneScan();
 else if(el.dataset.preset) await preset(el.dataset.preset);
 else if(el.id==='restore-recorded'){if(state.challenge)await loadUnfamiliarChallenge(state.challenge.id);else if(['F01','F02'].includes(state.caseId))await preset(state.caseId);else throw Error('Use the challenge case button or two-scene recorded replay to restore exact source inputs.');}
 else if(el.id==='apply-permit') {const text=document.querySelector('#permit-editor').value;if(text.length<20||text.length>20000)throw Error('Permit text must be 20–20,000 characters');if(text!==state.permitText){state.permitText=text;state.challenge=null;clearDeskClocked();state.semantic.result=null;state.semantic.scan=null;if(state.semantic.packet?.id==='CURRENT'){state.semantic.packet=null;state.semantic.clauses=[];state.semantic.selected=null;}state.fields={};state.sourceMode='manual';state.reviewed.clear();state.manualFields={};state.selectedFinding=null;toast('Old Clocked extracts invalidated; source text updated.');} else toast('No changes in permit text.');render();}
 else if(el.id==='parse-scenes'){const text=document.querySelector('#call-editor').value;if(text.length>20000)throw Error('Call sheet exceeds 20,000 characters');state.callSheetText=text;state.challenge=null;clearDeskClocked();state.semantic.result=null;state.semantic.scan=null;if(state.semantic.packet?.id==='CURRENT'){state.semantic.packet=null;state.semantic.clauses=[];state.semantic.selected=null;}state.scenes=parseCallSheet(text).scenes;state.selectedScene=state.scenes[0]?.id??null;state.reviewed.clear();state.selectedFinding=null;state.tab='desk';render();toast('Row-local parsing complete; review unsupported rows and values.');}
 else if(el.dataset.editField){state.editingField=state.editingField===el.dataset.editField?null:el.dataset.editField;render();}
 else if(el.dataset.saveOverride){const k=el.dataset.saveOverride,v=document.querySelector(`[data-override="${k}"]`)?.value?.trim();if(!v)throw Error('Manual corrections must have a value');state.manualFields[k]=v;clearDeskClocked();state.editingField=null;state.reviewed.clear();render();toast('Manual reading applied and marked uncited / needs review.');}
 else if(el.dataset.saveScene){const id=el.dataset.saveScene,scene=state.scenes.find(s=>s.id===id);if(!scene)throw Error('Scene missing');let newValues={};for(const k of ['location','start','end','activity'])newValues[k]=document.querySelector(`[data-scene-input="${id}:${k}"]`)?.value?.trim()??'';
 clearDeskClocked();state.challenge=null;Object.assign(scene,newValues,{edited:true,needsReview:!newValues.start||!newValues.end||!newValues.location});if(state.semantic.packet?.id==='CURRENT'){state.semantic.packet=null;state.semantic.clauses=[];state.semantic.selected=null;state.semantic.result=null;state.semantic.scan=null;}state.reviewed.clear();state.selectedScene=id;state.tab='desk';render();toast(`Scene ${scene.number} corrected; human sign-off required.`);}
 else if(el.id==='live-extract')await runLive();
 else if(el.dataset.semanticCase)await loadSemanticPreset(el.dataset.semanticCase);
 else if(el.dataset.semanticClause){state.semantic.selected=Number(el.dataset.semanticClause);state.semantic.result=null;render();}
 else if(el.id==='semantic-current')loadSemanticCurrent();
 else if(el.id==='run-semantic')await runSemantic();
 else if(el.id==='run-sweep')await runSweep();
 else if(el.id==='export-sweep')exportSweepEvidence();
 else if(el.id==='export-semantic')exportSemanticEvidence();
 }catch(error){toast(error.message,true);}
});
app.addEventListener('submit',async e=>{if(state.tab==='projects'){e.preventDefault();if(e.target.matches('.production-create')){await workspaceController.click({id:'project-create',dataset:{}});render();}}});
app.addEventListener('input',e=>{workspaceController.markDraftChange(e.target);if(e.target.id==='operator-token'||e.target.id==='semantic-token'||e.target.id==='desk-operator-token')state.operatorToken=e.target.value;});
window.addEventListener('beforeunload',e=>{if(workspaceController.hasUncommittedWork()){e.preventDefault();e.returnValue='';}});
if(typeof document.addEventListener==='function')document.addEventListener('change',event=>{if(state.tab==='projects'&&event.target?.id==='project-link-from')workspaceController.syncLinkUnits();if(state.tab==='projects'&&event.target?.id==='project-scene-auth-doc')workspaceController.syncSceneUnits();if(state.tab==='projects'&&event.target?.id==='project-condition-document')workspaceController.syncConditionUnits();});
async function autoOpenExample(id='eval_archive'){const response=await fetch('/api/workspaces/'+id,{cache:'no-store'});if(!response.ok)throw Error('Evaluation example unavailable');workspaceController.selectProduction(await response.json());await workspaceController.load();}
(async()=>{try{const health=await (await fetch('/api/health',{cache:'no-store'})).json();state.liveEnabled=Boolean(health.liveEnabled);state.evaluationMode=health.evaluationMode===true;if(health.workspacesEnabled){await workspaceController.load();if(state.evaluationMode)await autoOpenExample();state.tab='projects';render();}else await preset('F01');}catch(e){app.innerHTML=`<div class="loading-screen"><div class="kicker">LOAD FAILURE</div><h1>Could not open the production workspace.</h1><p>${h(e.message)}</p></div>`;}})();

// Presentation selection only; durable evidence mutations stay in the existing controller.
document.addEventListener?.('change',async event=>{
 if(state.tab!=='projects')return;const el=event.target,m=workspaceController.model;let handled=true;
 if(el.id==='design-mobile-scene')await workspaceController.click({dataset:{sceneFocus:el.value}});
 else if(el.id==='design-scene-source'){const t=m.sceneWorkbench?.tasks.find(x=>x.id===el.value);if(t)await workspaceController.click({dataset:{sceneOpenTask:t.id,taskPosition:String(t.globalTaskIndex),sceneTaskPosition:String(t.sceneTaskIndex),sceneView:'investigation'}});}
 else if(el.id==='design-intake-kind'){workspaceController.captureDrafts();m.intakeKind=el.value;}
 else if(el.id==='design-compare-doc-left'){m.compareLeftDocument=el.value;m.compareLeftUnit=null;}
 else if(el.id==='design-compare-doc-right'){m.compareRightDocument=el.value;m.compareRightUnit=null;}
 else if(el.id==='design-compare-scene')m.compareSceneId=el.value;
 else if(el.id==='design-compare-left')m.compareLeftUnit=el.value;
 else if(el.id==='design-compare-right')m.compareRightUnit=el.value;
 else handled=false;
 if(handled){render();const focus=document.querySelector('#'+el.id)??document.querySelector('.page-heading');focus?.focus?.();}
});
app.addEventListener('input',event=>{if(state.tab!=='projects')return;const el=event.target,m=workspaceController.model;if(el.id==='design-scene-search'||el.id==='design-production-search'){workspaceController.captureDrafts();m[el.id==='design-scene-search'?'sceneSearch':'productionSearch']=el.value;if(el.id==='design-scene-search')m.sceneRegisterOffset=0;render();document.querySelector('#'+el.id)?.focus();}});
