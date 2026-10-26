/** BeforeRoll M3-S6 self-hosted local server. No dependencies or browser-side API keys. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual,randomUUID,randomBytes} from 'node:crypto';
import {sha256,excerptFromRange,decideSemanticPayload,conservativeSemanticFinding} from './src/semantic.mjs';
import {extractPayload} from './src/engine.mjs';
import {sweepCandidatePlan,parseSweepReply,uncoveredSourceSpans,MAX_SWEEP_CLAUSES} from './src/semantic-sweep.mjs';
import {planMultiSceneBatch} from './src/multi-scene.mjs';
import {createProduction,applySourceImport,recordReview,importWorkspace,assertWorkspaceSources,confirmPdfTranscription} from './src/production-workspace.mjs';
import {inspectReviewedCallSheet} from './src/reviewed-call-sheet.mjs';
import {inspectImport} from './src/source-intake.mjs';
import {previewCallSheetOriginal} from './src/document-preview.mjs';
import {createWorkspaceStore} from './src/workspace-store.mjs';
import {workspaceDirectory} from './src/workspace-location.mjs';
import {MAX_PLAN_TASKS,planIntelligence} from './src/intelligence-workflow.mjs';
import {productionReview,verifyTaskForReview} from './src/production-review.mjs';
import {createDurableExecution} from './src/durable-execution.mjs';
import {annotateAuthorityDocument,recordAuthorityLink,projectAuthorityGraph,assertAuthorityIntegrity} from './src/document-authority.mjs';
import {recordSceneAuthority,projectSceneAuthority,assertSceneAuthorityIntegrity} from './src/scene-authority.mjs';
import {recordSceneSchedule,recordCondition,decideCondition,projectOperations,assertProductionOperationsIntegrity} from './src/production-operations.mjs';
import {projectDocumentaryReasoning} from './src/documentary-reasoning.mjs';
import {buildProductionDossier,dossierMarkdown} from './src/production-dossier.mjs';
import {buildProductionActions} from './src/production-actions.mjs';
import {buildSceneWorkbench} from './src/scene-workbench.mjs';
import {buildProductionJourney} from './src/production-journey.mjs';
import {certifyProductionConsistency} from './src/production-consistency.mjs';
import {previewReviewSession,commitReviewSession} from './src/review-session.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from './src/production-lifecycle.mjs';
import {createSourceOriginalVault,referencedOriginals} from './src/source-originals.mjs';
import {previewSourceChange,verifySourceChangeCommit} from './src/source-change-control.mjs';
import {createOwnerSecurity,trustedOwnerRequest} from './src/owner-security.mjs';
import {encryptOwnerBackup,decryptOwnerBackup} from './src/secure-backup.mjs';
import {makeEvaluationRuntime} from './src/evaluation-mode.mjs';
import {loadLocalEnv} from './src/local-env.mjs';
import {productionHistory} from './src/production-history.mjs';
import {recoveryDiagnostic} from './src/recovery-diagnostics.mjs';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const IS_ENTRY=Boolean(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url));
const IS_EVALUATION=IS_ENTRY&&process.argv.includes('--evaluate');
// Private CLI loads local .env before evaluating server flags.
// The isolated evaluation CLI intentionally ignores .env and inherited secrets.
if(IS_ENTRY&&!IS_EVALUATION)loadLocalEnv({directory:ROOT});
const HOST=process.env.HOST || '127.0.0.1';
const PORT=Number(process.env.PORT || 3000);
const LIVE=process.env.BEFOREROLL_LIVE_ENABLED==='true' && !!process.env.CLOCKED_API_KEY && !!process.env.BEFOREROLL_OPERATOR_TOKEN;
const BODY_MAX=280000; // Default owner API requests remain bounded; DOCX import has a separate cap.
 // Exact source documents in offline production planning; legacy routes enforce narrower field caps.
// Local owner-configurable throttle, separate from Clocked's upstream limits.
// Raising this does not relax the explicit operator token, batch <= 8, or no-retry rules.
const DEFAULT_MAX_CALLS_PER_HOUR=256;

const staticFiles=new Map([
 ['/','public/index.html'],['/index.html','public/index.html'],['/styles.css','public/styles.css'],['/app.js','public/app.js'],['/workspace-desk.mjs','public/workspace-desk.mjs'],['/src/engine.mjs','src/engine.mjs'],['/src/timeline.mjs','src/timeline.mjs'],
 ['/src/semantic-source.mjs','src/semantic-source.mjs'],['/src/desk-semantic.mjs','src/desk-semantic.mjs'],['/src/authority-summary.mjs','src/authority-summary.mjs'],['/src/semantic-contract.mjs','src/semantic-contract.mjs'],['/fixtures/M3B_OWNER_SWEEP','fixtures/M3S2_OWNER_M3B_SWEEP_RECORDED.json'],['/fixtures/M3S4_TWO_SCENE_RECORDED','fixtures/audit/M3S4_OWNER_TWO_SCENE_LIVE.json'],['/fixtures/M3','fixtures/M3_SEMANTIC_PAIRS.json'],['/fixtures/M3S6_UNFAMILIAR_CASES','fixtures/M3S6_UNFAMILIAR_CASES.json'],['/fixtures/M3S6_U01_OWNER_RECORDED','fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json'],['/fixtures/M3S6_U02_OWNER_RECORDED','fixtures/audit/M3S6_U02_OWNER_LIVE_EVIDENCE.json'],
 ['/fixtures/F01','fixtures/R7_F01_RECORDED.json'],['/fixtures/F02','fixtures/R7_F02_RECORDED.json'],['/fixtures/F03','fixtures/R7_F03_RECORDED.json']
]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
function baseHeaders(req){return {
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
 'Cache-Control':'no-store','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()','Cross-Origin-Resource-Policy':'same-origin'
};}
function send(res,status,obj,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(obj));}
function constantEqual(a,b){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length && timingSafeEqual(aa,bb);}
async function jsonBody(req,limit=BODY_MAX){
 let count=0,chunks=[];
 for await(const chunk of req){count+=chunk.length;if(count>limit){const err=new Error('Request exceeds size limit');err.httpStatus=413;throw err;}chunks.push(chunk);}
 try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 catch {const e=new Error('Invalid JSON request');e.httpStatus=400;throw e;}
}
async function handleLive(req,res,config){
 const recent=config.recent;
 if(!config.enabled) return send(res,503,{error:'Live Clocked integration is disabled. Recorded mode remains available.'});
 const operator=(req.headers['x-operator-token'] || '').toString();
 if(!operator || !constantEqual(operator,config.operatorToken))return send(res,401,{error:'An operator token is required for credit-consuming requests.'});
 if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
 const now=Date.now();while(recent.length&&recent[0]<now-3600000)recent.shift();
 if(recent.length>=config.maxCallsPerHour)return send(res,429,{error:'Server request budget reached. Try later.'});
 let input;
 try {input=await jsonBody(req);}catch(e){return send(res,e.httpStatus||400,{error:e.message});}
 const source=input?.text,profile=input?.profile||'standard';
 if(typeof source!=='string'||source.length<20||source.length>20000||!['standard','variation'].includes(profile))return send(res,400,{error:'Use a supported profile and 20–20,000 characters of plain permit text.'});
 // Count attempts *before* network calls: protects against retries after timeouts.
 recent.push(Date.now());
 const payload=extractPayload(source,profile);
 try {
  const resp=await config.fetchImpl('https://clocked.rezolve.ai/clocked/extract',{
   method:'POST',headers:{'Authorization':`Bearer ${config.apiKey}`,'Content-Type':'application/json','Accept':'application/json','Idempotency-Key':randomUUID(),'User-Agent':'BeforeRoll-M2-ReviewDesk/0.1.2'},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(45000),cache:'no-store'
  });
  if(!resp.ok) return send(res,502,{error:'Clocked rejected the request',upstreamStatus:resp.status,detail:'No automatic retry was attempted.'});
  let body;
  try {body=await resp.json();}catch{return send(res,502,{error:'Clocked did not return JSON'});}
  if(!body||typeof body.fields!=='object'||Array.isArray(body.fields))return send(res,502,{error:'Clocked response lacked expected extract fields'});
  const credit=resp.headers.get('x-clocked-credits');
  return send(res,200,{source:'live-clocked',fields:body.fields,credits:credit && /^\d+$/.test(credit)?Number(credit):null,profile});
 }catch(err){return send(res,502,{error:'Clocked call failed or timed out',detail:'No automatic retry. Billing may be unknown.'});}
}
/** One deliberate, operator-authorized Clocked Decide request for a source-anchored clause + scene.
 * A signed permit cannot be authenticated by this endpoint. Excerpt selection is human-led.
 */
async function handleSemantic(req,res,config){
 const recent=config.recent;
 if(!config.enabled)return send(res,503,{error:'Live Clocked semantic analysis is disabled; no model insight can be produced offline.'});
 const operator=(req.headers['x-operator-token']||'').toString();
 if(!operator||!constantEqual(operator,config.operatorToken))return send(res,401,{error:'Operator token required'});
 if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
 const now=Date.now();while(recent.length&&recent[0]<now-3600000)recent.shift();
 if(recent.length>=config.maxCallsPerHour)return send(res,429,{error:'Server hourly request-attempt limit reached'});
 let input;
 try{input=await jsonBody(req);}catch(e){return send(res,e.httpStatus||400,{error:e.message});}
 const {permitText,sceneRow,start,end}=input??{};
 if(typeof permitText!=='string'||permitText.length<40||permitText.length>12000||typeof sceneRow!=='string'||sceneRow.length>1000||!/^\s*Scene\s+[^\r\n]+\|/.test(sceneRow))return send(res,400,{error:'Provide a limited fictional permit and one complete source scene row.'});
 let clause,payload;
 try{clause=excerptFromRange(permitText,start,end);payload=decideSemanticPayload(clause,sceneRow);}
 catch(e){return send(res,400,{error:e.message});}
 recent.push(Date.now());
 const requestHash=sha256(JSON.stringify(payload));
 try {
  const resp=await config.fetchImpl('https://clocked.rezolve.ai/clocked/decide',{
   method:'POST',headers:{'Authorization':`Bearer ${config.apiKey}`,'Content-Type':'application/json','Accept':'application/json','Idempotency-Key':randomUUID(),'User-Agent':'BeforeRoll-M3-SemanticLens/0.2.0'},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(45000),cache:'no-store'
  });
  if(!resp.ok)return send(res,502,{error:'Clocked Decide rejected the request',upstreamStatus:resp.status,detail:'No retry; billing may be unknown.'});
  let response;
  try{response=await resp.json();}catch{return send(res,502,{error:'Clocked Decide returned non-JSON output.'});}
  const finding=conservativeSemanticFinding(response?.answers);
  const credit=resp.headers.get('x-clocked-credits');
  const record={source:'live-clocked-decide',endpoint:'decide',caseStatus:'fictional-unverified-document',requestHash,permitHash:sha256(permitText),sceneHash:sha256(sceneRow),clause:{start,end,text:clause},scene:{text:sceneRow},finding,reportedCredits:credit&&/^\d+$/.test(credit)?Number(credit):null,notClearance:true};
  // Only return the two selected answer objects; no bearer tokens or raw request.
  record.modelAnswers={activity_link:response?.answers?.activity_link??null,granted_for_scene:response?.answers?.granted_for_scene??null};
  return send(res,200,record);
 }catch {return send(res,502,{error:'Clocked Decide failed or timed out.',detail:'No retry; prior billing outcome may be unknown.'});}
}
/** Explicit operator-authorized, bounded series of Clocked Decide calls over EVERY detected clause.
 * No semantic keyword prefilter, no retries, no dropped candidate if over limit.
 * Partial results always remain unresolved. Never claims full permit clearance.
 */
async function handleSemanticSweep(req,res,config){
 const recent=config.recent;
 if(!config.enabled)return send(res,503,{error:'Live Clocked analysis disabled; no model decisions are simulated.'});
 const operator=(req.headers['x-operator-token']||'').toString();
 if(!operator||!constantEqual(operator,config.operatorToken))return send(res,401,{error:'Operator token required'});
 if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
 if(config.activeSweep)return send(res,409,{error:'A semantic sweep is already running'});
 let input,plan;
 try {input=await jsonBody(req);plan=sweepCandidatePlan(input?.permitText,input?.sceneRow);}
 catch(e){return send(res,e.httpStatus||422,{error:e.message});}
 const now=Date.now();while(recent.length&&recent[0]<now-3600000)recent.shift();
 if(recent.length+plan.length>config.maxCallsPerHour)return send(res,429,{error:'Insufficient available hourly request slots; no calls made.'});
 const replies=[];let error=null;let attempts=0;let observedCredits=0;let creditsKnown=true;
 config.activeSweep=true;
 try {
  for(const item of plan){
   // Count before sending: unknown billing must not trigger a retry.
   recent.push(Date.now());attempts++;
   try{
    const resp=await config.fetchImpl('https://clocked.rezolve.ai/clocked/decide',{
      method:'POST',headers:{'Authorization':`Bearer ${config.apiKey}`,'Content-Type':'application/json','Accept':'application/json','Idempotency-Key':randomUUID(),'User-Agent':'BeforeRoll-M3S2-ConditionSweep/0.2.1'},
      body:JSON.stringify(item.payload),signal:AbortSignal.timeout(45000),cache:'no-store'
    });
    if(!resp.ok){creditsKnown=false;error=`Clocked rejected clause ${item.index} with HTTP ${resp.status}; no retry.`;break;}
    let json;try{json=await resp.json();}catch{creditsKnown=false;error=`Non-JSON response for clause ${item.index}; no retry.`;break;}
    const creditHeader=resp.headers.get('x-clocked-credits');
    const credit=creditHeader && /^\d+$/.test(creditHeader)?Number(creditHeader):null;
    if(credit===null)creditsKnown=false;else observedCredits+=credit;
    const record=parseSweepReply(json,item,input.permitText,input.sceneRow,credit);
    replies.push(record);
    if(record.finding.code==='FORMAT_UNVERIFIED'){error=`Clause ${item.index} returned invalid model scores. Subsequent clauses were not sent.`;break;}
   }catch{creditsKnown=false;error=`Clause ${item.index} failed or timed out; unknown billing, no retry.`;break;}
  }
 }finally{config.activeSweep=false;}
 return send(res,200,{
  source:'live-clocked-decide-condition-sweep',endpoint:'decide',permitHash:sha256(input.permitText),sceneHash:sha256(input.sceneRow),scene:{text:input.sceneRow},
  candidatesDetected:plan.length,candidatesEvaluated:replies.length,attempts,
  sourceUnscanned:uncoveredSourceSpans(input.permitText,plan),
  complete:!error&&replies.length===plan.length,
  interpretationScope:'ONLY_SEGMENTED_CLAUSES_NOT_ENTIRE_PERMIT_AUTHORITY',
  reportedCredits:creditsKnown?observedCredits:null,observedKnownCredits:observedCredits,results:replies,error,
  notClearance:true,warning:'Review unknown clauses, missing/fragmented conditions, supersession and all permit authorities manually. No negative result means permission.'
 });
}

/** M3-S4: one explicit, bounded, operator-authorized MULTI-SCENE transaction.
 * Scene x clause calls are sequential and individually billable. Fails closed on error.
 * Results for unattempted scenes are explicitly NOT_EVALUATED, never fabricated.
 */
async function handleMultiScene(req,res,config){
 const recent=config.recent;
 if(!config.enabled)return send(res,503,{error:'Live Clocked multi-scene analysis is disabled.'});
 const operator=(req.headers['x-operator-token']||'').toString();
 if(!operator||!constantEqual(operator,config.operatorToken))return send(res,401,{error:'Operator token required'});
 if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
 if(config.activeSweep)return send(res,409,{error:'Another semantic scan is running'});
 let plan;
 try{const input=await jsonBody(req);plan=planMultiSceneBatch(input);}
 catch(e){return send(res,e.httpStatus||422,{error:e.message});}
 const now=Date.now();while(recent.length&&recent[0]<now-3600000)recent.shift();
 if(recent.length+plan.totalCalls>config.maxCallsPerHour)return send(res,429,{error:'Insufficient hourly attempt allowance: no calls made.'});
 let attempts=0,knownCredits=0,creditsKnown=true,error=null;const scenes=[];
 config.activeSweep=true;
 try{
  for(const scene of plan.scenes){
   if(error){scenes.push({sceneId:scene.sceneId,sceneRow:scene.sceneRow,sceneHash:scene.sceneHash,status:'NOT_EVALUATED',scan:null});continue;}
   const results=[];let sceneAttempts=0,sceneKnownCredits=0,sceneCreditsKnown=true,sceneError=null;
   for(const clause of scene.clauses){
    recent.push(Date.now());attempts++;sceneAttempts++;
    try{
     const upstream=await config.fetchImpl('https://clocked.rezolve.ai/clocked/decide',{
      method:'POST',headers:{'Authorization':`Bearer ${config.apiKey}`,'Content-Type':'application/json','Accept':'application/json','Idempotency-Key':randomUUID(),'User-Agent':'BeforeRoll-M3S4-MultiScene/0.4.0'},
      body:JSON.stringify(clause.payload),signal:AbortSignal.timeout(45000),cache:'no-store'
     });
     if(!upstream.ok){sceneCreditsKnown=false;sceneError=`Scene ${scene.sceneId}, clause ${clause.index}: upstream HTTP ${upstream.status}; no retry, billing unknown.`;break;}
     let body;try{body=await upstream.json();}catch{sceneCreditsKnown=false;sceneError=`Scene ${scene.sceneId}, clause ${clause.index}: invalid JSON; no retry.`;break;}
     const c=upstream.headers.get('x-clocked-credits');const credits=c&&/^\d+$/.test(c)?Number(c):null;
     if(credits===null){sceneCreditsKnown=false;}else{sceneKnownCredits+=credits;knownCredits+=credits;}
     const record=parseSweepReply(body,clause,plan.permitText,scene.sceneRow,credits);
     // Invalid/ambiguous model payloads never become permission. Stop on malformed output.
     if(record.finding.code==='FORMAT_UNVERIFIED'){sceneError=`Scene ${scene.sceneId}, clause ${clause.index}: invalid typed model probabilities; no subsequent calls.`;results.push(record);break;}
     results.push(record);
    }catch{sceneCreditsKnown=false;sceneError=`Scene ${scene.sceneId}, clause ${clause.index}: failure/timeout; no retry, billing unknown.`;break;}
   }
   if(!sceneCreditsKnown)creditsKnown=false;
   const complete=!sceneError&&results.length===scene.clauses.length;
   const scan={source:'live-clocked-decide-condition-sweep',endpoint:'decide',permitHash:plan.permitHash,sceneHash:scene.sceneHash,scene:{text:scene.sceneRow},
    candidatesDetected:scene.clauses.length,candidatesEvaluated:results.length,attempts:sceneAttempts,
    sourceUnscanned:uncoveredSourceSpans(plan.permitText,scene.clauses),complete,
    interpretationScope:'ONLY_SEGMENTED_CLAUSES_NOT_ENTIRE_PERMIT_AUTHORITY',
    reportedCredits:sceneCreditsKnown?sceneKnownCredits:null,observedKnownCredits:sceneKnownCredits,results,error:sceneError,
    notClearance:true,warning:'Results are limited to segmented source clauses; missing findings never imply permission.'};
   scenes.push({sceneId:scene.sceneId,sceneRow:scene.sceneRow,sceneHash:scene.sceneHash,status:complete?'COMPLETE':'PARTIAL',scan});
   if(!complete)error=sceneError||`Scene ${scene.sceneId}: incomplete sweep, subsequent scenes not evaluated`;
  }
 }finally{config.activeSweep=false;}
 return send(res,200,{source:'live-clocked-decide-multi-scene',endpoint:'decide',permitHash:plan.permitHash,scenes,
  totalPlannedCalls:plan.totalCalls,attempts,complete:!error&&scenes.every(v=>v.status==='COMPLETE'),
  interpretationScope:'SEGMENTED_CLAUSES_PER_SCENE_NOT_COMPLETE_PERMIT_AUTHORITY',
  reportedCredits:creditsKnown?knownCredits:null,observedKnownCredits:knownCredits,error,
  notClearance:true,warning:'A scene not evaluated or with no model finding is NOT authorized. Resolve authority, conditions and all missing source evidence manually.'});
}
/** One read-only dossier derivation for both the action queue and evidence export. */
async function currentDossier(saved,execution,asOf){
 const id=saved.workspace.id;
 let modelEvidence=null,executionSummary=null;
 try{
  const plan=planIntelligence(saved.workspace);
  const snapshot=await execution.snapshot(plan,{offset:0,limit:1});
  executionSummary=snapshot.status;modelEvidence=snapshot.evidence;
 }catch(e){
  if(!/^(Need source documents|Unsupported call-sheet|Invalid scene rows|Document coverage|PDF .* requires human verification|Document-scene plan requires more than)/.test(e.message))throw e;
 }
 const dossier=buildProductionDossier(saved.workspace,{persistedVersion:saved.version,asOf,modelEvidence,executionSummary});
 certifyProductionConsistency(saved.workspace,dossier,{persistedVersion:saved.version,executionStatus:executionSummary});
 return dossier;
}
export function createAppServer(options={}){
 if(options.controlledTestMode===true&&typeof options.fetchImpl!=='function')throw Error('Controlled test mode requires an explicit non-provider transport');
 // Test seam: a fake transport exercises the live route without consuming credits.
 // Production uses only process environment secrets and the real global fetch.
 const apiKey=options.apiKey ?? process.env.CLOCKED_API_KEY;
 const operatorToken=options.operatorToken ?? process.env.BEFOREROLL_OPERATOR_TOKEN;
 const evaluationMode=options.evaluationMode===true;
 if(evaluationMode&&(!options.workspaceStore||!options.evaluationRuntime))throw Error('Evaluation mode requires an explicitly initialized isolated sandbox');
 const requested=evaluationMode?false:(options.enabled ?? LIVE);
 const maxCallsPerHour=options.maxCallsPerHour ?? (process.env.BEFOREROLL_MAX_CALLS_PER_HOUR ? Number(process.env.BEFOREROLL_MAX_CALLS_PER_HOUR) : DEFAULT_MAX_CALLS_PER_HOUR);
 if(!Number.isSafeInteger(maxCallsPerHour)||maxCallsPerHour<8||maxCallsPerHour>20000)throw Error('BEFOREROLL_MAX_CALLS_PER_HOUR must be an integer between 8 and 20000');
 // Non-loopback listeners are never allowed to call billable Clocked routes,
 // including older experimental endpoints, even if secrets were configured.
 const localOnly=['127.0.0.1','localhost','::1'].includes(HOST);
 const config={enabled:Boolean(!evaluationMode && requested && apiKey && operatorToken && localOnly),apiKey,operatorToken,fetchImpl:options.fetchImpl ?? fetch,recent:[],activeSweep:false,activeProject:false,maxCallsPerHour};
 // Workspace storage is available only to a private loopback owner server.
 const store=evaluationMode?options.workspaceStore:(options.workspaceStore ?? (localOnly?createWorkspaceStore({directory:workspaceDirectory()}):null));
 const execution=store?(options.executionStore??createDurableExecution({directory:store.directory})):null;
 const originalVault=store?(options.sourceVault??createSourceOriginalVault({directory:store.directory})):null;
 // Explicit store seam keeps the historic HTTP tests independent of passwords.
 // The ordinary installed owner server always uses an ephemeral/random owner secret.
 const ownerToken=evaluationMode?null:(options.ownerToken??(options.workspaceStore||!localOnly?null:(process.env.BEFOREROLL_OWNER_TOKEN||randomBytes(32).toString('hex'))));
 const owner=createOwnerSecurity({token:ownerToken});
 const primaryStore=store;
 const recoveryRoot=store?path.join(store.directory,'.recovered'):null;
 async function recoveredProjects(){
  if(!recoveryRoot||evaluationMode)return [];
  let names;try{names=await fs.readdir(recoveryRoot);}catch(e){if(e.code==='ENOENT')return [];throw e;}
  const items=[];for(const name of names.filter(n=>/^[a-f0-9]{64}$/.test(n))){
   const recoveredStore=createWorkspaceStore({directory:path.join(recoveryRoot,name)});
   for(const item of await recoveredStore.list())items.push({...item,recoverySpace:name});
  }return items;
 }
 const server=http.createServer(async(req,res)=>{
 for(const [k,v] of Object.entries(baseHeaders(req)))res.setHeader(k,v);
 let uri;try{uri=new URL(req.url,'http://localhost');}catch{return send(res,400,{error:'Malformed request target'});}
 const ownerRoute=uri.pathname==='/api/owner/status'||uri.pathname==='/api/owner/unlock'||uri.pathname==='/api/owner/lock';
 const privateRoute=uri.pathname==='/api/workspaces'||uri.pathname.startsWith('/api/workspaces/');
 // Host, peer, fetch-metadata and Origin are checked BEFORE reading any sensitive data.
 // Prevent DNS rebinding, custom-host loopback proxies and browser cross-site data access.
 if(privateRoute||ownerRoute){
  if(!store)return send(res,403,{error:'Private owner workspaces unavailable on this listening address'});
  if(!trustedOwnerRequest(req))return send(res,403,{error:'Owner workspaces require direct loopback same-origin access'});
  if(ownerRoute){
   if(uri.pathname==='/api/owner/status'&&req.method==='GET')return send(res,200,{schema:'beforeroll-owner-access-v1',required:owner.guarded,authenticated:owner.authorized(req),sessionMinutes:240});
   if(uri.pathname==='/api/owner/unlock'&&req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    let body;try{body=await jsonBody(req,4096);}catch(e){return send(res,e.httpStatus||400,{error:e.message});}
    const x=owner.unlock(req,body?.token);
    if(!x.ok)return send(res,x.limited?429:401,{error:x.limited?'Too many unlock attempts. Retry later.':'Invalid owner access token'});
    return send(res,200,{schema:'beforeroll-owner-unlocked-v1',authenticated:true},x.cookie?{'Set-Cookie':x.cookie}:{});
   }
   if(uri.pathname==='/api/owner/lock'&&req.method==='POST'){
    if(!owner.authorized(req))return send(res,401,{error:'Owner session required'});
    return send(res,200,{locked:true},{'Set-Cookie':owner.lock(req)});
   }
   return send(res,404,{error:'Unknown owner access route'});
  }
  if(!owner.authorized(req))return send(res,401,{error:'OWNER_ACCESS_LOCKED',ownerUnlockRequired:true});
 }
 // Strict local-only evaluation: synthetic sandbox, no access to owner store or live API.
 if(uri.pathname.startsWith('/api/evaluation/')){
  if(!evaluationMode||!store||!trustedOwnerRequest(req))return send(res,403,{error:'Evaluation commands are available only within the local isolated evaluation sandbox'});
  if(req.method!=='POST')return send(res,405,{error:'Evaluation commands require POST'});
  if(uri.pathname==='/api/evaluation/reset'){
   try{return send(res,200,await options.evaluationRuntime.reset());}catch(e){return send(res,422,{error:e.message});}
  }
  if(uri.pathname==='/api/evaluation/replay'){
   if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
   try{const body=await jsonBody(req,2048);return send(res,200,await options.evaluationRuntime.replay(body?.projectId));}
   catch(e){return send(res,422,{error:e.message});}
  }
  return send(res,404,{error:'Unknown evaluation command'});
 }
 // All production data, including read-only exports, requires this access fence.
 if(privateRoute){
  if(!primaryStore)return send(res,403,{error:'Private project workspaces only enabled on loopback; no public file exposure.'});
  const recoverySpace=req.headers['x-beforeroll-recovery-space']||uri.searchParams.get('recoverySpace')||'';
  if(recoverySpace&&(!/^[a-f0-9]{64}$/.test(recoverySpace)||evaluationMode))return send(res,400,{error:'Invalid recovered workspace selection'});
  const store=recoverySpace?createWorkspaceStore({directory:path.join(recoveryRoot,recoverySpace)}):primaryStore;
  const execution=recoverySpace?createDurableExecution({directory:store.directory}):options.executionStore??createDurableExecution({directory:store.directory});
  const originalVault=recoverySpace?createSourceOriginalVault({directory:store.directory}):options.sourceVault??createSourceOriginalVault({directory:store.directory});
  const parts=uri.pathname.split('/').slice(2);
  const id=parts[1]||null,action=parts[2]||null;
  try{
   if(id==='recovery'&&['verify','restore'].includes(action)&&req.method==='POST'){
    if(evaluationMode)return send(res,403,{error:'Private backup recovery is unavailable in the disposable evaluation sandbox. Open the private launcher.'});
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    const input=await jsonBody(req,96*1024*1024);
    const backup=await decryptOwnerBackup(input.backup,input.passphrase);
    const verified=verifyLifecycleBackup(backup,execution);
    const separate=input.destination==='separate';
    const targetSpace=separate?backup.sha256:'';
    const destinationStore=separate?createWorkspaceStore({directory:path.join(recoveryRoot,targetSpace)}):store;
    let targetExists=true;if(separate){try{await fs.access(destinationStore.directory);}catch(e){if(e.code==='ENOENT')targetExists=false;else throw e;}}
    const existing=targetExists?await destinationStore.load(backup.workspaceId):null;
    if(separate&&targetExists&&!existing)throw Error('Recovery destination exists but is incomplete. Preserve it for inspection; do not overwrite journals.');
    if(action==='verify')return send(res,200,{...verified,recoverySpace:targetSpace,canRestore:!existing&&verified.missingOriginalFiles===0,existingVersion:existing?.version??null,
     notice:verified.missingOriginalFiles?'Backup has missing original files. Reconnect the exact originals in the source production and export a complete encrypted backup; this incomplete backup will not be reported as a successful recovery.':existing?'This verified backup is already present. Open the recovered copy in Productions; no overwrite or duplicate recovery.':'Verified complete backup; original files and journals can be restored without provider calls into a separate workspace.'});
    if(input.confirmId!==backup.workspaceId||input.previewSha256!==verified.backupSha256)throw Error('Verify this exact backup first and confirm its production ID');
    if(verified.missingOriginalFiles)throw Error('Original custody incomplete: reconnect missing original files and export a complete backup before recovery');
    if(existing)return send(res,409,{error:'Recovery refuses to overwrite an existing production. Your current production is unchanged.'});
    if(separate){
     await fs.mkdir(recoveryRoot,{recursive:true});
     const staging=path.join(recoveryRoot,'.pending-'+randomUUID());
     const stagingStore=createWorkspaceStore({directory:staging}),stagingExecution=createDurableExecution({directory:staging});
     // A failed restore stays in an invisible diagnostic staging directory.
     // Only fully restored sources, originals and journals are published together.
     const recovered=await restoreLifecycleBackup(backup,{workspaceStore:stagingStore,execution:stagingExecution,ownerConfirmed:true});
     const receipt={...recovered,recoverySpace:targetSpace,recoveredAt:new Date().toISOString(),originalProductionId:backup.workspaceId};
     await fs.writeFile(path.join(staging,'.recovery-receipt.json'),JSON.stringify(receipt),{flag:'wx',mode:0o600});
     await fs.rename(staging,path.join(recoveryRoot,targetSpace));
     return send(res,201,receipt);
    }
    const recovered=await restoreLifecycleBackup(backup,{workspaceStore:store,execution,sourceVault:originalVault,ownerConfirmed:true});
    return send(res,201,recovered);
   }
   if(!id&&req.method==='GET')return send(res,200,{schema:'beforeroll-workspace-list-v1',items:[...await primaryStore.list(),...await recoveredProjects()]});
   if(!id&&req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    const input=await jsonBody(req);
    const workspace=createProduction({id:input.id,title:input.title,documents:[],callSheetText:''});
    const saved=await store.persist(workspace,{expectedVersion:0});
    return send(res,201,{id:saved.id,version:saved.version,workspace:saved.workspace});
   }
   if(!id||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id))return send(res,400,{error:'Invalid workspace id'});
   if(!action&&req.method==='GET'){
    const saved=await store.load(id);return saved?send(res,200,saved):send(res,404,{error:'Workspace not found'});
   }
   if(action==='diagnostics'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const exists=async filename=>{try{await fs.access(filename);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
    const writerLock=await exists(path.join(store.directory,'.beforeroll-write.lock'));
    const executionLock=await exists(path.join(store.directory,'.clocked-execution',id+'.lock'));
    let originals=null,journalState='VERIFIED',diagnostic=null;
    try{originals=await originalVault.inventory(saved.workspace);}catch(e){diagnostic=recoveryDiagnostic(e);}
    try{let plan;try{plan=planIntelligence(saved.workspace);}catch{plan={workspaceId:id,taskIds:[]};}await execution.exportAllRuns(plan);}catch(e){journalState='FAILED';diagnostic=recoveryDiagnostic(e);}
    if(writerLock||executionLock)diagnostic=recoveryDiagnostic(Error('Storage writer lock requires inspection'));
    return send(res,200,{schema:'beforeroll-recovery-diagnostics-v1',productionId:id,persistedVersion:saved.version,writerLock,executionLock,journalState,
     missingOriginals:originals?.missingOriginalSha256??null,completeOriginalCustody:originals?.complete??false,
     guidance:diagnostic?.recoveryGuidance??(originals?.complete?'Source custody and journals verified. This is storage integrity, not document authenticity.':'Reconnect the exact missing originals using their SHA-256 before making a complete recovery backup.'),
     automaticClockedRetry:false,locksRemoved:false,notClearance:true});
   }
   if(action==='overview'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const offset=Number(uri.searchParams.get('offset')??0),limit=Number(uri.searchParams.get('limit')??40);
    const available=saved.workspace.documents.length&&saved.workspace.callSheet?.scenes?.length;
    const pdfPending=saved.workspace.documents.some(d=>d.importReceipt?.requiresHumanTextReview&&!d.pdfTranscriptionReview);
    const executionStatus=available&&!pdfPending?await execution.status(planIntelligence(saved.workspace),{offset,limit}):null;
    return send(res,200,{version:saved.version,...productionReview(saved.workspace,{offset,limit,executionStatus,asOf:new Date().toISOString()})});
   }
   if(action==='authority'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const offset=Number(uri.searchParams.get('offset')??0),limit=Number(uri.searchParams.get('limit')??60);
    return send(res,200,{version:saved.version,...projectAuthorityGraph(saved.workspace,{offset,limit})});
   }
   if(action==='documentary-reasoning'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const dossier=await currentDossier(saved,execution,uri.searchParams.get('asOf')??new Date().toISOString());
    return send(res,200,{version:saved.version,dossierSha256:dossier.sha256,...dossier.documentaryReasoning});
   }
   if(action==='scene-authority'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const offset=Number(uri.searchParams.get('offset')??0),limit=Number(uri.searchParams.get('limit')??100);
    return send(res,200,{version:saved.version,...projectSceneAuthority(saved.workspace,{offset,limit,sceneId:uri.searchParams.get('sceneId')})});
   }
   if(action==='originals'&&parts[3]==='relink'&&req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    const body=await jsonBody(req,12*1024*1024),saved=await store.load(id);
    if(!saved)return send(res,404,{error:'Workspace not found'});
    if(body.expectedVersion!==saved.version)return send(res,409,{error:'Source archive relink version conflict; reload the production first',currentVersion:saved.version});
    const linked=await originalVault.relink(saved.workspace,{rawHash:body.rawHash,file:body.file});
    return send(res,200,{schema:'beforeroll-source-relinked-v1',projectId:id,version:saved.version,...linked,
     workspaceChanged:false,sourceIdentityChanged:false,newClockedCalls:0,notClearance:true});
   }
   if(action==='originals'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const references=referencedOriginals(saved.workspace);
    if(!parts[3]){
     const inventory=await originalVault.inventory(saved.workspace);
     return send(res,200,{schema:'beforeroll-original-source-register-v1',productionId:id,persistedVersion:saved.version,
      referenced:inventory.referenced,preserved:inventory.preserved,missingOriginalSha256:inventory.missingOriginalSha256,
      files:inventory.items,notClearance:true});
    }
    const hash=parts[3];if(!/^[a-f0-9]{64}$/.test(hash)||!references.some(r=>r.rawHash===hash))return send(res,404,{error:'Original source not referenced by this production'});
    const content=await originalVault.read(hash);if(!content)return send(res,404,{error:'Referenced original bytes not retained in the local vault'});
    const receipt=(saved.workspace.imports??[]).find(x=>x.rawHash===hash)||saved.workspace.documents.find(x=>x.importReceipt?.rawHash===hash)?.importReceipt||saved.workspace.callSheet?.importReceipt;
    const suffix=/\.(pdf|docx|txt|md|csv|json)$/i.exec(receipt?.name??'')?.[0]?.toLowerCase()??'.bin';
    res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="BEFOREROLL_ORIGINAL_${hash.slice(0,16)}${suffix}"`,
     'Content-Length':content.length});return res.end(content);
   }
   if(action==='lifecycle'&&parts[3]==='backup-encrypted'&&req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    const input=await jsonBody(req,4096);
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    if(input.expectedVersion!==saved.version)return send(res,409,{error:'Backup version changed; reload before exporting'});
    const backup=await createLifecycleBackup(saved,execution,{asOf:new Date().toISOString(),sourceVault:originalVault});
    const encrypted=await encryptOwnerBackup(backup,input.passphrase);
    return send(res,200,encrypted,{'X-BeforeRoll-Backup-Protection':'AES-256-GCM-SCRYPT'});
   }
   if(action==='lifecycle'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const backup=await createLifecycleBackup(saved,execution,{asOf:uri.searchParams.get('asOf')??new Date().toISOString(),sourceVault:originalVault});
    if(parts[3]==='backup'){
     // Production sessions default to encrypted portable backups. Preserve
     // legacy unprotected test seam and CLI interoperability explicitly.
     if(owner.guarded&&req.headers['x-beforeroll-plaintext-export']!=='I_ACCEPT_UNENCRYPTED_BACKUP')
      return send(res,403,{error:'Plaintext lifecycle backup disabled by default. Use encrypted backup or explicitly acknowledge an unencrypted owner export.'});
     return send(res,200,backup,{'Content-Disposition':`attachment; filename="BEFOREROLL_${id}_OWNER_LIFECYCLE_BACKUP.json"`,'X-BeforeRoll-Sensitive-Export':'PLAINTEXT_ORIGINAL_DOCUMENTS'});
    }
    if(!parts[3])return send(res,200,{schema:'beforeroll-lifecycle-audit-v1',id,
     persistedVersion:saved.version,asOf:backup.asOf,integrity:backup.integrity,journalCount:backup.journals.length,
     backupAvailable:true,notClearance:true,
     notice:'Read-only lifecycle projection. Backup embeds preserved exact originals within the configured archive budget and reports legacy originals that remain missing.'});
    return send(res,404,{error:'Unknown lifecycle representation'});
   }
   // M3-S24: one server-side workspace snapshot for the entire operator journey.
   // Exactly one persisted project load; one version and one dossier across all
   // projections. No independent client-side recomputation of authority.
   if(action==='workflow'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const w=saved.workspace;
    const asOf=uri.searchParams.get('asOf')??new Date().toISOString();
    const offset=Number(uri.searchParams.get('offset')??0),actionOffset=Number(uri.searchParams.get('actionOffset')??0);
    const kind=uri.searchParams.get('kind')??'ALL';
    const requestedSceneId=uri.searchParams.get('sceneId');
    const sceneId=w.callSheet?.scenes?.some(sc=>sc.id===requestedSceneId)?requestedSceneId:(w.callSheet?.scenes?.[0]?.id??null);
    const sceneTaskOffset=Number(uri.searchParams.get('sceneTaskOffset')??0);
    const sceneActionOffset=Number(uri.searchParams.get('sceneActionOffset')??0);
    // Validate requested limits before touching the evidence journal.
    if(!Number.isSafeInteger(offset)||offset<0||offset>MAX_PLAN_TASKS||!Number.isSafeInteger(actionOffset)||actionOffset<0||actionOffset>200000||
       !Number.isSafeInteger(sceneTaskOffset)||sceneTaskOffset<0||sceneTaskOffset>MAX_PLAN_TASKS||
       !Number.isSafeInteger(sceneActionOffset)||sceneActionOffset<0||sceneActionOffset>200000)
       return send(res,400,{error:'Invalid workflow pagination'});
    let snapshot=null,planError=null;
    if(w.documents.length&&w.callSheet?.scenes?.length){
     try{snapshot=await execution.snapshot(planIntelligence(w),{offset,limit:40});}
     catch(e){if(!/^(Need source documents|Unsupported call-sheet|Invalid scene rows|Document coverage|PDF .* requires human verification|Document-scene plan requires more than)/.test(e.message))throw e;planError=e.message;}
    }
    const dossier=buildProductionDossier(w,{persistedVersion:saved.version,asOf,
     modelEvidence:snapshot?.evidence??null,executionSummary:snapshot?.status??null});
    let overview;
    try{overview={version:saved.version,...productionReview(w,{offset,limit:40,asOf,executionStatus:snapshot?.status??null})};}
    catch(e){if(!planError)throw e;overview={schema:'beforeroll-production-review-v1',version:saved.version,id,title:w.title,
      state:'SOURCE_PLAN_BLOCKED',planError,plannedCalls:0,reviewedCount:0,pagination:{offset,limit:40,shown:0,hasMore:false},tasks:[],
      documents:w.documents.map(d=>({id:d.id,name:d.name,sourceHash:d.sourceHash,revision:d.revision,sourceFormat:d.importReceipt?.sourceFormat??'MANUAL',
       unitCount:d.units.length,units:d.units,gaps:d.coverage?.gaps?.length??0})),
      scenes:w.callSheet?.scenes?.map(sc=>({id:sc.id,number:sc.number,location:sc.location,activity:sc.activity,start:sc.start,end:sc.end,ai:'NOT_EVALUATED'}))??[],notClearance:true};}
    const executionStatus=snapshot?.status??{schema:'beforeroll-execution-status-v1',projectId:id,
      state:w.documents.some(d=>d.importReceipt?.requiresHumanTextReview&&!d.pdfTranscriptionReview)?'PDF_TRANSCRIPTION_REVIEW_REQUIRED':planError?'SOURCE_PLAN_BLOCKED':'INCOMPLETE_SOURCES',
      planned:0,attempts:0,completed:0,entries:[],notClearance:true};
    const inventory=await originalVault.inventory(w);
    const originals={schema:'beforeroll-original-source-register-v1',productionId:id,persistedVersion:saved.version,
      referenced:inventory.referenced,preserved:inventory.preserved,missingOriginalSha256:inventory.missingOriginalSha256,
      files:inventory.items,notClearance:true};
    const journey=buildProductionJourney(dossier,{originals});
    const sceneWorkbench=sceneId?buildSceneWorkbench(dossier,{sceneId,taskOffset:sceneTaskOffset,taskLimit:40,
      actionOffset:sceneActionOffset,actionLimit:30}):null;
    const actionQueue=buildProductionActions(dossier,{offset:actionOffset,limit:30,kind});
    let recovery=null;try{recovery=JSON.parse(await fs.readFile(path.join(store.directory,'.recovery-receipt.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
    const journals=await execution.exportAllRuns(snapshot?.run?planIntelligence(w):{workspaceId:id,taskIds:[]});
    const history=productionHistory(w,dossier,journals,{offset:Number(uri.searchParams.get('historyOffset')??0),kind:uri.searchParams.get('historyKind')??'ALL',state:uri.searchParams.get('historyState')??'ALL',search:uri.searchParams.get('historySearch')??'',selectedId:uri.searchParams.get('historySelected'),recovery});
    const consistency=certifyProductionConsistency(w,dossier,{persistedVersion:saved.version,executionStatus:snapshot?.status??null,overview,queue:actionQueue,workbench:sceneWorkbench,journey,originals});
    const latest=await store.load(id);if(!latest||latest.version!==saved.version||latest.sha256!==saved.sha256)return send(res,409,{error:'Production changed while preparing the workflow. Reload before continuing.',currentVersion:latest?.version??null});
    const summary={schema:dossier.schema,productionId:dossier.productionId,title:dossier.title,
      persistedVersion:dossier.persistedVersion,revision:dossier.workspaceRevision,asOf:dossier.asOf,counts:dossier.counts,
      outstanding:dossier.outstanding,scenes:dossier.scenes.map(x=>({sceneId:x.sceneId,readiness:x.readiness,issues:x.issues,
       modelComplete:x.modelComplete,planned:x.planned,humanReviewed:x.humanReviewed,
       openPrerequisites:x.schedule?.openPrerequisites??null})),productionState:dossier.productionState,notClearance:true,sha256:dossier.sha256};
    return send(res,200,{schema:'beforeroll-atomic-production-workflow-v1',version:saved.version,workspace:saved.workspace,
      productionId:id,asOf,dossierSha256:dossier.sha256,originals,overview,execution:executionStatus,
      authority:{version:saved.version,...projectAuthorityGraph(w)},sceneAuthority:{version:saved.version,...projectSceneAuthority(w)},documentaryReasoning:dossier.documentaryReasoning,
      operations:{version:saved.version,...projectOperations(w,{asOf})},dossier:summary,actionQueue,sceneWorkbench,journey,consistency,history,
      notClearance:true});
   }
   if(action==='journey'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const asOf=uri.searchParams.get('asOf')??new Date().toISOString();
    const dossier=await currentDossier(saved,execution,asOf);
    const inventory=await originalVault.inventory(saved.workspace);
    const originals={schema:'beforeroll-original-source-register-v1',productionId:id,persistedVersion:saved.version,
     missingOriginalSha256:inventory.missingOriginalSha256};
    const journey=buildProductionJourney(dossier,{originals});
    certifyProductionConsistency(saved.workspace,dossier,{persistedVersion:saved.version,journey});
    const current=await store.load(id);if(!current||current.version!==saved.version||current.sha256!==saved.sha256)return send(res,409,{error:'Production changed during journey review; reload current evidence'});
    return send(res,200,journey);
   }
   // S28: independently auditable, source-version-bound consistency certificate.
   if(action==='consistency'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const asOf=uri.searchParams.get('asOf')??new Date().toISOString();
    const dossier=await currentDossier(saved,execution,asOf);
    if((uri.searchParams.has('expectedVersion')&&Number(uri.searchParams.get('expectedVersion'))!==saved.version)||
       (uri.searchParams.has('expectedDossierSha256')&&uri.searchParams.get('expectedDossierSha256')!==dossier.sha256))
      return send(res,409,{error:'Source or model evidence changed since the reviewed workflow snapshot.',currentVersion:saved.version,notClearance:true});
    const inventory=await originalVault.inventory(saved.workspace);
    const originals={schema:'beforeroll-original-source-register-v1',productionId:id,persistedVersion:saved.version,
     referenced:inventory.referenced,preserved:inventory.preserved,missingOriginalSha256:inventory.missingOriginalSha256,files:inventory.items};
    const certificate=certifyProductionConsistency(saved.workspace,dossier,{persistedVersion:saved.version,originals});
    const latest=await store.load(id);if(!latest||latest.version!==saved.version||latest.sha256!==saved.sha256)
      return send(res,409,{error:'Production changed while checking consistency. Refresh and review again.',currentVersion:latest?.version??null});
    return send(res,200,certificate);
   }
   if(action==='dossier'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const asOf=uri.searchParams.get('asOf')??new Date().toISOString();
    const dossier=await currentDossier(saved,execution,asOf);
    const expectedVersion=uri.searchParams.get('expectedVersion');
    const expectedDossierSha256=uri.searchParams.get('expectedDossierSha256');
    if(expectedVersion!==null&&Number(expectedVersion)!==saved.version||expectedDossierSha256!==null&&expectedDossierSha256!==dossier.sha256)
     return send(res,409,{error:'Export evidence changed since the reviewed workflow snapshot. Refresh the project and inspect again.',currentVersion:saved.version,notClearance:true});
    const inventory=await originalVault.inventory(saved.workspace);
    const originals={schema:'beforeroll-original-source-register-v1',productionId:id,persistedVersion:saved.version,
     referenced:inventory.referenced,preserved:inventory.preserved,missingOriginalSha256:inventory.missingOriginalSha256,files:inventory.items};
    const certificate=certifyProductionConsistency(saved.workspace,dossier,{persistedVersion:saved.version,originals});
    let evidencePack=null;
    if(parts[3]==='complete'){
     const backup=await createLifecycleBackup(saved,execution,{asOf});
     if(backup.integrity.dossierSha256!==dossier.sha256)return send(res,409,{error:'Model evidence changed during export; reload the current production.'});
     evidencePack={schema:'beforeroll-complete-production-evidence-v1',productionId:id,persistedVersion:saved.version,
      dossier,consistency:certificate,workspace:saved.workspace,journals:backup.journals,originals,
      originalBytesIncluded:false,secretsIncluded:false,notClearance:true,
      notice:'Includes current and historical model journals. Archived journals are checksum-checked, not revalidated against absent historical sources. Exact original bytes are available separately or in an encrypted lifecycle backup. Retained task credits are the original reported costs, never additional charges.'};
    }
    const latest=await store.load(id);if(!latest||latest.version!==saved.version||latest.sha256!==saved.sha256)return send(res,409,{error:'Production changed during export. Refresh the evidence before exporting.',currentVersion:latest?.version??null});
    res.setHeader('X-BeforeRoll-Consistency-Sha256',certificate.sha256);
    if(evidencePack)return send(res,200,evidencePack);
    if(parts[3]==='summary')return send(res,200,{schema:dossier.schema,productionId:dossier.productionId,title:dossier.title,
     persistedVersion:dossier.persistedVersion,revision:dossier.workspaceRevision,asOf:dossier.asOf,counts:dossier.counts,
     outstanding:dossier.outstanding,scenes:dossier.scenes.map(x=>({sceneId:x.sceneId,readiness:x.readiness,issues:x.issues,
      modelComplete:x.modelComplete,planned:x.planned,humanReviewed:x.humanReviewed,openPrerequisites:x.schedule?.openPrerequisites??null})),
     productionState:dossier.productionState,notClearance:true,sha256:dossier.sha256});
    if(parts[3]==='markdown'){
     const markdown=dossierMarkdown(dossier);
     res.writeHead(200,{'Content-Type':'text/markdown; charset=utf-8',
      'Content-Disposition':`attachment; filename="BEFOREROLL_${id}_INTEGRATED_REVIEW.md"`});return res.end(markdown);
    }
    if(!parts[3])return send(res,200,dossier,{'Content-Disposition':`attachment; filename="BEFOREROLL_${id}_INTEGRATED_EVIDENCE.json"`});
    return send(res,404,{error:'Unknown dossier representation'});
   }
   if(action==='scene-workbench'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const asOf=uri.searchParams.get('asOf')??new Date().toISOString();
    const dossier=await currentDossier(saved,execution,asOf);
    const packet=buildSceneWorkbench(dossier,{sceneId:uri.searchParams.get('sceneId'),
     taskOffset:Number(uri.searchParams.get('taskOffset')??0),taskLimit:Number(uri.searchParams.get('taskLimit')??40),
     actionOffset:Number(uri.searchParams.get('actionOffset')??0),actionLimit:Number(uri.searchParams.get('actionLimit')??30)});
    certifyProductionConsistency(saved.workspace,dossier,{persistedVersion:saved.version,workbench:packet});
    const current=await store.load(id);if(!current||current.version!==saved.version||current.sha256!==saved.sha256)return send(res,409,{error:'Production changed during scene review; reload current evidence'});
    return send(res,200,packet);
   }
   if(action==='actions'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const offset=uri.searchParams.has('offset')?Number(uri.searchParams.get('offset')):0;
    const limit=uri.searchParams.has('limit')?Number(uri.searchParams.get('limit')):30;
    const kind=uri.searchParams.get('kind')??'ALL',sceneId=uri.searchParams.get('sceneId')??null;
    const dossier=await currentDossier(saved,execution,uri.searchParams.get('asOf')??new Date().toISOString());
    const queue=buildProductionActions(dossier,{offset,limit,kind,sceneId});
    certifyProductionConsistency(saved.workspace,dossier,{persistedVersion:saved.version,queue});
    const current=await store.load(id);if(!current||current.version!==saved.version||current.sha256!==saved.sha256)return send(res,409,{error:'Production changed during action review; reload current evidence'});
    return send(res,200,queue);
   }
   if(action==='review-session'&&req.method==='POST'&&['preview','commit'].includes(parts[3])){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    const input=await jsonBody(req);
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    if(input.expectedVersion!==saved.version)return send(res,409,{error:'Review session version conflict; refresh before continuing',currentVersion:saved.version});
    // The identical as-of is necessary because deadline status contributes to dossier SHA.
    const asOf=parts[3]==='preview'?new Date().toISOString():input.asOf;
    if(parts[3]==='commit'&&(typeof asOf!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(asOf)))return send(res,422,{error:'Exact preview as-of required'});
    const dossier=await currentDossier(saved,execution,asOf);
    if(parts[3]==='preview')return send(res,200,previewReviewSession(saved.workspace,dossier,input));
    const result=commitReviewSession(saved.workspace,dossier,input);
    if(result.applied===0)return send(res,200,{schema:'beforeroll-review-session-commit-v1',applied:0,version:saved.version,previewSha256:result.preview.sha256,notClearance:true});
    const next=await store.persist(result.workspace,{expectedVersion:saved.version});
    return send(res,200,{schema:'beforeroll-review-session-commit-v1',applied:result.applied,version:next.version,
     workspaceRevision:next.workspace.revision,previewSha256:result.preview.sha256,notClearance:true});
   }
   if(action==='document-preview'&&req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    const body=await jsonBody(req,12*1024*1024);
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    if(body.expectedVersion!==saved.version)return send(res,409,{error:'Preview source version changed; reload project and retry',currentVersion:saved.version});
    return send(res,200,previewCallSheetOriginal(body.file||{}));
   }
   if(action==='impact'&&req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    const body=await jsonBody(req,12*1024*1024);
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    if(body.expectedVersion!==saved.version)return send(res,409,{error:'Version conflict: reload before previewing changes',currentVersion:saved.version});
    const envelope=body.transcription?inspectReviewedCallSheet({file:{...body.file,kind:'callSheet'},transcription:body.transcription}):inspectImport(body.file||{});
    const impact=previewSourceChange(saved.workspace,envelope,{documentId:body.documentId,persistedVersion:saved.version});
    return send(res,200,impact);
   }
   if(action==='operations'&&parts[3]==='export'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const w=saved.workspace,asOf=uri.searchParams.get('asOf')??new Date().toISOString();
    const output={schema:'beforeroll-production-operations-evidence-v1',id:w.id,title:w.title,workspaceRevision:w.revision,persistedVersion:saved.version,
     sourceDocuments:w.documents.map(d=>({id:d.id,name:d.name,sha256:d.sourceHash,rawSourceSha256:d.importReceipt?.rawHash??null,coverageGaps:d.coverage.gaps,transcriptionReview:d.pdfTranscriptionReview??null})),
     callSheetHash:w.callSheet?.sourceHash??null,callSheetUnsupportedRows:w.callSheet?.unsupported??[],
     operations:projectOperations(w,{asOf}),humanSourceClaims:projectSceneAuthority(w).summary,documentAuthority:projectAuthorityGraph(w).summary,
     notClearance:true,notice:'Source-bound operational review, NOT evidence of permission, signature authenticity or satisfied legal conditions.'};
    return send(res,200,output,{'Content-Disposition':`attachment; filename="BEFOREROLL_${id}_OPERATIONAL_REGISTER.json"`});
   }
   if(action==='operations'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const asOf=uri.searchParams.get('asOf')??new Date().toISOString();
    return send(res,200,{version:saved.version,...projectOperations(saved.workspace,{asOf})});
   }
   if(action==='execution'&&parts[3]==='export'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const plan=planIntelligence(saved.workspace);
    return send(res,200,await execution.exportEvidence(plan),{'Content-Disposition':`attachment; filename="BEFOREROLL_${id}_SOURCE_BOUND_EVIDENCE.json"`});
   }
   if(action==='execution'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    if(saved.workspace.documents.some(d=>d.importReceipt?.requiresHumanTextReview&&!d.pdfTranscriptionReview))return send(res,200,{schema:'beforeroll-execution-status-v1',projectId:id,state:'PDF_TRANSCRIPTION_REVIEW_REQUIRED',planned:0,attempts:0,completed:0,entries:[],notClearance:true});
    if(!saved.workspace.documents.length||!saved.workspace.callSheet?.scenes?.length)return send(res,200,{schema:'beforeroll-execution-status-v1',projectId:id,state:'INCOMPLETE_SOURCES',planned:0,attempts:0,completed:0,entries:[],notClearance:true});
    const plan=planIntelligence(saved.workspace);
    const offset=Number(uri.searchParams.get('offset')??0),limit=Number(uri.searchParams.get('limit')??40);
    const status=await execution.status(plan,{offset,limit});
    const now=Date.now();while(config.recent.length&&config.recent[0]<=now-3600000)config.recent.shift();
    return send(res,200,{...status,hourlyAllowance:{configured:config.maxCallsPerHour,remaining:Math.max(0,config.maxCallsPerHour-config.recent.length),localProcessOnly:true,notProviderQuota:true}});
   }
   if(action==='execution'&&req.method==='POST'){
    if(!config.enabled)return send(res,503,{error:'Live Clocked project analysis disabled. Offline source review remains available.'});
    const token=(req.headers['x-operator-token']||'').toString();
    if(!token||!constantEqual(token,config.operatorToken))return send(res,401,{error:'A valid project operator token is required'});
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
    if(config.activeProject||config.activeSweep)return send(res,409,{error:'Another model batch is already running'});
    const input=await jsonBody(req);
    if(input.confirm!=='RUN_PROJECT_CLOCKED'||!Number.isSafeInteger(input.maxCalls)||input.maxCalls<1||input.maxCalls>32)return send(res,400,{error:'Explicit RUN_PROJECT_CLOCKED confirmation and 1-32 maxCalls required'});
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const plan=planIntelligence(saved.workspace);
    const now=Date.now();while(config.recent.length&&config.recent[0]<=now-3600000)config.recent.shift();
    const available=config.maxCallsPerHour-config.recent.length;
    if(available<1)return send(res,429,{error:'Local hourly attempt cap reached. No new calls made.'});
    config.activeProject=true;
    try{
     const result=await execution.runBatch({workspace:saved.workspace,plan,maxCalls:Math.min(input.maxCalls,available),operatorAuthorized:true,
      checkFresh:async()=>{const current=await store.load(id);if(!current)throw Error('Production was deleted');return current.workspace;},
      beforeCall:async()=>{const at=Date.now();while(config.recent.length&&config.recent[0]<=at-3600000)config.recent.shift();if(config.recent.length>=config.maxCallsPerHour)throw Error('Local hourly limit reached before dispatch');config.recent.push(at);},
      transport:async(payload)=>{
       const resp=await config.fetchImpl('https://clocked.rezolve.ai/clocked/decide',{method:'POST',headers:{'Authorization':`Bearer ${config.apiKey}`,'Content-Type':'application/json','Accept':'application/json','Idempotency-Key':randomUUID(),'User-Agent':'BeforeRoll-Production-Execution/0.16.0'},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000),cache:'no-store'});
       if(!resp.ok)throw Error('Provider rejected project request');
       const response=await resp.json();const credit=resp.headers.get('x-clocked-credits');
       return {response,credits:credit&&/^\d+$/.test(credit)?Number(credit):null,controlledTest:options.controlledTestMode===true};
      }});
     return send(res,200,{...result,requestCap:input.maxCalls,noAutomaticRetries:true});
    }finally{config.activeProject=false;}
   }
   if(action==='plan'&&req.method==='GET'){
    const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
    const plan=planIntelligence(saved.workspace);
    const offset=Number(uri.searchParams.get('offset')??0),limit=Number(uri.searchParams.get('limit')??100);
    if(!Number.isSafeInteger(offset)||offset<0||offset>MAX_PLAN_TASKS||!Number.isSafeInteger(limit)||limit<1||limit>500)return send(res,400,{error:'Invalid plan page or size'});
    return send(res,200,{schema:plan.schema,workspaceId:plan.workspaceId,workspaceRevision:plan.workspaceRevision,plannedCalls:plan.plannedCalls,
     pagination:{offset,limit,total:plan.plannedCalls,hasMore:offset+limit<plan.plannedCalls},
     byDocument:plan.documents.map(d=>({id:d.id,unitCount:d.unitCount,planned:d.unitCount*saved.workspace.callSheet.scenes.length})),
     tasks:plan.tasks.slice(offset,offset+limit).map(t=>({id:t.id,documentId:t.documentId,sceneId:t.sceneId,unitId:t.unitId,sourceQuote:t.sourceQuote,sourceRange:t.sourceRange,requestHash:t.requestHash,status:t.status})),
     notClearance:true,notice:'Offline task preview, zero provider calls. Source segment coverage does not prove document authority.'});
   }
   if(req.method!=='POST'||!['import','commit-source-change','call-sheet-transcript','review','replace','review-task','authority-document','authority-link','scene-authority','pdf-transcription','scene-schedule','condition','condition-decision'].includes(action))return send(res,404,{error:'Unknown workspace route'});
   if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
   const body=await jsonBody(req,['import','commit-source-change','call-sheet-transcript'].includes(action)?12*1024*1024:BODY_MAX);
   const saved=await store.load(id);if(!saved)return send(res,404,{error:'Workspace not found'});
   if(body.expectedVersion!==saved.version)return send(res,409,{error:'Version conflict: reload before modifying',currentVersion:saved.version});
   const w=saved.workspace;
   if(action==='import'||action==='commit-source-change'){
    const envelope=body.transcription?inspectReviewedCallSheet({file:{...body.file,kind:'callSheet'},transcription:body.transcription}):inspectImport(body.file||{});
    const replaces=envelope.kind==='callSheet'?Boolean(w.callSheet):w.documents.some(d=>d.id===body.documentId);
    if(action==='commit-source-change'||replaces)verifySourceChangeCommit(w,envelope,{documentId:body.documentId,persistedVersion:saved.version,previewSha256:body.previewSha256});
    applySourceImport(w,envelope,{documentId:body.documentId});
    await originalVault.storeImport(body.file||{},envelope);
   }else if(action==='call-sheet-transcript'){
    const file={...body.file,kind:'callSheet'};
    const envelope=inspectReviewedCallSheet({file,transcription:body.transcription});
    if(w.callSheet)verifySourceChangeCommit(w,envelope,{persistedVersion:saved.version,previewSha256:body.previewSha256});
    applySourceImport(w,envelope);
    await originalVault.storeImport(file,envelope);
   }else if(action==='pdf-transcription'){
    confirmPdfTranscription(w,body);
   }else if(action==='scene-authority'){
    recordSceneAuthority(w,body);
   }else if(action==='scene-schedule'){
    recordSceneSchedule(w,body);
   }else if(action==='condition'){
    recordCondition(w,body);
   }else if(action==='condition-decision'){
    decideCondition(w,body);
   }else if(action==='authority-document'){
    annotateAuthorityDocument(w,body);
   }else if(action==='authority-link'){
    const from=w.documents.find(d=>d.id===body.fromId);
    const unit=from?.units.find(u=>u.id===body.unitId);
    if(!unit)throw Error('Select an original source unit belonging to the linking document');
    recordAuthorityLink(w,{fromId:body.fromId,toId:body.toId,kind:body.kind,start:unit.start,end:unit.end,quote:unit.text,reviewer:body.reviewer,reason:body.reason});
   }else if(action==='review-task'){
    verifyTaskForReview(w,body.evidenceId);
    recordReview(w,{evidenceId:body.evidenceId,decision:body.decision,reason:body.reason,reviewer:body.reviewer});
   }else if(action==='review'){
    recordReview(w,{evidenceId:body.evidenceId,decision:body.decision,reason:body.reason,reviewer:body.reviewer});
   }else if(action==='replace'){
    return send(res,410,{error:'Whole-workspace replacement is retired. Use source impact preview and commit-source-change for revisions, or encrypted backup verification and recovery into a separate workspace.'});
   }
   assertWorkspaceSources(w);assertAuthorityIntegrity(w);assertSceneAuthorityIntegrity(w);assertProductionOperationsIntegrity(w);
   const next=await store.persist(w,{expectedVersion:saved.version});
   return send(res,200,{id:next.id,version:next.version,workspace:next.workspace});
  }catch(e){const diagnosis=recoveryDiagnostic(e);return send(res,e.httpStatus||422,{error:e.message,...diagnosis});}
 }
 if(uri.pathname==='/api/production/plan'&&req.method==='POST'){
  if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(res,415,{error:'Use application/json'});
  try{const input=await jsonBody(req);const workspace=createProduction(input);const plan=planIntelligence(workspace);
   return send(res,200,{version:'workspace-v1',workspace:{id:workspace.id,title:workspace.title,documentCount:workspace.documents.length,sceneCount:workspace.callSheet.scenes.length},
    documents:workspace.documents.map(d=>({id:d.id,sourceHash:d.sourceHash,revision:d.revision,coverage:d.coverage,units:d.units.map(u=>({id:u.id,range:[u.start,u.end],text:u.text,kind:u.kind}))})),
    plannedCalls:plan.plannedCalls,planIdentity:plan.taskIds,warning:'This is offline analysis planning only. No Clocked calls. No legal or filming-clearance claim.'});
  }catch(e){return send(res,e.httpStatus||422,{error:e.message});}
 }
 if(uri.pathname==='/api/health'&&req.method==='GET')return send(res,200,{name:'BeforeRoll',version:'0.29.0',workspaceEngine:evaluationMode?'M3-S30-isolated-evaluation':'M3-S29-local-owner-security',workspacesEnabled:Boolean(store),ownerAccessRequired:Boolean(store&&owner.guarded),controlledTestMode:options.controlledTestMode===true,liveEnabled:config.enabled,localHourlyAttemptCap:config.maxCallsPerHour,mode:evaluationMode?'LOCAL_EVALUATION_SANDBOX':'local-owner-production',evaluationMode,recordedResponseNotice:evaluationMode?options.evaluationRuntime.notice:null});
 if(uri.pathname==='/api/extract'&&req.method==='POST')return handleLive(req,res,config);
 if(uri.pathname==='/api/semantic'&&req.method==='POST')return handleSemantic(req,res,config);
 if(uri.pathname==='/api/semantic-sweep'&&req.method==='POST')return handleSemanticSweep(req,res,config);
 if(uri.pathname==='/api/semantic-batch'&&req.method==='POST')return handleMultiScene(req,res,config);
 if(req.method==='GET'&&staticFiles.has(uri.pathname)){
   const rel=staticFiles.get(uri.pathname);const full=path.join(ROOT,rel);
   try {const content=await fs.readFile(full);res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream'});return res.end(content);}
   catch{return send(res,404,{error:'Missing local build asset'});}
 }
 return send(res,404,{error:'Not found'});
});
 server.requestTimeout=30000;server.headersTimeout=15000;server.maxHeadersCount=80;server.maxRequestsPerSocket=1000;
 server.ownerAccessTokenForTerminal=evaluationMode||options.workspaceStore?null:ownerToken;
 return server;
}
if(IS_ENTRY){
 if(!IS_EVALUATION&&process.env.BEFOREROLL_LIVE_ENABLED==='true'&&!LIVE)throw Error('Live mode requires CLOCKED_API_KEY and BEFOREROLL_OPERATOR_TOKEN in the local .env (or process environment).');
 if(!Number.isInteger(PORT)||PORT<1||PORT>65535)throw Error('Invalid PORT');
 const evaluationMode=process.argv.includes('--evaluate');
 const runtime=evaluationMode?await makeEvaluationRuntime():null;
 const server=createAppServer(evaluationMode?{
  evaluationMode:true,evaluationRuntime:runtime,workspaceStore:runtime.store,
  executionStore:runtime.execution,sourceVault:runtime.vault,enabled:false,apiKey:null,operatorToken:null
 }:{});
 server.listen(PORT,HOST,()=>{
  console.log(`BEFOREROLL_READY=http://${HOST}:${PORT}`);
  console.log('MODE='+(evaluationMode?'ISOLATED_FICTIONAL_EVALUATION_NO_KEYS':LIVE?'LIVE_ENABLED_OPERATOR_GATED':'RECORDED_REPLAY_ONLY'));
  console.log('LIVE_CLOCKED_ENABLED='+(evaluationMode?'false':LIVE));
  if(evaluationMode){console.log('EVALUATION_STATE=TEMPORARY_SANDBOX_ONLY');console.log('OWNER_DATA=UNTOUCHED');}
  else {console.log('LOCAL_HOURLY_ATTEMPT_ALLOWANCE='+ (process.env.BEFOREROLL_MAX_CALLS_PER_HOUR||DEFAULT_MAX_CALLS_PER_HOUR));
   if(server.ownerAccessTokenForTerminal&&!process.env.BEFOREROLL_OWNER_TOKEN)console.log('LOCAL_OWNER_ACCESS_TOKEN='+server.ownerAccessTokenForTerminal);
   console.log('Owner token is separate from the Clocked API key and the billable operator token. Never share it.');}
  console.log('No Clocked API key is ever printed or sent to the browser.');
 });
 if(runtime){const close=()=>{server.close(()=>runtime.dispose().catch(()=>{}));};process.once('SIGINT',close);process.once('SIGTERM',close);}
}
