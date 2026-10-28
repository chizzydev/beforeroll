import {assertTask} from './tasks.mjs';
import {decodeResponse} from './decoder.mjs';
import {TITLES, fingerprint, sha256} from './contract.mjs';

// Caller cannot pass prevalidated/fabricated labels to bypass raw-body validation.
// The origin is never inferred to be a genuine provider call by this offline harness.
export function constructCandidates(task, rawText, currentInput = task?.input) {
  try {assertTask(task, currentInput);} catch (error) {
    return {status: 'SOURCE_REJECTED', rawText, sourceError: error.message,
      coverage: null, cards: [], humanReviewRequired: true, automaticRetryAllowed: false};
  }
  const assessment = decodeResponse(rawText);
  const coverage = {taskId: task.taskId, source: structuredClone(task.binding),
    requestHash: task.requestHashes.C, contractVersion: task.contractVersion,
    rawResponseHash: sha256(rawText), assessment, sourceVisible: true,
    humanReviewRequired: true, humanConfirmation: 'NOT_CONFIRMED',
    origin: 'OFFLINE_RESPONSE_VALIDATION_NOT_LIVE_EVIDENCE', notClearance: true};
  const cards = [];
  if (assessment.schemaValid && assessment.semanticValid) {
    for (const family of assessment.parsed.answers.action_families.selected) {
      if (!Object.hasOwn(TITLES, family)) continue;
      cards.push({...structuredClone(coverage), id: fingerprint({taskId: task.taskId,
        family, rawResponseHash: coverage.rawResponseHash}), family, title: TITLES[family],
        status: 'MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED',
        boundary: 'Family-level candidate attached to the entire exact source unit; not an enumerated obligation checklist.'});
    }
  }
  return {coverage, cards, status: !assessment.schemaValid ? 'SCHEMA_REJECTED' :
    !assessment.semanticValid ? 'SEMANTIC_CONFLICT_REQUIRES_REVIEW' :
    cards.length ? 'CANDIDATES_REQUIRE_HUMAN_REVIEW' : 'NO_CANDIDATE_SOURCE_STILL_REQUIRES_REVIEW'};
}
