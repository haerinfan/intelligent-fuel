# Proposed retained-window fuel label specification 0.1

22 September 2026. Research design draft for adviser review. This does not select VED, approve a final label, or authorize model training. D08–D11 remain deferred.

## Intended claim boundary

The candidate target is **fuel consumed within a continuous, de-identified observation window**. It is not whole-trip fuel, because VED removes portions near trip starts and ends and applies geographic suppression. It cannot directly validate a Cavite door-to-door estimate.

Every candidate label must carry one provenance value:

- `oem_rate_integrated`: nonnegative OEM fuel-rate estimates already expressed as L/hr.
- `maf_derived_mass`: nonnegative MAF with an explicitly documented trim/AFR calculation; remains mass until a reviewed density conversion is applied.
- `load_derived_mass`: load/RPM/displacement-derived MAF followed by the same mass calculation. This lower-priority path has not been audited yet.

Never merge these provenances into an unlabeled target column. OEM-reported fuel rate is still an estimate, not certified tank measurement.

## Unit-checked calculations

For two adjacent samples `i` and `i+1` separated by `Δt_seconds`, trapezoidal integration of an OEM rate uses:

```text
liters_interval = ((rate_i_L_per_hr + rate_i+1_L_per_hr) / 2)
                  * (Δt_seconds / 3600)
```

The [VED paper's algorithm](https://arxiv.org/html/1905.02081#S2.SS3) defines:

```text
correction = (1 + STFT/100 + LTFT/100) / AFR
fuel_mass_rate_g_per_s = MAF_g_per_s * correction
```

That result has mass/time units. Converting it to L/hr would require:

```text
fuel_rate_L_per_hr = fuel_mass_rate_g_per_s * 3600 / fuel_density_g_per_L
```

`fuel_density_g_per_L` is deliberately unresolved. Fuel composition, temperature basis, the paper's suggested E10 AFR of 14.08, bank averaging, partial trim availability, and interpolation rules require adviser-reviewed choices and citations. Missing trims must not silently become zero.

## Continuity diagnostics

`scripts/audit_ved_windows.py` sorts observations chronologically within each vehicle/trip group, then tests maximum adjacent-sample gaps of 5, 10 and 30 seconds and minimum segment durations of 60, 300 and 600 seconds. These are sensitivity diagnostics, not accepted exclusions. Invalid channel values and excessive timestamp gaps split a segment. Any group containing an undated row is excluded from continuity results. Duplicate timestamps are counted and split, while source-order timestamp reversals are reported separately for source-quality review.

Strict `maf_bank1_trims` availability requires nonnegative MAF plus both short- and long-term bank-1 trims at every sample. This deliberately undercounts looser derivations allowed by the paper and prevents an unstated missing-trim assumption.

Selected first-week findings:

| Candidate channel | Powertrain | Maximum gap | ≥5-minute segments | Vehicles represented | ≥10-minute segments | Vehicles represented |
|---|---|---:|---:|---:|---:|---:|
| OEM raw rate | PHEV | 5 s | 10 | 3 | 2 | 2 |
| MAF + both bank-1 trims | ICE | 5 s | 29 | 17 | 12 | 9 |
| MAF + both bank-1 trims | HEV | 5 s | 5 | 5 | 0 | 0 |
| MAF only | ICE | 5 s | 273 | 103 | 113 | 62 |
| MAF only | HEV | 5 s | 32 | 24 | 5 | 5 |

At the permissive 30-second gap, eligible counts rise substantially, especially for HEV. This sensitivity shows that a continuity threshold materially changes the research population. The strict five-second results are small and do not justify fitting a production claim.

## Prediction-time feature boundary

Allowed pre-trip candidates must exist before departure: selected vehicle attributes that survive source validation, planned distance, planned duration, route class summaries, departure-time category and forecast/context data whose historical availability can be reproduced.

Realized speed, RPM, MAF, load, fuel trims, actual duration and post-trip traffic are label construction or data-quality evidence. They cannot be predictors for a pre-trip estimate. Vehicle IDs, trip IDs and coordinates are grouping inputs only and must not become model features.

## Split and evaluation gates

Before fitting even a baseline:

1. Adviser accepts the retained-window claim or selects a different dataset/measurement plan.
2. The derivation document resolves density, AFR, trim-bank, interpolation, zero-rate and plausible-bound rules.
3. At least one additional week is audited with the same audit version and settings. Each input's own SHA-256 hash and eligible vehicle/window counts are reported after all exclusions.
4. All windows from one original vehicle/trip stay within one split. A vehicle-held-out evaluation is required for claims about unseen vehicles; a later-time holdout is required for temporal claims.
5. Preprocessing is fit only on training partitions. A simple non-ML calculation and a simple regression baseline are frozen before comparing more complex models.
6. Metrics are declared before results. Report MAE in liters for the retained window, a scale-aware secondary metric, coverage, sample/vehicle counts and subgroup errors. Do not label a simulated range as a prediction interval.
7. External VED performance is reported as external feasibility evidence, never as Philippine or Cavite accuracy.

## Current decision

Do not train yet. The next decision is whether to audit additional VED weeks under this draft or pivot to a locally measured, consented fuel protocol. That choice belongs in D11 with adviser input. Model family, scoring rule and interval method remain open.
