# BeforeRoll M3-S2 v0.2.1 — Clocked Condition Sweep

Date: 24 October 2026. **IMPLEMENTED AND OFFLINE TESTED. LIVE OWNER ACCEPTANCE NOT YET PERFORMED.**

## Why this increment exists

M3-S1 asked the human to select a permit clause before Clocked Decide could assess whether a scene was related. The owner-run M3A/M3N/M3B triad passed its preregistered *narrow* semantic gold, but did not demonstrate automatic clause selection. This release adds a **single-scene, all-detected-candidate sweep**; no hazard keyword dictionary and no human selection of the relevant clause before the model runs.

## Exact operation

1. A reviewer loads an entirely fictional permit/scene packet (M3B recommended) under **Semantic lens**.
2. A deterministic, Unicode-codepoint-aware punctuation/newline adapter segments candidates; **it is not itself AI clause discovery**. Short or atypical text can be unscanned; these fragments are reported, never silently treated as safe.
3. The operator clicks **ANALYZE ALL N DETECTED CLAUSES WITH CLOCKED**, reviews the credit warning and uses the separate operator token. The server checks that the full permit and one complete scene row satisfy limits. It refuses documents containing more than **8** detected candidate clauses rather than truncating them.
4. For each candidate, in **source order**, the server makes **one actual Clocked Decide request** containing the original verbatim scene row and source-anchored clause with two `noul` questions (applicability; whether selected clause states a scene-specific documentary grant). The server performs no semantic pre-filter and no automatic retries.
5. Results are displayed in order of Clocked activity-link score. Each includes the exact quote, original Unicode source range, model scores, specific grant score, request hash, and conservative review/unresolved status. The user can inspect the corresponding exact original source.
6. Downloadable JSON retains all successful per-clause answer objects, exact sources and fingerprints. No real API key is sent to the browser or included in the export.
7. The existing one-clause Semantic Lens remains functional. All previous review-desk, corrections, dossier and evidence logic remains cumulative.

## Hard safety boundaries

- **At most 8 independently billable requests** in a sweep; total price is unknown in advance. Local $0 overage cannot cap a charge in credits on each request. Every call consumes one server hourly request-attempt slot, counted before the network call. No automatic retry.
- Invalid shape, upstream HTTP error, timeout or non-JSON response stops further attempts. The partial result explicitly says `complete:false` and never claims the rest of the clauses were checked. Billing on a failed request may be unknown; observed-known credits are shown separately.
- This feature evaluates all **detected** clauses, NOT all possible conditions across arbitrary formatting, not multi-sentence rule completeness, signed-authority precedence, real document authenticity or full permit compliance.
- `sourceUnscanned` reports missed non-whitespace source fragments; even a `complete:true` scan means only every enumerated clause was tested.
- Every result with high grant score remains **CONDITIONAL AUTHORITY REVIEW**. Actual signer, date, scene, location, safety conditions and outside authorities require human verification.
- Negative clause scores never establish global permission to film.
- Multi-clause/same-document issue: a restriction in Clause 2 and signed variation in Clause 3 can both score relevant. The app **does not resolve authority or supersession automatically**. Both are presented for review.
- No PDF ingestion, persistent storage, public credit-safe deployment, real user validation, blind independent generalization, or multi-document authority graph is claimed in this increment.

## Frozen owner test — one bounded session

1. Stop previous local server. Extract this package into a NEW directory. Run `npm test` (47 tests expected). Start recorded mode first and open `http://127.0.0.1:3000`. Select Semantic Lens -> Signed contrast M3B. Verify 4 clauses, new sweep action visible but disabled, no fabricated results.
2. For optional real API owner acceptance, restart with `scripts\\Run-BeforeRoll.ps1 -Live`. Paste Clocked API key at hidden **terminal** prompt. Copy the separate `LIVE_OPERATOR_TOKEN` into the browser; do not share either secret.
3. Select **SIGNED CONTRAST / M3B**, leave the selected clause alone to prove it is not required, click **ANALYZE ALL 4 DETECTED CLAUSES WITH CLOCKED**, and confirm the warning. There will be **up to four actual billable API calls**. No retries. If unsuccessful, stop and inspect response; never repeatedly click.
4. Inspect all four source-anchored results. **Expected primary insight**: a signed SV-31 scene-specific carbon-dioxide variation may produce a high applicability+grant score; the general prerequisite may also be relevant and must not be dropped or silently overridden. Results can differ from earlier single-clause calls; do not assert a pass without reading them.
5. Export `BEFOREROLL_M3_S2_SWEEP_M3B.json`, review for secrets, share the file and screenshot. Inspect `sourceUnscanned` and `complete` carefully. No additional experiment is necessary until independent audit.

## Verification completed during creation (not live acceptance)

- `node --check server.mjs` and `node --check public/app.js`: PASS.
- `npm test`: **47/47 PASS** (original 40 + seven new sweep tests).
- Mock transport coverage: all clauses evaluated with exact offsets and request hashes; operator gate; replay disables calls; >8 candidate refusal; partial HTTP403 stops; invalid probability abstention; short overlooked source text reported.
- Chromium offline browser harness: source pane renders, 4 clauses enumerate, sweep button disabled in replay, no invented model answers, no uncaught browser errors. **No actual Clocked API requests were made in preparing this build.**
- The owner-run M3 triad is independently audited in `docs/M3_TRIAD_OWNER_AUDIT_AND_S2_DECISION.md`. Do not mislabel earlier model answers as new sweep results.
