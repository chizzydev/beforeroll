import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {exists, readEvents, durableJSON, durableBytes} from './store.mjs';
import {sha256, fingerprint} from '../contract.mjs';
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

export function comparisonRows(preparation, outcomes) {
  return preparation.tasks.map((task, index) => {
    const ranking = preparation.laneA.rankings.find(s => s.sceneId === task.binding.sceneId)?.ranking || [];
    const position = ranking.findIndex(p => p.documentId === task.binding.documentId && p.unitId === task.binding.unitId);
    const out = outcomes[index];
    return {sceneId: task.binding.sceneId, unitId: task.binding.unitId, source: task.binding,
      A: {lexicalRank: position < 0 ? null : position + 1, score: ranking[position]?.score ?? null,
        ruleFindings: preparation.laneA.rules.findings.filter(f => f.sceneId === task.binding.sceneId),
        boundary: 'Frozen AI-off ranking/rules, not semantic permission or measured human effort.'},
      B: {status: 'NOT_DISPATCHED', results: null, humanEffort: null,
        workflow: 'Existing two-noul finding followed by human source review. No fresh B result or actual B UI measurement in this stage.'},
      C: {status: out.status, receipt: out.receipt ?? null, derivation: out.derivation ?? null,
        executionProvenance: out.executionProvenance ?? null, humanConfirmation: 'NOT_CONFIRMED', humanEffort: null}};
  });
}
export function renderReport(result) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>P0-B Stage 1 evidence</title>
<h1>P0-B Stage 1: ${esc(result.status)}</h1><p>${esc(result.origin)}. Exposed U01 development checks; not independent evaluation, clearance, or operational rollout.</p>
<p>Accepted typed responses: ${esc(result.acceptedCount)}/4. Request intents: ${esc(result.intentCount)}. Human verification remains pending.</p>
<p>B was not dispatched. Human reconstruction effort, comparative cost/latency, correctness and sponsor-value gains are unmeasured.</p>
${result.comparison.map(row => `<section><h2>${esc(row.sceneId)} / ${esc(row.source.documentId)} / ${esc(row.unitId)}</h2><blockquote>${esc(row.source.quote)}</blockquote>
<p>Packet: ${esc(row.source.packet.coverage)}. Task/source identities remain inspectable.</p>
<p>A lexical rank: ${esc(row.A.lexicalRank)}. B: NOT_DISPATCHED. C: ${esc(row.C.status)}.</p>
<p>Origin: ${esc(row.C.executionProvenance?.origin ?? 'NOT_ATTEMPTED')}; human confirmation: NOT_CONFIRMED.</p>
${(row.C.derivation?.cards || []).map(c => `<article><h3>${esc(c.title)}</h3><p>${esc(c.family)} · ${esc(c.status)}</p><p>${esc(c.boundary)}</p></article>`).join('')}
<details><summary>Source, receipt, classifications and diagnostics</summary><pre>${esc(JSON.stringify(row, null, 2))}</pre></details></section>`).join('')}
</html>`;
}
// Read-only recovery inspection. Never repairs the journal or enables dispatch.
export async function inspectExecution(directory) {
  if (!(await exists(directory))) return {status: 'NOT_EXECUTED', intentCount: 0, acceptedCount: 0, retryAllowed: false};
  if (!(await exists(join(directory, 'run.json')))) return {status: 'FENCE_ONLY_STORAGE_UNCERTAIN', retryAllowed: false};
  const run = JSON.parse(await readFile(join(directory, 'run.json'), 'utf8'));
  const events = await readEvents(directory);
  for (const event of events) {
    if (event.type === 'INTENT') {
      const {probe, intentHash, requestHash} = event.data;
      if (!/^probe-0[1-4]$/.test(probe)) throw Error('INTENT_INTEGRITY_FAILURE');
      const path = join(directory, probe);
      const intent = JSON.parse(await readFile(join(path, 'intent.json'), 'utf8'));
      if (fingerprint(intent) !== intentHash || sha256(await readFile(join(path, 'request-body.json'))) !== requestHash) throw Error('INTENT_INTEGRITY_FAILURE');
    }
    if (event.type === 'OUTCOME') {
      if (!/^probe-0[1-4]$/.test(event.data.probe)) throw Error('OUTCOME_INTEGRITY_FAILURE');
      const path = join(directory, event.data.probe);
      if (sha256(await readFile(join(path, 'outcome.json'))) !== event.data.outcomeFileHash) throw Error('OUTCOME_INTEGRITY_FAILURE');
      const outcome = JSON.parse(await readFile(join(path, 'outcome.json'), 'utf8'));
      for (const [name, hash] of Object.entries(outcome.artifacts)) {
        if (!/^[\w.-]+$/.test(name) || sha256(await readFile(join(path, name))) !== hash) throw Error('RESPONSE_INTEGRITY_FAILURE');
      }
    }
  }
  const intents = events.filter(e => e.type === 'INTENT'), outcomes = events.filter(e => e.type === 'OUTCOME');
  const finalized = events.find(e => e.type === 'FINALIZED');
  if (finalized) {
    if (sha256(await readFile(join(directory, 'result.json'))) !== finalized.data.resultHash ||
        sha256(await readFile(join(directory, 'index.html'))) !== finalized.data.htmlHash) throw Error('FINAL_REPORT_INTEGRITY_FAILURE');
    const manifest = JSON.parse(await readFile(join(directory, 'package-manifest.json'), 'utf8'));
    if (fingerprint(manifest.files) !== manifest.filesFingerprint) throw Error('PACKAGE_INTEGRITY_FAILURE');
    for (const [name, hash] of Object.entries(manifest.files)) {
      if (!/^(?:probe-0[1-4]\/)?[\w.-]+$/.test(name) || sha256(await readFile(join(directory, name))) !== hash) throw Error('PACKAGE_INTEGRITY_FAILURE');
    }
  }
  return {status: finalized ? 'FINALIZED_EVIDENCE_PRESENT' : 'INTERRUPTED_OR_STORAGE_UNCERTAIN',
    runId: run.runId, origin: run.origin, intentCount: intents.length,
    acceptedCount: outcomes.filter(e => e.data.status === 'ACCEPTED').length,
    unresolvedIntentCount: intents.filter(e => !outcomes.some(o => o.data.probe === e.data.probe)).length,
    retryAllowed: false, note: 'The permanent fence remains consumed even if there are no complete events. No resume or resubmission.'};
}
export async function finalizePackage(directory, result, journal) {
  await durableJSON(join(directory, 'result.json'), result);
  await durableBytes(join(directory, 'index.html'), renderReport(result));
  await journal.event('FINALIZED', {resultHash: sha256(await readFile(join(directory, 'result.json'))),
    htmlHash: sha256(await readFile(join(directory, 'index.html')))});
  const files = {};
  for (const name of (await readdir(directory)).sort()) {
    if (/^probe-0[1-4]$/.test(name)) {
      for (const file of (await readdir(join(directory, name))).sort()) files[`${name}/${file}`] = sha256(await readFile(join(directory, name, file)));
    } else files[name] = sha256(await readFile(join(directory, name)));
  }
  await durableJSON(join(directory, 'package-manifest.json'), {schema: 'p0b-stage1-package-v1', files,
    filesFingerprint: fingerprint(files), custody: 'Checksums and event chain detect changes; retain an independent copy. Not a digital signature.'});
}
