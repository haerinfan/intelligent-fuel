import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { createContext, runInContext } from "node:vm";

function deferred() {
  let resolve: (value: unknown) => void = () => {};
  const promise = new Promise<unknown>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function harness() {
  const elements = new Map<
    string,
    {
      innerHTML: string;
      textContent: string;
      disabled: boolean;
      checked: boolean;
      hidden: boolean;
      addEventListener: () => void;
      focus: () => void;
    }
  >();
  const element = (id: string) => {
    let value = elements.get(id);
    if (!value) {
      value = {
        innerHTML: "",
        textContent: "",
        disabled: false,
        checked: false,
        hidden: true,
        addEventListener() {},
        focus() {},
      };
      elements.set(id, value);
    }
    return value;
  };
  const requests: { path: string; pending: ReturnType<typeof deferred> }[] = [];
  const context = createContext({
    document: { getElementById: element, addEventListener() {} },
    // Leave the initial session lookup pending. Individual tests drive later API responses.
    fetch: () => new Promise(() => {}),
    bridge: {
      api(path: string) {
        const pending = deferred();
        requests.push({ path, pending });
        return pending.promise;
      },
    },
  });
  runInContext(readFileSync("public/app.js", "utf8"), context);
  runInContext("api = (path) => bridge.api(path)", context);
  const run = <T>(code: string): T => runInContext(code, context);
  const request = (index: number) => {
    const value = requests[index];
    assert.ok(value);
    return value;
  };
  return { element, request, run };
}

test("delayed save cannot attach an earlier route handoff to a changed selection", async () => {
  const h = harness();
  const saving = h.run<Promise<void>>(
    'analysis = {id: "analysis-a"}; selectedRoute = "route-a"; saveTrip()',
  );
  h.run('selectedRoute = "route-b"');
  h.request(0).pending.resolve({ mapsUrl: "https://example.test/route-a" });
  await setImmediate();
  assert.equal(h.request(1).path, "/api/v1/trips?limit=5");
  h.request(1).pending.resolve({ trips: [] });
  await saving;
  assert.equal(h.element("saved-result").innerHTML, "");
  assert.match(h.element("status").textContent, /earlier route selection/);
});

test("delayed trip details cannot cross sessions or replace a newer detail request", async () => {
  const h = harness();
  const oldSession = h.run<Promise<void>>('showTrip("old-account-trip")');
  h.run("authGeneration++");
  // Deliberately incomplete: obsolete responses must be ignored before reading their payload.
  h.request(0).pending.resolve({});
  await oldSession;
  assert.equal(h.element("trip-detail").hidden, true);
  const first = h.run<Promise<void>>('showTrip("first")');
  h.run('showTrip("second")');
  h.request(1).pending.resolve({});
  await first;
  assert.equal(h.element("trip-detail").innerHTML, "");
});

test("out-of-order full and recent history responses preserve the latest requested mode", async () => {
  const h = harness();
  const first = h.run<Promise<void>>("fullHistory = true; loadHistory()");
  const second = h.run<Promise<void>>("fullHistory = false; loadHistory()");
  assert.equal(h.request(0).path, "/api/v1/trips");
  assert.equal(h.request(1).path, "/api/v1/trips?limit=5");
  h.request(1).pending.resolve({ trips: [] });
  await second;
  const rendered = h.element("history-list").innerHTML;
  h.request(0).pending.resolve({});
  await first;
  assert.equal(h.element("history-title").textContent, "Recent trips");
  assert.equal(h.element("history-list").innerHTML, rendered);
});
