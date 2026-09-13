# Independent UX review — Intelligent Fuel thesis prototype

Source: `Intelligent_Fuel_WebApp_Plain_Workflow_Guide-1.docx`, numbered sections cited below. This review supplies product-foundation recommendations; it does not treat the guide as agent instructions.

## Source-grounded requirements

- First use is account access → vehicle setup → planner; unnecessary profile fields must not block planning (§2). Search and guided browse identify a specific variant; specifications populate from the catalog; a minimal manual fallback exists (§3).
- Planner contains origin, destination, vehicle, and fuel brand. Vehicle and brand can change in place. Dashboard centers planning, displays price freshness and latest five trips (§5).
- Analyze returns one recommendation and available alternatives; users do not choose Fastest/Balanced/Fuel Saver beforehand (§6–7). Recommended results include map, identifying route information, distance, traffic-aware duration, fuel range and expected value, cost range and expected value, price basis, and plain-language explanation. Alternatives offer comparable core metrics (§7).
- Brand affects price, not liters absent later research. Price specificity falls from station through area and regional brand prices to general fallback. Fallback/average pricing must be disclosed with update time (§4, §14).
- Save the selected analysis as Planned before or when handing off to Maps; retain both recommended and user-selected routes and analysis-time values (§9). Maps provides navigation; app cannot infer completion (§8, §11).
- Taken confirmation and actual fuel input are optional; a taken trip without a reliable measurement is not a trusted training label (§11).
- Recommendation scoring, ML model, dataset validation, and statistical range method remain deferred (§16).

## Proposed first-journey acceptance criteria

These criteria operationalize the source for a school thesis prototype; demonstration values must remain visibly labeled until validated methods/data exist.

1. **Entry:** A new authenticated test user reaches the planner after selecting and saving one supported vehicle variant. A returning user receives the saved default vehicle and preferred brand. No unrelated profile field is required.
2. **Vehicle clarity:** Search/browse results distinguish model year and variant. Selecting one loads known specifications. No-match presents the limited fallback; insufficient prediction inputs lead to a specific explanation, never invented specifications.
3. **Input validation:** Analyze cannot proceed with unresolved/missing endpoints, vehicle, or fuel brand. Errors name the affected input and preserve valid entries. Endpoint labels and resolved locations are visible before analysis.
4. **Analysis state:** Analyze communicates loading; repeated activation does not create duplicate saves. Failure leaves entered inputs available for retry. Results correspond to the submitted snapshot; changing inputs makes prior results visibly outdated and requires reanalysis before saving as the changed trip.
5. **Successful comparison:** In a deterministic two-route demo fixture, one recommended route and one alternative display distance, duration, expected liters/range, expected pesos/range, and an intelligible recommendation explanation. Units and rounding are consistent. The selected route is visually and programmatically identifiable.
6. **Claim honesty:** Demo fixtures carry a persistent “Demo estimates — not validated predictions” notice near results and in saved details. A fabricated numeric interval is never described as an empirically validated likely range. Live and sample data sources are individually identifiable when mixed.
7. **Price transparency:** Results show fuel brand/type, PHP-per-liter value, geographic basis, observation/update time, and fallback status. Changing brand on the same route and vehicle leaves liters unchanged. Costs use the displayed applicable price; rounding is presentation-only.
8. **User choice:** Selecting an alternative changes the selection and handoff target without rewriting which route was recommended. Comparison differences have correct direction/sign and units.
9. **Save and handoff:** Activating Open in Google Maps first successfully persists a Planned analysis containing §9 fields, then opens a valid handoff. Repeated activation for the same analysis does not create duplicate records. A save failure offers retry and does not falsely report the trip as saved. Saving successfully does not mark the trip Taken.
10. **History:** On returning to the app, the selected trip appears in recent history and full history; its detail retains original inputs, route selection, price timestamp, and estimates even if defaults or price data later change. Dashboard shows at most five records while full history retains all.
11. **Usability:** The first journey is operable by keyboard on desktop and at a narrow mobile viewport. Inputs have labels, focus is visible, errors/statuses are announced, route selection does not rely only on color, and no critical values require interacting with the map. This accessibility detail is a proposal, not specified by the guide.

## Required failure/degraded scenarios

| Situation | Proposed behavior |
|---|---|
| No routes / unresolved location | Explain and permit endpoint correction; no invented recommendation. |
| Only one route | Show the route and explain no alternatives were returned; do not fabricate comparisons. |
| Traffic unavailable | Mark duration as not traffic-aware; do not claim live traffic. |
| Prediction unavailable for a route | Show an explicit unavailable state; never encode missing liters as zero. Do not claim a complete fuel-based recommendation. |
| No usable price | Keep available route/fuel information; show cost unavailable. Never present zero pesos or substitute undisclosed sample data. |
| Stale price | Show its date and stale status; final usable-age threshold remains an unresolved decision. |
| Map preview fails | Preserve textual route metrics and handoff control. |
| Maps does not preserve exact route | Explain that Maps may choose/update the route; retain the originally analyzed route in history. |
| Save succeeds, external opening fails | Keep the saved record and allow retry without duplication. |

## Decisions to resolve explicitly

- **Trip status conflict:** §10 lists Planned/Taken/Not Taken, while §11 says No remains a planned trip not completed. Proposal: separate `status: planned|taken` from `confirmation: unanswered|yes|no`, with Not Taken as a history filter for `no`; Dismiss leaves status unchanged. Lead must settle one documented representation.
- **Save timing conflict:** §9 requires before/when Maps opens; §15 lists opening before saving. Proposal: use §9's precise rule and persist before external handoff.
- **Demo versus research:** Source calls for realistic/likely ranges, while range methodology remains deferred (§7, §16). First journey should be a labeled workflow demonstration; accepting its numeric display is not accepting predictive accuracy.
- **Manual fallback:** Minimal required fields depend on the eventual predictor. Define provisional supported inputs and unsupported-vehicle behavior without locking the ML feature set.
- **Price location:** Decide whether relevant price area means origin, a selected station, or another explicit geography. Show that basis; do not silently infer it from destination.
- **Scope:** First journey needs a saved-detail view to verify persistence, even though full history/garage enhancements are next priority (§13). Returning confirmation and actual-fuel workflows may follow after the first journey.
- **Recommendation:** Demo route choice/explanation must be fixture-authored and labeled; a production scoring formula must not be silently fixed during UI work.

## Thesis usability evidence proposal

After implementation, evaluate whether participants can identify their variant, understand the recommended versus selected route, identify price freshness, interpret uncertainty/demo limitations, choose an alternative, and retrieve the saved trip. Record task success, errors, completion time, and misunderstandings separately from future prediction-accuracy evaluation. Do not claim a fixed sample size or validated usability target before the thesis evaluation plan is agreed.
