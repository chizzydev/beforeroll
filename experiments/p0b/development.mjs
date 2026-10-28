import {readFile} from 'node:fs/promises';
import {discoverSourceUnits} from '../../src/permit-intelligence.mjs';
import {evaluatePreflight} from '../../src/engine.mjs';
import {prepareTask} from './tasks.mjs';
import {rankPassages} from './baseline.mjs';
import {sha256} from './contract.mjs';

export const DEVELOPMENT_PAIRS = Object.freeze([
  ['S47', 'U002'], ['S47', 'U003'], ['S48', 'U004'], ['S47', 'U004'],
].map(Object.freeze));
// This loader has no caller-controlled path and cannot load a blind set or answer key.
export async function prepareDevelopment() {
  const path = new URL('../../fixtures/M3S6_UNFAMILIAR_CASES.json', import.meta.url);
  const fixtureBytes = await readFile(path, 'utf8');
  const fixture = JSON.parse(fixtureBytes).cases.find(c => c.id === 'U01');
  if (!fixture || sha256(fixture.permit) !== fixture.permitSha256 ||
      fixture.scenes.some((row, i) => sha256(row) !== fixture.sceneSha256[i])) throw Error('Exposed U01 source fingerprint mismatch');
  const document = {id: 'U01-PERMIT', text: fixture.permit, revision: 1, epoch: 0};
  const scenes = fixture.scenes.map(row => ({id: /^Scene (\d+) /.exec(row)?.[1], row, epoch: 0})).map(s => ({...s, id: `S${s.id}`}));
  const tasks = DEVELOPMENT_PAIRS.map(([sceneId, unitId]) => prepareTask({document,
    scene: scenes.find(s => s.id === sceneId), unitId}));
  const passages = discoverSourceUnits(document.text).units.map(u => ({documentId: document.id, unitId: u.id, text: u.text}));
  return {schema: 'p0b-stage0-prepared-only-v1',
    evidenceOrigin: 'EXPOSED_U01_DEVELOPMENT_INPUTS_NOT_INDEPENDENT_EVALUATION',
    dispatches: 0, providerResults: null, fixtureFileHash: sha256(fixtureBytes),
    tasks, laneA: {rankings: scenes.map(scene => ({sceneId: scene.id,
      ranking: rankPassages(scene.row, passages)})),
      rules: evaluatePreflight({permitText: document.text, callSheetText: fixture.scenes.join('\n'), fields: {}}),
      ruleBoundary: 'Existing AI-off engine with no extracted permit fields or fabricated manual facts. Unknowns remain unknown.'},
    comparison: tasks.map(t => ({taskId: t.taskId, sceneId: t.binding.sceneId, unitId: t.binding.unitId,
      B: 'PREPARED_NOT_DISPATCHED; actual production payload, no new output or imagined action queue',
      C: 'PREPARED_NOT_DISPATCHED; no model classifications or candidate actions generated'}))};
}
