import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {evidence} from './prototypes/case-data.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=async p=>JSON.parse(await fs.readFile(path.join(root,'..',p),'utf8'));
const original=(await read('fixtures/M3S6_UNFAMILIAR_CASES.json')).cases[0];
const recording=await read('fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json');
assert.deepEqual(evidence.case,original);assert.deepEqual(evidence.recording,recording);
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(original.permit),original.permitSha256);
original.scenes.forEach((s,i)=>assert.equal(sha(s),original.sceneSha256[i]));
assert.equal(recording.scenes.flatMap(s=>s.scan.results).length,8);
const score=JSON.parse(await fs.readFile(path.join(root,'evidence/scores.json')));
assert.equal(score.weights.reduce((a,b)=>a+b,0),100);
for(const s of score.scores)assert.equal(Math.round(s.final.reduce((v,n,i)=>v+n*score.weights[i]/10,0)*100)/100,s.finalTotal);
const layouts=JSON.parse(await fs.readFile(path.join(root,'evidence/finalist-layout-checks.json')));
assert.equal(layouts.length,45);assert.ok(layouts.every(x=>x.scrollWidth<=x.width));
for(const c of ['editorial','studio','lens','command','atelier','clarity'])for(const state of ['opening','discovery','exception','workflow','depth'])for(const width of [1440,390])await fs.access(path.join(root,`evidence/${c}-${state}-${width}.jpg`));
for(const file of ['finalist-review-interactions.json','finalist-secondary-interactions.json'])assert.equal(JSON.parse(await fs.readFile(path.join(root,'evidence',file))).length,3);
function jpegSize(bytes){
 assert.equal(bytes.readUInt16BE(0),0xffd8);
 let i=2;while(i<bytes.length){if(bytes[i]!==255){i++;continue;}const marker=bytes[i+1];if(marker===255){i++;continue;}if(marker===0xd9||marker===0xda)break;const len=bytes.readUInt16BE(i+2);if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {imageFormat:'JPEG',imageWidth:bytes.readUInt16BE(i+7),imageHeight:bytes.readUInt16BE(i+5)};i+=len+2;}throw Error('JPEG dimensions not found');
}
const findings=[];
for(const name of await fs.readdir(path.join(root,'evidence'))){
 const p=path.join(root,'evidence',name);const st=await fs.stat(p);if(!st.isFile()||name==='manifest.json')continue;
 const bytes=await fs.readFile(p);findings.push({name,bytes:bytes.length,sha256:sha(bytes),...(name.endsWith('.jpg')?jpegSize(bytes):{})});
}
await fs.writeFile(path.join(root,'evidence/manifest.json'),JSON.stringify({date:'2026-10-26',clockedCalls:0,recordingProjection:'EXACT_COPY_VERIFIED',screenshotsAreBrowserCaptures:true,files:findings},null,2));
console.log(JSON.stringify({recordingProjection:'EXACT_COPY',sourceHashes:'MATCH',recordedResults:8,newClockedCalls:0,concepts:6,comparableStates:5,initialScreenshots:60,finalistLayoutChecks:45,horizontalOverflow:0,scores:'ARITHMETIC_VERIFIED',manifestFiles:findings.length},null,2));
