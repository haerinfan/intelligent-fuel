import { makeFixture, makeHistory, SCENARIOS } from "../src/fixtures/index.js";

for (const scenario of SCENARIOS) {
  const result = makeFixture(scenario);
  console.log(
    `${scenario}: ${result.ok ? `${result.analysis.routes.length} route(s), schema valid` : result.error.code}`,
  );
}
console.log(
  `History: ${makeHistory().length} synthetic trips, schema valid. No ML validation performed.`,
);
