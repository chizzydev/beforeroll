// One-time extraction of accepted guarded forms. The controller remains in place.
import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const old=(await fs.readFile(new URL('public/workspace-desk.mjs',root),'utf8')).replaceAll('\r\n','\n');
if(!old.includes('function journeyNav'))throw Error('Expected checkpoint view boundary');
await fs.mkdir(new URL('public/workspace/',root),{recursive:true});
function between(a,b){const start=old.indexOf(a),end=old.indexOf(b,start+a.length);if(start<0||end<0)throw Error('Extraction boundary missing: '+a);return old.slice(start,end);}
const common=`import {esc,label} from './presentation.mjs';\nconst pane=()=>'';\nfunction context(model){const {selected,originals,overview,execution,authority,sceneAuthority,operations,dossier,actionQueue,impactPreview,consistency,liveEnabled,busy}=model;const current=selected?.workspace;const locked=busy?'disabled':'';const focusId=model.activeSceneId;const page=overview?.pagination;const task=overview?.tasks?.find(x=>x.id===model.selectedTask)??overview?.tasks?.[0]??null;const tasks=overview?.tasks??[];const execEntries=new Map((execution?.entries??[]).map(e=>[e.id,e]));const currentEntry=task?execEntries.get(task.id):null;return {selected,originals,overview,execution,authority,sceneAuthority,operations,dossier,actionQueue,impactPreview,consistency,liveEnabled,busy,current,locked,focusId,page,task,tasks,execEntries,currentEntry};}\n`;
const vars='selected,originals,overview,execution,authority,sceneAuthority,operations,dossier,actionQueue,impactPreview,consistency,liveEnabled,busy,current,locked,focusId,page,task,tasks,execEntries,currentEntry';
const sentence=s=>s.charAt(0)+s.slice(1).toLowerCase().replace(/\b(pdf|docx|csv|json|sha-256|iana|clocked)\b/g,x=>x==='clocked'?'Clocked':x.toUpperCase());
function polish(s){return s.replace(/(<button\b[^>]*>)([A-Z][A-Z0-9 /→↗()—+.,:-]+)(<\/button>)/g,(_,a,t,z)=>a+sentence(t)+z).replace(/<option>([A-Z_]+)<\/option>/g,(_,v)=>`<option value="${v}">${labelStatic(v)}</option>`).replace('<h2>03 / Documentary authority and precedence review</h2>','<h2>Document roles and relationships</h2>').replace('<h2>04 / Scene-specific documentary applicability</h2>','<h2>Scene-specific documentary scope</h2>');}
function labelStatic(x){return sentence(x.replaceAll('_',' '));}
async function module(name,functions){let text=common;for(const [fn,body] of functions)text+=`\nexport function ${fn}(model){const {${vars}}=context(model);return \`${polish(body)}\`;}\n`;await fs.writeFile(new URL('public/workspace/'+name,root),text);}
const authority=between('  <section class="production-box${pane(\'scope\',model.workflowStage)}" aria-label="Document authority relationships">','  <section class="production-box${pane(\'operations\',model.workflowStage)}');
const operations=between('  <section class="production-box${pane(\'operations\',model.workflowStage)}','  <section class="production-box${pane(\'analysis\',model.workflowStage)}');
const analysis=between('  <section class="production-box${pane(\'analysis\',model.workflowStage)}','</section>`:`<section class="production-box production-empty">')+'</section>';
const exports=between('  <section class="production-box${pane(\'evidence\',model.workflowStage)}','  <section class="production-box${pane(\'review\',model.workflowStage)}" aria-label="Source-bound production action queue">');
await module('authority-view.mjs',[['authorityView',authority]]);
await module('operations-view.mjs',[['operationsView',operations]]);
await module('analysis-view.mjs',[['analysisView',analysis]]);
await module('export-view.mjs',[['exportView',exports]]);
const source=between('  <section class="production-box${pane(\'sources changes\',model.workflowStage)}','  <section class="production-box${pane(\'scope\',model.workflowStage)}');
function part(a,b){const start=source.indexOf(a),end=source.indexOf(b,start+a.length);if(start<0||end<0)throw Error('Intake boundary '+a);return source.slice(start,end);}
const permit=part('<h3>Import permit or amendment</h3>','</div>\n  <div><h3>02 / Call sheet</h3>');
const pdf=part('${overview?.documents?.some(d=>d.pdfTranscription', '  <h3>Transcribe an original PDF/DOCX call sheet</h3>');
const manual=part('<h3>Transcribe an original PDF/DOCX call sheet</h3>','   <h3>Import call sheet</h3>');
const direct=source.slice(source.indexOf('<h3>Import call sheet</h3>'),source.lastIndexOf('</div></div></section>'));
const impact=part('<h2>Source change preview / read-only</h2>','</div>\n  <div class="production-source-grid">');
await module('intake-controls.mjs',[['permitControls',permit],['pdfVerification',pdf],['reviewedCallControls',manual],['callControls',direct],['impactControls',impact]]);
let history=between('function historyView(model,locked){','\nexport function productionView(model)');
history=history.replace('function historyView(model,locked){',"export function historyView(model){const locked=model.busy?'disabled':'';");
await fs.writeFile(new URL('public/workspace/history-view.mjs',root),`import {esc,label} from './presentation.mjs';\nconst pane=()=>'';\n`+polish(history));
// Replace the old 194-line view boundary with the authoritative new renderer.
const controller=old.slice(old.indexOf('export function createWorkspaceController'));
await fs.writeFile(new URL('public/workspace-desk.mjs',root),`import {productionView} from './workspace/view.mjs';\nexport {productionView};\nconst workflowStages=new Set(['overview','work','sources','scope','analysis','review','operations','changes','evidence','history']);\nconst stageForRoute={sources:'sources',authority:'scope','scene-authority':'scope',review:'review',execution:'analysis',operations:'operations',history:'history',changes:'changes',evidence:'evidence'};\n`+controller);
console.log('Extracted guarded forms; production controller preserved for navigation integration.');
