# Batch B — Fill contract and value gate (27 October 2026)

Registered before any Batch B provider result. New ceiling: 80 provider attempts or 400 cumulative returned credits; no retries of uncertain outcomes. Old 57-request campaign is closed and unchanged. Owner chronology clarification is accepted; no new eligibility investigation.

## Official contract read in the Codex in-app browser

Living, undated documentation accessed 27 October 2026:
- https://clocked.rezolve.ai/docs/fill (including complete saved response)
- https://clocked.rezolve.ai/docs/responses
- https://clocked.rezolve.ai/docs/errors

POST /clocked/fill accepts nonempty text, 1–64 typed fields, shared instructions up to 20,000 characters. Six field types: extract, choice, multiselect, score, yes_no, generate. Extract infer defaults true; our contract explicitly uses false and no generation/normalization. Choice has 2–255 distinct labels; multiselect 2–64 independent labels; score 2–10 ordered levels. Extract list max_items 1–32; region is [start,end), unit can be sentence. Choice options_by dependencies must be noncyclic and have a choice/yes_no parent. Generate explicitly generates and has 1–400 max_tokens. These unused features are not necessary to claim breadth.

Raw HTTP returns model/fields directly, not SDK data. Fields have type-dependent value, optional confidence/probabilities/offsets. Missing source values can be null. Diagnostic keys must not be required globally. Non-null literal values in OUR application require exact Unicode codepoint offsets and original substring equality. Null carries no invented quote. Decision confidence is not authenticity or calibrated correctness. Image responses lack these offsets and are outside this integration. A whole malformed/partial record is rejected, never silently accepted as complete.

Credit headers settle the request, at 25 model milliseconds per credit rounded up, minimum one; usage tokens and summed engine timings are not debit. Retain safe timing/cost/transport headers and measured round-trip latency. A transport replay is not a new model read. There is no documented per-schema fixed Fill price. We reserve conservatively and stop on missing/excessive costs; a single unexpected charge cannot be undone. Gateway model limit 110 seconds; client timeout must allow overhead. Existing no-automatic-retry application fence remains stricter than SDK retry guidance. No SDK retry wrapper will be introduced.

## Product hypothesis and registered falsification

A: unchanged AI-off source processing/manual reviews. B: same packet with existing Decide + three-field Extract. C: B plus typed documentary investigation. Distinct useful value must be a source-grounded role/reference/scope investigation, not another prerequisite list or prose summary.

The versioned contract in src/documentary-fill-contract.json will add an application-defined scene_scope multiselect using selected scene IDs and exact scene rows in field instructions. Only this schema's choice/multiselect outputs are model interpretations. claim_quote, referenced_instrument and scope_quote are literal fields. No provider value may establish missingness across a corpus, actual issuance or legal precedence. Supporting-instrument availability stays UNESTABLISHED until independent human evidence. Exact extracted reference creates a locate-and-verify action, not an assertion that the instrument is absent.

Before first dispatch, freeze a matched packet with two distinct scene activities, a claimed narrow issued variation, unsigned wider request, historical reference and referenced instrument absent from supplied originals. Freeze expected role, claim/reference/scope quotations, scene associations, required actions and prohibited assertions. Retain original expectations and failures unchanged.

Value acceptance requires: all four role distinctions correct; reference correctly quoted; all accepted non-null spans exact; useful request/claimed-variation/reference investigations not supplied with comparable specificity by B; no historical prerequisite, scene transfer, authenticity/issuance/clearance/fulfillment assertion. All UNKNOWN is a failure of useful discovery. An empty reference is acceptable only where gold says absent. Errors get classified and generic repair/fresh fenced validation; no retroactive gold edits.

Initial experiment: four separately journaled Fill requests on the frozen four documentary units, before production integration. Current-condition and irrelevant units remain outside that initial four-case value test. Once the gate passes, production Fill is opt-in per bounded scope, one read per automatically eligible documentary unit after Decide/Extract, never one Fill for every scene pair. Eligibility and skipped units must be reported. Full hero must then execute through actual authenticated application and real browser controls; isolated probes alone cannot satisfy Batch B.

No results are registered in this document. Findings, failures and decision will be written separately.
