# Two-person team workflow

Use one GitHub repository, separate local clones, and one branch per bounded task. Each person remains responsible for reviewing changes produced by their coding agent. [Contributor setup](../CONTRIBUTING.md) contains the exact local commands; [agent workflow](agent-workflow.md) describes specialist handoffs.

## Ownership for each task

| Responsibility | Assignment |
| --- | --- |
| Lead/integrator | Maintains architecture, decisions, shared contracts, migrations and integration; assigns file ownership. |
| Collaborator | Owns an agreed UI, backend or research task and its evidence; proposes shared changes to the lead before editing them. |
| Reviewer | The other person checks the diff and acceptance evidence before merge. |

These are responsibilities, not fixed GitHub identities. Agree on assignments at the start of each backlog item. Do not assign two people or agents the same files concurrently. Keep changes to `src/contracts`, database migrations and contract documentation under one assigned owner at a time. Use small PRs so a thesis deadline does not turn into a large final merge.

An issue or task brief should state: backlog/acceptance IDs, expected behavior, owned files, shared interfaces, how to verify it, and unresolved decisions. If a teammate needs an interface change, agree on and merge that contract first. ML dataset, model, scoring and uncertainty choices remain in the decision log until evidence supports them; neither collaborator should silently settle them through implementation.

## Repository owner: finish account access

The friend's GitHub username is still needed to invite the correct account. The owner can invite it through repository **Settings → Collaborators / Manage access** and the friend must accept. Use repository write access where a role selector is offered; administrative access is unnecessary for ordinary development. No invitation or remote permission change is performed by adding this document.

After the first successful CI run, configure a rule for `main` that requires a pull request, one approving review, resolved review conversations, and the two checks **checks (ubuntu-latest)** and **checks (windows-latest)**. Select the actual checks shown by GitHub. Block force pushes and branch deletion. This is recommended configuration, not a claim that remote protection is enabled. If a setting is unavailable, follow the review workflow manually and record the limitation.

## Automated checks

The committed CI workflow runs on pull requests and pushes to `main`; it can also be started manually. It uses `.nvmrc`, npm 11.19.0 and `npm ci`, initializes fresh synthetic data twice to exercise repeatable setup, and runs `npm run check` on Linux and Windows. It has read-only repository permissions and needs no repository secrets. CI does not publish the application or upload local databases.

CI verifies the executable checks in the project; it does not by itself prove browser acceptance, local fuel accuracy or thesis validity. Include relevant browser evidence and research limitations in the PR. A local passing run is not a confirmed GitHub Actions run; inspect the Actions page after pushing.

Action versions are pinned to full commits, verified against the official repositories on 13 September 2026: [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) and [setup-node v6.5.0](https://github.com/actions/setup-node/releases/tag/v6.5.0). Dependabot proposes weekly dependency/action updates; review and test them normally, with no automatic merge.

## Daily handoff

Before stopping, push your task branch and leave a brief note in the PR: behavior completed, checks run, remaining work, and any interface decision needed. Start the next session by fetching changes and reading the other person's active PR. Keep participant data and real credentials out of issues, screenshots, fixtures and commits. The repository and fixtures are shared; local sessions and private data are separate.
