# M3-S26 / Documentary authority reasoning v0.24.0

## Cumulative source basis

Built from M3-S25 v0.23.0, itself based on the S24 atomic production workflow. **M3-S24 and M3-S25 Windows owner gate receipts were not reported in the conversation before this implementation.** Independent automated Linux/Node results are not Windows acceptance. M3-S26 has a cumulative Windows-only owner verifier.

## The actual integrated product contract

In the same original scene-authority register (NOT another shadow database), new human-recorded claims can now optionally carry eight typed, original-review-attested facets: exact scene activity, exact location, inclusive date interval, document issuance claim type, prerequisite mode, linked original restriction IDs, and linked scene prerequisite IDs. Legacy v1 source-linked records remain valid and project as unstructured scope requiring review; no silent promotion to a structured grant.

A deterministic read-only `projectDocumentaryReasoning` projection joins the same persisted production's original source-backed scene claims, current document metadata and AMENDS/SUPERSEDES/CONFLICTS_WITH relationships, current human-reviewed schedules and prerequisites, and any current audited Clocked task answers. Its conclusions are **review statuses**, never legal effects.

Conservative fences:

- **Original restrictions stay visible and outstanding.** Neither a broad general filming permission, a separate document, nor a Clocked-positive grant score can override or remove a specific restriction.
- **Issued vs requested.** Human-entered `DOCUMENT_CLAIMS_ISSUED` means only that a reviewer says original text states issuance; BeforeRoll never verifies the signature or issuer. A document registered as `REQUEST` or source claim `REQUEST_NOT_GRANTED` remains a request, even if a human tries to label its text issued.
- **Exact scope.** A possible documentary amendment must match the current scene's exact activity, exact location, and all covered local shoot dates (including overnight ending date) as independently human-reviewed. Missing, inconsistent or out-of-period facets fail closed. An `EXACT_SCENE` assertion is required; a `LOCATION_WIDE` claim cannot become a specific exception.
- **Document relationship.** A variation must link its exact original current source to an exact current same-scene restriction, with an active documented AMENDS/SUPERSEDES edge from the amendment document to that restriction document. Existing graph edges remain human-recorded; legal precedence is not inferred. An active conflict edge blocks any inference of an uncontested variation.
- **Issued chronology.** Human-reported issued-on date must be recorded and not be after the scheduled scene date. Without a current independently human-recorded scene schedule, time applicability remains open.
- **Prerequisites.** The operator either references exact current scene-bound prerequisite records, attests none stated, or records not reviewed. Outstanding linked conditions AND any open operational conditions on that same scene remain unresolved. A `HUMAN_CONFIRMED_NOT_AUTHORITY` decision is only an external human record and is explicitly NOT legal permission.
- **Clocked evidence.** Model-only scores, human-only source assertions, and claims supported by BOTH are reported separately (not treated as agreement or authenticity). Recorded Clocked responses cannot independently issue a grant.
- **Source revisions.** Changes to original permit/source text, source relationships, call-sheet scene rows and dated scene conditions retain the audit history but retire applicability. Fingerprints are exact source identities, not independent checks on human testimony.

This projection is connected to `/api/workspaces/:id/documentary-reasoning`, the existing atomic `workflow` response, the per-scene workbench, the integrated source-bound dossier and Markdown export, and the same prioritized human action queue. The production UI now offers actual activity/location/date/issuance/restriction/prerequisite controls and exposes each scene's conservative documentary status. No second persistent reasoning state was added. No other provider endpoint was invented.

## Validation scope

Full cumulative automated suite includes scenarios for: original restrictions vs generic permission, issued vs unissued request, same-scene restriction identity, exact activity/location/date and rescheduling, open prerequisites, source revision stale retirement, forged source identity, conflicting documentary relations, missing issue date, future issue date, model-only positive and separate human assertions, persistence round trip, HTTP scope commit, one atomic server workflow and dossier snapshot, and real browser-controller form rendering.

The original U01/U02 owner-recorded provider evidence is scored separately, read-only. These were narrow synthetic trials, not independently authenticated real permit decisions. **No live Clocked request is necessary for this milestone.** No GUI test is requested yet.

## Known limitations / next program phase

No signature cryptography, automatic semantic extraction of scope from complex prose, universal OCR, evidence-based enforcement of an attested date/location's literal presence in the quoted clause, or legal hierarchy adjudication. The typed scope predicates are HUMAN testimony about original source meaning, never automatically discovered facts. Real-provider integrated acceptance and unfamiliar real-document testing are deferred to coordinated functional product acceptance. Large-production execution and functional hardening remain outside this M3-S26 scope.
