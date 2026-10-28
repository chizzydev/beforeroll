/** Offline hasher/preflight. Never imports a provider transport or reads credentials. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recordedCoordinatorEvidence} from '../src/recorded-coordinator-evidence.mjs';
import {literalHash} from '../src/literal-requirements.mjs';
import {verifyFrozen} from '../experiments/p0b/stage1/freeze.mjs';
const {evidence,problem}=await recordedCoordinatorEvidence();assert.equal(problem,undefined);assert.ok(evidence);
const accepted=JSON.parse(await readFile(new URL('../fixtures/audit/U01_ACCEPTED_EVIDENCE.json',import.meta.url),'utf8'));
assert.equal(evidence.permitSha256,accepted.permitSha256);assert.equal(evidence.facts.length,3);
for(const expected of accepted.candidateC.requirements){
 const fact=evidence.facts.find(f=>f.unitId===expected.sourceUnit&&f.field===expected.field);
 assert.ok(fact);assert.equal(fact.quote,expected.quote);assert.deepEqual(fact.unitRange,expected.sourceOffset);assert.deepEqual(fact.permitRange,expected.permitOffset);
 assert.equal(fact.requestSha256,expected.requestSha256);assert.equal(fact.responseSha256,expected.responseSha256);
}
assert.equal(evidence.fieldStates.find(r=>r.unitId==='U004').responseSha256,accepted.candidateC.u004.responseSha256);
assert.equal(literalHash(await readFile(new URL('../docs/owner_acceptance/BEFOREROLL_UI_REFINEMENT_REGISTER_v2_2026-10-26.md',import.meta.url))),
 '6b4a0d3f93195dd5cd420c0a519f6820eb15fe429765762f1d67350ed007b1b2');
const frozen=await verifyFrozen();
console.log(JSON.stringify({status:'OFFLINE_SOURCE_AND_RECEIPT_PREFLIGHT_PASS',permitSha256:evidence.permitSha256,
 recordedResponseSha256:evidence.fieldStates.map(s=>s.responseSha256),literalFacts:3,sourceSelection:evidence.sourceSelection,
 stage0RequestFingerprint:frozen.manifest.requestContractFingerprint,brRegister:'ORIGINAL_COPY_HASH_VERIFIED',
 providerRequests:0,creditsSpentNow:0,ownerGuiAcceptance:'NOT_MEASURED_BY_THIS_OFFLINE_VERIFIER'},null,2));
