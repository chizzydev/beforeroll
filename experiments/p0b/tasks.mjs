import {discoverSourceUnits, contextForUnit, verifySourceUnit} from '../../src/permit-intelligence.mjs';
import {sourceBoundDecidePayload} from '../../src/intelligence-workflow.mjs';
import {parseCallSheet} from '../../src/engine.mjs';
import {VERSION, QUESTIONS, INSTRUCTIONS, CONTRACT_FINGERPRINT, sha256, fingerprint} from './contract.mjs';

function identityText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw Error(`${name} required`);
}
function epoch(value) {if (!Number.isSafeInteger(value) || value < 0) throw Error('Nonnegative revision/epoch required');}
// Snapshots are experiment inputs, never owner-workspace handles. No filesystem or network access.
export function prepareTask(input) {
  const snapshot = structuredClone(input);
  const {document, scene, unitId} = snapshot;
  identityText(document?.id, 'Document identity'); identityText(scene?.id, 'Scene identity');
  epoch(document.revision); epoch(document.epoch); epoch(scene.epoch);
  const discovery = discoverSourceUnits(document.text);
  const index = discovery.units.findIndex(u => u.id === unitId);
  if (index < 0 || !discovery.allNonWhitespaceRepresented) throw Error('Exact source unit unavailable');
  const unit = discovery.units[index];
  if (!verifySourceUnit(document.text, unit)) throw Error('Invalid source unit');
  const parsed = parseCallSheet(scene.row);
  if (parsed.scenes.length !== 1 || parsed.unsupported.length || parsed.scenes[0].needsReview ||
      parsed.scenes[0].id !== scene.id || scene.row.includes('\n') || scene.row.includes('\r')) throw Error('Scene identity/row mismatch');
  const context = contextForUnit(discovery.units, index);
  // No assessed supporting packet is represented by these development probes.
  const packet = {coverage: 'INCOMPLETE_OR_UNASSESSED', assessedDocuments: [],
    note: 'Focal document and neighbors are source context, not an assessed supporting packet.'};
  const binding = {documentId: document.id, documentHash: discovery.sourceHash,
    documentRevision: document.revision, documentEpoch: document.epoch,
    unitId, unitHash: unit.hash, range: [unit.start, unit.end], quote: unit.text,
    sceneId: scene.id, sceneHash: sha256(scene.row), sceneEpoch: scene.epoch,
    packet, packetHash: fingerprint(packet)};
  const v1 = sourceBoundDecidePayload({document, unit, scene, context});
  const v2 = {state: {applicationContract: VERSION, source: binding,
    focalQuotation: unit.text, neighborContextOnly: context, proposedSceneRow: scene.row},
    instructions: INSTRUCTIONS, questions: QUESTIONS};
  const requestHashes = {B: sha256(JSON.stringify(v1)), C: sha256(JSON.stringify(v2))};
  const taskId = fingerprint({binding, requestHashes, contractFingerprint: CONTRACT_FINGERPRINT});
  return {taskId, input: snapshot, binding, requests: {B: v1, C: v2}, requestHashes,
    contractVersion: VERSION, contractFingerprint: CONTRACT_FINGERPRINT,
    status: 'PREPARED_NOT_DISPATCHED', humanReviewRequired: true, notClearance: true};
}
export function assertTask(task, currentInput = task?.input) {
  const rebuilt = prepareTask(currentInput);
  if (fingerprint(task) !== fingerprint(rebuilt)) throw Error('Source/task/request mismatch or stale source revision');
  return true;
}
