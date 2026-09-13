# Agent workflow

Use one lead to integrate independent work. These role briefs work through explicit delegation and AGENTS.md; no custom model configuration or extra plugin is required. The roles are development collaborators, not components of the web application.

## Ownership

| Role | Reads | Owns when assigned | Returns |
|---|---|---|---|
| Lead/integrator | All foundation docs | Shared contracts, architecture, decisions, backlog and integration | Reconciled decisions, checks and next bounded task |
| UX/frontend | Guide, requirements, contracts, acceptance criteria | Assigned screen/component files or a UX review document | Interaction behavior, accessibility evidence, unresolved choices |
| Data/backend | Guide, contracts, feasibility review | Assigned provider/data modules or research review document | Primary sources, coverage checks, validation and limitations |
| Reviewer | Acceptance criteria, implementation diff | Review report; fixes only when separately assigned | Reproducible failures and missing evidence, ranked by impact |

Initially use the lead plus one UX and one data specialist. Activate a reviewer after integration; avoid continuous duplicate reviews of unchanged work. Assign one owner for schema migrations and shared types.

## Delegation template

> Complete backlog item [ID]. Read [specific files]. You own [files or directories]. Do not edit [shared files]; propose contract changes to the lead. Deliver [bounded artifact]. Verify [acceptance IDs]. Distinguish source facts, assumptions and proposals. Return files changed, checks and evidence, unresolved issues and any dependency blocking completion. Do not perform unrelated work.

## Suggested first assignments

- UX: implement the fixture planner/results interaction only after AC01–AC14 and shared contracts are accepted for M2. Include loading, empty, unavailable and save-error states.
- Data: implement fixture route/price/estimate adapters against the agreed contract. All fixtures remain explicitly synthetic. No invented manufacturer specifications.
- Reviewer: exercise AC05, AC09, AC10 and AC15 independently; report calculation, duplicate-save and ownership failures before polish issues.

## Integration routine

The lead freezes the versioned interface for a milestone, delegates independent files, reviews proposed interface changes, integrates completed work, then runs meaningful shared checks. Each handoff references the same requirement and acceptance IDs. Update backlog evidence and decision entries when behavior changes.

For parallel coding in separate Codex tasks, use Git worktrees, which require a Git repository. Shared-session subagents can still share files, so keep file ownership explicit. Consult [worktree documentation](https://learn.chatgpt.com/docs/environments/git-worktrees). [Official subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) explains delegation and additional token consumption.

## Model and cost policy

Inherit the current model initially. Use deeper reasoning selectively for architecture, data validity and unresolved failures; routine bounded implementation does not automatically justify maximum reasoning. Keep outputs concise, reuse reviewed contracts, and record unresolved issues instead of rerunning the same research. Adjust settings only after observing quality, latency and usage for actual work.
