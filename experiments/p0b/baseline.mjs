// Standard Okapi BM25. No learned parameters, semantic mappings, stopword list or model.
import {fingerprint, freeze} from './contract.mjs';
export const BASELINE = freeze({version: 'ai-off-okapi-bm25-v1', k1: 1.2, b: 0.75,
  tokenizer: 'NFKC then ECMAScript toLowerCase then Unicode letter/number runs',
  query: 'Exact complete call-sheet row; each distinct query token once',
  corpus: 'All supplied source units for the scenario, exactly once, no relevant-unit preselection',
  idf: 'ln(1 + (N - df + 0.5)/(df + 0.5))',
  score: 'sum(idf * tf*(k1+1)/(tf+k1*(1-b+b*length/averageLength)))',
  ties: 'documentId then unitId in Unicode code-unit ascending order',
  stemming: false, synonyms: false, stopwords: false, minimumScore: null,
  output: 'Full ranking including zero scores; retrieval only, no permission or action inference',
});
export const BASELINE_FINGERPRINT = fingerprint(BASELINE);
export const tokenize = s => s.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export function rankPassages(sceneRow, passages) {
  if (typeof sceneRow !== 'string' || !Array.isArray(passages) || passages.some(p =>
    typeof p.documentId !== 'string' || typeof p.unitId !== 'string' || typeof p.text !== 'string')) throw Error('Invalid lexical inputs');
  const identities = passages.map(p => JSON.stringify([p.documentId, p.unitId]));
  if (new Set(identities).size !== identities.length) throw Error('Duplicate lexical source identity');
  const documents = passages.map(p => ({...p, tokens: tokenize(p.text)}));
  const n = documents.length;
  if (!n) return [];
  const avg = documents.reduce((sum, d) => sum + d.tokens.length, 0) / n;
  const query = [...new Set(tokenize(sceneRow))];
  const df = new Map(query.map(t => [t, documents.filter(d => d.tokens.includes(t)).length]));
  return documents.map(d => {
    const frequencies = new Map(); for (const t of d.tokens) frequencies.set(t, (frequencies.get(t) || 0) + 1);
    let score = 0;
    for (const token of query) {
      const tf = frequencies.get(token) || 0;
      if (!tf) continue;
      const idf = Math.log(1 + (n - df.get(token) + 0.5) / (df.get(token) + 0.5));
      score += idf * tf * (BASELINE.k1 + 1) /
        (tf + BASELINE.k1 * (1 - BASELINE.b + BASELINE.b * d.tokens.length / avg));
    }
    return {documentId: d.documentId, unitId: d.unitId, text: d.text, score, humanReviewRequired: true};
  }).sort((a, b) => b.score - a.score || cmp(a.documentId, b.documentId) || cmp(a.unitId, b.unitId));
}
