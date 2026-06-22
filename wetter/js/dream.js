import { forecastUrl, parseForecast, cachedJson } from "./api.js";
import { describeCode } from "./weather-codes.js";

// Paradise destinations for the dream-weather contrast card.
const DREAMS = [
  { name: "Malediven",  lat: 4.17,   lon: 73.51 },
  { name: "Bali",       lat: -8.65,  lon: 115.22 },
  { name: "Seychellen", lat: -4.62,  lon: 55.45 },
  { name: "Hawaii",     lat: 21.31,  lon: -157.86 },
  { name: "Bora Bora",  lat: -16.50, lon: -151.74 },
  { name: "Barbados",   lat: 13.10,  lon: -59.62 },
  { name: "Phuket",     lat: 7.88,   lon: 98.39 },
  { name: "Mauritius",  lat: -20.35, lon: 57.55 },
];

// Renders the "Traumwetter / dream weather" card into `host`.
// opts: { currentTemp, lang, t, onPick }
export function renderDreamCard(host, { currentTemp, lang, t, onPick }) {
  // Rotate the starting destination by an index-like seed (changes through the day)
  // so the same city doesn't always show first.
  let idx = Math.floor(Date.now() / 3600000) % DREAMS.length;

  const card = document.createElement("div");
  card.className = "card dreamcard";
  card.setAttribute("role", "button");
  card.tabIndex = 0;
  host.appendChild(card);

  async function show() {
    const dest = DREAMS[idx];
    card.classList.add("loading");
    let temp = null, wx = null;
    try {
      const json = await cachedJson(forecastUrl(dest));
      const f = parseForecast(json);
      temp = f.current.temp;
      wx = describeCode(f.current.code, true);
    } catch {
      // leave temp null; render a graceful fallback below
    }
    card.classList.remove("loading");

    const place = t("dream.line", { place: dest.name });
    let badge = "";
    if (temp != null && currentTemp != null) {
      const d = temp - currentTemp;
      badge = d > 0
        ? `<span class="dream-badge warm">${t("dream.warmer", { d })}</span>`
        : `<span class="dream-badge home">${t("dream.athome")}</span>`;
    }
    const tempBlock = temp != null
      ? `<div class="dream-temp"><span class="dream-icon">${wx.icon}</span><span class="dream-deg">${temp}°</span></div>`
      : `<div class="dream-temp"><span class="dream-deg">…</span></div>`;

    card.innerHTML = `
      <div class="dream-head">
        <span class="label dream-label">🏝️ ${t("dream.title")}</span>
        <button class="dream-shuffle icobtn" title="${t("dream.shuffle")}" aria-label="${t("dream.shuffle")}">🔄</button>
      </div>
      <div class="dream-line">${place}</div>
      <div class="dream-body">
        ${tempBlock}
        <span class="dream-go" aria-hidden="true">→</span>
      </div>
      ${badge}
    `;

    const shuffle = card.querySelector(".dream-shuffle");
    shuffle.addEventListener("click", (e) => {
      e.stopPropagation();           // don't trigger tap-to-load
      idx = (idx + 1) % DREAMS.length;
      show();
    });
  }

  // Whole card taps through to actually visiting the destination (escapism).
  const go = () => {
    const dest = DREAMS[idx];
    onPick?.({ name: dest.name, country: "", lat: dest.lat, lon: dest.lon });
  };
  card.addEventListener("click", go);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
  });

  show();
}
