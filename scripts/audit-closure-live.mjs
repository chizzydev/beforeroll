/** Read-only audit of generated acceptance evidence. No credentials or network. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
const directory=path.resolve('.beforeroll-data/closure-browser');
const saved=await createWorkspaceStore({directory}).load('lantern_live');
const journals=await createDurableExecution({directory}).exportAllRuns(planIntelligence(saved.workspace));
const budget=JSON.parse(await fs.readFile(path.join(directory,'.live-budget.json'),'utf8'));
const attempts=journals.flatMap(j=>j.run.checkpoint.entries.filter(e=>e.status!=='NOT_ATTEMPTED'&&!e.inheritedFromPlanKey).map(e=>({...e,identity:j.run.taskManifest.find(t=>t.id===e.id),planKey:j.planKey})));
assert.equal(attempts.length,16);assert.equal(budget.entries.length,16);assert(attempts.every(e=>e.status==='COMPLETE'&&!e.finding.controlledTest&&!e.finding.replayOrigin));
assert(budget.entries.every(e=>e.state==='HTTP_RESPONSE'&&e.httpStatus===200&&e.credits===1));
const count=rows=>{const m=new Map();for(const r of rows)m.set(r,(m.get(r)??0)+1);return [...m].sort();};
assert.deepEqual(count(attempts.map(e=>e.requestHash)),count(budget.entries.map(e=>e.requestSha256)));
const checks=attempts.map(e=>{const t=e.identity;const relevance=t.documentId==='BASE'?t.unitId==='U002':(t.sceneId==='S31'?t.unitId==='U001':t.unitId==='U002');
 const grant=t.documentId==='VARIATION'&&t.unitId==='U001'&&t.sceneId==='S31';
 return {taskId:e.id,requestHash:e.requestHash,planKey:e.planKey,sceneId:t.sceneId,documentId:t.documentId,unitId:t.unitId,activityLink:e.finding.relevance,grant:e.finding.grant,
  expectedActivity:relevance?'high':'low',expectedGrant:grant?'high':'low',activityPass:relevance?e.finding.relevance>=.8:e.finding.relevance<=.2,grantPass:grant?e.finding.grant>=.8:e.finding.grant<=.2};});
const json=JSON.parse(await fs.readFile('.beforeroll-data/closure-fixtures/BEFOREROLL_lantern_live_INTEGRATED_EVIDENCE.json','utf8'));
const recovered=JSON.parse(await fs.readFile('.beforeroll-data/closure-fixtures/recovered-evidence.json','utf8'));
assert.deepEqual(json.workspace,recovered.workspace);assert.deepEqual(json.journals,recovered.journals);assert.deepEqual(json.originals.files,recovered.originals.files);
const report={schema:'beforeroll-closure-live-audit-v1',scope:'Generated integration expectations, not scientific accuracy or authorization',requests:16,uniqueTaskIds:new Set(attempts.map(e=>e.id)).size,
 distinctRequestBodies:new Set(attempts.map(e=>e.requestHash)).size,reportedCredits:16,unknown:0,newNetworkCallsInAudit:0,
 comparisons:32,passed:checks.reduce((n,e)=>n+Number(e.activityPass)+Number(e.grantPass),0),checks,
 recovery:{workspaceExact:true,journalsExact:true,originalInventoryExact:true,originalVersion:json.persistedVersion,recoveredVersion:recovered.persistedVersion},
 currentCounts:json.dossier.counts,journals:journals.map(j=>({planKey:j.planKey,sha256:j.sha256})),budgetLedgerSha256:createHash('sha256').update(JSON.stringify(budget)).digest('hex')};
console.log(JSON.stringify(report,null,2));
assert.equal(report.passed,32,'Report observed deviations instead of excluding unsuccessful cases');
