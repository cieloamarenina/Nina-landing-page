import { cachedJson } from "./api.js";

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

// Simplified public-domain world continent outlines (equirectangular, 0-1000 x / 0-500 y).
// Rough silhouettes — enough to read as continents behind the temperature pins.
const CONTINENTS = [
  // North America
  "M150 80 L210 75 L270 90 L300 120 L290 150 L255 175 L250 210 L225 245 L195 250 L185 215 L160 195 L150 160 L120 150 L110 120 L130 95 Z",
  // Central America
  "M250 250 L270 260 L285 285 L275 300 L255 290 L248 265 Z",
  // South America
  "M295 305 L330 300 L355 325 L360 370 L345 420 L320 455 L300 460 L295 420 L280 380 L285 335 Z",
  // Greenland
  "M340 55 L380 50 L395 80 L375 110 L345 100 L335 75 Z",
  // Europe
  "M470 110 L515 100 L545 115 L540 145 L510 160 L485 150 L465 165 L455 140 L460 120 Z",
  // Africa
  "M475 200 L545 195 L575 215 L585 260 L565 310 L530 350 L505 345 L490 300 L470 255 L465 220 Z",
  // Asia
  "M555 95 L700 90 L800 110 L850 140 L835 175 L780 185 L720 200 L660 195 L600 175 L565 150 L550 120 Z",
  // India
  "M640 200 L675 205 L685 240 L665 270 L645 255 L635 220 Z",
  // SE Asia islands
  "M740 250 L790 255 L820 275 L800 300 L760 290 L735 270 Z",
  // Australia
  "M810 340 L880 335 L905 365 L890 405 L840 415 L805 390 L800 360 Z",
  // Antarctica strip
  "M100 470 L900 470 L900 495 L100 495 Z",
];

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

export async function mountWorldMap(host, { lang, t, onPickCity }) {
  host.innerHTML = `
    <div class="wmap">
      <div class="wmap-head">${t("map.title")}</div>
      <div class="wmap-scroll">
        <svg class="wmap-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img"></svg>
      </div>
      <div class="wmap-status">${t("map.loading")}</div>
    </div>`;
  const svg = host.querySelector(".wmap-svg");
  const status = host.querySelector(".wmap-status");

  // Ocean + graticule + continents (static base).
  const SVGNS = "http://www.w3.org/2000/svg";
  const ocean = document.createElementNS(SVGNS, "rect");
  ocean.setAttribute("x", 0); ocean.setAttribute("y", 0);
  ocean.setAttribute("width", W); ocean.setAttribute("height", H);
  ocean.setAttribute("class", "wmap-ocean");
  svg.appendChild(ocean);

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
  for (const d of CONTINENTS) {
    const p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", d);
    p.setAttribute("class", "wmap-land");
    svg.appendChild(p);
  }

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

    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "wmap-pin");
    g.setAttribute("transform", `translate(${x},${y})`);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${city.name} ${temp == null ? "" : temp + "°"}`);

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
    label.setAttribute("y", -14);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", color);
    label.textContent = temp == null ? "–" : `${temp}°`;
    g.appendChild(label);

    const activate = () => onPickCity && onPickCity(city);
    g.addEventListener("click", activate);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
    svg.appendChild(g);
  });
}
