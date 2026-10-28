# BeforeRoll: from planned activity to documentary investigation

## Positioning and public description

**Positioning:** BeforeRoll turns filming paperwork and planned scene activities into source-linked coordinator review work. Clocked discovers relationships, copies prerequisites and organizes documentary claims; humans verify authority and readiness.

**Short description:** The crew has access to an observatory archive, but the next shot involves handling a borrowed atlas. BeforeRoll connects each scene to the original conditions, separates concrete prerequisites from documentary investigations, and produces a reviewable handover—without pretending to grant filming permission.

Primary audience: location managers and coordinators supporting production/location management. The problem is credible in heritage filming: access agreements, lender conditions, conservation protection and supervision can concern different activities. See Icon's [historic-house filming guidance](https://www.icon.org.uk/conservation-hub/caring-for-your-collections/filming-in-historic-houses.html), Claire Fry,1June2020; Film London's [heritage filming guidance](https://filmlondon.org.uk/latest/filming-in-heritage-locations-the-national-trust),3May2022. Our documents are fictional conditions, not those institutions' official requirements or legal advice. No user adoption, time saving or incident reduction has been measured.

## The implemented causal chain

1. **Original intake:** supported importer retains original bytes, source hash, transcription, revision, complete unit inventory and exact scene rows. Human text verification is distinct from issuer authentication.
2. **Automatic inventory:** each selected scene is paired with every represented unit of each selected document. Coverage gaps/oversize plans stop rather than silently truncate. No exact clauses or bespoke extraction questions are chosen by the coordinator.
3. **Decide:** existing two-question `activity_link` / `granted_for_scene` contract reads the focal original passage, same-document neighbors and proposed scene. Scores guide relevance/uncertainty investigation; even a high grant score cannot grant filming authority.
4. **Extract:** fixed `required_written_documents`, `required_physical_protections`, `required_on_site_personnel` lists return literal values. BeforeRoll checks field shape, source identity, quotation and zero-based Unicode codepoint `[start,end)` spans against the original. An exact phrase can still be misclassified, so validation is not semantic certification.
5. **Fill:** bounded documentary/status/reference routing invokes one typed record per eligible unit, not per scene pair. Fields: claimed role, exact claim quotation, referenced instrument, original scope quote and suggested scene target. All literal fields explicitly disable inference. Claimed-issued is not authenticated-issued; null does not prove corpus-wide absence.
6. **Source-bound work:** deterministic projection combines accepted responses, conservative scene/history fences and original-source bindings. It creates explicit candidate tasks and documentary investigations; it preserves uncertainty and quarantines unsupported classifications. Full evidence, alternative checks and scope disagreement remain available.
7. **Humans and handover:** acknowledgment, human documentary assertions and physical fulfillment are different records. Scenes/Work/History/JSON/Markdown share projections and source identity. Revisions retire stale evidence; reversing text cannot revive a consumed old analysis. Encrypted recovery preserves original bytes and non-retryable request history.

Implementation: `src/core-discovery.mjs`, `src/discovery-execution.mjs`, `src/literal-requirements.mjs`, `src/documentary-intelligence.mjs`, `src/coordinator-tasks.mjs`, `src/recorded-last-light.mjs`; existing server and browser presenters. Direct endpoints are `/clocked/decide`, `/clocked/extract`, `/clocked/fill`; no other sponsor endpoint is claimed.

## Last Light: actual expected and observed outcome

Four fictional documents/seven units and two planned scenes yielded14 assessed scene/unit pairs. S31 directly handles/unfolds the atlas; S32 interviews beside a closed case without touching it.

- Both scenes: investigate required **venue duty officer** presence—two independent tasks.
- S31 only: **written lender consent**, **supporting book cradle**, **padded transfer tray**, **collections conservator**—four additional tasks.
- S31 documentary investigation: inspect the source's claimed narrow variation and locate/verify referenced **Consent Schedule CS-9**.
- S32 documentary investigation: the wider extension request citing **Variation VA-17** remains explicitly unissued.

Six expected prerequisites and two investigations are retained. Historical foam-wedge/volunteer material does not become current work. No source or model output authenticates the variation, establishes external instrument availability or fulfills personnel/protection conditions.

**Known disagreement:** the general venue Fill target lists onlyS31. Independently accepted Decide/Extract bindings support the officer for both scenes; both tasks remain and the interface visibly discloses the incomplete Fill scope. Do not claim all five target readings were correct.

## Endpoint ablation and costs

| Configuration | Observed output | Original requests/credits/transport time |
|---|---|---|
| AI off | Complete deterministic original/scene processing and manual investigation; no model-derived cards |0/0; no coordinator time measured |
| Decide+Extract | Six expected prerequisites, **plus an unsupported CS-9 prerequisite** |18/30/11,913.4532ms |
| Add Fill | Six correct prerequisites plus two typed investigations; CS-9 becomes investigation, not duty |23/62/15,467.7490ms |

Two-endpointB is offline ablation of the same genuine receipts, not another dispatched run. Fill adds5calls/32credits/3,554.2958ms. Credits are provider units, not money; summed transport timings are neither model accuracy nor measured human effort. AI-off retains useful deterministic warnings, originals and manual tools; it is not deliberately weakened.

The full adaptive Batch B campaign consumed39genuine requests/150credits. Its failed quotation/scope attempts and initial missing/false task projection are preserved. Generic contract/projection repairs restored the frozen expectations; no gold/source/raw answer was changed. The earlier separate57-request campaign demonstrated27expected candidates across six fictional cases after repair; its original E failure remains a failure. These exposed development cases do not establish universal reliability.

## Reliability and security mechanisms

Exact preview and current version, independent local operator authorization, bounded request/credit reserve, durable intent before network dispatch, exact raw HTTP receipts, original request/response hashes and permanent execution fences. A lost/invalid/unknown-cost response halts; no blind retry. Provider receipt validation is repeated at load/projection/recovery. Controlled fake transports test engineering safety and are not live Clocked evidence.

Credential-free Evaluation validates/reprojects the exact23-request hero recording, labels it previously recorded and disables paid routes. No API key belongs in the browser. Each local process seeds a new temporary store; shared tabs on that process share mutations/reset, so this is **not a safe multi-user public deployment**. Private owner mode remains separate and authenticated.

## Limits and honest vocabulary

Use **source-grounded suggestion**, **prerequisite to verify**, **documentary investigation**, **source claims issued**, **unissued request**, **human review acknowledgment**, **previously recorded genuine response** and **handover**. Avoid “approved by AI,” “permission granted,” “verified signature,” “safe to film,” “all obligations found,” “autonomous clearance,” and unsupported time/incident/adoption claims.

Text offsets, complete represented inventory and bounded fictional results are demonstrated. Cross-document legal precedence, authentic issue, external missing-instrument completeness, physical readiness, arbitrary PDF/OCR/language coverage and real-world generalization are not. The useful outcome is an organized investigation with original evidence and accountable next work—not a green clearance badge.
