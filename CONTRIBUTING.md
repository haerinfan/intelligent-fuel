# Work on Intelligent Fuel

This is a school thesis prototype for Cavite. Start with [current status](docs/current-status.md), [project instructions](AGENTS.md), [acceptance criteria](docs/acceptance-criteria.md) and the [team workflow](docs/team-workflow.md). The machine-learning requirement remains mandatory; simulated fixtures do not establish model accuracy.

## Set up your own copy

Install Git, Node **24.19.0** (also recorded in `.nvmrc`) and npm **11.19.0**. Check `node --version` and `npm --version`; if necessary, run `npm install --global npm@11.19.0` after installing Node. Each collaborator uses their own GitHub account and local folder.

```sh
git clone https://github.com/haerinfan/intelligent-fuel.git
cd intelligent-fuel
npm ci
npm run setup
npm run check
npm run dev
```

Open `http://127.0.0.1:3000` for the available application, or `/health` for service status. Consult the current-status page for implemented screens and remaining work. Stop the server with Ctrl+C.

Setup generates your own ignored `.env` and SQLite database. Development accounts are `driver-a@example.test` and `driver-b@example.test`; their local password is `DEMO_PASSWORD` in **your own** `.env`. Setup can be rerun and preserves existing accounts. Do not exchange `.env`, passwords, database files or GitHub credentials with teammates. These synthetic accounts are local test identities, not team GitHub accounts.

Use `npm ci` after pulling lockfile changes and `npm run setup` after changes to database setup. Commit both `package.json` and `package-lock.json` when intentionally changing dependencies. Never edit the lockfile by hand. `npm run format` applies the code formatter; inspect its diff before committing.

## Submit a small change

Agree on one backlog item and file ownership before starting. From a clean working tree:

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/your-short-task-name
```

Make the change, then run `npm run check`. Inspect `git status` and `git diff`; stage only intended files with `git add <paths>`. Commit and push your branch:

```sh
git commit -m "Describe the change"
git push -u origin HEAD
```

Open a pull request into `main` on GitHub and fill in the template. Ask the other collaborator to review. Keep `main` usable by merging after review and successful checks. Do not force-push `main`. If you cannot push a branch, the repository owner must grant your GitHub account collaborator access; share your username, never a password or token.

Before continuing an older branch, commit or stash your work, run `git fetch origin`, then `git merge origin/main` from your task branch. Resolve conflicts with the owner of affected files and rerun checks. Do not discard another collaborator's changes to make a merge pass.
