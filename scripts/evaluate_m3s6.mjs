#!/usr/bin/env node
/** M3-S6 read-only evaluator. Does NOT contact Clocked or any remote endpoint.
 * Compares original, source-audited model replies with PRE-FROZEN synthetic gold.
 * Passing five assertions is not real-world accuracy or document authorization.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import {sha256} from '../src/semantic.mjs';
import {planMultiSceneBatch,validateBatchEnvelopeShape} from '../src/multi-scene.mjs';
import {auditDeskSweep} from '../src/desk-semantic.mjs';
import {sentenceCandidates} from '../src/semantic-source.mjs';
import {uncoveredSourceSpans} from '../src/semantic-sweep.mjs';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const cases=read(join(ROOT,'fixtures/M3S6_UNFAMILIAR_CASES.json'));
const gold=read(join(ROOT,'research/M3S6_FROZEN_PREREGISTERED_GOLD.json'));
function fail(msg){throw Error(msg);}
function assert(x,msg){if(!x)fail(msg);}
function freezeCheck(){
 assert(cases.study===gold.study,'Frozen study identity mismatch');
 assert(gold.modelResultsAtFreeze==='NONE','Unexpected frozen model output');
 for(const c of cases.cases){
  assert(c.permitSha256===sha256(c.permit),'Frozen permit fingerprint mismatch for '+c.id);
  assert(c.scenes.every((s,i)=>sha256(s)===c.sceneSha256[i]),'Frozen scene fingerprint mismatch for '+c.id);
  const labels=gold.caseRubric.find(r=>r.id===c.id);
  if(c.offline_only){assert(!labels,'Failure sentinel must be offline only');continue;}
  assert(labels?.permitSha256===c.permitSha256,'Preregistered permit mismatch '+c.id);
  assert(JSON.stringify(labels.sceneSha256)===JSON.stringify(c.sceneSha256),'Preregistered scenes mismatch '+c.id);
  const rows=c.scenes.map(x=>({sceneId:'S'+/^Scene (\d+)/.exec(x)?.[1],sceneRow:x}));
  const p=planMultiSceneBatch({permitText:c.permit,scenes:rows});
  assert(p.totalCalls===8&&p.scenes.every(x=>x.clauses.length===4),'Expected 2 × 4 bounded source conditions in '+c.id);
  assert(labels.assertions.every(x=>p.scenes.some(s=>s.sceneId===x.sceneId)&&Number.isInteger(x.clause)&&x.clause>=1&&x.clause<=4&&['activity_link','granted_for_scene'].includes(x.field)&&['low','high'].includes(x.band)),'Preregistration malformed');
  console.log(`FROZEN=${c.id} SOURCE_SHA256=${c.permitSha256} SCENE_ROWS=2 CLAUSES_PER_SCENE=4 CALLS_MAX=8 GOLD_ASSERTIONS=${labels.assertions.length}`);
 }
 const sentinel=cases.cases.find(c=>c.id===gold.failureSentinel.id);
 assert(sentinel?.offline_only,'U03 must be offline-only');
 const chunks=sentenceCandidates(sentinel.permit),missing=uncoveredSourceSpans(sentinel.permit,chunks);
 const missingText=missing.map(x=>x.text).join(' ');
 assert(!chunks.some(x=>x.text.includes(gold.failureSentinel.requiredMissingExcerpt)),'Short clause unexpectedly segmented; rework sentinel before interpreting results');
 assert(missingText.includes('No')&&missingText.includes('drones.'),'Short safety omission not flagged as uncovered source');
 console.log(`FROZEN=${sentinel.id} OFFLINE_ONLY=YES OMITTED_SOURCE_VISIBLE=YES CLAUSES_DETECTED=${chunks.length} LIVE_CALLS=ZERO`);
 console.log('M3S6_SOURCE_PREFLIGHT=PASS | NO_CLOCKED_CALLS | NO_MODEL_ACCURACY_CLAIM');
}
async function grade(id,inputPath){
 const c=cases.cases.find(x=>x.id===id && !x.offline_only),r=gold.caseRubric.find(x=>x.id===id);
 assert(c&&r,'Unknown scored case; choose U01 or U02');
 const envelope=read(resolve(inputPath));
 const scenes=c.scenes.map(x=>({sceneId:'S'+/^Scene (\d+)/.exec(x)?.[1],sceneRow:x}));
 const plan=planMultiSceneBatch({permitText:c.permit,scenes});
 assert(validateBatchEnvelopeShape(envelope,plan),'Batch response envelope failed');
 const audits=new Map();
 for(const e of envelope.scenes){
  if(e.scan===null)continue;
  audits.set(e.sceneId,await auditDeskSweep({permitText:c.permit,sceneRow:e.sceneRow,sceneId:e.sceneId,scan:e.scan,hash:async x=>sha256(x),origin:'live'}));
 }
 console.log('SOURCE_IDENTITY=PASS | REQUEST_FINGERPRINTS=VERIFIED | PROVIDER_ORIGIN=OWNER_RECORDED_NOT_CRYPTOGRAPHICALLY_ATTESTED');
 console.log(`CASE=${id} ATTEMPTS=${envelope.attempts}/8 REPORTED_CREDITS=${envelope.reportedCredits??'UNKNOWN'} COMPLETE=${Boolean(envelope.complete)}`);
 if(!envelope.complete||audits.size!==2||Array.from(audits.values()).some(x=>!x.complete)){
  console.log('CHAMPIONSHIP_VERDICT=INCOMPLETE; DO NOT CLAIM VALIDATED MODEL CAPABILITY; DO NOT AUTO-RETRY');
  process.exitCode=2;return;
 }
 let pass=0;const detail=[];
 for(const a of r.assertions){
  const obj=audits.get(a.sceneId).checked.find(x=>x.index===a.clause);
  const score=obj?.modelAnswers?.[a.field]?.noul;
  assert(typeof score==='number'&&score>=0&&score<=1,'Missing/invalid typed model answer '+a.sceneId+' '+a.field);
  const ok=a.band==='high'?score>=.8:score<=.2;
  if(ok)pass++;
  detail.push({scene:a.sceneId,clause:a.clause,field:a.field,expected:a.band,observed:score,verdict:ok?'PASS':'FAIL'});
 }
 for(const d of detail)console.log(`${d.verdict} ${d.scene} CLAUSE=${d.clause} ${d.field} EXPECT=${d.expected} ACTUAL=${d.observed.toFixed(4)}`);
 console.log(`CHAMPIONSHIP_ASSERTIONS=${pass}/${detail.length}`);
 console.log(`CHAMPIONSHIP_VERDICT=${pass===detail.length?'NARROW_SYNTHETIC_PASS':'PREREGISTERED_FAILURE_RECORDED'}`);
 console.log('LIMITATION: scripted synthetic bands are not real-world accuracy, calibrated model confidence, signature validation, or exhaustive permit review.');
 if(pass!==detail.length)process.exitCode=2;
}
try{
 freezeCheck();
 const args=process.argv.slice(2);
 if(args.length===0||args.length===1&&args[0]==='--preflight'){
  console.log('NO_LIVE_RESULTS_EVALUATED=YES');
 }else{
  const i=args.indexOf('--case'),j=args.indexOf('--input');
  if(i<0||j<0||!args[i+1]||!args[j+1]||args.length!==4)fail('Use: node scripts/evaluate_m3s6.mjs --case U01 --input C:\\path\\to\\evidence.json');
  await grade(args[i+1],args[j+1]);
 }
}catch(e){console.error('M3S6_EVALUATION_FAILED_CLOSED='+e.message);process.exitCode=1;}
