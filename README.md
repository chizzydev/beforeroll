# Internal M3-S23 engineering note

This package extends the accepted M3-S22 owner engineering baseline with source change reconciliation and exact preview-bound commits. This file is development documentation, not the final judge-facing README. See `docs/M3S23_BULK_ENGINEERING_RECEIPT.md`.

---

> Engineering status (M3-S20 v0.18.0): source-bound lifecycle integrity, archived Clocked ledger backup and owner-local recovery added. Previous documentation is retained as engineering history; final visual redesign and submission materials remain deferred. See `docs/M3S20_BULK_ENGINEERING_RECEIPT.md`.

# BeforeRoll — internal functional engineering baseline M3-S19 v0.17.0

Cumulative source-bound transactional human review sessions are described in `docs/M3S19_BULK_ENGINEERING_RECEIPT.md`; see `README_FIRST_WINDOWS.txt` for the current automated owner verification. This is **not** a finished product or final visual design. Earlier engineering notes below remain historical.

---

# BeforeRoll — internal functional engineering baseline M3-S18 v0.16.0

Owner-accepted input: M3-S17 (240/240 Windows automated tests). M3-S18 adds a single scene-centered command and evidence workflow: original row, source tasks, recorded model results, documentary scope, operational conditions, prioritized actions, direct source-review navigation and current human decisions. See `docs/M3S18_BULK_ENGINEERING_RECEIPT.md` and `README_FIRST_WINDOWS.txt` for the current engineering gate. **This is not a final product README, UI redesign, end-to-end approval or submission artifact.** The historical engineering readme below is retained for continuity.

---

# BeforeRoll M3-S15 — source-bound production operations v0.13.0

This intermediate engineering increment adds reviewed IANA timezone and overnight
scene scheduling, documentary/manual operational prerequisites, immutable human
condition reviews, durable workspace integration and source-bound operations
export. See `docs/M3S15_BULK_ENGINEERING_RECEIPT.md` and
`README_FIRST_WINDOWS.txt` for the current automated engineering gate.
**This is not a complete or UI-accepted product.** The historical engineering
notes below remain for continuity; final documentation comes after functionality.

---

# BeforeRoll — Source-linked film production intelligence

**Clocked Build Challenge 2026 · M3-S13 bulk functional build v0.11.0 · 25 October 2026**

**Know the constraint before the take.** BeforeRoll connects a fictional location permit to two filming scenes, uses Clocked Decide to identify relevant restrictions and *potential* scene-scoped documentary exceptions, and produces original-quote/offset-backed review evidence. It is not a film-office approval tool.

## Start — offline demo (no key, no external requests)

Requirements: Node.js 20+ and Windows PowerShell or any Node-compatible shell. No npm install needed.

```powershell
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1'
```

Open http://127.0.0.1:3000 → **Review desk** → choose **REPLAY VERIFIED U01** or **REPLAY VERIFIED U02**. These are original owner-run live Clocked results, re-validated locally against exact source and request hashes. The interface MUST say **OWNER-RECORDED**; replay is not a new live call. Use **EXPORT DOSSIER** for the evidence narrative. To see the no-AI baseline instead, click **LOAD FROZEN U01/U02**: all scenes reset to NOT AI-EVALUATED.

### Two scenes, two real experiments

| Frozen fictional permit | Clause the model linked | Scene-specific authorisation it did / didn't transfer | Frozen assertions |
|---|---|---|---|
| U01: Riverton Archive mosaic | Wheeled camera platforms / original tesserae | Scene 47 addendum applies as a *possible* conditional grant; not Scene 48 | 5/5 |
| U02: North Arcade egress | Temporary scenic installations / passage obstruction | Scene 62 approved route-plan condition; not Scene 63's unissued relocation request | 5/5 |

Both experiments used eight independently reported Clocked credits each and were scored against expectations frozen **before** live calls. This establishes only a narrow synthetic pass, not calibrated confidence, legal effect, unseen real-world reliability, or complete clause discovery. Original data: `fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json` and `fixtures/audit/M3S6_U02_OWNER_LIVE_EVIDENCE.json`. Frozen gold labels and scoring script: `research/M3S6_FROZEN_PREREGISTERED_GOLD.json`, `scripts/evaluate_m3s6.mjs`.

### Why Clocked is load-bearing

With Clocked disabled, BeforeRoll still parses source-bound scene rows, validates provenance, and performs deterministic date, time, and location checks, but makes **no semantic claims** about whether a wheeled camera dolly equals a pressure-bearing platform, or a period stall must comply with a pedestrian-egress restriction. Clocked Decide produces typed clause-by-scene relevance and documentary-grant scores; BeforeRoll binds them to exact permit quotation, scene source hash, Unicode offsets, and original request fingerprint, then shows a *human-review* authority board. No activity-synonym rules are hardcoded for U01/U02.

### Known limits and safety

The model sometimes assigns high documentary-grant scores to **general site consent**. The review desk and exported dossier now demote such unscoped model-positive claims to **unverified scope**, without deleting or changing the original raw result. Even a grant naming the correct scene may not cover the planned activity. Human checks for authenticity, date, scope, conditions and precedence remain mandatory. A four-clause segmented scan cannot claim whole-permit coverage; U03 offline test demonstrates an omitted short-condition risk. BeforeRoll is NOT filming clearance.

A public demo must be **offline/recorded-only**, with no `CLOCKED_API_KEY`, operator token or live request enablement. Public GitHub hosting, live demo deployment, video, final challenge form and independent cold start are not yet completed.

### New owner-run live requests (local machine only)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1' -Live
```

Enter the Clocked API key only in the masked terminal prompt, and copy the *separate operator token* into the browser when running a fresh batch. No automatic retries. Local throttle is configurable. Do not upload keys, tokens or confidential permits.


## Further documentation

- `docs/M3S8_JUDGE_WALKTHROUGH.md`: click-by-click sponsor-value demonstration and release status.
- `docs/M3S7_AND_EARLIER_README_HISTORY.md`: historical engineering readmes, not current run instructions.
- `docs/M3S6_OWNER_ACCEPTANCE.md`: original preregistered U01/U02 live execution protocol.

## M3-S11 local project-first workflow (functional engineering, not final UI)
On a loopback `node server.mjs` session, **Productions** opens by default. Create a project, import a UTF-8 permit source and supported call sheet, review paged source-bound tasks, record human follow-up decisions, and reopen the versioned project. This workflow makes **zero model calls** and does not claim documentary clearance. Recorded synthetic demos remain under Research replay. At M3-S11, PDF/DOCX and durable Clocked execution were not yet included; consult the later engineering receipts below for current capabilities. See `docs/M3S11_BULK_ENGINEERING_RECEIPT.md`.

## M3-S12 integrated engineering status (NOT final product documentation)
Project-first Productions mode now supports authenticated local operator-initiated source-bound Clocked batches (1-32 tasks per run), per-attempt durable journals, source version isolation, paged progress, and read-only JSON evidence export. This does not imply general real-world accuracy or filming clearance. At M3-S12, imports were TXT/MD, CSV and typed JSON; M3-S13 now supports conservative DOCX main-body permit imports, while PDF remains pending. See `docs/M3S12_BULK_ENGINEERING_RECEIPT.md` and `README_FIRST_WINDOWS.txt` for engineering verification. Do not deploy writable local project routes publicly.

## M3-S13 internal engineering state (NOT final product documentation)
The local Productions desk supports conservative DOCX permit main-body import (unambiguous paragraphs and ordinary table rows, without invisible Word constructs), retains the original ZIP byte hash plus the exact normalized text/offset map, and explicitly rejects review-critical Word features that could silently hide restrictions. PDF binaries and OCR are still unsupported. Human reviewers can annotate documents and record source-quoted links (amendment/supersession/request/conflict) across documents; links remain unverified claims and turn **stale** if original source changes. The new authority board is integrated with local stored productions. No signature verification or effective legal precedence is claimed. See `docs/M3S13_BULK_ENGINEERING_RECEIPT.md`.

## M3-S21 internal engineering increment (source originals custody)

New local project imports preserve byte-identical PDFs, DOCX, call sheets and text originals in a private content-addressed source vault, linked to the same persisted source receipts and revisions. Owner lifecycle backups now embed available originals and report legacy originals not found. Source-original downloads and exact-SHA legacy relink are accessible within the local Production Desk, with no source revision or Clocked call during relink. An explicit 32 MiB original-payload budget applies to single lifecycle backups. This is a functional engineering increment, **not** a final UI redesign or a claim that all real-world documents can be parsed. See `docs/M3S21_BULK_ENGINEERING_RECEIPT.md`.
