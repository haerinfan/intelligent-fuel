# Independent data-feasibility review

Reviewed 2026-09-12 for a school thesis prototype. This is a bounded documentation review, not a successful API integration, selected supplier list, or legal opinion. No credentials, billable requests, source datasets, or measurements were tested. Recommendations below are proposals for the lead to integrate against the workflow guide.

## Verified external facts and implications

| Area | Verified fact | Design implication / remaining uncertainty |
|---|---|---|
| Route alternatives | Google Compute Routes exposes `computeAlternativeRoutes`; it does not return alternatives for requests with intermediate waypoints. The response includes distance and duration. [API reference](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes) | Begin with one origin and destination. Accept one route when no alternative is returned; never manufacture alternatives or guarantee a fixed count. Local coverage and response quality remain untested. |
| Traffic | Google distinguishes traffic-unaware, traffic-aware, and traffic-aware-optimal calculation. Current-traffic options trade latency for route quality and use higher billing rates. [Traffic preferences](https://developers.google.com/maps/documentation/routes/config_trade_offs) | Keep traffic availability and calculation time explicit. Measure latency and request cost before choosing a preference; do not label traffic-unaware results live. |
| Storage and display | Google policy identifies place IDs as exempt from caching restrictions; most Routes content is restricted. Its guidance requires attribution and a Google Map when route results are displayed on a map. [Routes policies](https://developers.google.com/maps/documentation/routes/policies) | Gate persistent provider fields, including geometry and route metrics, on field-level retention review. Do not assume raw responses can become permanent thesis fixtures or training data. Separate user-owned inputs and permitted application results from provider content. Exact derived-result retention also requires checking applicable terms. |
| Navigation handoff | Maps URLs support origin, destination, travel mode, and optional waypoints. `dir_action=navigate` may instead show a route preview. Waypoint support varies by platform. [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) | Inference: these parameters cannot guarantee replay of an arbitrary selected polyline, and the documented URL interface offers no completion callback. Record a handoff request, never actual travel or completion. Explain that Maps may recalculate. Test desktop and mobile. |
| Philippine fuel prices | DOE has an energy-prices portal and periodic liquid-fuel monitoring publications, including retail-price material. [DOE prices](https://doe.gov.ph/prices), [DOE liquid fuels](https://doe.gov.ph/site/lfo/articles/group/liquid-fuels?category=Oil+Monitor&display_type=Card), [NCR archive](https://legacy.doe.gov.ph/downstream-oil?q=retail-pump-prices-metro-manila) | A dated, manually reviewed import is a candidate. This review did not verify a public real-time station API, complete city/brand/grade coverage, or permission for an automated ingestion pipeline. Do not convert area summaries into claimed station prices. |
| Vehicle specifications | Toyota Philippines publishes variant information and downloadable brochures containing engine/transmission specifications. [Vios page](https://www.toyota.com.ph/vios), [manufacturer brochure](https://content.toyota.com.ph/uploads/vehicles/4/001_4_1713246001901_000.pdf) | A small curated catalog is feasible in principle. Verify exact Philippine-market year, variant and transmission; a current page is not proof of a historical specification. Engine displacement does not establish trip fuel consumption. No fleet-wide vehicle API was verified. |

## Proposed thesis-sized scope

- Select one explicit study area after checking available participants and price coverage; do not silently equate Philippines with Metro Manila.
- Support a small, documented set of conventional gasoline/diesel passenger-car variants. Catalog size is a scope decision, not a verified data fact.
- Use one routing adapter, one price-import path, and one vehicle catalog. Keep a separately labeled synthetic fixture mode for deterministic demonstrations and failure tests.
- Keep manual price entry as a provenance-bearing fallback only if accepted by the lead requirements. A missing price must not become zero, an invented city average, or an unrelated brand's price.
- Display price amount, PHP/L unit, fuel grade, geographic basis, source, and effective/observed date. Distinguish the date imported from the date observed. Handle a report's range explicitly; do not silently choose its midpoint as an official quote.
- Keep liters independent of fuel-brand selection. Recompute peso cost using the selected compatible price; disclose that this excludes tolls and other costs unless scope explicitly expands.
- Enable saved analysis history using synthetic/owned data first. Live-provider history is gated on an explicit retention matrix; schemas alone do not authorize persistence.

## Deferred research decisions

No model family, training dataset, feature set, prediction interval method, traffic adjustment, or recommendation scoring formula is selected here. A baseline estimator may be proposed separately but must be labeled provisional, versioned, and evaluated. A working UI with synthetic liters is not evidence of predictive accuracy. Do not call an arbitrary percentage band a confidence or prediction interval.

Define the thesis question, fuel-measurement method, participant/vehicle scope, data collection protocol and held-out evaluation before fitting a model. Avoid leakage across repeated trips/vehicles when choosing splits. Record acquisition permissions and provider restrictions before proposing commercial routing outputs as training features. Manual completion is not measured fuel; distance and total expense alone may not identify trip liters reliably.

## Next validation experiments

1. Pick candidate study area; inspect one actual DOE publication for brand, grade, geography, period, range structure, missing entries and reuse conditions. Deliver a reviewed sample price record and mapping rules; do not fabricate records now.
2. Inspect two candidate vehicle variants from dated manufacturer evidence; identify whether year and fuel-economy inputs are actually supported. Deliver source-linked entries with unknown values retained as null.
3. With a configured provider account, run a small representative origin/destination set and record route counts, available traffic fields, request failures, latency and actual billed SKU. Account setup and paid requests are not yet performed.
4. Build a field-by-field retention matrix for the chosen provider and account terms. Decide allowed saved-trip fields, expiry, deletion and refresh behavior before live-history writes.
5. Test Maps handoff on desktop and mobile for current-location and remote origins. Confirm destination encoding, preview behavior and route differences without claiming completion detection.
6. Agree an advisor-reviewed measurement protocol and feasible sample before finalizing ML or accuracy targets. Document limits if the thesis can only evaluate workflow usability rather than prediction quality.

## Main risks

The critical risks are inadequate measured fuel labels, unsupported exact vehicle variants, price granularity mismatch, provider retention restrictions, and navigation diverging from the analyzed route. Each can be exposed early through the experiments above. None requires expanding the prototype into a nationwide vehicle database, live station-price aggregator, navigation engine, or microservice system.
