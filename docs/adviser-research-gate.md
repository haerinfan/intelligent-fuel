# Adviser research gate: ML claim and measurement protocol

25 September 2026. This packet turns the current evidence into a short adviser decision. It does not approve participant collection, select a final model, or convert the fixture journey into a validated prediction system. D08-D12 and the research part of D16 remain open until the choices below are recorded.

## Decision requested

Choose one research track and narrow the thesis claim before any model is fitted:

| Track | Intended evidence | Claim boundary | Main unresolved gate |
|---|---|---|---|
| A. External retained windows | Use the audited VED windows under an accepted derivation and grouped split | Fuel consumed inside de-identified observation windows in the external dataset | Accept the window target; resolve AFR, density, trim, interpolation and continuity rules |
| B. Local measured trips | Collect consented trips with an approved measurement instrument and a frozen pre-trip feature set | Pre-trip fuel prediction for the sampled Cavite routes and vehicles only | Approve measurement validity, consent, retention, sample design and leakage-safe split |
| C. External ML plus local usability | Fit and evaluate on an inspected licensed external dataset; test only the Cavite workflow locally | External predictive results plus local prototype usability; no Cavite accuracy claim | Confirm this satisfies the thesis rubric, map external features to prediction-time app inputs and keep the domain gap explicit |

The adviser may request another track, but its target, evidence and permitted claim must be written with the same precision. A fixture-only demonstration cannot satisfy the required ML component.

## Questions to record with the adviser

1. Is the thesis contribution prediction accuracy, route recommendation quality, prototype usability, or a stated combination?
2. Which track above is acceptable for the October submission, and what wording may appear in the title, objectives and conclusions?
3. What is the accepted fuel outcome and unit: retained-window liters, whole-trip liters, or another directly measured target?
4. Which measurement or derivation method is accepted, and what uncertainty or quality evidence must accompany it?
5. Which generalization claim matters: future trips from known vehicles, unseen vehicles, unseen routes/areas, or only the observed sample?
6. What participant-consent, retention, deletion and school-review steps are required before local collection?
7. Is a point estimate sufficient? If an interval is required, what coverage claim and separate calibration evidence are expected?

## Draft local measurement protocol for Track B

This section is a proposal for review, not authority to recruit or collect data.

### Unit of observation

One record represents one completed, explicitly bounded vehicle journey. The start and end rule, pauses, engine-off periods, route deviations and aborted runs must be defined before the pilot. Repeated readings from one journey are label-construction data, not independent training examples.

### Measurement hierarchy

The adviser must approve one primary instrument and its validation procedure. A candidate should directly support fuel consumed over the bounded journey, preserve units and timestamps, and produce a device/source identifier and quality flags. Dashboard estimates, user guesses, trip-completion clicks, purchase receipts spanning several trips and predictions from the app are not verified fuel labels. If an OBD fuel-rate signal is used, its origin, cadence, gap handling and integration rule require the same review as the external-data derivation.

### Freeze before departure

Only information available when the user requests a plan may enter the prediction feature set: source-supported vehicle attributes, planned route distance and duration, permitted route/context summaries, and a reproducible departure-time or forecast context. Realized speed, RPM, MAF, fuel trims, actual duration, actual distance and post-trip traffic remain measurement or quality fields. Fuel brand and price stay outside the liters model and affect peso cost only.

### Minimum record contract

| Field group | Required content |
|---|---|
| Identity and grouping | Pseudonymous journey ID, vehicle group ID, route/corridor group, collection batch; no direct participant identity in the model table |
| Time boundary | Start/end timestamps, timezone, explicit start/end rule and interruption flags |
| Planned inputs | The exact pre-trip feature snapshot, source/version and capture time used by the app |
| Outcome | Fuel amount and unit, measurement method/version, instrument/source ID and raw-to-label derivation version |
| Quality | Cadence/gaps, missingness, invalid values, route deviation, instrument failure and reviewer disposition |
| Governance | Consent version, collection purpose, retention class and deletion link kept outside the model features |

### Run procedure

1. Confirm that consent and the approved instrument are in place; assign pseudonymous journey and vehicle groups.
2. Capture and freeze the pre-trip input snapshot before departure.
3. Start the measurement boundary using the approved rule; record instrument status without exposing credentials or direct identity.
4. End the boundary using the approved rule and preserve raw evidence outside Git under the approved retention controls.
5. Derive the label with a versioned script, producing quality flags rather than silently repairing gaps or substituting zero.
6. Review the record against frozen inclusion/exclusion rules. Preserve excluded counts and reasons.
7. Keep every record from a journey and every derived window in the same evaluation partition.

### Pilot gate before model fitting

Before recruitment, confirm that the proposed equipment, compatible vehicles, collection dates and trained operators are actually available. Document the instrument's channel semantics, units, clock alignment, sampling cadence, calibration/reference evidence and known uncertainty. Confirm that route/context providers permit the planned retained fields and research use.

The pilot must then demonstrate that the instrument produces usable labels, the planned features are available at prediction time, grouping keys prevent leakage, and the team can repeat the procedure consistently. Report attempted/usable journeys, independent vehicles, route groups, label missingness, measurement failures and observed variability. A reviewer must accept or reject labels using the frozen quality rules without using model errors to choose exclusions. The adviser must then set or accept sample-adequacy criteria; this document does not invent a trip count that guarantees validity.

## Evaluation choices to freeze after the track decision

- For any external-data track, document every training feature's source and map it to an input genuinely available when the application predicts. If the mapping is unavailable or materially different, remove the feature or narrow the claim before fitting.
- Hold out vehicles for an unseen-vehicle claim, later journeys for a future-known-vehicle claim, and geographic groups for a transfer claim. Random telemetry-row splits are not acceptable.
- Keep an untouched final test partition and fit preprocessing only on training data.
- Freeze a transparent non-ML calculation and a simple regression baseline before comparing stronger candidates. This does not select the final model.
- Predeclare trip/window MAE in liters, signed bias, a scale-aware secondary metric, coverage, independent-group counts and subgroup errors.
- Report failure to beat the baseline. A fitted model can demonstrate the required ML implementation without proving superiority or Cavite-wide validity.
- Treat intervals as optional until a method, calibration partition, coverage target and width reporting are approved. The current simulated range is not a prediction interval.

## Collection and governance gate

No participant collection begins until the thesis team records the school/adviser requirement, consent text/version, data controller, storage location, access list, retention period, deletion process and incident contact. Raw location and sensor traces stay out of Git. The application continues to use fictional local accounts until this gate passes.

## Adviser acceptance record

### Gate 1: authorize a bounded feasibility pilot

This gate is needed only when the selected track includes local measurement or local usability participants. It must pass before recruitment or pilot collection:

- [ ] Accepted pilot purpose, population, study area and allowed data
- [ ] Consent, retention, deletion, access and school-review requirements
- [ ] For measurement: equipment, compatible vehicles, collection dates and operators are feasible
- [ ] For usability: the approved session script and data captured are defined
- [ ] Named pilot owner and stop criteria

External-only inspection may continue without participant recruitment, subject to dataset access, provenance, license and derivation checks.

### Gate 2: freeze the research protocol before fitting

This gate passes only when the following are dated and attributable in the thesis record:

- [ ] Accepted research track and exact permitted claim
- [ ] Accepted outcome, unit and measurement/derivation method
- [ ] Accepted population, study area and generalization boundary
- [ ] Accepted grouping and holdout strategy
- [ ] Accepted baseline and predeclared metrics
- [ ] Decision on whether an interval is required
- [ ] External tracks: dataset access, provenance, license, derivation rules and prediction-time feature mapping are accepted
- [ ] Local measurement: pilot quality and sample-adequacy rule are accepted
- [ ] Local usability: governance approval is recorded, without treating usability outcomes as fuel labels
- [ ] Named owner and date for freezing the protocol before fitting

Until Gate 1 passes, the team must not recruit or collect from participants. Until Gate 2 passes, it may improve the fixture application, reproduce permitted audits and prepare collection tools, but must not describe a candidate label as validated, tune a final model or report prediction accuracy.
