const $ = (id) => document.getElementById(id);
const htmlEscape = (value) =>
  String(value ?? "Unknown").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (v) => (v === null ? "Unavailable" : `₱${Number(v).toFixed(2)}`);
const date = (v) => (v ? new Date(v).toLocaleString() : "Unknown");
let bootstrap,
  vehicles = [],
  preferences = {},
  analysis = null,
  selectedRoute = null;
let generation = 0,
  authGeneration = 0,
  historyGeneration = 0,
  detailGeneration = 0,
  signup = false,
  fullHistory = false,
  saving = false;
const filters = { brand: "", model: "", modelYear: "", variant: "" };
function status(message, error = false) {
  $("status").textContent = message;
  $("status").className = error ? "status error" : "status";
}
async function api(path, body, method = body === undefined ? "GET" : "POST") {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      data.error?.message ||
        data.message ||
        "The request failed. Please retry.",
    );
    error.fields = data.error?.fieldErrors || [];
    error.code = data.error?.code;
    throw error;
  }
  return data;
}
function showError(error) {
  status(error.message, true);
  for (const field of error.fields || []) {
    const target = $(`error-${field.field.split(".")[0]}`);
    if (target) target.textContent = field.message;
  }
}
function clearErrors() {
  for (const el of document.querySelectorAll(".field-error"))
    el.textContent = "";
}
function invalidate() {
  generation++;
  if (analysis) {
    analysis = null;
    selectedRoute = null;
    $("result-content").innerHTML =
      '<p class="notice">Inputs changed. Previous results are outdated. Compare routes again before saving.</p>';
  }
}
const title = (v) =>
  v.kind === "manual"
    ? `${v.model} · Manual`
    : `${v.brand} ${v.model} · ${v.modelYear} · ${v.variant}`;
function renderGarage() {
  const prior = $("vehicle").value;
  $("vehicle").innerHTML =
    '<option value="">Select your vehicle</option>' +
    vehicles
      .map(
        (v) =>
          `<option value="${htmlEscape(v.id)}">${htmlEscape(title(v.vehicleSnapshot))}</option>`,
      )
      .join("");
  $("vehicle").value = vehicles.some((v) => v.id === prior)
    ? prior
    : preferences.defaultVehicleId || "";
  $("saved-vehicles").innerHTML = vehicles.length
    ? vehicles
        .map(
          (v) =>
            `<article class="vehicle-tile"><h3>${htmlEscape(title(v.vehicleSnapshot))}</h3><p>${htmlEscape(v.vehicleSnapshot.fuelType)} fuel · ${v.vehicleSnapshot.displacementCc ?? "Unknown"} cc · ${htmlEscape(v.vehicleSnapshot.transmission)}</p><p>${v.id === preferences.defaultVehicleId ? "Default vehicle" : "Saved in your garage"}</p><button type="button" data-use="${htmlEscape(v.id)}">Plan with this</button><button class="quiet" type="button" data-delete="${htmlEscape(v.id)}">Remove</button></article>`,
        )
        .join("")
    : '<p class="hint">Your garage is empty. Choose a fictional catalog variant below or add your vehicle manually.</p>';
  vehicleNote();
}
function vehicleNote() {
  const v = vehicles.find((v) => v.id === $("vehicle").value)?.vehicleSnapshot;
  $("vehicle-note").textContent = !v
    ? "Add a vehicle below to get started."
    : v.kind === "manual"
      ? "Manual vehicle: unknown specifications stay unknown. Fuel and cost estimates are unavailable."
      : `${v.displacementCc} cc · ${v.transmission} · ${v.fuelType}. Fictional specifications for this demo only.`;
}
function renderCatalog() {
  const query = $("catalog-search").value.toLowerCase().trim();
  const matches = bootstrap.catalog.filter(
    (v) =>
      title(v).toLowerCase().includes(query) &&
      Object.entries(filters).every(
        ([k, value]) => !value || String(v[k]) === value,
      ),
  );
  $("catalog-results").innerHTML = matches.length
    ? matches
        .map(
          (v) =>
            `<article class="catalog-item"><h3>${htmlEscape(v.model)}</h3><p>${htmlEscape(v.brand)} · ${v.modelYear} · ${htmlEscape(v.variant)}</p><p>${v.displacementCc} cc · ${htmlEscape(v.transmission)} · ${htmlEscape(v.fuelType)}<br>Rated economy: unavailable</p><button type="button" data-catalog="${htmlEscape(v.id)}">Add ${htmlEscape(v.model)}</button></article>`,
        )
        .join("")
    : '<p class="notice">No catalog match. Use “Vehicle not listed?” below to save a manual vehicle without inventing specifications.</p>';
}
function setupBootstrap() {
  for (const field of ["origin", "destination"]) {
    $(field).innerHTML =
      '<option value="">Select a demo location</option>' +
      bootstrap.locations
        .map((l, i) => `<option value="${i}">${htmlEscape(l.label)}</option>`)
        .join("");
  }
  $("brand").innerHTML =
    '<option value="">Select a brand</option>' +
    bootstrap.brands
      .map((b) => `<option value="${b.id}">${htmlEscape(b.label)}</option>`)
      .join("");
  $("scenario").innerHTML = bootstrap.scenarios
    .map(
      (s) =>
        `<option value="${s}">${htmlEscape(s.replaceAll("-", " "))}</option>`,
    )
    .join("");
  $("catalog-filters").innerHTML = Object.keys(filters)
    .map(
      (key) =>
        `<label>${key === "modelYear" ? "Year" : key[0].toUpperCase() + key.slice(1)}<select data-filter="${key}"><option value="">All</option>${[...new Set(bootstrap.catalog.map((v) => v[key]))].map((v) => `<option value="${htmlEscape(v)}">${htmlEscape(v)}</option>`).join("")}</select></label>`,
    )
    .join("");
  for (const key of Object.keys(filters)) filters[key] = "";
  renderCatalog();
}
async function loadWorkspace() {
  const token = ++authGeneration;
  const me = await api("/api/v1/me");
  const [config, garage] = await Promise.all([
    api("/api/v1/bootstrap"),
    api("/api/v1/garage"),
  ]);
  if (token !== authGeneration) return;
  bootstrap = config;
  vehicles = garage.vehicles;
  preferences = garage.preferences;
  setupBootstrap();
  $("auth").hidden = true;
  $("workspace").hidden = false;
  $("signout").hidden = false;
  $("brand").value = preferences.brandId;
  renderGarage();
  await loadHistory();
  status(`Welcome, ${me.user.name}. Your local demo workspace is ready.`);
}
async function addVehicle(body) {
  const data = await api("/api/v1/garage", body);
  const garage = await api("/api/v1/garage");
  vehicles = garage.vehicles;
  preferences = garage.preferences;
  invalidate();
  renderGarage();
  $("vehicle").value = data.vehicle.id;
  vehicleNote();
  status("Vehicle saved. Choose your locations to plan a trip.");
  $("planner").scrollIntoView({ behavior: "smooth" });
  $("origin").focus({ preventScroll: true });
}
function priceHtml(price) {
  if (!price)
    return '<p class="notice">Price unavailable. No cost has been substituted with zero.</p>';
  const p = price.observation;
  return `<details class="price-details" open><summary>Price basis & source</summary><dl><dt>Price</dt><dd>${p.amountPhpPerLiter === null ? `${money(p.lowerPhpPerLiter)}–${money(p.upperPhpPerLiter)}/L · source range only, no official point quote` : `${money(p.amountPhpPerLiter)}/L`}</dd><dt>Location</dt><dd>${htmlEscape(p.geographyLabel)} (${htmlEscape(p.geographicBasis)})</dd><dt>Match</dt><dd>${p.brandId === null ? "General fallback — not brand-specific" : htmlEscape(p.brandId)} · ${htmlEscape(p.fuelType)} · ${htmlEscape(p.gradeId)}</dd><dt>Observed</dt><dd>${htmlEscape(date(p.observedAt))}</dd><dt>Freshness</dt><dd>${htmlEscape(price.freshness)} · fixture-authored, not live</dd><dt>Source</dt><dd>${htmlEscape(p.provenance.sourceName)} · ${htmlEscape(p.provenance.mode)}</dd></dl></details>`;
}
function routeHtml(r, recommendedId, interactive, comparison = "") {
  const f = r.fuelEstimate,
    c = r.costEstimate;
  const content = `<span class="route-title">${interactive ? `<input type="radio" name="route-choice" value="${htmlEscape(r.route.id)}" ${selectedRoute === r.route.id ? "checked" : ""}>` : ""}${htmlEscape(r.route.label)}${r.route.id === recommendedId ? '<span class="badge">Demo recommendation</span>' : '<span class="badge">Alternative</span>'}</span><span class="route-metrics"><span class="metric"><strong>${r.route.durationSeconds / 60} min</strong><small>${r.route.distanceMeters / 1000} km</small></span><span class="metric"><strong>${f.expectedLiters === null ? "Unavailable" : `${htmlEscape(f.expectedLiters)} L`}</strong><small>${f.range ? `${htmlEscape(f.range.lowerLiters)}–${htmlEscape(f.range.upperLiters)} L · demo range` : htmlEscape(f.reason)}</small></span><span class="metric"><strong>${money(c.expectedPhp)}</strong><small>${c.rangePhp ? `${money(c.rangePhp.lower)}–${money(c.rangePhp.upper)} · cost envelope` : htmlEscape(c.reason)}</small></span></span><p class="route-extra">${htmlEscape(comparison)} Traffic: ${htmlEscape(r.route.trafficStatus)} (synthetic). Estimate: ${htmlEscape(f.validationStatus)}, ${htmlEscape(f.methodVersion)}.</p>`;
  return interactive
    ? `<label class="route-card">${content}</label>`
    : `<article class="route-card">${content}</article>`;
}
function mapHtml() {
  if ($("hide-map").checked)
    return '<p class="hint">Map preview unavailable by demo control. Route details and actions remain available below.</p>';
  return '<div class="map"><svg viewBox="0 0 480 150" role="img" aria-label="Illustrative schematic showing two fictional paths between origin and destination"><path d="M10 35H470M10 80H470M10 125H470M80 10V140M210 10V140M340 10V140" stroke="#d6dfce" fill="none"/><path d="M35 120L125 85L260 95L440 28" stroke="#527048" stroke-width="7" fill="none"/><path d="M35 120L140 30L330 50L440 28" stroke="#a58b5a" stroke-width="5" stroke-dasharray="9 5" fill="none"/><circle cx="35" cy="120" r="9" fill="#224b3d"/><circle cx="440" cy="28" r="9" fill="#224b3d"/><text x="15" y="145" font-size="12">From</text><text x="365" y="18" font-size="12">Destination</text></svg><p>Illustrative schematic only — not road geometry or a navigable map. Textual route choices below are authoritative for this demo.</p></div>';
}
function renderResults() {
  if (!analysis) return;
  const recommended = analysis.routes.find(
    (r) => r.route.id === analysis.recommendation.routeId,
  );
  $("result-content").innerHTML =
    `<p class="notice">${htmlEscape(bootstrap.notice)}</p>${mapHtml()}<p class="hint">${htmlEscape(analysis.recommendation.explanation)}</p><fieldset class="route-options"><legend>Choose a route</legend>${analysis.routes
      .map((r) => {
        let delta = "";
        if (recommended && r !== recommended) {
          const minutes =
            (r.route.durationSeconds - recommended.route.durationSeconds) / 60;
          delta = `${minutes >= 0 ? "+" : ""}${minutes} min`;
          if (
            r.costEstimate.expectedPhp !== null &&
            recommended.costEstimate.expectedPhp !== null
          ) {
            const diff =
              Number(r.costEstimate.expectedPhp) -
              Number(recommended.costEstimate.expectedPhp);
            delta += ` · ${money(String(Math.abs(diff)))} ${diff <= 0 ? "less" : "more"}`;
          }
          delta += ". ";
        }
        return routeHtml(r, analysis.recommendation.routeId, true, delta);
      })
      .join(
        "",
      )}</fieldset>${priceHtml(analysis.selectedPriceSnapshot)}<p class="hint">${analysis.warnings.map(htmlEscape).join("<br>")}<br>Analysis: ${htmlEscape(date(analysis.createdAt))}. Expires: ${htmlEscape(date(analysis.expiresAt))}.</p><button type="button" id="save-trip" class="wide">Save planned trip & prepare Maps ↗</button><div id="saved-result" role="status"></div>`;
}
async function saveTrip() {
  if (!analysis || saving) return;
  const token = generation,
    authToken = authGeneration,
    id = analysis.id,
    route = selectedRoute;
  saving = true;
  $("save-trip").disabled = true;
  try {
    const result = await api("/api/v1/trips", {
      analysisId: id,
      selectedRouteId: route,
      simulateFailure: $("simulate-save").checked,
    });
    if (authToken !== authGeneration) return;
    await loadHistory();
    if (authToken !== authGeneration) return;
    if (token !== generation || !analysis) {
      status(
        "The previous plan was saved. Your changed inputs still need a new analysis.",
      );
      return;
    }
    if (route !== selectedRoute) {
      status(
        "Your earlier route selection was saved in history. Compare again to save a different plan.",
      );
      return;
    }
    $("saved-result").innerHTML =
      `<div class="saved-box"><h3>Saved as a planned trip</h3><p>Your plan is safely in history. Use this link to open Google Maps; retrying it does not create a second trip.</p><a class="maps-link" href="${htmlEscape(result.mapsUrl)}" rel="noopener noreferrer">Open in Google Maps ↗</a><p>Google Maps may update the route. Fictional route alternatives cannot be reproduced exactly. Opening or returning does not mark this trip taken.</p></div>`;
    status("Trip saved. The Google Maps link is ready.");
  } catch (error) {
    if (authToken === authGeneration) showError(error);
  } finally {
    saving = false;
    if ($("save-trip")) $("save-trip").disabled = false;
  }
}
async function loadHistory() {
  const token = authGeneration,
    request = ++historyGeneration,
    requestedFullHistory = fullHistory;
  let data;
  try {
    data = await api(`/api/v1/trips${requestedFullHistory ? "" : "?limit=5"}`);
  } catch (error) {
    if (token !== authGeneration || request !== historyGeneration) return;
    throw error;
  }
  if (token !== authGeneration || request !== historyGeneration) return;
  $("history-title").textContent = requestedFullHistory
    ? "All planned trips"
    : "Recent trips";
  $("history-toggle").textContent = requestedFullHistory
    ? "Show latest five"
    : "View full history";
  $("history-list").innerHTML = data.trips.length
    ? data.trips
        .map(
          (t) =>
            `<article class="history-row"><div><h3>${htmlEscape(t.inputSnapshot.origin.label)} → ${htmlEscape(t.inputSnapshot.destination.label)}</h3><p>${htmlEscape(date(t.createdAt))} · ${htmlEscape(t.inputSnapshot.vehicleSnapshot.model)} · ${htmlEscape(t.status)}</p></div><button class="quiet" type="button" data-trip="${htmlEscape(t.id)}">View trip</button></article>`,
        )
        .join("")
    : '<p class="hint">No saved plans yet. Compare routes and save your first trip.</p>';
}
async function showTrip(id) {
  const token = authGeneration,
    request = ++detailGeneration;
  let data;
  try {
    data = await api(`/api/v1/trips/${encodeURIComponent(id)}`);
  } catch (error) {
    if (token !== authGeneration || request !== detailGeneration) return;
    throw error;
  }
  if (token !== authGeneration || request !== detailGeneration) return;
  const { trip: t, mapsUrl } = data;
  $("trip-detail").hidden = false;
  $("trip-detail").innerHTML =
    `<h3>Saved trip details</h3><p class="notice">Historical synthetic snapshot — not recomputed with current prices or defaults.</p><p>${htmlEscape(title(t.inputSnapshot.vehicleSnapshot))}<br>${htmlEscape(t.inputSnapshot.origin.label)} → ${htmlEscape(t.inputSnapshot.destination.label)}</p><p class="hint">Saved: ${htmlEscape(date(t.createdAt))} · Status: ${htmlEscape(t.status)}<br>Selected: ${htmlEscape(t.selectedRouteId)} · Recommended: ${htmlEscape(t.recommendedRouteId)}<br>Contract: ${htmlEscape(t.schemaVersion)} · Analysis: ${htmlEscape(t.analysisId)}</p>${t.routeSnapshots.map((r) => routeHtml(r, t.recommendedRouteId, false)).join("")}${priceHtml(t.selectedPriceSnapshot)}<a class="maps-link" href="${htmlEscape(mapsUrl)}" rel="noopener noreferrer">Open saved plan in Google Maps ↗</a><p class="hint">Google Maps may update the route. This remains planned, not a record of driving.</p>`;
  $("trip-detail").focus();
}
$("auth-toggle").addEventListener("click", () => {
  signup = !signup;
  $("name-label").hidden = !signup;
  $("auth-title").textContent = signup
    ? "Create a test account"
    : "Welcome back";
  $("auth-toggle").textContent = signup
    ? "Already have an account? Sign in"
    : "Create a test account";
  $("auth-form").querySelector('[type="submit"]').textContent = signup
    ? "Create account"
    : "Sign in";
});
$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  const values = Object.fromEntries(new FormData(event.target));
  try {
    await api(
      `/api/auth/${signup ? "sign-up" : "sign-in"}/email`,
      signup ? values : { email: values.email, password: values.password },
    );
    event.target.reset();
    await loadWorkspace();
  } catch (error) {
    showError(error);
  } finally {
    button.disabled = false;
  }
});
$("signout").addEventListener("click", async () => {
  try {
    await api("/api/auth/sign-out", {});
    authGeneration++;
    invalidate();
    vehicles = [];
    $("workspace").hidden = true;
    $("auth").hidden = false;
    $("signout").hidden = true;
    $("trip-detail").hidden = true;
    $("trip-detail").replaceChildren();
    $("history-list").replaceChildren();
    status("Signed out.");
  } catch (error) {
    showError(error);
  }
});
for (const id of ["origin", "destination", "vehicle", "brand", "scenario"])
  $(id).addEventListener("change", () => {
    invalidate();
    vehicleNote();
  });
$("hide-map").addEventListener("change", renderResults);
$("catalog-search").addEventListener("input", renderCatalog);
$("catalog-filters").addEventListener("change", (event) => {
  filters[event.target.dataset.filter] = event.target.value;
  renderCatalog();
});
$("manual-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  event.submitter.disabled = true;
  try {
    await addVehicle({
      manual: { label: values.label, fuelType: values.fuelType || null },
    });
    event.target.reset();
  } catch (error) {
    showError(error);
  } finally {
    event.submitter.disabled = false;
  }
});
$("save-preferences").addEventListener("click", async () => {
  try {
    if (!$("vehicle").value || !$("brand").value)
      throw new Error("Choose a vehicle and brand before saving defaults.");
    const result = await api(
      "/api/v1/preferences",
      { defaultVehicleId: $("vehicle").value, brandId: $("brand").value },
      "PATCH",
    );
    preferences = result.preferences;
    renderGarage();
    status("Your default vehicle and fuel brand are saved.");
  } catch (error) {
    showError(error);
  }
});
$("planner-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  invalidate();
  const token = generation;
  let valid = true;
  for (const [id, field] of [
    ["origin", "origin"],
    ["destination", "destination"],
    ["vehicle", "savedVehicleId"],
    ["brand", "fuelSelection"],
  ]) {
    if (!$(id).value) {
      $(`error-${field}`).textContent = "Please make a selection.";
      valid = false;
    }
  }
  if (!valid) {
    status("Complete the highlighted fields to compare routes.", true);
    return;
  }
  const vehicle = vehicles.find(
    (v) => v.id === $("vehicle").value,
  ).vehicleSnapshot;
  const origin = bootstrap.locations[Number($("origin").value)];
  $("analyze").disabled = true;
  status("Comparing synthetic routes…");
  try {
    const result = await api("/api/v1/analyses", {
      origin,
      destination: bootstrap.locations[Number($("destination").value)],
      savedVehicleId: $("vehicle").value,
      fuelSelection: {
        brandId: $("brand").value,
        fuelType: vehicle.fuelType || "gasoline",
        gradeId:
          vehicle.kind === "manual"
            ? null
            : vehicle.compatibleGrades?.[0] || null,
      },
      priceLocation: origin,
      scenario: $("scenario").value,
      simulateDelay: $("simulate-delay").checked,
    });
    if (token !== generation) {
      status(
        "Inputs changed while loading. Compare again for the current trip.",
      );
      return;
    }
    analysis = result.analysis;
    selectedRoute =
      analysis.recommendation.routeId || analysis.routes[0].route.id;
    renderResults();
    status(
      `${analysis.routes.length} demo route${analysis.routes.length === 1 ? "" : "s"} ready. Choose your plan.`,
    );
  } catch (error) {
    if (token === generation) {
      showError(error);
      $("result-content").innerHTML =
        `<p class="notice">${htmlEscape(error.message)} Your inputs are preserved. Use Compare routes to retry.</p>`;
    }
  } finally {
    $("analyze").disabled = false;
  }
});
$("result-content").addEventListener("change", (event) => {
  if (event.target.name === "route-choice") {
    selectedRoute = event.target.value;
    $("saved-result").replaceChildren();
  }
});
$("history-toggle").addEventListener("click", async () => {
  fullHistory = !fullHistory;
  try {
    await loadHistory();
  } catch (error) {
    showError(error);
  }
});
document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  try {
    if (target.dataset.catalog) {
      target.disabled = true;
      await addVehicle({ catalogVehicleId: target.dataset.catalog });
    }
    if (target.dataset.use) {
      invalidate();
      $("vehicle").value = target.dataset.use;
      vehicleNote();
      $("origin").focus();
    }
    if (target.dataset.delete) {
      await api(
        `/api/v1/garage/${encodeURIComponent(target.dataset.delete)}`,
        undefined,
        "DELETE",
      );
      const garage = await api("/api/v1/garage");
      vehicles = garage.vehicles;
      preferences = garage.preferences;
      invalidate();
      renderGarage();
      status("Vehicle removed. Previously saved trip snapshots are unchanged.");
    }
    if (target.dataset.trip) await showTrip(target.dataset.trip);
    if (target.id === "save-trip") await saveTrip();
  } catch (error) {
    showError(error);
  } finally {
    if (target.dataset.catalog) target.disabled = false;
  }
});
loadWorkspace().catch(() => {
  $("auth").hidden = false;
  status("Sign in or create a fictional test account to get started.");
});
