import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluatePreflight,parseCallSheet,permitInterpretation,validSpan,extractPayload,clockToMinutes,sourcePointSlice} from '../src/engine.mjs';
const f=id=>JSON.parse(readFileSync(new URL(`../fixtures/R7_${id}_RECORDED.json`,import.meta.url)));
const A=f('F01'),B=f('F02'),C=f('F03');
const replay=(calls,profile='standard',record=A)=>evaluatePreflight({permitText:record.source,callSheetText:calls,fields:record.fields,profile});
test('R7 F01 recorded permit spans and issued request decoy',()=>{
 for(const field of Object.values(A.fields))assert.equal(validSpan(A.source,field),true);
 const t=permitInterpretation(A.source,A.fields);
 assert.equal(t.end.value,'17:00');assert.equal(t.location.value,'EAST COURTYARD');assert.equal(t.sound.value,'16:15');
 assert.notEqual(t.end.value,'20:00');
});
test('call sheet row-local provenance for 3 distinct scenes',()=>{
 const p=parseCallSheet(C.source);assert.equal(p.scenes.length,3);assert.equal(p.unsupported.length,0);
 assert.deepEqual(p.scenes.map(s=>[s.number,s.location,s.start,s.end]),[
  ['14','EAST COURTYARD','15:30','16:05'],['15','EAST COURTYARD','16:05','17:20'],['16','WEST PLAZA','14:00','14:25']]);
 for(const s of p.scenes)for(const [field,span] of Object.entries(s.source.fields)){
  assert.ok(span.start>=s.source.start&&span.end<=s.source.end,`${s.id}.${field} stays in its own source row`);
 }
});
test('scene 15 catches real time and amplified sound violation',()=>{
 const r=replay(C.source);const fs=r.findings.filter(x=>x.sceneId==='S15');
 assert.ok(fs.some(x=>x.code==='OVER_TIME'&&x.severity==='issue'));
 assert.ok(fs.some(x=>x.code==='SOUND'&&x.severity==='issue'));
 assert.equal(r.scenes.find(x=>x.id==='S15').end,'17:20');
 assert.ok(r.findings.some(x=>x.code==='SIGNOFF_PENDING'&&x.severity==='review')); 
 assert.equal(r.findings.filter(x=>x.sceneId==='S14'&&x.code==='SOUND_CLASSIFY').length,0,'Explicit no-playback should not trigger music ambiguity');
});
test('scene 16 location excluded and drone denied, not implied permission',()=>{
 const r=replay(C.source);let fs=r.findings.filter(x=>x.sceneId==='S16');
 assert.ok(fs.some(x=>x.code==='LOCATION'));
 assert.ok(fs.some(x=>x.code==='DRONE'&&x.severity==='issue'));
});
test('variation fields point to base-permit paragraph and CANNOT automatically grant',()=>{
 const t=permitInterpretation(B.source,B.fields,'variation');
 assert.equal(t.variation.location.value,'Warehouse NORTH');
 assert.equal(t.variation.date.value,'7 November 2026');
 assert.equal(t.variation.location.valid,false);
 assert.equal(t.variation.date.valid,false);
 assert.equal(t.variation.end.valid,true);
 assert.equal(t.variation.pendingSouth.value,'22:00');
 assert.equal(t.variation.southAuthorization.value,null);
 const scene='DAILY CALL SHEET CS-12 - Saturday 7 November 2026\nScene 21 | Warehouse NORTH | 19:55-20:10 | Dialogue.\nScene 22 | Warehouse SOUTH | 21:00-21:30 | Dialogue.';
 const r=replay(scene,'variation',B);assert.ok(r.findings.some(x=>x.code==='VARIATION_SCOPE'&&x.sceneId==='S21'));
 assert.ok(r.findings.some(x=>x.code==='LOCATION'&&x.sceneId==='S22'));
});
test('empty permit fields cannot turn unknown into permissions',()=>{
 const r=evaluatePreflight({permitText:'This is a draft application only with no approved permit or terms.',fields:{},callSheetText:C.source});
 assert.ok(r.findings.some(x=>x.code==='END_UNKNOWN'));
 assert.equal(r.findings.filter(x=>x.severity==='issue').length,0);
 assert.ok(r.findings.some(x=>x.code==='LOCATION_UNKNOWN'));
});
test('unsupported call sheet rows detected, not silently certified',()=>{
 const p=parseCallSheet('Date 5 November 2026\nScene 14 - 18:00 at East Yard\nScene 15 | EAST COURTYARD | 16:05-17:20 | Amplified playback.');
 assert.equal(p.scenes.length,1);assert.equal(p.unsupported.length,1);
});
test('edited or missing scene rows require review',()=>{
 const scenes=parseCallSheet(C.source).scenes;scenes[0].edited=true;scenes[1].end='';
 const r=evaluatePreflight({permitText:A.source,fields:A.fields,callSheetText:C.source,scenes});
 assert.ok(r.findings.some(x=>x.code==='MANUAL_ROW'));
 assert.ok(r.findings.some(x=>x.code==='SCENE_INCOMPLETE'));
});
test('timestamps must be valid; overnight scenes cannot be assumed',()=>{
 assert.equal(clockToMinutes('17:00'),1020);assert.equal(clockToMinutes('25:00'),null);
 const p=parseCallSheet('Scene 3 | WAREHOUSE | 23:50-00:20 | dialogue');
 assert.equal(p.scenes.length,1);
 const r=evaluatePreflight({permitText:A.source,fields:A.fields,callSheetText:'5 November 2026\nScene 3 | WAREHOUSE | 23:50-00:20 | dialogue'});
 assert.ok(r.findings.some(x=>x.code==='SCENE_INCOMPLETE'));
});
test('live request schema is curated and never includes scene parsing',()=>{
 const b=extractPayload('An actual issued permit with 09:00 filming text','standard');
 assert.equal(b.fields.principal_filming_end!==undefined,true);
 assert.equal(b.fields.scenes,undefined);
 assert.throws(()=>extractPayload('source','bad'));
});
test('ambiguous amendment cannot make a within-variation North scene an asserted breach',()=>{
 const call='DAILY CALL SHEET CS-12 - 7 November 2026\nScene 21 | Warehouse NORTH | 19:55-20:10 | Interview.\nScene 22 | Warehouse SOUTH | 21:00-21:30 | Interview.\nScene 23 | Warehouse NORTH | 20:10-20:45 | Closing setup.';
 const r=replay(call,'variation',B);
 const one=r.findings.filter(x=>x.sceneId==='S21');
 assert.ok(one.some(x=>x.code==='VARIATION_SCOPE'&&x.severity==='review'));
 assert.ok(!one.some(x=>x.code==='OVER_TIME'&&x.severity==='issue'));
 const south=r.findings.filter(x=>x.sceneId==='S22');
 assert.ok(south.some(x=>x.code==='LOCATION'&&x.severity==='review'));
 assert.ok(!south.some(x=>x.code==='OVER_TIME'),'base North cutoff cannot be applied to South');
 assert.ok(r.findings.some(x=>x.sceneId==='S23'&&x.code==='OVER_VARIATION'));
});
test('human permit correction adds review even if values seem compliant',()=>{
 const r=evaluatePreflight({permitText:A.source,fields:A.fields,callSheetText:C.source,manualFields:{end:'20:00'}});
 assert.ok(r.findings.some(x=>x.code==='MANUAL_TERM'&&x.severity==='review'));
});

test('Clocked codepoint offsets remain correct after emoji; source citations are exact',()=>{
 const src='🎬 permit says filming ends at 17:00.';
 const start=Array.from(src.slice(0,src.indexOf('17:00'))).length;
 const end=start+5;
 assert.equal(validSpan(src,{value:'17:00',start,end}),true);
 assert.equal(sourcePointSlice(src,start,end),'17:00');
 const call='🎬 DAILY CALL SHEET - 5 November 2026\nScene 2 | EAST COURTYARD | 16:00-17:20 | Amplified playback.';
 const row=parseCallSheet(call).scenes[0];
 assert.equal(sourcePointSlice(call,row.source.start,row.source.end).includes('Scene 2'),true);
 assert.equal(sourcePointSlice(call,row.source.fields.scene.start,row.source.fields.scene.end),'2');
});

test('different schedule date downgrades apparent documented breaches to conditional review',()=>{
 const day=C.source.replace('Thursday 5 November 2026','Friday 6 November 2026');
 const r=replay(day);
 assert.ok(r.findings.some(x=>x.code==='DATE_SCOPE'));
 assert.ok(r.findings.some(x=>x.code==='OVER_TIME' && x.severity==='review'));
 assert.equal(r.findings.filter(x=>x.severity==='issue').length,0);
});
