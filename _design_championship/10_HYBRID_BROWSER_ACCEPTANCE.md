# Hybrid browser acceptance

26 October 2026. **PASS for the design prototype scope.** This is acceptance of rendered layouts and local simulated interactions, not a claim that a production redesign, real recovery, PDF ingestion or new Clocked analysis has been implemented.

## Execution surface and preservation

Actual Git HEAD is `355cd5a`; `359f476` is the accepted engineering ancestor. The working tree has no tracked production changes. Work is confined to `_design_championship/`. No reference repository was modified, no credentials were printed, and no live Clocked requests were made. The earlier engineering baseline's 501/501 result remains historical; no fresh production-suite run is claimed for these static artifacts.

Browser: actual Codex in-app Chromium surface, localhost port 3044. The static server serves the prototype directory and has `connect-src 'none'`. Human design state uses the isolated key `beforeroll-design-v2-editorial-studio`; A–F retain their separate prototype state. No production API, storage or live provider is connected.

U01 and U02 cases plus recorded evidence are copied exactly into `hybrid-evidence.js`. Offline deep equality and SHA checks cover both original source texts, all four scene rows and sixteen genuine recorded results. Earlier-contract provenance stays visible. Additional long text, 118 scene rows, work rows and history notes are explicitly design material with no provider results. The source originals and original recordings remain in place.

## Browser matrix and evidence

| Exercise | Actual coverage | Evidence |
|---|---|---|
| Fair visual comparison | A/C/B/G × five common screens × three viewports = 60 rendered observations; no horizontal page overflow | [four-way-layout.json](evidence/hybrid/four-way-layout.json); `{concept}-{screen}-{width}.jpg` |
| Same review task | Four concepts × three viewports = 12 completed journeys; exact Scene 48 paragraph 4 visible before application | [four-way-review-tasks.json](evidence/hybrid/four-way-review-tasks.json); `task-*-preview-*.jpg` |
| Hybrid stress matrix | 16 state/scenario combinations × three widths = 48 observations; no horizontal page overflow | [stress-layouts.json](evidence/hybrid/stress-layouts.json); `stress-*.jpg` |
| Final refined G screens | Five states × three widths = 15 new final captures | [final-captures.json](evidence/hybrid/final-captures.json); `final-editorial-studio-*.jpg` |
| Second case reflow | U02 discovery, exception and depth at 768 and 390 = six additional final captures; desktop journey separately exercised | `final-u02-*.jpg`; [U02 journey](evidence/hybrid/u02-journey.json) |
| Typography | Three real local pairings, equal content; desktop and narrow visual inspection | `typography-1440.jpg`, `typography-390.jpg`, `typography-cambria-390.jpg` |
| Semantic color samples | Seven contrast calculations meet declared targets | [contrast-checks.json](evidence/hybrid/contrast-checks.json) |

The CSS viewports were **1440×960, 768×1024 and 390×844**. Native screenshot transport sometimes returns a cropped/resized visible image (for example 1425×866 for the desktop CSS viewport). JPEG dimensions are recorded separately in the manifest; DOM dimensions establish viewport/overflow facts. A screenshot's image dimensions are not silently relabeled as CSS dimensions. Images are real browser captures, not generated mockups.

The stress combinations are: long/discovery; no-model/discovery; historical/depth; stale/discovery; many/discovery with a generated scene selected; empty/opening; loading/opening; error/discovery; and recorded documents, intake, review, preview, history, revision, export and recovery. State coverage does not imply every possible state/action cross-product was tested.

## Interactions actually completed

**U01 exact-source review.** Opened the example, compared the addendum/request, chose Scene 48 and retained paragraph 4 in review. Empty reviewer/reason fields triggered native validation. Entered a fictional reviewer and rationale; staged the exact source. Attempting application before verification was refused without discarding the staged entry. Attempting production switching with a staged entry was refused. Verification followed by explicit application succeeded; reopening history retained the human entry separately from the recording. See [review-journey.json](evidence/hybrid/review-journey.json).

**U02 independent context.** Used the production picker; inspected the booth/public-passage relationship and the RP-7/Scene 63 request distinction. Expanded exact provenance and compared raw fields with the genuine selected recording, including the original typed values. Navigated away and back to the same review draft; verified and applied. The successful result received status focus after the fix. See [u02-journey.json](evidence/hybrid/u02-journey.json). JSON key ordering in browser transport differs; the final raw-field comparison is structured equality, not serialized-key-order equality.

**All four final candidates.** At each viewport: first opening → investigate Scene 47 → comparison → Scene 48 → review → stage → verify → apply. Seven purposeful button actions, excluding field entry and scrolling, for all four. All twelve preview states contain the original unissued-request quotation and all twelve show saved/applied outcome text. G focuses its result status at all three sizes; the older candidates' observed active element has no status role. This demonstrates task completion; it is not a participant timing study.

**Shared comparison integration.** Selected G from A using the existing Design selector, opened Discovery using the shared five-screen toolbar, returned to A, then selected G again and opened Scenes through product navigation. All rendered the intended concept/content. The original selector intentionally returns to opening when changing concepts; it does not retain a cross-concept review transaction. [shared-selector-acceptance.json](evidence/hybrid/shared-selector-acceptance.json).

**Intake.** Selected the included fictional `.txt` using the real browser chooser. Its 530 bytes were read locally; displayed SHA-256 matched the frozen U01 original. Named reviewer plus comparison checkbox recorded a prototype transcription review. Unsupported `.csv` was rejected and retained the previously inspected material. No upload, OCR, vault write or PDF ingestion occurred. See [intake-acceptance.json](evidence/hybrid/intake-acceptance.json).

**Work.** Opened the AD-4 condition, recorded “Blocked,” returned to Work and reopened the same condition. The selected scene stayed S47 and the decision stayed Blocked, rather than becoming a generic completion label. [condition-acceptance.json](evidence/hybrid/condition-acceptance.json). Schedule controls are rendered; date/timezone/overnight server semantics remain a production acceptance obligation, not a newly proven behavior here.

**Large registers.** Navigated scene page two (21–40 / 120), searched “scene 210,” opened T210 and verified that it has no Clocked evidence. Navigated work page two (16–30 / 121). Activated 80 design history notes, opened page two, searched note 80 and inspected that exact note. At that point the 89 total rows comprised eight recorded comparisons, one prototype human record and eighty generated notes; subsequent acceptance added more human records, so live totals legitimately differ. See [large register](evidence/hybrid/large-register-acceptance.json) and [history](evidence/hybrid/history-acceptance.json).

**Revisions and history.** Opened the source revision impact specimen and explicitly showed changed-source state. The UI retained the old recording as history, showed no current result for the changed source, and disabled applying a source review to that design revision. After reload the earlier human review and model records remained historical. A persisted per-case epoch prevents restoring the old test mode from resurrecting earlier notes as current. This simulates presentation, not the real server's selective invalidation algorithm. [revision-acceptance.json](evidence/hybrid/revision-acceptance.json).

**Export and recovery.** Actually downloaded JSON design notes and inspected the file: `beforeroll-design-v2-notes-only`, `prototypeOnly: true`. It is not an evidence pack or encrypted backup. Exercised recovery specimens for wrong passphrase/damaged data, missing original, uncertain provider outcome and valid sample. Wrong typed production identity was refused; exact identity created a separate local design-copy record. No decryption, restoration or paid retry occurred. [export-recovery-acceptance.json](evidence/hybrid/export-recovery-acceptance.json) and [downloaded file](evidence/hybrid/downloaded-design-notes.json).

**Narrow navigation and focus.** At 390px opened “Find a scene,” received focus in search, filtered to T210, selected it and received heading focus. Used the native selector to return to the original scene and the next-action anchor to jump to human work. Review keyboard Tab order moved from reviewer to decision to rationale with visible focus. [mobile-navigation-acceptance.json](evidence/hybrid/mobile-navigation-acceptance.json), `review-keyboard-focus.jpg`, `mobile-next-action.jpg`.

## Defects found, fixed and retested

| Observed defect | Correction | Retest evidence |
|---|---|---|
| Generic disclosure styles expanded the context strip to about 95px and pushed desktop action below the intended position | Scoped compact context/disclosure rules | Final desktop view; strip about 43px; final action at y796–841 in comparative DOM |
| Mobile comparison used visual reordering without matching reading order | Two complete scene articles, desktop subgrid alignment, narrow natural grouping | Final exception views and DOM order |
| Scene 48 inherited Scene 47 vocabulary in a reading guide | Use the selected scene's actual activity fragment; U02 has its own vocabulary | U01/U02 journey and final captures |
| Applying a review left focus on BODY | Focus the visible status after application | U02 log and all three G four-way task outcomes |
| Saved condition truthiness could label Blocked as confirmed | Render and reopen the exact decision, reviewer and reason | Blocked-condition reopen evidence |
| Human history detail omitted the original quote | Include stored exact quote, citation and source identity | Selected human-history inspection |
| Simulated revision epoch was lost on reload | Persist separate case epochs; classify earlier notes as historical | Revision reload history |
| Long generated text could appear under a frozen source identity | Explicit design-only identity, no model result; frozen original in separate disclosure | Long-source end screenshot; disabled review |
| Search did not match natural “scene 210” | Include scene prefix, row and activity in searchable text | Large-register and mobile-search logs |
| Narrow search appeared after a long investigation | Place expanded search before investigation, focus input, then selected heading | Mobile navigation evidence |
| Input boundary had insufficient contrast against its surface | Use `#7f877a`, measured 3.68:1 | Contrast record and final captures |

The earliest screenshots and initial failed focus observation are retained, rather than overwritten as though the defects never existed. Final G captures use the `final-` prefix. One later automation label lookup timed out with the populated form still intact; fresh accessibility observation confirmed it, then the named textarea completed the task. Two comparison-selector attempts omitted an arrow in an exact label; inspection corrected the automation, not the interface. These attempts are not counted as product failures or successful actions.

## Visual findings and remaining limits

Inspected screenshots include all G common states at desktop, discovery at tablet/mobile, U02 narrow exception, narrow staged review, long reader interior/end, document register at tablet, narrow intake/error, history at tablet and the actual font pairings. Long quotations are legible but remain vertically expensive. The 2,350-character stress quotation requires substantial scrolling on a phone; the dedicated reader and next-action anchor are necessary. Tablet is functional rather than compact enough to keep every action initially visible. A's opening remains more expressive.

No horizontal **page** overflow occurred in the recorded matrices; the comparison toolbar deliberately has internal horizontal scrolling on narrow screens. Numerical overflow checks alone did not establish visual quality: screenshot inspection exposed the context-height and comparison-order defects above.

Not performed: participant study, real film-coordinator study, calibrated five-second comprehension measurement, screen-reader session, 200% zoom/forced-colors matrix, cross-platform fallback-font validation, actual engine reanalysis or encrypted disaster recovery. These remain explicit production acceptance work. The browser chooser and download tool had unusually long automation delays; no product latency claim is inferred from their durations. Compact disclosure and pagination targets need final accessibility refinement.

Run `node _design_championship/verify-hybrid.mjs` for reproducible evidence, preservation, score arithmetic and frozen-data checks. It writes only a new hybrid manifest; it does not rerun or overwrite the v1 study manifest. The result is a bounded design-acceptance PASS with the limits stated above.
