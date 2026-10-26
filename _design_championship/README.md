# BeforeRoll design championship

**Recommended: Cinematic Editorial. Backup: Documentary Evidence Lens.** Production redesign has not started. The recommendation is a single expert assessment supported by working prototypes and real browser evidence, not an unfamiliar-user study.

## Open the comparison

On Windows, double-click **Start-Design-Championship.cmd** in this directory. It uses the installed Node runtime, serves only the static prototype folder on localhost:3044, and opens your browser. It does not read `.env`, call a model, or connect to BeforeRoll storage. No installation is needed.

The study is already available in this session at [local prototype comparison](http://127.0.0.1:3044/).

Alternative terminal command from the project root:

```powershell
node _design_championship/prototypes/serve.mjs
```

Direct finalist links:

- [A — Cinematic Editorial](http://127.0.0.1:3044/?concept=editorial&screen=opening)
- [C — Documentary Evidence Lens](http://127.0.0.1:3044/?concept=lens&screen=opening)
- [B — Precision Intelligence Studio](http://127.0.0.1:3044/?concept=studio&screen=opening)

Other concepts: [D Command](http://127.0.0.1:3044/?concept=command), [E Atelier](http://127.0.0.1:3044/?concept=atelier), [F Clarity](http://127.0.0.1:3044/?concept=clarity).

Use the **gray comparison toolbar** to select any of the six concepts and the same five screens. This toolbar is research equipment, not proposed product navigation. Inside each design, use Production / Scenes / Work / Documents & history, source disclosure, exception comparison and exact human review. The browser URL preserves concept/screen, so screenshots can be reproduced directly.

For a finalist review: Investigate Scene 47 → compare addendum/request → investigate Scene 48 → record source review → enter fictional name/rationale → stage → verify → apply. Reopen History or reload to inspect the saved prototype review. Work offers a scene filter, document/source navigation, revision impact storyboard and prototype notes export. On narrow screens **Next human action** jumps to the source-bound next step.

Prototype human work is explicitly separate from frozen model evidence and saved only in `beforeroll-design-v1-CONCEPT` browser localStorage. Do not enter private production material. File import, replacement, paid analysis and encrypted restore are represented only as honest navigation/storyboards, not fake backend success. Full production behavior remains in the unchanged application.

## Read the decision evidence

1. [Existing products](01_EXISTING_PRODUCT_DESIGN_AUDIT.md)
2. [External benchmarks](02_EXTERNAL_DESIGN_BENCHMARKS.md)
3. [Current BeforeRoll critique](03_BEFOREROLL_CURRENT_UI_CRITIQUE.md)
4. [Six theses](04_SIX_DESIGN_THESES.md)
5. [Championship and ranking](05_DESIGN_CHAMPIONSHIP.md)
6. [Winning design system](06_WINNING_DESIGN_SYSTEM.md)
7. [Implementation contract and one owner selection plan](07_IMPLEMENTATION_CONTRACT.md)

Screenshots and DOM/interaction records live in `evidence/`. `*-final-*-1440.jpg`, `*-final-*-768.jpg` and `*-final-*-390.jpg` are the dimension-verified finalist comparison. Other concept captures use `CONCEPT-STATE-1440.jpg` and `CONCEPT-STATE-390.jpg`. Source/reference screenshots are identified by product name. The manifest records byte hashes; do not interpret every screenshot as proof of a completed production lifecycle.

Width suffixes identify the measured CSS viewport, not the JPEG pixel dimensions. The browser capture transport omits scrollbar/chrome regions and can clip the visible image height; native JPEG sizes are recorded separately in the manifest. Screenshots were saved without artificial resizing or redrawing. Use the DOM geometry log for viewport/overflow measurements and the running prototype for full-page inspection.

Baseline: clean HEAD `355cd5a`, accepted engineering ancestor `359f476`, independently 501/501 tests. Zero new live Clocked calls. Reference projects and production source unchanged. The ignored reference-render copy contains no environment/private files and uses existing read-only dependencies; it is not part of the deliverable runtime.

Choose one direction after the bounded GUI review in 07, or request a specific revision. No public deployment, submission, Git push or production implementation has occurred.
