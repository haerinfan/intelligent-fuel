# M1 stack and implementation gate

Decision date: 12 September 2026. The user authorized the next setup step and confirmed Cavite as the initial area, about one month to delivery (planning date 12 October 2026), and a required machine-learning component. Philippines-wide coverage is an expansion goal, not the first evaluation claim.

## M2 update, 13 September 2026

The browser is now native HTML/CSS/ES modules, served by Fastify from `public`. This supersedes the planned React row below: the one-month prototype needs one server, no added frontend build and a small shared HTTP interface. API/tests remain TypeScript; browser JavaScript is included in Biome checks. CI uses the pinned `.nvmrc` version; the latest local run used Node 24.20.0. Better Auth rate limits use each SQLite database, preventing cross-test memory limits and retaining limits across local restarts. Rerun setup for auth migrations.

## Selected local development stack (M1 record)

| Layer | Choice | Reason / scope |
|---|---|---|
| API and shared contracts | Node.js 24, TypeScript, Fastify, Zod | Typed modular API, runtime validation, injectable HTTP tests |
| Persistence | SQLite through Node's built-in driver | Local setup without a separate database server; isolate access behind repositories |
| Authentication | Better Auth email/password and cookie sessions | Maintained auth implementation; no custom password hashing; local synthetic test accounts |
| Cost arithmetic | decimal.js | Decimal-string quantities and exact multiplication before UI rounding |
| Tests and code checks | Node test runner via tsx, TypeScript, Biome | Small reproducible toolchain, locked dependency versions |
| Planned browser layer | React with TypeScript, framework selected at M2 UI setup | Shares contracts through HTTP; UI dependencies are not installed in this API/fixture milestone |
| Planned ML experiments | Python with scikit-learn candidate tooling | Offline training/evaluation; final estimator and inference packaging chosen after data gate |

The Node SQLite driver is documented as release candidate in current Better Auth guidance. It avoids native-addon build prerequisites on this Windows machine, but must be retested when changing Node major version. This prototype pins Node 24; deployment will need a Node-compatible host or an explicitly planned adapter migration. This setup does not assume that a Node server can run unchanged in a Worker runtime.

This milestone builds a local API environment and fixture library, not the browser application or a published website. The web host, UI framework and ML-serving mechanism are separate integration choices. This keeps provider accounts and hosting out of the current setup. SQLite remains suitable for the bounded local demonstration; wider rollout needs a separate capacity/deployment decision.

## Decisions adopted for the fixture prototype

- D06: Save before navigation handoff, unique by owner and analysis; do not infer trip taken.
- D15: Missing supported fuel inputs or usable prices produces explicit unavailable values, never zero.
- D19: Price lookup basis is the origin area and is shown to the user.
- Fixture TTL: 15 minutes at an injected clock. Fixture freshness policy is scenario-authored and always synthetic; no source-specific live threshold is selected.
- Demo request timeout target: 10 seconds, no automatic paid-provider retries. Real provider budgets remain D05.
- Lead owns shared runtime schemas and migrations. UX/data agents review separate artifacts; future implementation agents request contract changes through the lead.

These are recorded engineering choices for M1/M2 under the user's implementation authorization, not claims of adviser approval. D08–D11 remain unresolved research decisions. ML is required, so a demo-only result cannot be called a completed thesis.

## Reproducibility and security boundaries

Use npm with the checked-in lockfile. Setup generates ignored development secrets and a local SQLite file; no external account is contacted. The HTTP server binds to 127.0.0.1 and accepts only a loopback APP_ORIGIN in this milestone. Local email verification/recovery are not configured. Before participant or hosted use, choose verified-email/recovery policy, TLS, retention and rate limits with the full user journey.

## Sources consulted

- [Fastify TypeScript](https://fastify.dev/docs/latest/Reference/TypeScript/) and [HTTP testing](https://fastify.dev/docs/latest/Guides/Testing/).
- [Better Auth SQLite](https://better-auth.com/docs/adapters/sqlite) and [Fastify integration](https://better-auth.com/docs/integrations/fastify).
- [Zod runtime parsing](https://zod.dev/basics) and [decimal.js API](https://mikemcl.github.io/decimal.js/).

Exact resolved versions and transitive dependencies are in package-lock.json. Sources establish capabilities, not proof that unimplemented workflows pass acceptance.
