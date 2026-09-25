# One-month ML critical path: Cavite thesis prototype

Planning baseline: 2026-09-12 to approximately 2026-10-12. Cavite is the initial deployment/study area; Philippine expansion is later. ML is required for the submitted prototype. Model family, final dataset, features, and interval method remain open today, but need early dated decisions rather than being deferred until the last milestone.

## Recovery status, 25 September

The September 15 data-route gate and the original September 19-25 training target were not met. The team inspected two chronological VED weeks and documented their limits, but has not accepted a label, split, baseline or final dataset and has not trained a model. The immediate recovery task is adviser review of `adviser-research-gate.md`: select the bounded claim/data track and freeze its measurement, split, metric and governance rules. The schedule below remains the original planning baseline, not a statement of completed work.

## September 13 progress

An actual first-week VED file is now downloaded and audited outside Git. See [sample audit](ml-data-audit.md) and `scripts/audit_ved.py`. Fuel-rate sparsity/zeros prevent calling it training-ready. The data gate is still open; next investigate label semantics and static-feature mapping. No model, split or final dataset was selected.

## Immediate decision gate: September 15

By September 15, produce an actual inspected labeled-data sample, a rights/access note, a data dictionary, counts of usable trips and distinct vehicles, the prediction-time feature mapping, and the advisor-facing claim boundary. Choose a training/evaluation route by this gate. A download link alone does not pass it. If unavailable, raise the deadline/scope conflict immediately while continuing the web workflow; do not wait until week four.

Candidate primary sources checked on September 12:

- As recorded on September 12, the authors' [Vehicle Energy Dataset repository](https://github.com/gsoh/VED) describes OBD-II time series from 383 personal cars in Ann Arbor, Michigan, including gasoline, hybrid and plug-in vehicles. It lists fuel rate in L/hr, timestamps, trip/vehicle IDs and static vehicle fields; the repository states Apache 2.0 licensing. At that planning point files had not yet been downloaded or audited. Two weeks have since been audited outside Git; see `ml-data-audit.md`, `ml-label-spec.md` and `ml-two-week-audit.md`. The dataset remains a candidate for an external measured-data experiment, not Cavite validation.
- [EPA/DOE fuel-economy downloads](https://www.fueleconomy.gov/feg/download.shtml) provide test-based vehicle fuel-economy data and downloadable files. These are potential rated-efficiency reference/benchmark data, not observed Cavite trip labels. Training a vehicle-rating model would answer a different question from predicting trip consumption.
- [NREL Fleet DNA](https://www.nrel.gov/transportation/fleettest-fleet-dna.html) focuses on commercial medium/heavy-duty fleets. Its vehicle-domain mismatch makes it a lower-priority candidate for this passenger-car deadline.

No suitable Cavite labeled dataset was verified in this bounded review. Do not present any candidate as selected or successfully ingested.

## Four-week plan

| Dates | ML critical path | Parallel application work | Exit evidence |
|---|---|---|---|
| Sep 12–18 | Resolve data gate by Sep 15; define target and unit; audit sample; freeze split plan; implement reproducible label extraction and a simple non-ML baseline | Cavite-scoped catalog/route/price feasibility; complete fixture journey and estimator interface | Dataset card; allowed use; feature availability table; train/validation/test membership manifest; reproducible baseline run |
| Sep 19–25 | Train one simple supervised candidate and one stronger candidate if time/data justify it; compare on development folds; integrate a versioned inference artifact | Live adapters where permitted, authentication/save/history; fixture/live separation | Real fitted model executes through app contract; baseline comparison; unsupported-input handling; no final-test tuning |
| Sep 26–Oct 2 | Freeze features/model; evaluate untouched holdout; inspect errors and missing-input behavior; run Cavite pilot only with approved protocol and feasible labels | End-to-end tests, failure states, source/price disclosure, Maps handoff | Holdout report with sample/group counts, error distribution, model card and domain limits; documented integration behavior |
| Oct 3–9 | Reproducibility rerun; finalize thesis tables and limitations; optional interval calibration only if adequate separate data/method exists | Demo rehearsal, browser/mobile checks, bug fixes; freeze feature scope | Rebuildable model+app; defense demo; honest claim matrix; completion checklist |
| Oct 10–12 | Submission buffer | Final package and rehearsal | Archived evidence and reproducible instructions |

Model suggestions above are an experiment budget, not selection of an algorithm. Prefer a small tabular pipeline over a large neural project unless inspected data and advisor requirements justify otherwise. Do not make nationwide support part of this month's acceptance criteria.

## Required data semantics

The target is consumed fuel in liters over an explicitly defined trip/window, with `tripId`, `vehicleGroupId`, start/end timestamps, measurement method, source/version, quality flags and units. A fuel-rate series can produce an integrated label only after validating units, cadence, gaps, engine-off handling and derivation; the numerical integration policy must be versioned. Do not infer measured liters from model predictions, a tank gauge, trip completion, or unrelated purchase receipts. Refills spanning several trips do not directly label each trip.

Keep two separate field groups:

1. **Prediction-time inputs:** planned route distance, any duration/traffic values actually available before departure and permitted for model use, and source-supported vehicle attributes. Every candidate feature must have a matching application field or an explicit unsupported-input response. Fuel brand/price stays outside the liters model.
2. **Measurement/evaluation fields:** actual duration, measured speed/engine signals, fuel rate, sensor metadata and actual distance. These can establish outcomes and quality but cannot silently become inputs to a pre-trip predictor. Training on actual average speed then supplying planned ETA at inference creates a distribution/measurement mismatch that must be evaluated and disclosed. If only post-trip features exist, restrict the experiment's claim or redesign the feature set; do not call it validated pre-trip prediction.

For local collection, approve a consistent measurement protocol and consent before participant data acquisition. Define what constitutes an accepted label and measurement uncertainty. A small local sample may support a feasibility pilot, not broad Cavite accuracy. Sample adequacy is a protocol decision based on independent groups and variability; do not promise an arbitrary count guarantees validity.

## Leakage and evaluation rules

Preserve an untouched test partition before preprocessing. Fit imputers, encoders, scaling and feature selection only on training folds, preferably within a pipeline. Group repeated observations so fragments of one trip cannot appear on both sides. These safeguards align with [scikit-learn leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html).

Choose the holdout to match the thesis claim: hold out vehicles for unseen-vehicle claims; hold out later trips for future trips on known vehicles; hold out geographic units if claiming geographic transfer. Use grouped/time-aware validation as appropriate rather than random telemetry-row splits. A temporal/group-aware custom split may be required; ordinary TimeSeriesSplit alone does not guarantee vehicle isolation. [Official cross-validation guide](https://scikit-learn.org/stable/modules/cross_validation.html)

Report trip MAE in liters, RMSE, signed bias, baseline comparison and errors by distance/vehicle group, plus sample and independent-group counts. Avoid percentage error as the sole metric for near-zero labels. Fix the model before final evaluation; report failure to beat the baseline honestly. A trained model can fulfill the ML implementation requirement without demonstrating superiority. Route-choice fuel savings need separate evidence: predicting several alternatives does not reveal the actual fuel of routes nobody drove.

If intervals are included, describe method, calibration partition and measured held-out coverage/width. An arbitrary percentage band is a heuristic, never a validated confidence interval. Interval uncertainty remains a near-term decision, not grounds to delay the fitted point-estimate ML deliverable.

## Honest fallback if Cavite labels are unavailable

Keep actual ML in the application: train/evaluate on a licensed inspected external dataset, integrate its fitted artifact, and label Cavite outputs experimental and not locally validated. Require a documented train-to-application feature mapping. Obtain advisor agreement on whether external-data evaluation plus Cavite application/usability testing satisfies the thesis claim. This is a proposed research-scope fallback, not an assertion of approval.

If no legitimate labeled data and usable input mapping are available at all, synthetic training can demonstrate pipeline mechanics only. It must be disclosed and cannot establish real-world fuel prediction. Since ML is required, a fixture-only final app is not completion; document the unmet requirement and seek an explicit scope/deadline decision rather than relabeling arithmetic or mocked outputs as ML.
