import {mkdir, readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {TextDecoder} from 'node:util';
import {verifyFrozen, assertVerified, REPOSITORY, ANCHORS} from './freeze.mjs';
import {claimExecution, durableJSON, durableBytes, preserveResponse} from './store.mjs';
import {comparisonRows, finalizePackage} from './report.mjs';
import {ENDPOINT, MAX_RESPONSE_BYTES} from './transport.mjs';
import {constructCandidates} from '../candidates.mjs';
import {fingerprint, sha256} from '../contract.mjs';

export const OWNER_DIRECTORY = join(REPOSITORY, 'experiments/p0b/stage1/owner-execution');
const LIVE = 'OWNER_EXECUTED_LIVE_CLOCKED_STAGE1';
const CONTROLLED = 'CONTROLLED_NETWORK_FREE_TEST_NOT_CLOCKED_EVIDENCE';
function returnedMetadata(headers, parsed) {
  const raw = headers?.rawHeaders || [], creditHeaders = [];
  for (let i = 0; i < raw.length; i += 2) if (/credit|usage|token/i.test(raw[i])) creditHeaders.push([raw[i], raw[i + 1]]);
  const values = creditHeaders.filter(([key]) => key.toLowerCase() === 'x-clocked-credits').map(([, value]) => value);
  const numeric = values.length === 1 && /^\d+(?:\.\d+)?$/.test(values[0]) && Number.isFinite(Number(values[0])) ? Number(values[0]) : null;
  return {modelAsReturned: parsed?.model ?? null, usageAsReturned: parsed?.usage ?? null,
    creditHeadersAsReturned: creditHeaders, reportedCredits: numeric,
    otherCreditFieldsAsReturned: parsed && typeof parsed === 'object' ? Object.fromEntries(
      ['credits', 'credit_usage', 'credits_used'].filter(k => Object.hasOwn(parsed, k)).map(k => [k, parsed[k]])) : {}};
}
export async function executeStage1({verified, credential, transport, directory = OWNER_DIRECTORY,
  origin = CONTROLLED, runnerFingerprint = 'CONTROLLED_TEST'}) {
  assertVerified(verified);
  if (![LIVE, CONTROLLED].includes(origin)) throw Error('EXPLICIT_ORIGIN_REQUIRED');
  if (origin === LIVE && (resolve(directory) !== resolve(OWNER_DIRECTORY) || verified.root !== resolve(REPOSITORY))) throw Error('FIXED_OWNER_DIRECTORY_REQUIRED');
  if (typeof credential !== 'string' || !/^[\x21-\x7e]+$/.test(credential)) throw Error('CREDENTIAL_UNAVAILABLE');
  await verifyFrozen(verified.root);
  const run = {schema: 'p0b-stage1-run-v1', runId: randomUUID(), at: new Date().toISOString(), origin,
    stage0ManifestHash: ANCHORS['manifest.json'], contractFingerprint: verified.manifest.requestContractFingerprint,
    runnerFingerprint, maximumCalls: 4, lane: 'C_ONLY', automaticRetryAllowed: false};
  const journal = await claimExecution(directory, run);
  await journal.event('RUN_STARTED', run);
  const outcomes = verified.preparation.tasks.map(task => ({taskId: task.taskId, status: 'NOT_ATTEMPTED'}));
  let status = 'ALL_FOUR_ACCEPTED_PENDING_HUMAN_SEMANTIC_REVIEW', intentCount = 0;
  for (const [index, task] of verified.preparation.tasks.entries()) {
    // Recheck the entire freeze before every dispatch. Never substitute regenerated bodies.
    try {await verifyFrozen(verified.root);} catch {status = 'HALTED_FREEZE_MISMATCH'; break;}
    const probe = `probe-${String(index + 1).padStart(2, '0')}`, path = join(directory, probe);
    await mkdir(path, {mode: 0o700});
    const body = JSON.stringify(task.requests.C);
    if (sha256(body) !== task.requestHashes.C) throw Error('REQUEST_HASH_MISMATCH');
    const intent = {taskId: task.taskId, probe, sceneId: task.binding.sceneId, unitId: task.binding.unitId,
      endpoint: ENDPOINT, method: 'POST', requestHash: task.requestHashes.C,
      contractFingerprint: task.contractFingerprint, source: task.binding,
      idempotencyKey: randomUUID(), at: new Date().toISOString(), maximumAttempts: 1, retryAllowed: false};
    await durableBytes(join(path, 'request-body.json'), body);
    await durableJSON(join(path, 'intent.json'), intent);
    await journal.event('INTENT', {probe, intentHash: fingerprint(intent), requestHash: task.requestHashes.C});
    intentCount++;
    // No network call can precede the successful sync of all three durable intent records.
    const chunks = []; let size = 0, headers = null, headersAt = null, complete = false;
    const startedAt = new Date().toISOString(), started = performance.now();
    try {
      await transport({body, credential, idempotencyKey: intent.idempotencyKey,
        onHeaders: async value => {if (headers) throw Error('MULTIPLE_RESPONSES'); headers = value; headersAt = new Date().toISOString();},
        onChunk: async chunk => {
          chunks.push(Buffer.from(chunk)); size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) throw Error('RESPONSE_SIZE_LIMIT');
        }});
      complete = true;
    } catch {/* Never serialize transport exceptions: they can contain authorization headers. */}
    const endedAt = new Date().toISOString(), latencyMs = performance.now() - started;
    const bytes = Buffer.concat(chunks);
    const saved = await preserveResponse(path, headers, bytes, credential, complete);
    let resultStatus, derivation = null, parsed = null;
    if (!saved.sensitive) {
      try {parsed = JSON.parse(new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes));} catch {/* Raw bytes remain authoritative. */}
    }
    if (!complete || !headers) resultStatus = 'TRANSPORT_UNCERTAIN';
    else if (saved.sensitive) resultStatus = 'CREDENTIAL_ECHO_SEALED';
    else if (!Number.isInteger(headers.status) || headers.status < 200 || headers.status >= 300) resultStatus = 'HTTP_REJECTED';
    else {
      let raw;
      try {raw = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes);} catch {resultStatus = 'INVALID_UTF8_RESPONSE';}
      if (raw !== undefined) {
        derivation = constructCandidates(task, raw);
        parsed = derivation.coverage?.assessment.parsed;
        resultStatus = !derivation.coverage?.assessment.schemaValid ? 'INVALID_RESPONSE' :
          !derivation.coverage.assessment.semanticValid ? 'SEMANTIC_CONTRADICTION' : 'ACCEPTED';
      }
    }
    // Persist raw data before parsing is accepted; header/body custody never relies on pretty JSON.
    const receipt = {...saved, status: saved.sensitive ? null : headers?.status ?? null,
      startedAt, headersAt, endedAt, latencyMs,
      ...(saved.sensitive ? {metadata: 'SEALED_CREDENTIAL_ECHO_NOT_DISPLAYED'} : returnedMetadata(headers, parsed))};
    await durableJSON(join(path, 'receipt.json'), receipt);
    const artifacts = {};
    for (const name of ['request-body.json', 'intent.json', 'receipt.json', saved.rawFile,
      ...(saved.sensitive ? [] : ['response.headers.json'])]) artifacts[name] = sha256(await readFile(join(path, name)));
    const outcome = {taskId: task.taskId, status: resultStatus, receipt, derivation,
      executionProvenance: {origin, runId: run.runId, probe, requestHash: intent.requestHash,
        rawBodyHash: receipt.rawBodyHash, note: 'Execution receipt is separate from the unchanged frozen candidate-construction origin label.'}, artifacts};
    await durableJSON(join(path, 'outcome.json'), outcome);
    await journal.event('OUTCOME', {probe, status: resultStatus, outcomeFileHash: sha256(await readFile(join(path, 'outcome.json')))});
    outcomes[index] = outcome;
    if (resultStatus !== 'ACCEPTED') {status = `HALTED_${resultStatus}`; break;}
  }
  const result = {schema: 'p0b-stage1-result-v1', runId: run.runId, origin, status,
    intentCount, acceptedCount: outcomes.filter(o => o.status === 'ACCEPTED').length,
    intendedMaximum: 4, retryAllowed: false, humanConfirmation: 'NOT_CONFIRMED',
    comparativeHumanEffort: null, semanticAccuracy: null, operationalRolloutAuthorized: false,
    comparison: comparisonRows(verified.preparation, outcomes)};
  await finalizePackage(directory, result, journal);
  return result;
}
