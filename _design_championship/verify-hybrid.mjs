import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {frozenCases} from './prototypes/hybrid-evidence.js';

const study=path.dirname(fileURLToPath(import.meta.url));
const root=path.dirname(study);
const evidence=path.join(study,'evidence/hybrid');
const sha=x=>createHash('sha256').update(x).digest('hex');
const readJson=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const record=async name=>readJson(path.join(evidence,name));
const originalCases=(await readJson(path.join(root,'fixtures/M3S6_UNFAMILIAR_CASES.json'))).cases;
let results=0;
for(const id of ['U01','U02']){
 const original=originalCases.find(x=>x.id===id);
 const recording=await readJson(path.join(root,`fixtures/audit/M3S6_${id}_OWNER_LIVE_EVIDENCE.json`));
 const projection=frozenCases.find(x=>x.case.id===id);
 assert.deepEqual(projection.case,original);
 assert.deepEqual(projection.recording,recording);
 assert.equal(sha(original.permit),original.permitSha256);
 original.scenes.forEach((row,i)=>assert.equal(sha(row),original.sceneSha256[i]));
 assert.equal(recording.scenes.flatMap(x=>x.scan.results).length,8);
 results+=8;
}
assert.equal(sha(await fs.readFile(path.join(study,'prototypes/hybrid-demo-permit.txt'))),frozenCases[0].case.permitSha256);

const baseline=await record('v1-preservation-baseline.json');
const integration=new Set(['_design_championship/prototypes/index.html','_design_championship/prototypes/prototype.js']);
for(const file of baseline.files){
 if(integration.has(file.path)){
  const frozen=path.join(study,'prototypes/v1-frozen',path.basename(file.path));
  assert.equal(sha(await fs.readFile(frozen)),file.sha256,`Frozen original changed: ${file.path}`);
 }else assert.equal(sha(await fs.readFile(path.join(root,file.path))),file.sha256,`V1 changed: ${file.path}`);
}
// The shared renderer may only register and dispatch concept G; A–F stay byte-identical after removing those additions.
const current=await fs.readFile(path.join(study,'prototypes/prototype.js'),'utf8');
const removeG=current.replace("import {mountHybrid} from './editorial-studio.js';\n",'')
 .replace(",'Editorial Intelligence Studio'",'').replace(",'editorial-studio'",'')
 .replace(" if(concept===6){mountHybrid({screen,onScreenChange:next=>{screen=next;document.querySelectorAll('#lab [data-go]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.go===next)));}});return;}\n",'');
assert.equal(removeG,await fs.readFile(path.join(study,'prototypes/v1-frozen/prototype.js'),'utf8'));
const currentIndex=await fs.readFile(path.join(study,'prototypes/index.html'),'utf8');
assert.equal(currentIndex.replace('<link rel="stylesheet" href="editorial-studio.css">',''),await fs.readFile(path.join(study,'prototypes/v1-frozen/index.html'),'utf8'));
for(const name of ['prototype.css','case-data.js'])assert.equal(sha(await fs.readFile(path.join(study,'prototypes',name))),sha(await fs.readFile(path.join(study,'prototypes/v1-frozen',name))));

const layouts=await record('four-way-layout.json');
assert.equal(layouts.length,60);assert.ok(layouts.every(x=>x.scrollWidth<=x.width));
const stress=await record('stress-layouts.json');
assert.equal(stress.length,48);assert.ok(stress.every(x=>x.scrollWidth<=x.width));
const final=await record('final-captures.json');
assert.equal(final.length,21);assert.ok(final.every(x=>!x.overflow));
const tasks=await record('four-way-review-tasks.json');
assert.equal(tasks.length,12);
for(const concept of ['editorial','lens','studio','editorial-studio'])for(const width of [1440,768,390]){
 const task=tasks.filter(x=>x.concept===concept&&x.viewport.width===width);assert.equal(task.length,1);
 assert.equal(task[0].purposefulButtons,7);assert.equal(task[0].result.overflow,false);
 assert.ok(task[0].preview.text.includes(frozenCases[0].case.permit.split('\n')[3]));
 assert.match(task[0].result.text,/review (?:applied|saved)/i);
 if(concept==='editorial-studio')assert.equal(task[0].result.focusRole,'status');
}
for(const row of await record('contrast-checks.json'))assert.ok(row.pass&&row.ratio>=row.target);
assert.equal((await record('intake-acceptance.json')).exactOriginalHashConfirmed,true);
assert.equal((await record('u02-journey.json')).rawExact,true);
assert.equal((await record('condition-acceptance.json')).conditionSelected.value,'Blocked');
assert.equal((await record('revision-acceptance.json')).staleGuard.reviewDisabled,true);
assert.equal((await record('mobile-navigation-acceptance.json')).chosenMobile.focus,'H1');
const shared=await record('shared-selector-acceptance.json');
assert.equal(shared.sharedG.body,'editorial-studio');assert.equal(shared.backA.body,'editorial');assert.equal(shared.returnedG.body,'editorial-studio');
assert.ok(shared.discoveryG.quote.includes(frozenCases[0].case.permit.split('\n')[1]));
const notes=await record('downloaded-design-notes.json');
assert.equal(notes.schema,'beforeroll-design-v2-notes-only');assert.equal(notes.prototypeOnly,true);
const scores=await record('scores-v2.json');
assert.equal(scores.weights.reduce((t,n)=>t+n,0),100);
for(const row of scores.scores)assert.equal(Math.round(row.values.reduce((t,n,i)=>t+n*scores.weights[i]/10,0)*100)/100,row.total);
const oldScores=await readJson(path.join(study,'evidence/scores.json'));
for(const row of scores.scores.filter(x=>x.concept!=='editorial-studio')){
 const old=oldScores.scores.find(x=>x.name===row.name);assert.deepEqual(row.values,old.final);assert.equal(row.total,old.finalTotal);
}
const head=execFileSync('git',['rev-parse','--short','HEAD'],{cwd:root,encoding:'utf8'}).trim();
assert.equal(head,'355cd5a');
execFileSync('git',['merge-base','--is-ancestor','359f476','HEAD'],{cwd:root});
const changed=execFileSync('git',['diff','HEAD','--name-only'],{cwd:root,encoding:'utf8'}).trim();
assert.equal(changed,'','Tracked production files changed');

function jpegSize(bytes){
 assert.equal(bytes.readUInt16BE(0),0xffd8);let i=2;
 while(i<bytes.length){if(bytes[i]!==255){i++;continue;}const m=bytes[i+1];if(m===255){i++;continue;}if(m===0xd9||m===0xda)break;const len=bytes.readUInt16BE(i+2);if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m))return {format:'JPEG',imageWidth:bytes.readUInt16BE(i+7),imageHeight:bytes.readUInt16BE(i+5)};i+=len+2;}throw Error('JPEG dimensions unavailable');
}
const files=[];
for(const name of (await fs.readdir(evidence)).sort()){
 if(name==='manifest-v2.json')continue;const file=path.join(evidence,name);if(!(await fs.stat(file)).isFile())continue;
 const bytes=await fs.readFile(file);files.push({name,bytes:bytes.length,sha256:sha(bytes),...(name.endsWith('.jpg')?jpegSize(bytes):{})});
}
const deliverables=[];
for(const name of ['08_HYBRID_SYNTHESIS_AUDIT.md','09_EDITORIAL_INTELLIGENCE_STUDIO_SYSTEM.md','10_HYBRID_BROWSER_ACCEPTANCE.md','11_FINAL_FOUR_WAY_CHAMPIONSHIP.md','12_FINAL_IMPLEMENTATION_CONTRACT.md','HYBRID_REVIEW_GUIDE.md']){
 const bytes=await fs.readFile(path.join(study,name));assert.ok(bytes.length>1000);deliverables.push({name,bytes:bytes.length,sha256:sha(bytes)});
}
const summary={date:'2026-10-26',head,acceptedAncestor:'359f476',newClockedRequests:0,providerProjection:'EXACT_U01_U02',genuineRecordedResults:results,v1PreservedFiles:baseline.files.length,sharedIntegrationOnly:true,comparativeLayouts:60,stressLayouts:48,finalCaptures:21,reviewTasks:12,horizontalPageOverflow:0,contrastSamples:7,champion:'Editorial Intelligence Studio',backup:'Cinematic Editorial',productionRedesign:'NOT_STARTED_PENDING_FINAL_SELECTION',screenshots:files.filter(x=>x.format==='JPEG').length};
await fs.writeFile(path.join(evidence,'manifest-v2.json'),JSON.stringify({...summary,method:'One expert design assessment; real browser screenshots and local simulated interactions; no participant timing or actual production lifecycle claim.',files,deliverables},null,2));
console.log(JSON.stringify(summary,null,2));
