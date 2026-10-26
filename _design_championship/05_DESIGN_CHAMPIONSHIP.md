# Independent design championship

**Primary recommendation: Cinematic Editorial. Backup: Documentary Evidence Lens. Third finalist: Precision Intelligence Studio.** This is an expert design recommendation awaiting owner selection, not permission to implement it or a claim of user-study consensus.

## Method and controls

[Preregistered protocol](evidence/PREREGISTRATION.md) preceded construction/scoring. Same frozen fictional U01 case, four source paragraphs, two scenes, original model returns, five state tasks and desktop/narrow sizes. Initial field: 30 desktop and 30 narrow captures. Finalists: five states at each of 1440×960, 768×1024 and 390×844, with dimensions read back from the browser. [Desktop states](evidence/screens-desktop.json), [narrow states](evidence/screens-mobile.json), [finalist layout measurements](evidence/finalist-layout-checks.json).

Viewport tooling initially affected a different research tab after new tabs were created. Those incorrectly labeled finalist captures were discarded by overwriting them with a dedicated-tab, dimension-asserted run. Use the final manifests and `*-final-*-WIDTH.jpg` files. No unsupported viewport claim is inferred from filenames alone.

The capture transport returns JPEGs with visible-content cropping; image pixel dimensions differ from the measured CSS viewport and are separately recorded in the manifest. Layout measurements come from the rendered DOM, not inferred image dimensions. The running prototypes retain all content beyond each captured view.

One agent authored and assessed the field; no independently blinded panel or unfamiliar participant was available. Scores are reasoned ordinal judgments. Five-second and thirty-second impressions below are **expert predictions**, not measured participant comprehension or fabricated task times. Automated layout checks supplement visual inspection; they do not certify WCAG compliance or product desirability.

## Scoring

Weights: Clocked comprehension 20%; usability 20%; craftsmanship 20%; cohesion 15%; identity 10%; film credibility 5%; responsive/accessibility 5%; implementation 5%. Scores are 0–10; weighted total = Σ(score × weight)/10. Exact arithmetic is saved in [scores.json](evidence/scores.json). No concept may win with false authority, fake model evidence or an unsupported essential interaction model.

| Rank | Concept | Clocked | Usability | Craft | Cohesion | Identity | Film | Responsive | Implementation | Weighted /100 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Cinematic Editorial | 9.2 | 8.8 | 9.1 | 8.8 | 9.0 | 9.0 | 8.2 | 9.0 | 89.50 |
| 2 | Documentary Evidence Lens | 9.4 | 8.5 | 8.5 | 8.7 | 8.0 | 8.5 | 7.8 | 8.8 | 86.40 |
| 3 | Precision Intelligence Studio | 8.7 | 8.7 | 8.5 | 8.8 | 7.6 | 8.4 | 8.0 | 9.0 | 85.30 |
| 4 | Film Production Atelier | 8.0 | 7.6 | 8.9 | 7.8 | 9.2 | 8.8 | 7.5 | 8.0 | 82.05 |
| 5 | Modern Production Command | 7.8 | 8.3 | 8.0 | 8.5 | 7.0 | 9.0 | 8.0 | 8.5 | 80.70 |
| 6 | Radical Clarity | 8.2 | 8.0 | 8.0 | 7.4 | 7.0 | 7.8 | 8.8 | 8.4 | 79.00 |

The table follows computed totals. Precision to two decimals expresses the declared weights, not measurement certainty.

## Initial comparison and bounded refinement

Initial scores and final scores are both retained. A, C and B formed the top three before refinement. The initial Editorial spread had unnecessary empty height on the source side while its human action sat at the bottom of the story column. Lens's 250px central bridge wrapped too heavily; Studio's next action arrived late after stacked evidence.

Refinement kept the original concepts: Editorial moved the action directly under the source, capped headline size and reduced quotation padding. Lens widened the middle bridge to 290px and made the next-action footer a horizontal working strip. Studio tightened scene prose and turned its action into a clear bar. Shared narrow refinement added a native **Next human action** anchor after the planned activity; it scrolls to the existing source-bound action rather than creating a second decision concept. No source or model content was removed to improve apparent clarity.

## Adversarial comparison

| Test | Editorial | Evidence Lens | Precision Studio |
|---|---|---|---|
| Predicted first five seconds | A film scene and a paperwork question; distinctive reading identity | A direct intention/condition relationship; less film-specific | A professional review workstation; familiar rather than ownable |
| Predicted first thirty seconds | The dolly/platform language gap, exact restriction and follow-up are presented together | Strongest literal explanation of the model's bridging role | Clear model/source separation, but interface feels like a tool before a story |
| Consequential discovery | Four semantic roles visible together at 1440×960 | Three comparison columns plus action strip | Scene rail plus model/source pair plus action bar |
| Authority distinction | Original quotation is typographically prominent; recorded output explicitly separate | Excellent documentary comparison, but could look like machine adjudication unless labeled | Good panel separation; raw terminology must stay in disclosures |
| Next action at desktop | Review button bounds y=822.8–871.9 | y=864.3–913.3 | y=896.2–945.3 |
| Narrow reading | Long but comfortable; tested native jump to source-bound action | Longest of the three; comparison becomes serial | Shortest initial stack of the finalists, denser reading |
| Full-product continuity | Work register and document reader feel part of the same production desk | Evidence view is excellent; production opening less memorable | Strong stable workstation continuity |
| Main remaining concern | Long real quotations require disciplined line/space limits | Multiple long source documents can overwhelm the bridge | Generic professional-tool resemblance and dark reading fatigue |

The button positions are DOM measurements at the same 1440×960 viewport, not response-time metrics. At 768px all three require scrolling to review; at 390px the action itself is farther down the evidence sequence. Direct action jump was added and exercised. All 45 finalist state/size combinations fit within the viewport horizontally. Horizontal scrolling inside the gray comparison toolbar is intentional and outside the proposed product navigation.

## Actual finalist interactions

[Exact-source review log](evidence/finalist-review-interactions.json), [secondary workflow log](evidence/finalist-secondary-interactions.json).

For **each finalist**, used actual browser controls to open Scene 47, expand recorded model output, compare exception and request, investigate Scene 48, enter a fictional reviewer and reason, stage the exact paragraph, attempt apply before verification, verify, apply and reload. The unverified apply was refused; saved prototype human review reappeared after reload. The frozen provider recording was not changed. The commit success and raw source fields were inspected, not inferred from a button click.

Defined task path: from opening to completed human review is **seven purposeful button activations**, plus form entry: investigate, compare, select S48, record review, stage, verify, apply. The adversarial test added an eighth activation to check unverified apply refusal; opening model detail added a separate disclosure click. These counts are observed interaction structure, not user completion-time data.

Also exercised exact paragraph selection, raw source/request identity disclosure, work filtering to S48, document navigation and revision-impact storyboard in all three. The revision screen explicitly says no replacement file or new result exists. Review notes are stored only in `beforeroll-design-v1-CONCEPT` browser storage. The originals, authenticated production store and provider journal are inaccessible to the prototype server. Export/recovery are navigation/storyboard scope unless explicitly exercised; no fabricated lifecycle acceptance is claimed.

Review evidence: [Editorial preview](evidence/editorial-final-review-preview.jpg), [Lens preview](evidence/lens-final-review-preview.jpg), [Studio preview](evidence/studio-final-review-preview.jpg), [expanded provenance](evidence/editorial-provenance-expanded.jpg), [narrow action jump](evidence/editorial-mobile-action-jump.jpg). Review-preview captures were taken in the narrow prototype tab; desktop/narrow comparative state captures have their own measured manifest.

## Why Editorial wins

It makes a specific scene concern the product, then gives the original language and next action enough visual authority to stand beside the model. The refined spread supports a complete four-part reading without a grid of metrics, legalistic approval badge or chat transcript. Georgia/Segoe, limestone/rust/sage, scene numbering and a restrained quotation rail make it recognizably crafted without borrowing another product's palette or adding film clichés.

Lens narrowly wins the single relationship-explanation criterion. Editorial wins the overall combination of immediate purpose, film identity, comfortable reading, full-product continuity and implementation viability. Studio is an excellent fallback for users who spend long sessions across many scenes, but it contributes less distinctive product identity. These score differences could change with unfamiliar coordinator testing; the owner should review the real prototypes, not treat totals as proof.

## Backup and rejected alternatives

**Backup: Documentary Evidence Lens.** Select it if the owner values simultaneous documentary comparison above editorial identity. Keep the widened bridge and the explicit document/model/human labels. Its responsive serial comparison is the key tradeoff.

**Third finalist: Precision Intelligence Studio.** Retain as the preferred dark workstation territory if field feedback strongly favors dense scene switching. Do not merge its rail and dark surfaces into Editorial without re-evaluating the resulting design.

**Atelier:** strong identity and comfortable documents; the source/margin crossing weakens the core reading sequence. Its highest identity score does not buy workflow clarity. **Command:** excellent operations orientation, but could make BeforeRoll seem like a schedule manager while the unique Clocked discovery recedes. Use its task clarity as a principle, not a second navigation system. **Radical Clarity:** excellent restraint; serial reading delays comparison and under-expresses whole-product richness. None is rejected for being less decorated.

## Selection gate

Recommend **Cinematic Editorial**, subject to one owner GUI review of A/B/C using the same case and tasks. Do not start production implementation yet. The proposed contract in 06/07 is concrete enough to review and does not silently authorize replacement.

`DESIGN_RESEARCH=COMPLETE`  
`DEALFORGE_REVIEW=COMPLETE`  
`DECIDE_REVIEW=COMPLETE`  
`SKILLSROOM_REVIEW=COMPLETE`  
`SIX_DISTINCT_CONCEPTS=PASS`  
`INTERACTIVE_FINALISTS=PASS`  
`DESIGN_CHAMPION=Cinematic Editorial`  
`BACKUP_DESIGN=Documentary Evidence Lens`  
`PRODUCTION_REDESIGN=NOT_STARTED_PENDING_SELECTION`

“Complete” concerns this bounded design championship. It does not imply private reference-product transaction testing, an unfamiliar participant study, arbitrary-document acceptance or a production implementation.
