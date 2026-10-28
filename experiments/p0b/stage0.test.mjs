import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {QUESTIONS, VERSION, CONTRACT, CONTRACT_FINGERPRINT, fingerprint, sha256} from './contract.mjs';
import {decodeResponse} from './decoder.mjs';
import {prepareTask, assertTask} from './tasks.mjs';
import {constructCandidates} from './candidates.mjs';
import {rankPassages, tokenize, BASELINE, BASELINE_FINGERPRINT} from './baseline.mjs';
import {prepareDevelopment, DEVELOPMENT_PAIRS} from './development.mjs';
import {renderCandidates, renderPreparation} from './view.mjs';
import {sourceBoundDecidePayload} from '../../src/intelligence-workflow.mjs';
import {discoverSourceUnits, contextForUnit} from '../../src/permit-intelligence.mjs';

// STRUCTURAL TEST DOUBLE ONLY. No model predictions or evaluation answer key.
function response() {
  const answers = {};
  for (const [name, q] of Object.entries(QUESTIONS)) {
    const labels = Object.keys(q.criteria);
    answers[name] = q.type === 'choice' ? {type: 'choice', choice: labels.at(-1),
      confidence: 1, probabilities: Object.fromEntries(labels.map(k => [k, k === labels.at(-1) ? 1 : 0]))} :
      {type: 'multiselect', selected: [], threshold: 0.5, probabilities: Object.fromEntries(labels.map(k => [k, 0]))};
  }
  return {model: 'STRUCTURAL_TEST_DOUBLE_NOT_CLOCKED', answers, usage: {input_tokens: 0, output_tokens: 0}};
}
const body = r => JSON.stringify(r);
function select(r, field, selected) {
  const answer = r.answers[field];
  if (answer.type === 'choice') {answer.choice = selected; for (const k in answer.probabilities) answer.probabilities[k] = k === selected ? 1 : 0;}
  else {answer.selected = selected; for (const k in answer.probabilities) answer.probabilities[k] = selected.includes(k) ? 1 : 0;}
  return r;
}
const prepared = await prepareDevelopment();
const task = prepared.tasks[0];

test('contract is frozen, six typed questions only, all requested labels bounded by publisher limits', () => {
  assert.equal(VERSION, 'beforeroll-actionable-decide-v2-draft1');
  assert.equal(CONTRACT_FINGERPRINT, fingerprint(CONTRACT));
  assert.equal(Object.keys(QUESTIONS).length, 6);
  for (const q of Object.values(QUESTIONS)) {
    assert.ok(['choice', 'multiselect'].includes(q.type));
    assert.ok(Object.keys(q.criteria).length >= 2 && Object.keys(q.criteria).length <= (q.type === 'choice' ? 255 : 64));
    assert.ok(Object.values(q.criteria).every(v => typeof v === 'string' && v.length > 20));
    assert.equal(q.options, undefined);
  }
  assert.throws(() => {QUESTIONS.relation.criteria.UNCERTAIN = 'changed';});
  assert.equal(task.requests.C.contract_version, undefined);
  assert.equal(task.requests.C.response_format, undefined);
});
test('only the four named exposed U01 pairs are prepared; no outputs, credits or dispatch', () => {
  assert.deepEqual(prepared.tasks.map(t => [t.binding.sceneId, t.binding.unitId]), DEVELOPMENT_PAIRS);
  assert.equal(prepared.dispatches, 0); assert.equal(prepared.providerResults, null);
  assert.equal(new Set(prepared.tasks.map(t => t.taskId)).size, 4);
  for (const t of prepared.tasks) {
    assertTask(t); assert.equal(t.status, 'PREPARED_NOT_DISPATCHED');
    assert.equal(t.binding.packet.coverage, 'INCOMPLETE_OR_UNASSESSED');
    assert.equal(t.requestHashes.C, sha256(JSON.stringify(t.requests.C)));
    assert.deepEqual(Object.keys(t.requests.B.questions), ['activity_link', 'granted_for_scene']);
  }
});
test('B uses the exact production request, including original context and question order', () => {
  const d = task.input.document, units = discoverSourceUnits(d.text).units;
  const index = units.findIndex(u => u.id === task.input.unitId);
  assert.deepEqual(task.requests.B, sourceBoundDecidePayload({document: d, scene: task.input.scene,
    unit: units[index], context: contextForUnit(units, index)}));
});
test('source binding is exact Unicode codepoint text with complete neighboring context', () => {
  const input = structuredClone(task.input);
  input.document.text = '🙂 A small source.\nDo not move the rig.\nAnother source follows.';
  input.unitId = 'U002';
  const t = prepareTask(input);
  assert.equal(Array.from(input.document.text).slice(...t.binding.range).join(''), t.binding.quote);
  assert.equal(t.requests.C.state.neighborContextOnly.before[0].text, '🙂 A small source.');
  assert.equal(t.requests.C.state.neighborContextOnly.after[0].text, 'Another source follows.');
});
for (const field of ['text', 'revision', 'epoch']) test(`changed document ${field} invalidates task/candidate`, () => {
  const input = structuredClone(task.input);
  if (field === 'text') input.document.text += '\nAdditional context.'; else input.document[field]++;
  const raw = body(response()), out = constructCandidates(task, raw, input);
  assert.equal(out.status, 'SOURCE_REJECTED'); assert.equal(out.rawText, raw);
  assert.equal(out.coverage, null); assert.equal(out.cards.length, 0);
  assert.notEqual(prepareTask(input).taskId, task.taskId);
});
for (const field of ['row', 'epoch']) test(`changed scene ${field} invalidates task/candidate`, () => {
  const input = structuredClone(task.input);
  if (field === 'row') input.scene.row += ' amended'; else input.scene.epoch++;
  assert.throws(() => assertTask(task, input), /mismatch|stale/);
});
test('source reversal cannot resurrect an earlier task when epoch advances', () => {
  const input = structuredClone(task.input); input.document.epoch += 2;
  assert.notEqual(prepareTask(input).taskId, task.taskId);
});
test('deep unassessable JSON fails closed while preserving exact raw input', () => {
  const raw = '['.repeat(10000) + '0' + ']'.repeat(10000);
  const decoded = decodeResponse(raw);
  assert.equal(decoded.schemaValid, false); assert.equal(decoded.rawText, raw);
});
test('forged task quote, request, packet and scene identity rejected', () => {
  for (const mutate of [t => {t.binding.quote = 'forged';}, t => {t.requests.C.state.focalQuotation = 'forged';},
    t => {t.binding.packet.coverage = 'COMPLETE';}, t => {t.input.scene.id = 'S48';}]) {
    const t = structuredClone(task); mutate(t); assert.throws(() => assertTask(t));
  }
});
test('raw valid unknown response stays unknown and never becomes a candidate or human resolution', () => {
  const raw = body(response()), out = constructCandidates(task, raw);
  assert.equal(out.coverage.assessment.schemaValid, true);
  assert.equal(out.coverage.assessment.rawText, raw);
  assert.equal(out.cards.length, 0); assert.equal(out.coverage.humanReviewRequired, true);
  assert.equal(out.coverage.humanConfirmation, 'NOT_CONFIRMED');
  assert.equal(out.coverage.assessment.automaticRetryAllowed, false);
});
for (const name of Object.keys(QUESTIONS)) {
  test(`missing required ${name} rejected without coercion`, () => {
    const r = response(); delete r.answers[name]; const raw = body(r), out = constructCandidates(task, raw);
    assert.equal(out.status, 'SCHEMA_REJECTED'); assert.equal(out.cards.length, 0);
    assert.equal(out.coverage.assessment.rawText, raw);
  });
  test(`wrong ${name} type rejected`, () => {
    const r = response(); r.answers[name].type = 'noul'; assert.equal(decodeResponse(body(r)).schemaValid, false);
  });
}
const corruptions = {
  'extra field': r => {r.answers.actions = [];},
  'generated typed property': r => {r.answers.relation.reason = 'made up';},
  'unknown label': r => {r.answers.scene_scope.choice = 'AUTHORIZED';},
  'string confidence': r => {r.answers.relation.confidence = '0.9';},
  'negative probability': r => {r.answers.relation.probabilities.UNCERTAIN = -1;},
  'overflow numeric probability': r => {r.answers.relation.probabilities.UNCERTAIN = 2;},
  'missing probability': r => {delete r.answers.relation.probabilities.UNCERTAIN;},
  'extra probability': r => {r.answers.relation.probabilities.AUTHORIZED = 0;},
  'wrong choice probability': r => {r.answers.relation.choice = 'APPLIES_TO_SCENE';},
  'nonunit choice distribution': r => {r.answers.relation.probabilities.APPLIES_TO_SCENE = 0.2;},
  'selected probability conflict': r => {r.answers.action_families.selected = ['SEEK_SUPPORTING_DOCUMENT'];},
  'unselected high probability': r => {r.answers.action_families.probabilities.SEEK_SUPPORTING_DOCUMENT = 0.9;},
  'duplicate selected': r => {r.answers.action_families.selected = ['UNCERTAIN', 'UNCERTAIN'];},
  'unknown selected': r => {r.answers.action_families.selected = ['MAKE_IT_LEGAL'];},
  'changed threshold': r => {r.answers.action_families.threshold = 0.9;},
  'negative usage': r => {r.usage.input_tokens = -1;},
  'missing usage': r => {delete r.usage;},
  'missing model': r => {delete r.model;},
  'image response': r => {r.result = {}; delete r.answers;},
};
for (const [name, corrupt] of Object.entries(corruptions)) test(`${name} produces preserved schema failure`, () => {
  const r = response(); corrupt(r); const raw = body(r), out = constructCandidates(task, raw);
  assert.equal(out.status, 'SCHEMA_REJECTED'); assert.equal(out.coverage.assessment.rawText, raw);
  assert.equal(out.cards.length, 0); assert.equal(out.coverage.humanReviewRequired, true);
});
for (const raw of ['not JSON', 'null', '[]', '1', '{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"answers":{"x":1,"x":2}}', '{"model":1e999}']) {
  test(`malformed/ambiguous body retained: ${raw}`, () => {
    const d = decodeResponse(raw); assert.equal(d.schemaValid, false); assert.equal(d.rawText, raw);
  });
}
test('multiselect independent probabilities need not sum to one; explicit cutoff including boundary is frozen', () => {
  const r = response(), a = r.answers.action_families;
  a.selected = ['SEEK_SUPPORTING_DOCUMENT', 'VERIFY_DOCUMENTARY_SCOPE'];
  a.probabilities.SEEK_SUPPORTING_DOCUMENT = 1; a.probabilities.VERIFY_DOCUMENTARY_SCOPE = 0.5;
  assert.equal(decodeResponse(body(r)).schemaValid, true);
  delete a.threshold; assert.equal(decodeResponse(body(r)).schemaValid, true);
});
for (const label of ['NO_ACTION_STATED', 'UNCERTAIN']) test(`${label} with concrete action is flagged and quarantined`, () => {
  const r = select(response(), 'action_families', [label, 'SEEK_SUPPORTING_DOCUMENT']);
  const out = constructCandidates(task, body(r));
  assert.equal(out.coverage.assessment.schemaValid, true);
  assert.equal(out.status, 'SEMANTIC_CONFLICT_REQUIRES_REVIEW'); assert.equal(out.cards.length, 0);
});
test('request/issuance contradiction retained and cannot generate usable candidates', () => {
  const r = select(select(response(), 'passage_roles', ['UNISSUED_REQUEST']), 'textual_issuance', 'DOCUMENT_CLAIMS_ISSUED');
  assert.ok(decodeResponse(body(r)).flags.includes('REQUEST_ISSUANCE_CONFLICT'));
});
for (const value of ['REQUIRED_SUPPORT_LOCATED_IN_SUPPLIED_PACKET', 'REQUIRED_SUPPORT_NOT_LOCATED_IN_SUPPLIED_PACKET']) test(`${value} blocked for unassessed packet`, () => {
  const out = constructCandidates(task, body(select(response(), 'support_state', value)));
  assert.equal(out.coverage.assessment.semanticValid, false); assert.equal(out.cards.length, 0);
});
test('hypothetical candidate binds full original source, raw classification and request; deterministic title only', () => {
  const raw = body(select(response(), 'action_families', ['VERIFY_STATED_PHYSICAL_PREREQUISITES']));
  const out = constructCandidates(task, raw), card = out.cards[0];
  assert.deepEqual(out, constructCandidates(task, raw));
  assert.equal(card.title, 'Verify the physical prerequisites stated in this source.');
  assert.equal(card.status, 'MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED');
  assert.deepEqual(card.source, task.binding); assert.equal(card.requestHash, task.requestHashes.C);
  assert.equal(card.assessment.rawText, raw); assert.equal(card.humanConfirmation, 'NOT_CONFIRMED');
  assert.equal(card.origin, 'OFFLINE_RESPONSE_VALIDATION_NOT_LIVE_EVIDENCE');
});
test('negative/empty/no-action checks retain inspectable source and human review', () => {
  const r = select(select(response(), 'relation', 'UNRELATED_TO_SCENE'), 'action_families', ['NO_ACTION_STATED']);
  const out = constructCandidates(task, body(r)); assert.equal(out.cards.length, 0);
  assert.equal(out.coverage.sourceVisible, true); assert.equal(out.coverage.humanReviewRequired, true);
  assert.equal(out.coverage.source.quote, task.binding.quote);
});
test('BM25 reproduces an independent textbook calculation and includes zero scores', () => {
  const docs = [{documentId: 'D', unitId: '1', text: 'alpha alpha beta'},
    {documentId: 'D', unitId: '2', text: 'alpha beta'}, {documentId: 'D', unitId: '3', text: 'gamma'}];
  const ranked = rankPassages('alpha', docs);
  const idf = Math.log(1 + 1.5 / 2.5);
  const expected = new Map([['1', idf * 2 * 2.2 / (2 + 1.2 * (0.25 + 0.75 * 3 / 2))],
    ['2', idf * 2.2 / (1 + 1.2)], ['3', 0]]);
  for (const d of ranked) assert.ok(Math.abs(d.score - expected.get(d.unitId)) < 1e-12);
  assert.equal(ranked.length, 3); assert.equal(ranked.at(-1).unitId, '3');
  assert.equal(BASELINE_FINGERPRINT, fingerprint(BASELINE));
});
test('lexical normalization, no synonym invention, stable ties and empty corpus behavior', () => {
  assert.deepEqual(tokenize('ＦＯＯ café—WHEEL ４７'), ['foo', 'café', 'wheel', '47']);
  const docs = [{documentId: 'D', unitId: '2', text: 'carriage'}, {documentId: 'D', unitId: '1', text: 'trolley'}];
  assert.deepEqual(rankPassages('dolly', docs).map(d => [d.unitId, d.score]), [['1', 0], ['2', 0]]);
  assert.deepEqual(rankPassages('', []), []);
  assert.deepEqual(rankPassages('x', [{documentId: 'D', unitId: '1', text: ''}])[0].score, 0);
  assert.throws(() => rankPassages('x', [docs[0], docs[0]]), /Duplicate/);
});
test('baseline sees full identical source corpus, no selection based on model answers', () => {
  assert.equal(prepared.laneA.rankings.length, 2);
  for (const s of prepared.laneA.rankings) assert.deepEqual(s.ranking.map(p => p.unitId).sort(), ['U001', 'U002', 'U003', 'U004']);
  assert.ok(prepared.laneA.rules.findings.some(f => f.code === 'DATE_UNKNOWN'));
});
test('standalone views escape documentary markup and preserve source coverage on schema errors', () => {
  const raw = '<script>alert(1)</script>', out = constructCandidates(task, raw);
  const html = renderCandidates(out);
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'));
  assert.ok(html.includes(task.binding.unitId)); assert.ok(html.includes('NOT_CONFIRMED'));
  const view = renderPreparation(prepared);
  assert.ok(view.includes('connect-src \'none\''));
  assert.ok(view.includes('Zero provider requests')); assert.equal((view.match(/<section>/g) || []).length, 4);
});
test('offline preparation does not access network even if a fetch implementation is present', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = () => {throw Error('Network forbidden');};
  try {assert.deepEqual(await prepareDevelopment(), prepared);} finally {globalThis.fetch = previous;}
});
test('runner rejects dispatch flags before preparing or writing anything', () => {
  assert.throws(() => execFileSync(process.execPath, [new URL('./prepare.mjs', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), '--live'], {stdio: 'pipe'}), /Command failed/);
});
test('experimental modules cannot import a transport or read environment/owner stores', async () => {
  for (const name of ['contract', 'tasks', 'decoder', 'candidates', 'baseline', 'development', 'view', 'prepare']) {
    const source = await readFile(new URL(`./${name}.mjs`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|process\.env|from ['"](?:https?|net|tls|clocked-sdk|dotenv)|import\(['"]|\.env['"]|durable-execution|OWNER_ONLY_BLIND/);
  }
});
