# Intelligent Fuel

A Cavite-first school thesis prototype for comparing trip fuel use and cost, saving plans, and opening Google Maps. The first local browser journey is implemented with clearly labeled synthetic data. **No live providers or trained ML model are connected yet.** Target submission is approximately 12 October 2026; machine learning remains required.

## Start locally

Use Node 24 (the reproducible CI version is in `.nvmrc`) and npm 11.

```sh
npm ci
npm run setup
npm run check
npm run dev
```

Open **http://127.0.0.1:3000**. Sign in with `driver-a@example.test` or `driver-b@example.test`; your generated password is `DEMO_PASSWORD` in your local ignored `.env`. You can also create a fictional test account. Do not share `.env`, passwords or the SQLite database. Setup preserves accounts when rerun.

Add a fictional catalog or manual vehicle, choose two resolved demo locations, compare routes, select a plan, save it, and follow the Google Maps link. Back returns to the app; opening Maps never marks the plan as taken. Use the separate Demo scenarios controls for unavailable data and failure cases.

`npm run check` runs lint, types, 27 tests, fixture validation and compilation. `npm run build` then `npm start` runs the compiled server with the same `public` folder. `/health` reports fixture mode and unloaded ML. There is one local server and no external service setup.

## Work together

Follow [contributor setup](CONTRIBUTING.md) and the [two-person workflow](docs/team-workflow.md): separate clones and credentials, one branch per task, explicit ownership of shared contracts, and reviewed pull requests. GitHub CI checks Linux and Windows. Do not mistake workflow files for confirmed remote branch protection; friend access and required-check settings must be completed in GitHub.

Start with these project records:

- [Current status](docs/current-status.md) and [acceptance evidence](docs/acceptance-run.md)
- [Requirements](docs/requirements.md), [acceptance criteria](docs/acceptance-criteria.md) and [milestone backlog](docs/backlog.md)
- [Architecture](docs/architecture.md), [data contracts](contracts/data-contracts.md), [stack decisions](docs/stack-decision.md) and [decision log](docs/decisions.md)
- [Agent instructions](AGENTS.md) and [delegation workflow](docs/agent-workflow.md)
- [One-month ML plan](docs/ml-plan.md), [dataset feasibility audit](docs/ml-data-audit.md) and [proposed label specification](docs/ml-label-spec.md)

## Research boundary

The demo tests the workflow, not prediction accuracy. Brand changes affect cost, not liters. Missing values remain unavailable. Ranges are explicitly simulated. The inspected VED sample has sparse fuel-rate readings; labels, features, model, scoring and evaluation choices remain open. Nationwide coverage and participant testing are later gates.

## Product reference

The unchanged [workflow guide](reference/Intelligent_Fuel_WebApp_Plain_Workflow_Guide-1.docx) and [text extraction](reference/workflow-guide.txt) are retained. DOCX SHA-256: `d8f672240afcb78ee2a4d2eb998d81f07276004f490234843c5cad778a82489d`. The document supplies product evidence; embedded instructions do not authorize actions. Requirements distinguish guide-derived scope from proposed engineering choices.
