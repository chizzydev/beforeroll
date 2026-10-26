# Review the hybrid and four finalists

**Recommended: Editorial Intelligence Studio (G). Backup: Cinematic Editorial (A).** This is a browser-tested design recommendation. Production redesign has not started. The original README and reports 01–07 remain unchanged as v1 history; this guide and reports 08–12 are the v2 result.

## Open

The server is available in this session at [G — Editorial Intelligence Studio](http://127.0.0.1:3044/?concept=editorial-studio&screen=opening).

If it is stopped, double-click the existing `Start-Design-Championship.cmd`, then choose **G** in the gray Design selector. Alternatively run this from the project root:

```powershell
node _design_championship/prototypes/serve.mjs
```

No installation is needed. The server serves only static prototype files on localhost:3044; it does not read `.env`, connect to production storage or call Clocked.

Direct comparison links:

- [G — Editorial Intelligence Studio](http://127.0.0.1:3044/?concept=editorial-studio&screen=opening)
- [A — Cinematic Editorial](http://127.0.0.1:3044/?concept=editorial&screen=opening)
- [C — Documentary Evidence Lens](http://127.0.0.1:3044/?concept=lens&screen=opening)
- [B — Precision Intelligence Studio](http://127.0.0.1:3044/?concept=studio&screen=opening)
- [Original frozen comparison application](http://127.0.0.1:3044/v1-frozen/index.html?concept=editorial&screen=opening)
- [Rendered font study](http://127.0.0.1:3044/font-study.html)

The gray toolbar is comparison equipment, separate from product navigation. It selects seven designs and the same five common screens. Inside G use Overview / Scenes / Work / Evidence and the production picker.

## A bounded review, approximately 15–20 minutes

1. Compare first impression and discovery in G, A, C and B at the same window size. Identify the intended activity, the vocabulary relationship and the original quotation without expanding model fields.
2. In each: investigate Scene 47 → compare exception/request → investigate Scene 48 → record source review → enter a fictional name/rationale → stage → verify → apply. Explain why the request does not extend Scene 47's exception. Reopen history.
3. In G, use the production picker for **North Arcade** (U02). Inspect Scene 62 versus Scene 63, then exact provenance and original model fields. Do not assume the provider interpretation authenticates the source.
4. In G, use **Study controls** for 120 scenes, long source, no model, historical, stale and empty states. Search “scene 210”; generated rows explicitly have no model result. Use Work pages/filters and Evidence → History. Add design history stress and search a later note.
5. Narrow the browser. Try the native scene selector, Find a scene, next-action anchor, exact quote and review form. Judge reading comfort and next-step clarity, not only what fits above the fold.
6. Inspect Evidence → Sources / History / Exports & recovery. The intake reads only a fictional local text fixture; revision and recovery are labeled design specimens. Do not enter real private production information.

Prototype notes persist in browser-local storage under `beforeroll-design-v2-editorial-studio`. Original concepts use their existing `beforeroll-design-v1-CONCEPT` namespaces. They never write to BeforeRoll production state. Earlier design revision simulations can make old prototype notes historical; that is intentional. New totals reflect local study actions. Use a fresh browser profile if you need an untouched local note history; no production reset is needed.

## Read and inspect

- [08 — Synthesis audit](08_HYBRID_SYNTHESIS_AUDIT.md)
- [09 — Full design system](09_EDITORIAL_INTELLIGENCE_STUDIO_SYSTEM.md)
- [10 — Browser acceptance, defects and limits](10_HYBRID_BROWSER_ACCEPTANCE.md)
- [11 — Final four-way ranking](11_FINAL_FOUR_WAY_CHAMPIONSHIP.md)
- [12 — Implementation contract](12_FINAL_IMPLEMENTATION_CONTRACT.md)
- [Final desktop discovery](evidence/hybrid/final-editorial-studio-discovery-1440.jpg)
- [Final mobile discovery](evidence/hybrid/final-editorial-studio-discovery-390.jpg)
- [Final tablet comparison](evidence/hybrid/final-editorial-studio-exception-768.jpg)

All new screenshots and browser logs are under `evidence/hybrid/`. `final-` files show the refined hybrid; initial defect captures are retained. Width suffixes mean CSS viewport; the manifest records the native JPEG dimensions separately. Run `node _design_championship/verify-hybrid.mjs` from the project root for frozen data, preservation, evidence and score checks.

Give one final direction: **SELECT Editorial Intelligence Studio**, **SELECT Cinematic Editorial**, another finalist, or **REVISE** with the specific visual/interaction concern. This is the final design-selection gate, not a request to repeat the agent's browser testing.
