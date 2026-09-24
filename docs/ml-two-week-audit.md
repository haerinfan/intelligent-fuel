# Two-week VED continuity and overlap audit

24 September 2026. This is an aggregate feasibility update using the unchanged diagnostic settings in `ml-label-spec.md`. It does not select VED, approve a fuel-label derivation, choose a continuity threshold, or authorize training.

## Reproducible inputs

The second chronological member of the existing VED Part 1 archive was extracted outside Git. Raw CSVs and generated JSON reports remain in the ignored local work folder.

| Input | SHA-256 |
|---|---|
| `VED_171101_week.csv` | `5846f9ffa1d66bfffae4b16f0983bd88139e630017b98f219650923fd2101aa8` |
| `VED_171108_week.csv` | `fdc4782568be21fb33d7970a80ffc87a6eca2da234bb38d86fe6fbe7586ed680` |
| `VED_Static_Data_ICE_HEV.xlsx` | `addb23d937ef7d943620755f478cc5a24316a7d61dee232ffbfd9b6e50986dae` |
| `VED_Static_Data_PHEV_EV.xlsx` | `e0f2b4d7a360074c17fd00068d8d8bf898f0e650f0cdda43c7e10883f6bf9340` |

Run the same audits for each week, then compare them:

```text
python scripts/audit_ved.py WEEK.csv
python scripts/audit_ved_static.py WEEK.csv ICE_HEV.xlsx PHEV_EV.xlsx
python scripts/audit_ved_windows.py WEEK.csv ICE_HEV.xlsx PHEV_EV.xlsx
python scripts/compare_ved_weeks.py WEEK1.csv WEEK2.csv ICE_HEV.xlsx PHEV_EV.xlsx
```

The comparison emits hashes and aggregate counts only. Vehicle and trip identifiers are retained in memory for grouping and overlap, then discarded.

## Basic availability

| Measure | Week of 1 Nov | Week of 8 Nov |
|---|---:|---:|
| Rows | 489,414 | 535,198 |
| Vehicles | 258 | 246 |
| Vehicle-trip groups | 854 | 836 |
| Nonnegative OEM fuel-rate rows | 16,073 | 18,433 |
| Zero OEM fuel-rate rows | 13,958 | 12,396 |
| Vehicles with a positive OEM fuel rate | 3 | 5 |

All nonnegative OEM fuel-rate rows in both audited weeks belong to PHEVs. ICE, HEV and EV retain no direct OEM-rate coverage in these samples.

## Strict continuity comparison

The strict diagnostic requires samples separated by at most five seconds and a segment lasting at least five minutes. Counts are segments, with distinct represented vehicles shown in parentheses.

| Candidate channel | Powertrain | Week of 1 Nov | Week of 8 Nov |
|---|---|---:|---:|
| OEM raw rate | PHEV | 10 (3) | 10 (4) |
| MAF + both bank-1 trims | ICE | 29 (17) | 194 (87) |
| MAF + both bank-1 trims | HEV | 5 (5) | 51 (31) |
| MAF only | ICE | 273 (103) | 246 (101) |
| MAF only | HEV | 32 (24) | 61 (36) |
| MAF only | PHEV | 12 (7) | 41 (10) |

The large week-to-week change in trim-complete coverage shows that one week was not representative enough to freeze a derivation rule. It does not prove that trim-complete windows are valid fuel labels.

## Repeated-vehicle boundary

The two weeks contain 307 unique vehicles in total, with 197 appearing in both weeks. By powertrain, the shared counts are 129 ICE, 50 HEV, 16 PHEV and 2 EV. Exact vehicle-trip group keys do not repeat, but the vehicles do.

At the strict threshold, 13 ICE vehicles have trim-complete five-minute windows in both weeks; the union is 91 vehicles. Two HEV vehicles qualify in both weeks; the union is 34. Two PHEVs have qualifying OEM-rate windows in both weeks; the union is 5.

Windows from repeated vehicles are correlated evidence. An evaluation claiming performance on unseen vehicles must keep all windows from one vehicle in the same partition. A temporal claim instead needs a later-time holdout with repeated-vehicle effects reported; adding weeks does not create independent vehicle samples.

## Resulting gate

The additional-week audit gate is complete. The evidence strengthens two limitations:

- Direct OEM-rate feasibility remains PHEV-only and very small at the vehicle level.
- Derived ICE/HEV feasibility is sensitive to week, channel availability, continuity and still-unresolved AFR, density, trim-bank and interpolation choices.

D08–D11 remain deferred. The adviser still needs to accept the retained-window claim and derivation protocol or direct a pivot to consented local measurement. No model should be trained from these reports alone, and none of these results measures Cavite or Philippine accuracy.
