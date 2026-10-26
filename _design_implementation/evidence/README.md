# Evidence index

These artifacts document the actual production redesign. The preserved championship is separately under `_design_championship/`; its prototypes are not production acceptance evidence.

## Start here

- [Final production scene workspace](final-production-studio.jpg)
- [Desktop opening](final-opening-1440.jpg)
- [Laptop next-action access](final-laptop-next-action-access.jpg)
- [Tablet review](final-review-768.jpg)
- [Mobile source and keyboard review](final-review-keyboard-390.jpg)
- [Corrected mobile work layout](final-work-390-corrected.jpg)
- [Original U02 source on mobile](u02-egress-source-390.jpg)
- [Source-revision reconciliation](bay-revision-export.jpg)
- [Verified separate recovery](recovery-health-retest.jpg)

## Machine-readable records

- [Complete 516-test result](final-tests.txt), [final focused regressions](editorial-final-tests.txt), [verified 501-test baseline](baseline-tests-verified.txt)
- [Preservation manifest](preservation-manifest.json), [frozen preflight](frozen-preflight.txt)
- [Actual downloaded export verification](real-export-verification.json), [Markdown download verification](markdown-export-verification.json)
- [Actual downloaded original/restored deep comparison](real-recovery-comparison.json)
- [Source revision journey](bay-revision-acceptance.json), [U01 review journey](u01-review-journey.json)
- [Viewport and keyboard record](viewport-and-keyboard.json), [token contrast calculation](contrast-check.json)
- [Artifact byte counts and SHA-256](artifact-manifest.json)

## Interpret earlier artifacts accurately

`baseline-tests.txt` contains Windows sandbox permission failures; `baseline-tests-verified.txt` is the rerun with the required local execution permissions. Intermediate integration logs show old monolithic-render assertions failing before task-oriented test migration and corrections. They are retained for traceability.

`opening-initial-*`, `scene-first-pass-*`, `comparison-first-pass-*`, `final-discovery-1366.jpg`, `final-work-390.jpg`, `large-work-pagination.jpg` and `large-last-scene-second-findings-page.jpg` include earlier layouts or captures before asynchronous completion. Prefer `final-laptop-next-action-access.jpg`, `final-work-390-corrected.jpg`, `large-work-page-two.jpg` and the explicit observed outcomes in report 03. A screenshot filename by itself is not a successful acceptance assertion.

`unsupported-source-error.jpg` actually shows missing stable document-ID validation. `unsupported-source-rejected-390.jpg` shows the initial unrelated recovery guidance after a real valid-ID unsupported upload. `unsupported-source-corrected-390.jpg` is the repeated successful error-handling retest. No unsupported source was imported.

`recovery-acceptance.json` records the initial diagnostic disclosure issue; `recovery-health-retest.json/.jpg` records its corrected, visibly completed result. Downloaded evidence/backup payloads remain in ignored generated test storage; committed records contain only sanitized verification facts. Screenshots contain fictional materials only.
