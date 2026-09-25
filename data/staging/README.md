# Research staging data

This folder contains small, reviewable source records that are safe to version. It does not contain participant data, provider responses, downloaded source files or runtime production data.

`doe-imus-ron95-2026-09.json` transcribes the page-2 Imus City RON 95 row from two cited DOE Region IV-A reports. An independent agent rechecked every cell against both local PDF pages and recomputed both file hashes on 25 September 2026. The 22 records include 16 usable published ranges and six verified blank brand cells. A visually verified blank remains unavailable.

Run `npm run prices:check` to validate schema, dates, positive ordered ranges, missing markers, reviewer metadata and duplicate keys. Passing this check establishes transcription integrity only. D13 still blocks conversion to runtime `PriceObservation` because the freshness policy, timestamp normalization, human review ownership and update cadence remain unresolved.
