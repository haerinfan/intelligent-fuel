# Decision and uncertainty log

D01 and the scope updates below are confirmed by the user. The original table is preserved as decision history. A prototype design choice is not adviser approval; record evidence and consequences rather than erasing unresolved research decisions.

## Adopted updates, 13 September 2026

- D02: Cavite first, Philippine expansion later, as confirmed by the user.
- D16: Approximately 12 October submission and an ML component required. Research question, rubric and budget still open.
- D04/D18: Local Fastify/TypeScript/SQLite/Better Auth application; browser uses native HTML/CSS/ES modules. This replaces the unadopted React proposal to keep one server/build and avoid extra tooling for the one-month prototype. Hosting, email verification/recovery and participant access remain later gates.
- D06/D17: Transactional save unique by owner/analysis, then an explicit same-tab Maps link. This survives blocked popups and preserves planned status. Fictional routes have no legitimate waypoints to transmit; only resolved demo endpoints are sent.
- D15: Minimal manual vehicles retain unknown fields; prediction and cost unavailable in contract 0.2.0. Existing catalog data remain synthetic.
- D19: Origin-area price basis, visibly synthetic; exact brand quotes affect cost only.
- D08–D11: Still deferred. The real sample audit found sparse fuel-rate readings and does not justify adopting VED or a fitted model. Next task: label semantics and static-feature mapping, followed by an agreed split/protocol. ML remains required.

## Research evidence update, 22 September 2026

- D09–D11 remain deferred. The unit-checked draft in `ml-label-spec.md` defines only a candidate retained-window target and leakage boundary.
- A strict five-second continuity audit found 29 ICE MAF/trim segments lasting at least five minutes across 17 vehicles, and 12 lasting ten minutes across 9 vehicles, in the inspected week. PHEV OEM-rate coverage is smaller. These counts are feasibility evidence, not training approval.
- The next choice is adviser-owned: audit another VED week using the same draft or pivot to a consented local measurement protocol. No model, scoring rule, interval method, density assumption or final split was selected.

## Research evidence update, 24 September 2026

- The second chronological VED week was audited with unchanged continuity settings, with a separate hash recorded for each input; the additional-week feasibility gate is complete.
- Strict five-minute ICE MAF/trim coverage changes from 29 segments across 17 vehicles to 194 across 87. Across both weeks, 197 of 307 vehicles repeat, including 13 ICE vehicles qualifying for trim-complete windows in both weeks.
- D08–D11 remain deferred. Reversible external-data inspection does not adopt VED or replace adviser acceptance of the claim, derivation, split and evaluation protocol.
- Two current DOE Region IV-A price reports were visually inspected for Cavite. They support dated city-level brand/grade ranges, but contain no station identity, coordinates, machine-readable schema or time-of-day observation. D13 remains open.
- The proposed DOE intake rule treats blank, `None`, `No LFRO` and `0.00-0.00` as unavailable; it preserves report period, monitoring interval, retrieval time, page and hash. This rule blocks zero-price arithmetic and does not interpret DOE's internal missing-value semantics.
- Current Philippine manufacturer evidence was mapped for Toyota Vios 1.3 XLE CVT and Mitsubishi Mirage GLX CVT. It supports variant identity and several specifications, but exact catalog model-year applicability and route-relevant fuel economy remain unsupported. Participant/Cavite fit is a separate later check. D03 stays open and the fixture catalog is unchanged.

## Research preparation update, 25 September 2026

- `adviser-research-gate.md` turns D08-D12 and the research part of D16 into an explicit review checklist. It offers three bounded tracks without selecting one: external retained windows, locally measured trips, or external ML with local usability evidence.
- The local-protocol draft separates pre-trip predictors from realized telemetry, requires a versioned direct measurement/derivation method and leakage-safe grouping, and blocks participant collection until consent, retention and deletion are approved.
- No sample count, final model, baseline implementation, interval method or prediction claim was adopted. Adviser acceptance and a frozen protocol remain the next research gate.

| ID | Status | Decision or question | Proposed next step / evidence | Owner / needed by |
|---|---|---|---|---|
| D01 | Confirmed | School thesis prototype | User clarification on 2026-09-12 | Lead / now |
| D02 | Open | Target city/corridor and vehicle classes | Select one area with inspectable route and price coverage; do not infer location from workspace timezone | Thesis team / M1 |
| D03 | Open | Initial vehicles and source permission | Two staging candidates and manufacturer sources are documented. Obtain exact-year applicability evidence, separately confirm participant/Cavite fit, and define review/reuse ownership before promoting either to the real catalog; final count stays deferred | Data + thesis team / M3 |
| D04 | Proposed | One modular web application | Prefer shared typed boundaries and relational persistence; exact framework and hosting await constraints | Lead / M1 |
| D05 | Open | Provider access, school budget and quotas | Test routing alternatives/traffic in target area, inspect billing and permitted storage; record a request budget | Data + thesis team / M1–M3 |
| D06 | Proposed | Save at first explicit route selection for handoff, before redirect | Analyze returns an expiring analysis; handoff action creates/reuses a planned trip. Persist failure requires retry, never a false saved label | Lead + UX / before M2 implementation |
| D07 | Proposed | Trip status is planned/taken/not_taken | Yes → taken, No → not_taken, Dismiss → unchanged; store prompt dismissal separately. This reconciles §10 filters and §11 wording | UX / before M4 |
| D08 | Deferred | Final Smart Recommendation score | M2 uses a fixture-designated recommendation and explicit demo explanation; later compare fuel/time tradeoffs under an adviser-reviewed rule | Research / M5 |
| D09 | Deferred | ML model and training implementation | Establish a defensible baseline and evaluation protocol before model selection; no default algorithm treated as final | Research / M5 |
| D10 | Deferred | Interval method and its statistical meaning | Demo range is explicitly simulated. Define coverage target and empirical calibration later | Research / M5 |
| D11 | Deferred | Dataset collection, label validation and split design | Distinguish user reports from verified labels; examine trip-level measurement and leakage before selecting protocol | Research + adviser / before participant collection |
| D12 | Open | Participant consent, retention and deletion | School rules and study protocol determine handling of account/location/measurement data; collect no participant data during foundation | Thesis team / before M4 study |
| D13 | Open | Live price source, freshness policy and final ingestion | DOE South Luzon reports are feasible for manually reviewed Cavite city ranges. Decide timestamp normalization, freshness threshold, reviewer/update ownership and whether documented automated access exists; do not claim station or real-time pricing | Data + lead / M3 |
| D14 | Open | Maps content persistence vs saved history | Reconcile provider rules with immutable analysis needs; persist only permitted fields; select an alternative source or revise persistence design if necessary | Data + lead / before M3 live storage |
| D15 | Proposed | Fuel data can be unavailable | Missing grade/spec/baseline → route-only result with no numeric fuel estimate; missing usable price → fuel result without cost. Never substitute zero | Lead / M2 |
| D16 | Open | Thesis question, deadline and adviser rubric | Confirm whether contribution is prediction accuracy, recommendation quality, usability, or a combination; define deliverable dates | Thesis team / M1 and M5 |
| D17 | Proposed | Maps handoff is approximate | Include origin/destination and permitted waypoints when practical; tell user Maps may choose or update a route | UX + data / M2/M3 |
| D18 | Proposed | Authentication and deployment | Use maintained authentication and private per-user storage when stack is chosen; local fixtures may use documented test accounts. Hosting selection deferred | Lead / M1 |
| D19 | Proposed | Price location is the origin area initially | Make price location explicit in request/result. Do not imply destination or exact station pricing; later station choice is a separate scope decision | Lead + UX / before M2 |

## Dependency rules

- Foundation documentation is allowed while these entries remain open.
- M2 fixture workflow can proceed after confirming scope, stack and D06 behavior; it does not require resolution of D08–D11.
- M3 cannot claim live coverage until D05/D13 checks pass. D14 must be resolved before retaining provider content.
- M5 cannot claim predictive validity until D09–D11 and the research part of D16 have an agreed protocol and recorded results.
- A lack of measured labels blocks predictive-validity claims, not the UX prototype.
