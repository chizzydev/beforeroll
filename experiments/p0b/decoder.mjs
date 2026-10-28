import {QUESTIONS, POLICY, TITLES} from './contract.mjs';
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const unit = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const keysEqual = (v, keys) => object(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const allowedKeys = (v, keys) => object(v) && Object.keys(v).every(k => keys.includes(k));

// JSON.parse alone silently replaces duplicate keys. Detect those before accepting evidence.
// Syntax has already been checked by JSON.parse; this walker only tracks object member names.
function hasDuplicateKeys(text) {
  let i = 0, duplicate = false;
  const whitespace = () => {while (/\s/.test(text[i] || '') && i < text.length) i++;};
  const string = () => {
    const start = i++;
    while (i < text.length) {if (text[i] === '\\') {i += 2; continue;} if (text[i++] === '"') break;}
    return JSON.parse(text.slice(start, i));
  };
  function value() {
    whitespace();
    if (text[i] === '{') {
      i++; whitespace(); const seen = new Set();
      while (text[i] !== '}') {
        whitespace(); const key = string();
        if (seen.has(key)) duplicate = true;
        seen.add(key); whitespace(); i++; value(); whitespace();
        if (text[i] !== ',') break; i++;
      } i++;
    } else if (text[i] === '[') {
      i++; whitespace();
      while (text[i] !== ']') {value(); whitespace(); if (text[i] !== ',') break; i++;}
      i++;
    } else if (text[i] === '"') string();
    else {while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;}
  }
  value(); return duplicate;
}

// Always return the exact raw body, even if JSON, schema, or semantic checks fail.
// A usable response is not a permission, resolution, or deployment authorization.
export function decodeResponse(rawText) {
  if (typeof rawText !== 'string') throw Error('Exact raw response text required');
  const errors = [], flags = [];
  const result = {rawText, parsed: null, schemaValid: false, semanticValid: false,
    errors, flags, humanReviewRequired: true, notClearance: true, automaticRetryAllowed: false};
  try {result.parsed = JSON.parse(rawText);} catch {errors.push('INVALID_JSON'); return result;}
  try {
    if (hasDuplicateKeys(rawText)) {errors.push('DUPLICATE_JSON_KEY'); return result;}
  } catch {errors.push('JSON_STRUCTURE_UNASSESSABLE'); return result;}
  const root = result.parsed;
  if (!keysEqual(root, ['model', 'answers', 'usage'])) errors.push('RESPONSE_ENVELOPE_KEYS');
  if (typeof root?.model !== 'string' || !root.model.trim()) errors.push('MODEL_REQUIRED');
  if (!keysEqual(root?.usage, ['input_tokens', 'output_tokens']) ||
      !['input_tokens', 'output_tokens'].every(k => Number.isSafeInteger(root?.usage?.[k]) && root.usage[k] >= 0)) errors.push('INVALID_USAGE');
  if (!keysEqual(root?.answers, Object.keys(QUESTIONS))) errors.push('EXACT_SIX_ANSWER_KEYS_REQUIRED');
  for (const [name, question] of Object.entries(QUESTIONS)) {
    const a = root?.answers?.[name], labels = Object.keys(question.criteria);
    const fail = reason => errors.push(`${name}:${reason}`);
    if (!object(a) || a.type !== question.type) {fail('ANSWER_TYPE'); continue;}
    const properties = question.type === 'choice' ? ['type', 'choice', 'probabilities', 'confidence'] : ['type', 'selected', 'probabilities', 'threshold'];
    if (!allowedKeys(a, properties)) fail('UNKNOWN_ANSWER_PROPERTY');
    if (!keysEqual(a.probabilities, labels) || !labels.every(k => unit(a.probabilities?.[k]))) {fail('EXACT_BOUNDED_PROBABILITIES'); continue;}
    if (question.type === 'choice') {
      if (!labels.includes(a.choice)) fail('UNKNOWN_CHOICE');
      if (!unit(a.confidence)) fail('INVALID_CONFIDENCE');
      if (Math.abs(labels.reduce((n, k) => n + a.probabilities[k], 0) - 1) > POLICY.choiceSumTolerance) fail('CHOICE_DISTRIBUTION');
      if (labels.includes(a.choice) && a.probabilities[a.choice] < Math.max(...Object.values(a.probabilities))) fail('CHOICE_PROBABILITY_CONFLICT');
    } else {
      if (!Array.isArray(a.selected) || a.selected.some(k => !labels.includes(k)) || new Set(a.selected).size !== a.selected.length) {fail('INVALID_SELECTED_LABELS'); continue;}
      if (Object.hasOwn(a, 'threshold') && (!unit(a.threshold) || a.threshold !== question.threshold)) fail('THRESHOLD_MISMATCH');
      if (labels.some(k => a.selected.includes(k) !== (a.probabilities[k] >= question.threshold))) fail('SELECTED_PROBABILITY_CONFLICT');
    }
  }
  result.schemaValid = errors.length === 0;
  if (!result.schemaValid) return result;
  const a = root.answers, actions = a.action_families.selected, roles = a.passage_roles.selected;
  const concrete = actions.some(k => Object.hasOwn(TITLES, k));
  if (concrete && actions.includes('NO_ACTION_STATED')) flags.push('NO_ACTION_WITH_CONCRETE_ACTION');
  if (concrete && actions.includes('UNCERTAIN')) flags.push('UNCERTAIN_WITH_CONCRETE_ACTION');
  if (actions.includes('NO_ACTION_STATED') && actions.includes('UNCERTAIN')) flags.push('NO_ACTION_WITH_UNCERTAINTY');
  if (roles.includes('UNISSUED_REQUEST') && a.textual_issuance.choice === 'DOCUMENT_CLAIMS_ISSUED') flags.push('REQUEST_ISSUANCE_CONFLICT');
  if (roles.includes('BACKGROUND') && roles.length > 1) flags.push('BACKGROUND_WITH_SUBSTANTIVE_ROLE');
  if (a.relation.choice === 'UNRELATED_TO_SCENE' && concrete) flags.push('UNRELATED_WITH_ACTION');
  if (['REQUIRED_SUPPORT_LOCATED_IN_SUPPLIED_PACKET', 'REQUIRED_SUPPORT_NOT_LOCATED_IN_SUPPLIED_PACKET'].includes(a.support_state.choice)) flags.push('UNASSESSED_PACKET_SUPPORT_CLAIM');
  result.semanticValid = flags.length === 0;
  return result;
}
