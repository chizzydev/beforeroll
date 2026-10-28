/** Offline regression over immutable fresh owner-authorized 2026-10-27 HTTP bytes.
 * These tests never dispatch or reset the live campaign. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDiscoveryExecution} from '../src/discovery-execution.mjs';
import {projectDiscovery,scopeCaution} from '../src/core-discovery.mjs';
import {buildProductionDossier,dossierMarkdown} from '../src/production-dossier.mjs';
import {buildProductionActions} from '../src/production-actions.mjs';
import {buildProductionJourney} from '../src/production-journey.mjs';
const root=fileURLToPath(new URL('../verification/clocked-live-20261027/',import.meta.url));
const read=async name=>JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
const validate=createDiscoveryExecution({directory:path.join(root,'workspaces')}).validate;
const norm=s=>s.toLowerCase().replace(/\b(?:a|an|the|current|staffed|named)\s+/g,'').replace(/[^a-z0-9]/g,'');
for(const id of ['A_DOCK','B_GALLERY','C_ORCHARD','D_ROAD','E_PRESENT_PHOTO','F_COLLECTION'])test('genuine recorded '+id+' stays source-bound and produces all frozen candidates without dispatch',async()=>{
 const frozen=await read(id==='E_PRESENT_PHOTO'?'supplement-E.json':id==='F_COLLECTION'?'supplement-F.json':'scenarios.json'),expected=frozen.cases.find(c=>c.id===id);
 const job=validate((await read(id+'/raw-evidence.json')).jobs[0]),w=(await read(id+'/reviewed-workflow.json')).workspace;
 const p=projectDiscovery(w,[job]);assert.equal(job.origin,'OWNER_CLOCKED_CORE_DISCOVERY');assert.equal(p.jobs[0].coverage.unassessed,0);
 assert.equal(p.candidates.length,expected.expected.length);
 for(const e of expected.expected)assert.ok(p.candidates.some(c=>c.sceneId===e[0]&&c.field===e[1]&&norm(c.quote)===norm(e[2])),JSON.stringify(e));
 for(const c of p.candidates){assert.equal(Array.from(expected.permit).slice(...c.permitRange).join(''),c.quote);assert.equal(c.issuance,'UNKNOWN');assert.equal(c.fulfillment,'UNVERIFIED');assert.equal(c.notClearance,true);}
 assert.equal(w.sceneAuthority.length,0);assert.equal(w.conditionDecisions.length,0);
});
test('historical object words do not suppress an explicit current focal-scene requirement; actual narrative/unsigned scope stays quarantined',()=>{
 assert.equal(scopeCaution('Scene X21 close-ups of a historical artwork require signed lender consent.','SX21'),null);
 assert.equal(scopeCaution('Scene X22 must use handling gloves beside the historical exhibit.','SX22'),null);
 assert.match(scopeCaution('Historical photographs show Scene X21; the previous production was required to use mats.','SX21'),/NARRATIVE/);
 assert.match(scopeCaution('An unsigned proposal says Scene X21 must use a smoke observer.','SX21'),/NARRATIVE/);
 assert.match(scopeCaution('Scene X21 requires gloves.','SX22'),/OTHER/);
});
test('genuine discovery results reconcile source queue, journey, source-review evidence and exports without rewriting legacy execution',async()=>{
 const job=validate((await read('D_ROAD/raw-evidence.json')).jobs[0]),w=(await read('D_ROAD/reviewed-workflow.json')).workspace;
 const d=buildProductionDossier(w,{persistedVersion:4,asOf:'2026-10-27T12:00:00.000Z',discoveryJournals:[job]});
 assert.equal(d.counts.completedModelChecks,0); // no invented old Decide-only journal entries
 assert.equal(d.counts.discoveryAssessedChecks,6);assert.equal(d.counts.effectiveUnassessedChecks,0);
 assert.equal(d.sceneTasks.filter(t=>t.discoveryCheck?.decideStatus==='ACCEPTED').length,6);
 const q=buildProductionActions(d,{limit:100});assert.equal(q.actions.filter(a=>a.code==='RUN_UNEVALUATED_SOURCE_CHECK').length,0);
 assert.ok(q.actions.some(a=>a.code==='INVESTIGATE_DISCOVERY_UNCERTAINTY'));assert.equal(q.actions.filter(a=>a.code==='REVIEW_EXACT_SOURCE_TASK').length,6);
 assert.ok(!q.actions.some(a=>a.detail.includes('no model finding is available yet')));
 const journey=buildProductionJourney(d).checkpoints.find(s=>s.id==='analysis');assert.equal(journey.status,'CURRENT');assert.match(journey.summary,/6\/6/);
 assert.match(dossierMarkdown(d),/Discovery Decide: ACCEPTED/);assert.match(dossierMarkdown(d),/HUMAN_UNVERIFIED|REQUIRES_MANUAL_REVIEW/);
});
