import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, mkdir, readFile, writeFile, readdir, cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {Readable} from 'node:stream';
import {createDecipheriv, hkdfSync} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {verifyFrozen, verifyRunner, REPOSITORY, ANCHORS} from './freeze.mjs';
import {executeStage1, OWNER_DIRECTORY} from './runner.mjs';
import {runtimeCredential} from './credential.mjs';
import {inspectExecution} from './report.mjs';
import {readEvents, durableJSON, claimExecution} from './store.mjs';
import {createLiveTransport, ENDPOINT, MAX_RESPONSE_BYTES} from './transport.mjs';
import {QUESTIONS, sha256} from '../contract.mjs';
const DUMMY = 'CONTROLLED_TEST_CREDENTIAL_NEVER_A_REAL_KEY_0123456789';
const ORIGIN = 'CONTROLLED_NETWORK_FREE_TEST_NOT_CLOCKED_EVIDENCE';
const verified = await verifyFrozen();
async function temporary(t) {
  const dir = await mkdtemp(join(tmpdir(), 'beforeroll-p0b-stage1-'));
  t.after(async () => {
    assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + '/') || resolve(dir).startsWith(resolve(tmpdir()) + '\\'));
    await rm(dir, {recursive: true, force: true});
  }); return dir;
}
function structuralResponse() {
  // Schema-only double, not an expected U01 answer, model output or semantic gold.
  const answers = {};
  for (const [name, q] of Object.entries(QUESTIONS)) {
    const labels = Object.keys(q.criteria), selected = labels.at(-1);
    answers[name] = q.type === 'choice' ? {type: 'choice', choice: selected, confidence: 1,
      probabilities: Object.fromEntries(labels.map(k => [k, k === selected ? 1 : 0]))} :
      {type: 'multiselect', selected: [], threshold: 0.5, probabilities: Object.fromEntries(labels.map(k => [k, 0]))};
  }
  return {model: 'STRUCTURAL_TEST_DOUBLE_NOT_CLOCKED', answers, usage: {input_tokens: 123, output_tokens: 45}};
}
const raw = () => Buffer.from(JSON.stringify(structuralResponse()));
function transportFor({bytes = raw(), status = 200, headers = ['x-clocked-credits', '1'], fail = null, before = null} = {}) {
  let calls = 0;
  const transport = async args => {
    calls++; if (before) await before(args, calls);
    if (fail === 'before-headers') throw Error(`A sensitive transport exception: ${DUMMY}`);
    await args.onHeaders({status, statusText: 'Controlled test', httpVersion: '1.1', rawHeaders: headers});
    await args.onChunk(bytes);
    if (fail === 'after-chunk') throw Error(`A sensitive transport exception: ${DUMMY}`);
  };
  return {transport, calls: () => calls};
}
async function run(t, options = {}) {
  const dir = await temporary(t), directory = join(dir, 'execution');
  const fake = transportFor(options);
  const result = await executeStage1({verified, credential: DUMMY, transport: fake.transport, directory, origin: ORIGIN});
  return {directory, result, ...fake};
}
async function allFiles(directory) {
  const files = [];
  for (const item of await readdir(directory, {withFileTypes: true})) {
    if (item.isDirectory()) files.push(...await allFiles(join(directory, item.name)));
    else files.push(join(directory, item.name));
  } return files;
}
test('all Stage 0 trust anchors and exact identities still verify', async () => {
  assert.equal(Object.keys(ANCHORS).length, 5);
  assert.equal(verified.preparation.tasks.length, 4);
  assert.equal(verified.manifest.requestContractFingerprint, 'c87e4120c2b4fbdc9ebdfffc44029d6397c6b63eac25969f51565d29fa8c4805');
  assert.ok((await verifyRunner()).sourceFingerprint);
});
test('four C requests only, identical frozen bodies, durable intent already on disk at transport entry', async t => {
  const dir = await temporary(t), directory = join(dir, 'execution');
  const seen = [];
  const fake = transportFor({before: async (args, calls) => {
    const probe = `probe-0${calls}`, file = join(directory, probe);
    const body = await readFile(join(file, 'request-body.json'), 'utf8');
    const intent = JSON.parse(await readFile(join(file, 'intent.json'), 'utf8'));
    const events = await readEvents(directory);
    assert.equal(events.at(-1).type, 'INTENT');
    assert.equal(intent.requestHash, sha256(body)); assert.equal(body, args.body);
    assert.equal(args.body, JSON.stringify(verified.preparation.tasks[calls - 1].requests.C));
    assert.deepEqual(Object.keys(JSON.parse(body).questions), Object.keys(QUESTIONS));
    assert.equal(intent.idempotencyKey, args.idempotencyKey); seen.push(args.body);
  }});
  const result = await executeStage1({verified, credential: DUMMY, transport: fake.transport, directory, origin: ORIGIN});
  assert.equal(fake.calls(), 4); assert.equal(seen.length, 4); assert.equal(result.acceptedCount, 4);
  assert.equal(result.status, 'ALL_FOUR_ACCEPTED_PENDING_HUMAN_SEMANTIC_REVIEW');
  assert.equal((await inspectExecution(directory)).status, 'FINALIZED_EVIDENCE_PRESENT');
  for (const row of result.comparison) {
    assert.equal(row.B.status, 'NOT_DISPATCHED'); assert.equal(row.B.results, null);
    assert.equal(row.C.humanConfirmation, 'NOT_CONFIRMED'); assert.equal(row.C.humanEffort, null);
    assert.equal(row.C.executionProvenance.origin, ORIGIN); assert.ok(row.A.ruleFindings.length > 0);
  }
});
test('accepted execution cannot be run again; no second transport invocation', async t => {
  const out = await run(t); const before = out.calls();
  await assert.rejects(executeStage1({verified, credential: DUMMY, transport: out.transport, directory: out.directory}), /EXECUTION_ALREADY/);
  assert.equal(out.calls(), before);
});
for (const status of [301, 400, 401, 422, 429, 500]) test(`HTTP ${status} halts after one original request and remains fenced`, async t => {
  const out = await run(t, {status, bytes: Buffer.from('{"error":"controlled schema or service rejection"}')});
  assert.equal(out.calls(), 1); assert.equal(out.result.status, 'HALTED_HTTP_REJECTED');
  assert.equal(out.result.comparison[1].C.status, 'NOT_ATTEMPTED');
  await assert.rejects(executeStage1({verified, credential: DUMMY, transport: out.transport, directory: out.directory}), /EXECUTION_ALREADY/);
  assert.equal(out.calls(), 1);
});
for (const [name, bytes] of [
  ['invalid JSON', Buffer.from('not JSON')], ['wrong envelope', Buffer.from('{"result":{}}')],
  ['invalid UTF8', Buffer.from([0xff, 0xfe])],
  ['missing six-field answer', Buffer.from(JSON.stringify({...structuralResponse(), answers: {}}))],
]) test(`${name} halts and preserves exact response bytes`, async t => {
  const out = await run(t, {bytes}); assert.equal(out.calls(), 1);
  assert.equal(out.result.acceptedCount, 0);
  assert.ok(['HALTED_INVALID_RESPONSE', 'HALTED_INVALID_UTF8_RESPONSE'].includes(out.result.status));
  assert.deepEqual(await readFile(join(out.directory, 'probe-01/response.body.bin')), bytes);
});
test('semantic contradiction is retained and prevents subsequent probes or cards', async t => {
  const r = structuralResponse(), a = r.answers.action_families;
  a.selected = ['NO_ACTION_STATED', 'VERIFY_STATED_PHYSICAL_PREREQUISITES'];
  for (const key of a.selected) a.probabilities[key] = 1;
  const out = await run(t, {bytes: Buffer.from(JSON.stringify(r))});
  assert.equal(out.calls(), 1); assert.equal(out.result.status, 'HALTED_SEMANTIC_CONTRADICTION');
  assert.equal(out.result.comparison[0].C.derivation.cards.length, 0);
  assert.ok(out.result.comparison[0].C.derivation.coverage.assessment.flags.length);
});
test('candidate construction remains frozen with actual execution provenance as a separate receipt', async t => {
  const r = structuralResponse(), a = r.answers.action_families;
  a.selected = ['VERIFY_STATED_PHYSICAL_PREREQUISITES']; a.probabilities[a.selected[0]] = 1;
  const out = await run(t, {bytes: Buffer.from(JSON.stringify(r))});
  const row = out.result.comparison[0], card = row.C.derivation.cards[0];
  assert.equal(card.status, 'MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED');
  assert.equal(card.humanConfirmation, 'NOT_CONFIRMED');
  assert.deepEqual(card.source, verified.preparation.tasks[0].binding);
  assert.equal(card.origin, 'OFFLINE_RESPONSE_VALIDATION_NOT_LIVE_EVIDENCE');
  assert.equal(row.C.executionProvenance.origin, ORIGIN);
});
for (const fail of ['before-headers', 'after-chunk']) test(`lost response ${fail} is uncertain, preserved and cannot retry`, async t => {
  const bytes = Buffer.from('controlled partial body'); const out = await run(t, {fail, bytes});
  assert.equal(out.calls(), 1); assert.equal(out.result.status, 'HALTED_TRANSPORT_UNCERTAIN');
  assert.equal(out.result.comparison[0].C.receipt.complete, false);
  assert.equal(out.result.comparison[1].C.status, 'NOT_ATTEMPTED');
  for (const file of await allFiles(out.directory)) assert.equal((await readFile(file)).includes(Buffer.from(DUMMY)), false);
});
test('raw status, duplicate headers, exact body, timestamps, latency, model, usage and credits persist', async t => {
  const bytes = Buffer.from(' \n' + raw().toString('utf8') + '\n\n');
  const out = await run(t, {bytes, headers: ['X-Clocked-Credits', '1.25', 'X-Custom', 'one', 'X-Custom', 'two']});
  const receipt = out.result.comparison[0].C.receipt;
  assert.equal(receipt.status, 200); assert.equal(receipt.reportedCredits, 1.25);
  assert.equal(receipt.modelAsReturned, 'STRUCTURAL_TEST_DOUBLE_NOT_CLOCKED');
  assert.deepEqual(receipt.usageAsReturned, {input_tokens: 123, output_tokens: 45});
  assert.ok(receipt.latencyMs >= 0 && receipt.headersAt && receipt.startedAt && receipt.endedAt);
  assert.deepEqual(await readFile(join(out.directory, 'probe-01/response.body.bin')), bytes);
  const headers = JSON.parse(await readFile(join(out.directory, 'probe-01/response.headers.json'), 'utf8'));
  assert.deepEqual(headers.rawHeaders, ['X-Clocked-Credits', '1.25', 'X-Custom', 'one', 'X-Custom', 'two']);
});
test('missing or malformed credit information remains unknown, not zero', async t => {
  const out = await run(t, {headers: ['X-Clocked-Credits', 'not-a-number']});
  assert.equal(out.result.comparison[0].C.receipt.reportedCredits, null);
  assert.deepEqual(out.result.comparison[0].C.receipt.creditHeadersAsReturned, [['X-Clocked-Credits', 'not-a-number']]);
});
test('model and usage on an HTTP rejection are retained without accepting the result', async t => {
  const out = await run(t, {status: 422, bytes: raw()});
  assert.equal(out.result.comparison[0].C.receipt.modelAsReturned, 'STRUCTURAL_TEST_DOUBLE_NOT_CLOCKED');
  assert.equal(out.result.acceptedCount, 0);
});
test('credential echo is sealed losslessly, absent from readable files, and halts', async t => {
  const bytes = Buffer.from('server unexpectedly echoes ' + DUMMY);
  const out = await run(t, {bytes, headers: ['x-clocked-credits', '1']});
  assert.equal(out.calls(), 1); assert.equal(out.result.status, 'HALTED_CREDENTIAL_ECHO_SEALED');
  for (const file of await allFiles(out.directory)) assert.equal((await readFile(file)).includes(Buffer.from(DUMMY)), false);
  const sealed = JSON.parse(await readFile(join(out.directory, 'probe-01/response.sealed.json'), 'utf8'));
  const key = hkdfSync('sha256', DUMMY, Buffer.from(sealed.salt, 'base64'), 'BeforeRoll-P0B-credential-echo-custody-v1', 32);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(sealed.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(sealed.tag, 'base64'));
  const original = JSON.parse(Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, 'base64')), decipher.final()]).toString('utf8'));
  assert.deepEqual(Buffer.from(original.bodyBase64, 'base64'), bytes);
});
test('credential in response headers also seals the complete raw response', async t => {
  const out = await run(t, {headers: ['x-echo', DUMMY]});
  assert.equal(out.result.status, 'HALTED_CREDENTIAL_ECHO_SEALED');
  assert.equal(out.result.comparison[0].C.receipt.sensitive, true);
});
test('Unicode-escaped credential echo is sealed before normalized JSON reaches a report', async t => {
  const escaped = [...DUMMY].map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
  const out = await run(t, {bytes: Buffer.from(`{"echo":"${escaped}"}`)});
  assert.equal(out.result.status, 'HALTED_CREDENTIAL_ECHO_SEALED');
  for (const file of await allFiles(out.directory)) assert.equal((await readFile(file)).includes(Buffer.from(DUMMY)), false);
});
test('oversized response stops at the received prefix and cannot be accepted', async t => {
  const out = await run(t, {bytes: Buffer.alloc(MAX_RESPONSE_BYTES + 1, 120)});
  assert.equal(out.calls(), 1); assert.equal(out.result.status, 'HALTED_TRANSPORT_UNCERTAIN');
  assert.equal(out.result.comparison[0].C.receipt.complete, false);
  assert.equal(out.result.comparison[0].C.receipt.byteLength, MAX_RESPONSE_BYTES + 1);
});
test('storage failure after a request leaves an unresolved durable intent; restart cannot send again', async t => {
  const dir = await temporary(t), directory = join(dir, 'execution');
  const fake = transportFor({before: async () => {await writeFile(join(directory, 'probe-01/receipt.json'), '{}');}});
  await assert.rejects(executeStage1({verified, credential: DUMMY, transport: fake.transport, directory}));
  const inspection = await inspectExecution(directory);
  assert.equal(inspection.status, 'INTERRUPTED_OR_STORAGE_UNCERTAIN'); assert.equal(inspection.unresolvedIntentCount, 1);
  await assert.rejects(executeStage1({verified, credential: DUMMY, transport: fake.transport, directory}));
  assert.equal(fake.calls(), 1);
});
test('abrupt process exit after synced intent remains uncertain and fenced', async t => {
  const directory = join(await temporary(t), 'execution');
  const code = `import {verifyFrozen} from ${JSON.stringify(pathToFileURL(join(REPOSITORY, 'experiments/p0b/stage1/freeze.mjs')).href)};
import {executeStage1} from ${JSON.stringify(pathToFileURL(join(REPOSITORY, 'experiments/p0b/stage1/runner.mjs')).href)};
await executeStage1({verified:await verifyFrozen(),credential:'STRUCTURAL_DUMMY_NOT_REAL',directory:${JSON.stringify(directory)},transport:async()=>process.exit(37)});`;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', code], {encoding: 'utf8'});
  assert.equal(child.status, 37);
  const inspection = await inspectExecution(directory);
  assert.equal(inspection.unresolvedIntentCount, 1); assert.equal(inspection.retryAllowed, false);
  const fake = transportFor();
  await assert.rejects(executeStage1({verified, credential: DUMMY, transport: fake.transport, directory}));
  assert.equal(fake.calls(), 0);
});
test('concurrent invocations claim the permanent fence only once', async t => {
  const directory = join(await temporary(t), 'execution'), fake = transportFor();
  const args = {verified, credential: DUMMY, transport: fake.transport, directory};
  const results = await Promise.allSettled([executeStage1(args), executeStage1(args)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(fake.calls(), 4);
});
test('even an empty fence directory blocks all execution', async t => {
  const directory = join(await temporary(t), 'execution'); await mkdir(directory);
  const fake = transportFor();
  await assert.rejects(executeStage1({verified, credential: DUMMY, transport: fake.transport, directory}));
  assert.equal(fake.calls(), 0);
  assert.equal((await inspectExecution(directory)).status, 'FENCE_ONLY_STORAGE_UNCERTAIN');
});
test('forged verification objects and alternate live output directories cannot dispatch', async t => {
  const directory = join(await temporary(t), 'execution'), fake = transportFor();
  await assert.rejects(executeStage1({verified: structuredClone(verified), credential: DUMMY, transport: fake.transport, directory}), /VERIFIED/);
  await assert.rejects(executeStage1({verified, credential: DUMMY, transport: fake.transport, directory, origin: 'OWNER_EXECUTED_LIVE_CLOCKED_STAGE1'}), /FIXED_OWNER/);
  assert.equal(fake.calls(), 0);
});
test('read-only inspection detects raw response tampering', async t => {
  const out = await run(t);
  await writeFile(join(out.directory, 'probe-01/response.body.bin'), 'altered');
  await assert.rejects(inspectExecution(out.directory), /INTEGRITY/);
});
test('read-only inspection detects journal tampering', async t => {
  const out = await run(t);
  await writeFile(join(out.directory, '001-event.json'), '{}');
  await assert.rejects(inspectExecution(out.directory), /EVENT_CHAIN/);
});
for (const target of ['experiments/p0b/prepared/development-probes.json', 'src/intelligence-workflow.mjs']) test(`frozen file mutation ${target} stops verification`, async t => {
  const root = await temporary(t);
  const names = [...Object.keys(verified.manifest.sourceFiles), ...Object.keys(ANCHORS).map(n => `experiments/p0b/prepared/${n}`)];
  for (const name of names) {await mkdir(dirname(join(root, name)), {recursive: true}); await cp(join(REPOSITORY, name), join(root, name));}
  await writeFile(join(root, target), 'controlled corruption');
  await assert.rejects(verifyFrozen(root), /FROZEN_/);
});
test('runtime credentials use environment or one unambiguous file value without mutating either', async t => {
  const root = await temporary(t), path = join(root, '.env');
  const original = `UNRELATED=not-read\nCLOCKED_API_KEY="${DUMMY}" # local\n`;
  await writeFile(path, original);
  const env = {}; assert.equal(await runtimeCredential(root, env), DUMMY); assert.deepEqual(env, {});
  assert.equal(await readFile(path, 'utf8'), original);
  assert.equal(await runtimeCredential(root, {CLOCKED_API_KEY: DUMMY}), DUMMY);
  await writeFile(path, `CLOCKED_API_KEY=${DUMMY}\nCLOCKED_API_KEY=${DUMMY}`);
  await assert.rejects(runtimeCredential(root, {}), error => error.message === 'CREDENTIAL_UNAVAILABLE' && !error.message.includes(DUMMY));
  await assert.rejects(runtimeCredential(root, {CLOCKED_API_KEY: 'bad\nheader'}), /CREDENTIAL_UNAVAILABLE/);
});
test('HTTPS adapter uses one POST, fixed endpoint, no SDK/redirect/retry, and exact supplied bytes', async () => {
  let calls = 0, received;
  const adapter = createLiveTransport((url, options, callback) => {
    calls++; assert.equal(url, ENDPOINT); assert.equal(options.method, 'POST'); assert.equal(options.agent, false);
    assert.equal(options.headers.Authorization, `Bearer ${DUMMY}`);
    const req = new EventEmitter(); req.destroy = () => {};
    req.end = body => {received = body; const response = Readable.from([Buffer.from('raw')]);
      Object.assign(response, {statusCode: 302, statusMessage: 'Controlled redirect', httpVersion: '1.1', rawHeaders: ['Location', 'https://example.invalid'], complete: true});
      queueMicrotask(() => callback(response));}; return req;
  });
  const headers = [], chunks = [];
  await adapter({body: 'EXACT C BODY', credential: DUMMY, idempotencyKey: 'controlled-id',
    onHeaders: async h => headers.push(h), onChunk: async b => chunks.push(b)});
  assert.equal(calls, 1); assert.equal(received, 'EXACT C BODY'); assert.equal(headers[0].status, 302);
  assert.equal(Buffer.concat(chunks).toString(), 'raw');
});
test('HTTPS adapter error before headers is one call, never exposes the transport error and never retries', async t => {
  let calls = 0, destroyed = 0;
  const adapter = createLiveTransport(() => {
    calls++; const req = new EventEmitter(); req.destroy = () => {destroyed++;};
    req.end = () => queueMicrotask(() => req.emit('error', Error('controlled error ' + DUMMY)));
    return req;
  });
  const directory = join(await temporary(t), 'execution');
  const result = await executeStage1({verified, credential: DUMMY, transport: adapter, directory});
  assert.equal(result.status, 'HALTED_TRANSPORT_UNCERTAIN'); assert.equal(calls, 1); assert.equal(destroyed, 1);
  for (const file of await allFiles(directory)) assert.equal((await readFile(file)).includes(Buffer.from(DUMMY)), false);
});
test('CLI dry verification and inspection cannot read credentials, write owner execution or dispatch', async () => {
  const before = await inspectExecution(OWNER_DIRECTORY);
  const cli = join(REPOSITORY, 'experiments/p0b/stage1/cli.mjs');
  for (const args of [[], ['--verify'], ['--report']]) {
    const result = spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8', env: {...process.env, CLOCKED_API_KEY: DUMMY}});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.includes(DUMMY), false);
  }
  assert.deepEqual(await inspectExecution(OWNER_DIRECTORY), before);
});
for (const args of [['--live'], ['--retry'], ['--resume'], ['--live', '--acknowledge-four-one-shot-requests', '--out', 'another'], ['--endpoint', 'https://example.invalid']]) test(`CLI rejects unsupported command ${args.join(' ')}`, () => {
  const result = spawnSync(process.execPath, [join(REPOSITORY, 'experiments/p0b/stage1/cli.mjs'), ...args], {encoding: 'utf8'});
  assert.equal(result.status, 1); assert.match(result.stderr, /COMMAND_REJECTED/);
});
