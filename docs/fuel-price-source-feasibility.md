# Cavite fuel-price source feasibility

Reviewed 24 September 2026. This is a source and contract spike for the thesis prototype. It does not connect a live price provider, establish a guaranteed update schedule, or make the application an official DOE service.

## Finding

The Philippine Department of Energy (DOE) publishes weekly South Luzon liquid-fuel monitoring reports that cover Cavite. The current archive is a workable source for a **manually reviewed, dated city-level reference import**. It is not evidence of a public real-time station API.

- [DOE retail-pump-price index](https://doe.gov.ph/data-and-prices/liquid-fuels/retail-pump-prices) separates NCR, North Luzon, South Luzon, Visayas and Mindanao reports.
- [DOE South Luzon archive](https://doe.gov.ph/data-and-prices/liquid-fuels/retail-pump-prices/south-luzon-pump-prices) lists weekly periods and historical reports. Its current 2026 entries are consolidated Region IV-A files; older entries sometimes link separate Cavite files.
- The DOE site footer says content is public domain unless otherwise stated. This supports source citation and research review, but no API, automated-access policy, guaranteed service level or endorsement was found. Check each attachment for a contrary notice before redistributing it.

## Files inspected

| Report | Monitoring dates inside report | Cavite coverage | Local audit hash (SHA-256) |
|---|---|---|---|
| [Region IV-A, 15-21 September 2026](https://d24qbtp4vooyzi.cloudfront.net/api/media/file/Region%20IV-A%20CALABARZON%2015-21%20Sep%202026.pdf?prefix=dev/media) | 15-17 September 2026 | Bacoor, Cavite City, Dasmarinas, General Trias, Imus, Tagaytay and Trece Martires | `29ffaa09094d4768bab2d01acf017d523b529f7daf9b2e22971415565a7c4ed7` |
| [Region IV-A, 8-14 September 2026](https://d24qbtp4vooyzi.cloudfront.net/api/media/file/region%20IV-A%208%20TO%2014.pdf?prefix=dev/media) | 8-10 September 2026 | Same seven Cavite cities in the inspected table | `4906625938a1cd5ff6622b2207adca77793358cdf8175d2801fe185a8ff3e292` |

The report period and monitoring dates differ, so both must be retained. Retrieval date is also separate. The audit copies and rendered pages remain outside Git.

## Fields and limitations

Each city table includes product rows for RON 100, RON 97, RON 95, RON 91, diesel, diesel plus and kerosene. Columns cover Petron, Shell, Caltex, Phoenix, Total, Unioil, Seaoil, Flying V, PTT and independent outlets, followed by an overall range and a common price. A brand cell may contain a lower/upper range or be blank. Some columns are marked `No LFRO`.

The files do not provide station names, addresses, coordinates, per-station observations, an explicit sample count or a machine-readable schema. PDF text extraction can reorder table labels, so any initial import needs visual review and a page reference. These reports can support a city reference such as “DOE monitored Imus City range”; they cannot support “current price at this station.”

Zero ranges occur beside products with no visible quote. For this project, `0.00-0.00`, blank, `None` and `No LFRO` are unavailable markers. They must never become a zero-peso price. This is a conservative adapter rule pending DOE clarification, not a claim about DOE's internal coding.

## Visually checked example: Imus City, RON 95

| Field | 8-14 September report | 15-21 September report |
|---|---:|---:|
| Monitoring dates | 8-10 September 2026 | 15-17 September 2026 |
| Petron | PHP 76.70-80.50/L | PHP 82.40-83.70/L |
| Shell | PHP 85.30-87.00/L | PHP 91.90/L |
| Caltex | PHP 82.40/L | PHP 88.10/L |
| Unioil | PHP 79.40-82.60/L | PHP 87.10-88.10/L |
| Seaoil | PHP 85.28/L | PHP 90.96/L |
| Flying V | PHP 77.39-80.47/L | PHP 80.28-85.18/L |
| Independent | PHP 76.10-78.90/L | PHP 80.70-84.50/L |
| Overall range | PHP 76.10-87.00/L | PHP 80.28-91.90/L |
| Common price | unavailable | unavailable |

Phoenix, Total and PTT are blank for this row in both inspected reports. The example preserves published ranges and does not invent a midpoint. A brand-specific row is eligible only when that exact brand cell is populated; the overall range is a disclosed general fallback.

## Draft intake contract

The external document needs a staging record before it can become the current `PriceObservation`. This avoids inventing a timestamp when DOE supplies only dates.

```text
SourcePriceRecord
  sourceName: "Philippine Department of Energy"
  sourceUrl: string
  sourceFileSha256: string
  sourcePage: positive integer
  reportPeriodStart: YYYY-MM-DD
  reportPeriodEnd: YYYY-MM-DD
  monitoredFromDate: YYYY-MM-DD
  monitoredThroughDate: YYYY-MM-DD
  retrievedAt: timestamp
  province: string
  cityMunicipality: string
  brandId: string | null
  fuelType: gasoline | diesel
  gradeId: string
  lowerPhpPerLiter: positive decimal | null
  upperPhpPerLiter: positive decimal | null
  commonPhpPerLiter: positive decimal | null
  sourceMarker: null | blank | zero_range | none | no_lfro
  reviewStatus: pending | visually_verified | rejected
  reviewedBy: string | null
  reviewedAt: timestamp | null
```

Normalization into `PriceObservation` is allowed only for `visually_verified` records with a usable positive range. The final `observedAt` timestamp and freshness calculation remain blocked on D13 because the publication gives a monitoring interval rather than a time of day. `brandId=null` means the overall city range and must be labeled general fallback. A populated brand cell may produce a brand-matched range, never a point quote unless its lower and upper values are equal.

## Prototype acceptance checks

The first curated DOE import is complete only when:

1. Source URL, file hash, page, report period, monitoring dates and retrieval time are recorded.
2. A second reviewer compares every imported value with the rendered PDF table.
3. Missing markers remain unavailable, and no zero price enters cost arithmetic.
4. Brand, grade and geography matching are exact; an overall range is visibly a city-level fallback.
5. Ranges remain ranges through analysis and saved history.
6. The UI names DOE, city, monitoring dates, retrieval date and source mode without implying a station quote or live feed.
7. A replacement report creates new immutable observations; saved plans keep their original permitted snapshot.

## Decision boundary

This spike completes the “inspect one actual price publication” part of M1.3. D13 remains open for adviser/lead approval of the source, freshness policy, timestamp normalization, review ownership and update cadence. A live or automated adapter also needs a documented access policy and failure monitoring. The ML label, model, split and evaluation decisions remain deferred and independent of this price source.
