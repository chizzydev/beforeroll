import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {auditDeskSweep,classifyAnswers} from '../src/desk-semantic.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('../fixtures/M3_SEMANTIC_PAIRS.json',import.meta.url)));
const packet=fixture.cases.find(x=>x.id==='M3B');
const saved=JSON.parse(fs.readFileSync(new URL('../fixtures/M3S2_OWNER_M3B_SWEEP_RECORDED.json',import.meta.url)));
const hash=s=>createHash('sha256').update(s).digest('hex');
const input=(extra={})=>({permitText:packet.permit,sceneRow:packet.scene,sceneId:'S31',scan:structuredClone(saved),hash,origin:'recorded',...extra});
test('owner-recorded Clocked sweep binds to correct permit and scene only',async()=>{
 const b=await auditDeskSweep(input());
 assert.equal(b.complete,true);assert.equal(b.checked.length,4);assert.equal(b.findings.length,3);assert.equal(b.credits,4);
 assert.deepEqual(b.findings.map(x=>x.clocked.finding.code),['CLOCKED_SEMANTIC_REVIEW','CLOCKED_CONDITIONAL_AUTHORITY_REVIEW','CLOCKED_SEMANTIC_AMBIGUOUS']);
 for(const f of b.findings){assert.equal(f.severity,'review');assert.equal(f.clocked.origin,'recorded');assert.equal(f.clocked.sourceMatched,true);assert.equal(f.clocked.clause,Array.from(packet.permit).slice(f.evidence.permit.start,f.evidence.permit.end).join(''));}
});
test('source change invalidates cached Clocked authority',async()=>{
 await assert.rejects(auditDeskSweep(input({permitText:packet.permit+' NEW CONDITION.'})),/does not match/);
 await assert.rejects(auditDeskSweep(input({sceneRow:packet.scene+' Extra'})),/does not match/);
});
test('fake positive or changed model score rejected',async()=>{
 const d=input();d.scan.results[0].finding.code='CLOCKED_CONDITIONAL_AUTHORITY_REVIEW';
 await assert.rejects(auditDeskSweep(d),/diverge/);
 const e=input();e.scan.results[2].modelAnswers.activity_link.noul=.01;
 await assert.rejects(auditDeskSweep(e),/diverge/);
});
test('malformed source quote/range rejected',async()=>{
 const d=input();d.scan.results[2].clause='AUTHORISATION FOR ALL SCENES';
 await assert.rejects(auditDeskSweep(d),/source quote mismatch/);
 const e=input();e.scan.results[1].range=[51,145];
 await assert.rejects(auditDeskSweep(e),/source quote mismatch/);
});
test('duplicate candidates rejected and missing partial candidates remain unresolved',async()=>{
 const d=input();d.scan.results[2].index=2;
 await assert.rejects(auditDeskSweep(d),/Duplicate/);
 const e=input();e.scan.complete=false;e.scan.error='Timeout after two';e.scan.results=e.scan.results.slice(0,2);e.scan.attempts=3;e.scan.candidatesEvaluated=2;e.scan.reportedCredits=null;
 const b=await auditDeskSweep(e);assert.equal(b.complete,false);assert.equal(b.coverageWarning,true);assert.equal(b.findings.length,1);
});
test('missing clause fragments flagged, never interpreted as unrestricted clearance',async()=>{
 const d=input();const add='\nNo drones.';const permitText=packet.permit+add;
 // Rebinding a stale scan is rejected even if the added clause is short and omitted by segmentation.
 await assert.rejects(auditDeskSweep(input({permitText})),/does not match/);
});
test('noul classification never makes clearance decisions',()=>{
 const mk=(p,g)=>({activity_link:{type:'noul',noul:p},granted_for_scene:{type:'noul',noul:g}});
 assert.equal(classifyAnswers(mk(.99,.001)).code,'CLOCKED_SEMANTIC_REVIEW');
 assert.equal(classifyAnswers(mk(.99,.99)).code,'CLOCKED_CONDITIONAL_AUTHORITY_REVIEW');
 assert.equal(classifyAnswers(mk(.005,.002)).code,'NO_SEMANTIC_LINK_DETECTED');
 assert.equal(classifyAnswers(mk(.49,.002)).code,'CLOCKED_SEMANTIC_AMBIGUOUS');
 assert.equal(classifyAnswers(mk(NaN,.1)),null);
});
test('Clocked results contain only original source text and no API token',()=>{
 const raw=JSON.stringify(saved);
 assert.doesNotMatch(raw,/Authorization\\s*:/i);assert.doesNotMatch(raw,/Bearer\\s+/i);
 assert.equal(saved.notClearance,true);
});
