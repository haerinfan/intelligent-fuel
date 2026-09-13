import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { createAuth, migrateAuth } from "../src/auth.js";
import { readConfig } from "../src/config.js";
import { openDatabase } from "../src/database.js";
import { fixtureUsers } from "../src/fixtures/index.js";

const envPath = resolve(".env");
if (!existsSync(envPath)) {
  writeFileSync(
    envPath,
    `APP_ORIGIN=http://127.0.0.1:3000\nDATABASE_PATH=./private-data/development.sqlite\nBETTER_AUTH_SECRET=${randomBytes(48).toString("base64url")}\nDEMO_PASSWORD=${randomBytes(24).toString("base64url")}\n`,
    { flag: "wx", mode: 0o600 },
  );
}
const env = parseEnv(readFileSync(envPath, "utf8"));
const config = readConfig(env);
const password = env.DEMO_PASSWORD;
if (!password || password.length < 12)
  throw new Error("DEMO_PASSWORD must have at least 12 characters in .env.");
const db = openDatabase(config.databasePath);
try {
  const auth = createAuth(db, config.origin, config.secret);
  await migrateAuth(auth);
  for (const user of fixtureUsers) {
    // Preserve existing accounts and passwords when setup is rerun.
    if (db.prepare('SELECT id FROM "user" WHERE email = ?').get(user.email))
      continue;
    await auth.api.signUpEmail({
      body: { name: user.name, email: user.email, password },
    });
  }
  console.log(
    "Local database initialized; two synthetic accounts are available.",
  );
  console.log(
    "Account emails: driver-a@example.test, driver-b@example.test. Password is in ignored .env (DEMO_PASSWORD).",
  );
  console.log(
    "Run npm run dev, then open http://127.0.0.1:3000/health to inspect API readiness.",
  );
} finally {
  db.close();
}
