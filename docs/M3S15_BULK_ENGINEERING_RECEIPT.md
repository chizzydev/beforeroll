# BeforeRoll M3-S15 — Production operations / temporal source review

## Acceptance baseline
- Built cumulatively from owner-accepted M3-S14: 182/182 Windows tests, U01 5/5, U02 5/5, U03 omitted-source sentinel.
- Functional engineering increment; NOT complete product or coordinated Windows GUI acceptance.
- All original owner-recorded Clocked fixtures remain untouched; automated tests never contact the provider.

## Bulk implementation
- Introduced one source-and-scene-bound operations register connected to the existing durable production workspace, browser desk, read API and source-hash-validated local storage.
- Human-confirmed date + IANA timezone + explicit next-day flag for every scene, with original call-sheet row SHA256. Date/time intervals resolved to explicit UTC instants, including overnight and DST offset transitions.
- Refuse invalid Gregorian dates, unsupported time zones, DST gaps, DST repeated times, implicit overnight guessing, inconsistent end-day selections, and non-positive or implausible >24h intervals.
- Immutable schedule revisions: changing an original scene marks previous schedule records stale; rescheduling supersedes earlier dated entry without erasing it.
- Exact-source-linked prerequisites bind the original document hash, source-unit hash/quote, original scene row, and precisely selected current dated schedule. Manual operational tasks are allowed but are visibly lacking a documentary quotation.
- Optional local deadline resolves to UTC using the bound schedule timezone, with explicit reproducible UTC `asOf` for overdue and before-scene calculations. Missing deadline never becomes a claimed automatic completion.
- Human condition-review decisions append to an immutable chronology; allowed states are OPEN, NEEDS_SOURCE, BLOCKED, HUMAN_CONFIRMED_NOT_AUTHORITY. None mean permission to film.
- Source edits, scene edits and rescheduling retire current prerequisite assertions and previously confirmed human status instead of transferring them to a changed scene. Historical records remain visible.
- Local-only project API (`/scene-schedule`, `/condition`, `/condition-decision`, `/operations`, `/operations/export`); JSON export joins operational registers with current source fingerprints and documentary graph summaries.
- Persistent storage load/save validates deterministic identities, temporal calculations and source-quote bindings. Optimistic persisted-version checks apply to all mutations.
- Browser production desk has operational controls and statuses connected to these persisted routes. Detailed GUI acceptance deferred as owner requested.

## Scope limitations
- No automatic inference of dates from free-form call sheet headers: the source schedule requires a responsible human, exact date, timezone and rationale.
- Condition deadlines and confirmation are human claims; no signature verification, legal authority, complete source discovery or filming clearance.
- Historical source hashes are provenance/integrity within the local workspace; not independent cryptographic proof of a third party's signature.
- Conservative text PDF import limitations from M3-S14 remain. More workflow completion and independent integrated acceptance are still required.

## Windows owner automated gate
From the extracted root:
`powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-M3S15.ps1`
Expect source manifest PASS, 200/200 tests PASS, U01/U02 5/5, U03 preflight and final `M3S15_WINDOWS_OWNER_AUTOMATED_GATE=PASS`.
No Windows GUI, API keys or Clocked credits required.
