# Decision and uncertainty log

Only D01 is confirmed by the user. Other entries are proposed defaults, unresolved choices or intentionally deferred research. A proposal can guide a reversible prototype design but is not adviser approval. To resolve an entry, record date, evidence, alternatives and consequence; do not erase its history.

| ID | Status | Decision or question | Proposed next step / evidence | Owner / needed by |
|---|---|---|---|---|
| D01 | Confirmed | School thesis prototype | User clarification on 2026-09-12 | Lead / now |
| D02 | Open | Target city/corridor and vehicle classes | Select one area with inspectable route and price coverage; do not infer location from workspace timezone | Thesis team / M1 |
| D03 | Open | Initial vehicles and source permission | Curate a small set of verified Philippine variants; record missing specs and source dates. Final count stays deferred | Data / M1 seed plan, M3 coverage |
| D04 | Proposed | One modular web application | Prefer shared typed boundaries and relational persistence; exact framework and hosting await constraints | Lead / M1 |
| D05 | Open | Provider access, school budget and quotas | Test routing alternatives/traffic in target area, inspect billing and permitted storage; record a request budget | Data + thesis team / M1–M3 |
| D06 | Proposed | Save at first explicit route selection for handoff, before redirect | Analyze returns an expiring analysis; handoff action creates/reuses a planned trip. Persist failure requires retry, never a false saved label | Lead + UX / before M2 implementation |
| D07 | Proposed | Trip status is planned/taken/not_taken | Yes → taken, No → not_taken, Dismiss → unchanged; store prompt dismissal separately. This reconciles §10 filters and §11 wording | UX / before M4 |
| D08 | Deferred | Final Smart Recommendation score | M2 uses a fixture-designated recommendation and explicit demo explanation; later compare fuel/time tradeoffs under an adviser-reviewed rule | Research / M5 |
| D09 | Deferred | ML model and training implementation | Establish a defensible baseline and evaluation protocol before model selection; no default algorithm treated as final | Research / M5 |
| D10 | Deferred | Interval method and its statistical meaning | Demo range is explicitly simulated. Define coverage target and empirical calibration later | Research / M5 |
| D11 | Deferred | Dataset collection, label validation and split design | Distinguish user reports from verified labels; examine trip-level measurement and leakage before selecting protocol | Research + adviser / before participant collection |
| D12 | Open | Participant consent, retention and deletion | School rules and study protocol determine handling of account/location/measurement data; collect no participant data during foundation | Thesis team / before M4 study |
| D13 | Open | Live price source, freshness policy and final ingestion | Verify usable brand/type/grade/location observations; set expiry by source. Manual curated snapshots are a possible prototype path, not a current-price API claim | Data / M3 |
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
