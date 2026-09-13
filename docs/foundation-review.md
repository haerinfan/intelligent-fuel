# Foundation integration review

Prepared 2026-09-12. The lead integrated two independent reviews: [UX](ux-review.md) and [data feasibility](data-feasibility.md). They are supporting analysis; when a proposed representation differs, the lead's decision log and shared contracts govern the proposed implementation.

## Findings integrated

| Finding | Integrated treatment |
|---|---|
| Source mixes planned/not-taken wording | D07 proposes three explicit statuses, with dismissal separate. This intentionally differs from the UX review's alternative representation and remains a proposal |
| Final flow lists save after Maps, while §9 says before/when | D06 and AC09 use successful persistence before external handoff |
| UI can suggest false predictive certainty | FR19, contract provenance and AC16 separate fixtures, unvalidated estimates and validated research |
| Missing price or vehicle data can create false zero estimates | D15, per-field unavailable states and AC12 require explicit absence |
| Alternatives and traffic are not guaranteed | Routing contract and AC13 handle zero/one route and unavailable traffic |
| Provider restrictions can conflict with permanent history | D14 and the persistence permission contract gate all retained provider and derived fields |
| Brand alone does not identify a usable quote | Contracts match type/grade/location, retain observed versus retrieved time and expose source ranges |
| Relevant price area was ambiguous | D19 explicitly proposes origin-area pricing and requires that basis in the result |
| Maps can diverge from selected route | D17 and acceptance criteria require disclosure and prohibit completion inference |
| Save retry and stale responses can corrupt history | Contract defines idempotency, conflicting selection, expiry and input invalidation; AC08–10/17 verify them |
| Final reviewer found price IDs insufficient for immutable history | Added embedded SelectedPriceSnapshot to analysis and trip, including price observation, freshness policy and selection policy versions |
| Final reviewer found manual fallback acceptance coverage incomplete | AC01 now explicitly checks no-match discovery, manual submission/save and unknown specification handling |
| Available estimates needed precise numeric semantics | Fuel/CostEstimate status enums and minimum available numeric content are explicit; price ID can be null when unavailable |

## Verification scope

Foundation checks cover local document links, required files, unique requirement/acceptance IDs, cross-referenced IDs, unchanged source SHA-256 and deterministic example arithmetic. No application tests, live API calls, model training, participant recruitment or performance measurements were performed. AC01–AC18 remain not run.

Source feasibility is a primary-documentation review, not proof of access, complete data coverage or permission under a future provider account. The next milestone must test those assumptions with bounded samples and actual account terms.

## Remaining limits

The team still needs to supply school deadline/rubric, target study area, budget and research question. Stack selection and the proposed save/status/pricing policies need to be recorded as implementation decisions when that phase begins. ML model, recommendation scoring, interval method and dataset protocol are intentionally deferred. The absence of those decisions does not prevent a clearly labeled fixture demonstration, but does prevent claims that the prototype has validated fuel accuracy.
