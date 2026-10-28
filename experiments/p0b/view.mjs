const esc = v => String(v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
// Standalone experimental presentation only; not loaded by the application.
export function renderCandidates(result) {
  const {coverage, cards, status} = result;
  if (!coverage) return `<section><h2>Source rejected — no candidate</h2><p>${esc(result.sourceError)}</p><pre>${esc(result.rawText)}</pre></section>`;
  return `<section><h2>${esc(coverage.source.sceneId)} / ${esc(coverage.source.documentId)} / ${esc(coverage.source.unitId)}</h2>
<p>${esc(status)} · ${esc(coverage.origin)} · Human confirmation: ${esc(coverage.humanConfirmation)}</p>
<blockquote>${esc(coverage.source.quote)}</blockquote>
<p>Packet: ${esc(coverage.source.packet.coverage)}. No scene clearance. All source checks require human review.</p>
<p>Task: ${esc(coverage.taskId)} · Request: ${esc(coverage.requestHash)} · ${esc(coverage.contractVersion)}</p>
${cards.map(c => `<article><h3>${esc(c.title)}</h3><p>${esc(c.family)} · ${esc(c.status)}</p><p>${esc(c.boundary)}</p></article>`).join('')}
<details><summary>Raw response, classifications and validation diagnostics</summary><pre>${esc(JSON.stringify(coverage.assessment, null, 2))}</pre></details></section>`;
}
export function renderPreparation(preparation) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'none'; script-src 'none'; img-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>P0-B Stage 0 — prepared only</title>
<h1>P0-B Stage 0: exposed U01 development probes</h1>
<p>Zero provider requests. No model results. Not an evaluation score or production interface. All sources remain human-unverified.</p>
${preparation.tasks.map(t => `<section><h2>${esc(t.binding.sceneId)} / ${esc(t.binding.unitId)}</h2><p>${esc(t.status)} · Packet incomplete or unassessed</p><blockquote>${esc(t.binding.quote)}</blockquote><p>${esc(t.input.scene.row)}</p><details><summary>Exact v1/v2 requests and source identity</summary><pre>${esc(JSON.stringify(t, null, 2))}</pre></details></section>`).join('')}
<h2>AI-off full lexical rankings and unchanged rules</h2><pre>${esc(JSON.stringify(preparation.laneA, null, 2))}</pre></html>`;
}
