# Evidence provenance and what R6/R7 established

### Original preregistration

Clocked Build Challenge research, October 24, 2026. Research expectations and scenario texts were authored before the owner executed live API calls. All samples fictional. The archived `CLOCKED_R7_VERIFIED_LIVE_RESULTS.zip` supplied by the owner contains independently verified actual R7 Clocked responses. The original frozen research and audit were prepared earlier; this code does not rewrite that history.

### R7 response outcomes — not an accuracy benchmark

| Case | Observed | Engineering implication |
|---|---|---|
| F01 issued permit vs. application annex | 8/8 preregistered values; 5 credits | Use Extract for explicit permit terms and distinguish a request from issued authorization. |
| F02 signed NORTH variation vs. pending SOUTH email | 7/7 values; 5 credits; location/date values anchored to **base paragraph** rather than variation | A matching substring is not enough: require authority-paragraph containment. If that fails, display a reviewer question, not a permitted extension. |
| F03 three call sheet rows | 6/9 preregistered value cells; 5/12 cells with both correct value and within-own-row provenance when activities included; 10 credits | Don't use Clocked's free-form row extraction for this pipe-delimited scene format. Parse and source-link each line deterministically. |

All three R7 API calls returned HTTP 200; total **20 credits**. They are not training-independent or validated by film office experts.

### R6 earlier failure classes

- Compare is pairwise; a conflicting base-document/scene relationship does not by itself determine whether a later amendment supersedes the base rule.
- Verify can reject a claim of written approval when supplied documents expressly state a request remains unanswered, but that does not cover the full operational workflow.
- Rerank may select the correct governing rule while skipping a required installation plan. Thus no unguarded document filtering here.

### Built-in fences in this app

- No Clocked API authentication in the browser. Live requests require separate operator authorization.
- A request for additional time is never treated as issued authority just because it appears in the source.
- Codepoint-exact span evidence is checked. F02 variation requires same authority-paragraph citations before automatic applicability. Otherwise review.
- Explicit scene parser does not combine columns across lines; unrecognized Scene lines are reported as unsupported.
- Documentary time/location/drone/sound **findings** use deterministic rules, not model "overall verdict" labels.
- Missing information and manual corrections retain review status.
- A reviewer marking a finding "reviewed" doesn't clear it.

### Remaining gate for concept COMMIT

1. Collect at least three independently written realistic permit packs and two non-pipe call sheets, without sending private data to an unsecured demo.
2. Freeze which asserted decisions must be correct, source-quote affiliation and adverse amendment/request controls.
3. Compare Clocked extracted permit readings against a fair deterministic baseline, show material incremental value and measure omissions/false scope claims.
4. Obtain film-professional feedback on workflow usefulness; no invented testimonials or economic savings claims.
5. Ship a real demo link, README, short reproducible video, solid integration evidence and complete write-up well before the November 10 contest cutoff.

Decision today: bounded prototype delivered, **contest COMMIT still conditional**; no API calls in this build environment.
