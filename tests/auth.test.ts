import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createAuth, migrateAuth } from "../src/auth.js";
import { readConfig } from "../src/config.js";
import { openDatabase } from "../src/database.js";

const origin = "http://127.0.0.1:3000";
test("real auth sessions distinguish two users, reject wrong password and revoke on signout", async (t) => {
  const db = openDatabase(":memory:");
  const auth = createAuth(db, origin, randomBytes(48).toString("hex"));
  await migrateAuth(auth);
  await migrateAuth(auth); // repeatable setup
  const app = createApp(auth, origin);
  t.after(async () => {
    await app.close();
    db.close();
  });
  assert.equal((await app.inject({ url: "/api/v1/me" })).statusCode, 401);
  const password = randomBytes(24).toString("hex");
  const cookies: string[] = [];
  const userIds: string[] = [];
  for (const key of ["a", "b"]) {
    const signup = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { origin },
      payload: { name: `Demo ${key}`, email: `${key}@example.test`, password },
    });
    assert.equal(signup.statusCode, 200, signup.body);
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { origin },
      payload: { email: `${key}@example.test`, password },
    });
    assert.equal(login.statusCode, 200, login.body);
    const cookie = login.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    assert.ok(cookie);
    cookies.push(cookie);
    const me = await app.inject({ url: "/api/v1/me", headers: { cookie } });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().user.email, `${key}@example.test`);
    assert.equal(me.json().session, undefined); // do not expose session token
    userIds.push(me.json().user.id);
  }
  assert.notEqual(userIds[0], userIds[1]);
  const failed = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin },
    payload: {
      email: "a@example.test",
      password: "deliberately-wrong-password",
    },
  });
  assert.equal(failed.statusCode, 401);
  const cookieA = cookies[0];
  assert.ok(cookieA);
  const signout = await app.inject({
    method: "POST",
    url: "/api/auth/sign-out",
    headers: { origin, cookie: cookieA },
    payload: {},
  });
  assert.equal(signout.statusCode, 200, signout.body);
  assert.equal(
    (await app.inject({ url: "/api/v1/me", headers: { cookie: cookieA } }))
      .statusCode,
    401,
  );
});
test("cross-origin auth request is rejected and no raw error leaks", async (t) => {
  const db = openDatabase(":memory:");
  const auth = createAuth(db, origin, randomBytes(48).toString("hex"));
  await migrateAuth(auth);
  const app = createApp(auth, origin);
  t.after(async () => {
    await app.close();
    db.close();
  });
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    headers: { origin: "https://untrusted.example" },
    payload: {
      name: "Test",
      email: "test@example.test",
      password: "some-test-password",
    },
  });
  assert.equal(response.statusCode, 403);
  const invalid = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    headers: { "content-type": "application/json" },
    payload: "{broken",
  });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.json().error.code, "INVALID_INPUT");
});
test("local configuration rejects accidental network exposure", () => {
  for (const APP_ORIGIN of [
    "http://0.0.0.0:3000",
    "https://public.example",
    "http://127.0.0.1:3000/path",
  ])
    assert.throws(() =>
      readConfig({ APP_ORIGIN, BETTER_AUTH_SECRET: "x".repeat(40) }),
    );
});
test("health endpoint is truthful about milestone and unloaded ML", async (t) => {
  const db = openDatabase(":memory:");
  const app = createApp(
    createAuth(db, origin, randomBytes(48).toString("hex")),
    origin,
  );
  t.after(async () => {
    await app.close();
    db.close();
  });
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mlModelLoaded, false);
});
