# Milestone backlog

Updated 22 September 2026: fixture journey implemented, targeting approximately 12 October submission. The original table records the initial planning baseline; the current progress table below supersedes its old statuses. Every task needs acceptance IDs and evidence; parallel work requires separate ownership.

## Current progress

| Item | Status | Evidence / remaining work |
|---|---|---|
| M1.1 Thesis scope | Partly complete | Cavite, one-month deadline and required ML confirmed; rubric/budget remain open |
| M1.2 Environment | Complete locally | Reproducible setup/check/dev, SQLite migrations, maintained auth and local-only server |
| M1.3 Data spike | Partly complete | Sample/static/paper/continuity audits and draft label specification complete; adviser choice, another week or local protocol, and local price publication remain open |
| M1.4 Fixture interfaces | Complete for M2 | Contract 0.2.0, manual unknowns/compatibility/integrity, lead ownership |
| M2.1–M2.4 Fixture journey | Implemented and checked | See acceptance-run.md; no live provider or ML claim |
| M2.5 Review | Independent static review complete | Three async races fixed with delayed-response tests; physical mobile and screen-reader review remain open |
| Collaboration setup | Synced, CI verified | CONTRIBUTING, PR template, dependency updates and Windows/Linux CI on GitHub; invite and branch-rule enforcement remain pending |
| Next research task | Adviser decision needed | Review ml-label-spec.md, then audit another VED week under the same draft or pivot to a consented local measurement protocol |

M3–M5 remain unimplemented. The completed demo does not satisfy the ML submission requirement by itself.

## Implementation gate

Before writing application code, the lead must document the chosen stack and runnable setup, establish a bounded fixture scope, resolve D06/D15/D19 for M2, and assign contract ownership. These are routine design decisions within a subsequent implementation request; this foundation task stops at documentation. Decisions about school constraints or adviser requirements require that information, rather than an invented answer. D08–D11 remain deferred while the fixture workflow is built.

| Item | Owner | Depends on | Deliverable and exit evidence | Status |
|---|---|---|---|---|
| M0.1 Source and requirements | Lead | Guide and user scope | Source preserved; FR/NFR requirements trace to source or proposal | Complete |
| M0.2 Independent reviews | UX + data | M0.1 context | UX and primary-source feasibility findings integrated | Complete |
| M0.3 Contracts and acceptance | Lead | M0.2 | Architecture, decisions, contracts, AC01–AC18 and cross-document review | Complete |
| M1.1 Scope and thesis constraints | Thesis team + lead | M0 | Record area, deadline, adviser rubric and budget in D02/D05/D16 | Not started |
| M1.2 Stack and environment | Lead | M0; available team constraints | Choose modular stack/auth/DB; add reproducible install/dev/check commands and test-account setup; no undocumented infrastructure | Not started |
| M1.3 Data spike plan | Data | M0.2 | Select candidate variants and inspect one actual price publication; document coverage, permission and unknowns | Not started |
| M1.4 Fixture and interface freeze | Lead + UX | M1.2 | Resolve D06/D15/D19, version interface, define synthetic success/failure fixtures and owners | Not started |
| M2.1 Account and garage | Backend + frontend | M1.4 | Authenticated test users; searchable/browsable garage; AC01–03 and AC15 | Not started |
| M2.2 Fixture analysis | Data/backend | M1.4 | Route/price/estimate fixtures, structured degradation, pure cost logic; AC04–06, AC12–13, AC16 | Not started |
| M2.3 Planner and results | UX/frontend | M1.4; integrates M2.1–2 | Responsive complete inputs/comparison flow; AC02–08, AC12–14, AC16 | Not started |
| M2.4 Save, history and handoff | Backend + frontend | M2.1–3 | Transactional idempotent save, snapshot details, latest-five/full history; AC09–11, AC17 | Not started |
| M2.5 Independent journey review | Reviewer + lead | M2.1–4 | Acceptance run evidence AC01–AC18; all material failures resolved | Not started |
| M3.1 Live provider feasibility | Data | M1.1, M1.3 | Representative route requests, actual coverage/latency/quota evidence, attribution and retention matrix; D05/D14 resolved | Not started |
| M3.2 Sourced catalog and pricing | Data/backend | M1.3; D03/D13 | Versioned evidence-backed records, grade compatibility, freshness and fallback behavior | Not started |
| M3.3 Live adapter integration | Backend + reviewer | M2.5, M3.1–2 | Partial-data handling, budget limits, permitted snapshots and real mobile/desktop handoff checks | Not started |
| M4.1 Return and history extensions | UX/backend | M2.5; D07 | Confirmation, history filters, optional measurement and explicit correction rules | Not started |
| M4.2 Study data handling | Thesis team + lead | D11/D12 and M4.1 | Agreed consent/retention/deletion and measurement provenance before real participant collection | Not started |
| M5.1 Research protocol | Research + adviser | D16, feasibility evidence | Resolve D08–D11 with justified methods, baseline, data rights and held-out evaluation design | Not started |
| M5.2 Evaluation and report | Research + reviewer | M5.1 and approved measured dataset | Reproducible experiments, limitations, error/coverage and usability results; no unsupported accuracy claims | Not started |

M3 source investigation can run beside M2 fixture implementation. M5 protocol design may start early; this schedule does not suggest delaying research planning until all screens are complete. Actual data collection depends on an agreed protocol and data handling. If the thesis requires a trained model, M2 alone is insufficient.

## First implementation task brief

After the foundation is reviewed and implementation requested: complete M1.2 and M1.4, recording the stack choice and setup, then create the smallest authenticated fixture journey. Delegate fixture adapters and UI work only after their shared types are fixed. Do not connect billable providers or select a final model merely to make the demo appear complete.

## Definition of done for a backlog item

The behavior matches named acceptance criteria; relevant checks actually ran; review findings are resolved or visibly recorded; documentation matches implementation; no fake data is presented as observed; no secrets or participant data enter the repository; evidence includes versions and limitations. A documentation item can be complete while its proposed behavior remains unimplemented.
