import { cachedJson } from "./api.js";
import { WORLD_LAND_PATH } from "./world-land-path.js";

// ~30 major cities spread across the continents.
const CITIES = [
  { name: "Reykjavik", lat: 64.15, lon: -21.94 },
  { name: "Anchorage", lat: 61.22, lon: -149.90 },
  { name: "Oslo", lat: 59.91, lon: 10.75 },
  { name: "Moscow", lat: 55.76, lon: 37.62 },
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Berlin", lat: 52.52, lon: 13.40 },
  { name: "Toronto", lat: 43.65, lon: -79.38 },
  { name: "New York", lat: 40.71, lon: -74.01 },
  { name: "Madrid", lat: 40.42, lon: -3.70 },
  { name: "Rome", lat: 41.90, lon: 12.50 },
  { name: "Istanbul", lat: 41.01, lon: 28.98 },
  { name: "Beijing", lat: 39.90, lon: 116.41 },
  { name: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "Los Angeles", lat: 34.05, lon: -118.24 },
  { name: "Tel Aviv", lat: 32.07, lon: 34.78 },
  { name: "Cairo", lat: 30.04, lon: 31.24 },
  { name: "Dubai", lat: 25.20, lon: 55.27 },
  { name: "Honolulu", lat: 21.31, lon: -157.86 },
  { name: "Mexico City", lat: 19.43, lon: -99.13 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "Bangkok", lat: 13.76, lon: 100.50 },
  { name: "Lagos", lat: 6.52, lon: 3.38 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Nairobi", lat: -1.29, lon: 36.82 },
  { name: "Rio de Janeiro", lat: -22.91, lon: -43.17 },
  { name: "Santiago", lat: -33.45, lon: -70.67 },
  { name: "Cape Town", lat: -33.92, lon: 18.42 },
  { name: "Buenos Aires", lat: -34.60, lon: -58.38 },
  { name: "Perth", lat: -31.95, lon: 115.86 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
];

// Equirectangular SVG canvas dimensions (2:1 like a world map).
const W = 1000, H = 500;

// Accurate world land geometry (Natural Earth 110m, public domain) is imported as
// WORLD_LAND_PATH — a single combined equirectangular SVG path aligned to projX/projY.

// Cities packed densely in Europe — for these we stagger label offsets and only show
// the name on hover/focus to avoid the cluttered overlap, while the temp is always shown.
const DENSE_CLUSTER = new Set(["London", "Madrid", "Rome", "Oslo", "Istanbul", "Berlin"]);

// Cold→hot color scale. Stops in °C → RGB.
const STOPS = [
  [-15, [26, 60, 120]],   // deep blue
  [0,   [42, 107, 168]],  // #2a6ba8
  [10,  [74, 163, 232]],  // #4aa3e8
  [20,  [0, 212, 255]],   // #00d4ff cyan
  [28,  [247, 198, 104]], // #f7c668 amber
  [34,  [239, 68, 68]],   // #ef4444 red
  [45,  [180, 30, 40]],
];
function tempColor(t) {
  if (t == null || Number.isNaN(t)) return "#6b7fa3";
  if (t <= STOPS[0][0]) return rgb(STOPS[0][1]);
  if (t >= STOPS[STOPS.length - 1][0]) return rgb(STOPS[STOPS.length - 1][1]);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i], [t1, c1] = STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return rgb([0, 1, 2].map(k => Math.round(c0[k] + (c1[k] - c0[k]) * f)));
    }
  }
  return "#6b7fa3";
}
const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;

// Equirectangular projection.
const projX = lon => (lon + 180) / 360 * W;
const projY = lat => (90 - lat) / 180 * H;

function batchUrl(cities) {
  const lats = cities.map(c => c.lat).join(",");
  const lons = cities.map(c => c.lon).join(",");
  return `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current_weather=true`;
}

export async function mountWorldMap(host, { lang, t, onPickCity, isDay = true }) {
  host.innerHTML = `
    <div class="wmap" data-time="${isDay ? "day" : "night"}">
      <div class="wmap-head">${t("map.title")}</div>
      <div class="wmap-scroll">
        <div class="wmap-stage">
          <svg class="wmap-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img"></svg>
          <div class="wmap-fx" aria-hidden="true"></div>
        </div>
      </div>
      <div class="wmap-status">${t("map.loading")}</div>
    </div>`;
  const wmap = host.querySelector(".wmap");
  const svg = host.querySelector(".wmap-svg");
  const status = host.querySelector(".wmap-status");
  const SVGNS = "http://www.w3.org/2000/svg";

  // ---- Themed background: day = sky→sea gradient, night = navy + starfield. ----
  const defs = document.createElementNS(SVGNS, "defs");
  // Day gradient: bright sky-blue at top → deep sea-blue at bottom.
  const dayGrad = document.createElementNS(SVGNS, "linearGradient");
  dayGrad.setAttribute("id", "wmap-day-grad");
  dayGrad.setAttribute("x1", "0"); dayGrad.setAttribute("y1", "0");
  dayGrad.setAttribute("x2", "0"); dayGrad.setAttribute("y2", "1");
  [["0%", "#5bb8f0"], ["35%", "#4aa3e8"], ["68%", "#1a4a7a"], ["100%", "#0d2b52"]]
    .forEach(([off, col]) => {
      const s = document.createElementNS(SVGNS, "stop");
      s.setAttribute("offset", off); s.setAttribute("stop-color", col);
      dayGrad.appendChild(s);
    });
  defs.appendChild(dayGrad);
  // Night gradient: deep navy.
  const nightGrad = document.createElementNS(SVGNS, "linearGradient");
  nightGrad.setAttribute("id", "wmap-night-grad");
  nightGrad.setAttribute("x1", "0"); nightGrad.setAttribute("y1", "0");
  nightGrad.setAttribute("x2", "0"); nightGrad.setAttribute("y2", "1");
  [["0%", "#0a1428"], ["100%", "#060b18"]].forEach(([off, col]) => {
    const s = document.createElementNS(SVGNS, "stop");
    s.setAttribute("offset", off); s.setAttribute("stop-color", col);
    nightGrad.appendChild(s);
  });
  defs.appendChild(nightGrad);
  svg.appendChild(defs);

  // Ocean rect — fill driven by theme via CSS (references the gradients above).
  const ocean = document.createElementNS(SVGNS, "rect");
  ocean.setAttribute("x", 0); ocean.setAttribute("y", 0);
  ocean.setAttribute("width", W); ocean.setAttribute("height", H);
  ocean.setAttribute("class", "wmap-ocean");
  svg.appendChild(ocean);

  // Starfield (night only; hidden in day via CSS). Deterministic scatter.
  const stars = document.createElementNS(SVGNS, "g");
  stars.setAttribute("class", "wmap-stars");
  let seed = 1337;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 110; i++) {
    const st = document.createElementNS(SVGNS, "circle");
    st.setAttribute("cx", (rnd() * W).toFixed(1));
    st.setAttribute("cy", (rnd() * H).toFixed(1));
    const r = 0.5 + rnd() * 1.6;
    st.setAttribute("r", r.toFixed(2));
    st.setAttribute("class", "wmap-star");
    st.setAttribute("fill", rnd() > 0.7 ? "#bcd8ff" : "#ffffff");
    st.style.setProperty("--star-op", (0.3 + rnd() * 0.6).toFixed(2));
    if (rnd() > 0.6) {
      st.classList.add("twinkle");
      st.style.animationDelay = (rnd() * 4).toFixed(2) + "s";
      st.style.animationDuration = (2.4 + rnd() * 2.8).toFixed(2) + "s";
    }
    stars.appendChild(st);
  }
  svg.appendChild(stars);

  // Graticule lines every 30°.
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = projX(lon);
    const ln = document.createElementNS(SVGNS, "line");
    ln.setAttribute("x1", x); ln.setAttribute("y1", 0);
    ln.setAttribute("x2", x); ln.setAttribute("y2", H);
    ln.setAttribute("class", "wmap-grid");
    svg.appendChild(ln);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = projY(lat);
    const ln = document.createElementNS(SVGNS, "line");
    ln.setAttribute("x1", 0); ln.setAttribute("y1", y);
    ln.setAttribute("x2", W); ln.setAttribute("y2", y);
    ln.setAttribute("class", "wmap-grid");
    svg.appendChild(ln);
  }
  // Accurate coastlines: one combined path, filled via .wmap-land theming.
  const land = document.createElementNS(SVGNS, "path");
  land.setAttribute("d", WORLD_LAND_PATH);
  land.setAttribute("class", "wmap-land");
  land.setAttribute("fill-rule", "evenodd");
  svg.appendChild(land);

  // Fetch all temps in ONE batched request → array indexed by city.
  let temps = CITIES.map(() => null);
  try {
    const data = await cachedJson(batchUrl(CITIES));
    const arr = Array.isArray(data) ? data : [data];
    temps = CITIES.map((_, i) => {
      const cw = arr[i] && arr[i].current_weather;
      return cw ? Math.round(cw.temperature) : null;
    });
    status.style.display = "none";
  } catch {
    status.textContent = t("msg.offline");
  }

  // Pins (drawn after land so they sit on top).
  CITIES.forEach((city, i) => {
    const x = projX(city.lon), y = projY(city.lat);
    const temp = temps[i];
    const color = tempColor(temp);

    const dense = DENSE_CLUSTER.has(city.name);

    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", dense ? "wmap-pin wmap-pin--dense" : "wmap-pin");
    g.setAttribute("transform", `translate(${x},${y})`);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${city.name} ${temp == null ? "" : temp + "°"}`);

    // Pulsing glow ring — gentle, staggered so the map feels alive.
    const pulse = document.createElementNS(SVGNS, "circle");
    pulse.setAttribute("r", 11); pulse.setAttribute("class", "wmap-pulse");
    pulse.setAttribute("fill", color);
    pulse.style.animationDelay = `${(i % 6) * 0.5}s`;
    g.appendChild(pulse);

    const halo = document.createElementNS(SVGNS, "circle");
    halo.setAttribute("r", 11); halo.setAttribute("class", "wmap-halo");
    halo.setAttribute("fill", color);
    g.appendChild(halo);

    const dot = document.createElementNS(SVGNS, "circle");
    dot.setAttribute("r", 5.5); dot.setAttribute("class", "wmap-dot");
    dot.setAttribute("fill", color);
    g.appendChild(dot);

    const label = document.createElementNS(SVGNS, "text");
    label.setAttribute("class", "wmap-temp");
    label.setAttribute("x", 0);
    // Stagger the temp label vertically in the dense European cluster to reduce overlap.
    label.setAttribute("y", dense && i % 2 ? -20 : -14);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", color);
    label.textContent = temp == null ? "–" : `${temp}°`;
    g.appendChild(label);

    // City name under the dot. In the dense cluster it only shows on hover/focus (CSS).
    const nameEl = document.createElementNS(SVGNS, "text");
    nameEl.setAttribute("class", "wmap-name");
    nameEl.setAttribute("x", 0);
    nameEl.setAttribute("y", 17);
    nameEl.setAttribute("text-anchor", "middle");
    nameEl.textContent = city.name;
    g.appendChild(nameEl);

    const activate = () => onPickCity && onPickCity(city);
    g.addEventListener("click", activate);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
    // Raise the pin to the front on hover/touch so its zoomed name isn't hidden by neighbours.
    g.addEventListener("pointerenter", () => svg.appendChild(g));
    svg.appendChild(g);
  });

  // Expose a tiny API so app.js can re-theme the map when a place loads.
  return {
    setTime(isDayNow) {
      wmap.setAttribute("data-time", isDayNow ? "day" : "night");
    },
  };
}
