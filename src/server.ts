import { createApp } from "./app.js";
import { createAuth } from "./auth.js";
import { readConfig } from "./config.js";
import { openDatabase } from "./database.js";

const config = readConfig();
const db = openDatabase(config.databasePath);
const app = createApp(
  createAuth(db, config.origin, config.secret),
  config.origin,
  db,
);
app.addHook("onClose", async () => {
  db.close();
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, async () => {
    await app.close();
  });
try {
  await app.listen({ host: "127.0.0.1", port: config.port });
  console.log(`Intelligent Fuel local demo: ${config.origin}`);
} catch (error) {
  await app.close();
  throw error;
}
