import { fmtTime } from "./format.js";

// Renders the "Sun position & day length" card into `host`.
// `today` is forecast.days[0] with ISO `.sunrise` / `.sunset`.
export function renderSunCard(host, today, lang, t) {
  const sunrise = new Date(today.sunrise);
  const sunset = new Date(today.sunset);
  const now = new Date();

  // Day length in ms -> "Xh Ym"
  const durMs = Math.max(0, sunset - sunrise);
  const totalMin = Math.round(durMs / 60000);
  const dh = Math.floor(totalMin / 60);
  const dm = totalMin % 60;
  const dayLen = `${dh}h ${dm}m`;

  // Fraction of the way through the day, clamped to the arc ends.
  const span = sunset - sunrise;
  let frac = span > 0 ? (now - sunrise) / span : 0;
  const isNight = frac < 0 || frac > 1;
  frac = Math.max(0, Math.min(1, frac));

  // SVG geometry. Top semicircle: y axis points down so we subtract to bow up.
  const W = 260, H = 130, pad = 22;
  const cx = W / 2;
  const cy = H - pad;            // baseline / horizon
  const r = (W - 2 * pad) / 2;   // radius
  const x0 = cx - r, x1 = cx + r;

  // Angle param: theta = pi*(1-frac). frac=0 -> left (sunrise), frac=1 -> right (sunset).
  const theta = Math.PI * (1 - frac);
  const sunX = cx + r * Math.cos(theta);
  const sunY = isNight ? cy + 6 : cy - r * Math.sin(theta);

  const arcColor = isNight ? "rgba(107,127,163,.5)" : "var(--accent)";
  const sunOpacity = isNight ? 0.45 : 1;

  // Arc path: from left baseline up and over to right baseline.
  const arcPath = `M ${x0} ${cy} A ${r} ${r} 0 0 1 ${x1} ${cy}`;

  host.innerHTML = `
    <div class="card suncard">
      <div class="label">${t("label.sunrise")} · ${t("label.sunset")}</div>
      <svg class="sunarc" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id="sunglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="1"/>
            <stop offset="60%" stop-color="var(--accent)" stop-opacity=".5"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <line x1="${pad - 6}" y1="${cy}" x2="${W - pad + 6}" y2="${cy}" stroke="rgba(255,255,255,.10)" stroke-width="1"/>
        <path d="${arcPath}" fill="none" stroke="${arcColor}" stroke-width="2"
              stroke-dasharray="5 6" stroke-linecap="round" opacity="${isNight ? 0.6 : 0.9}"/>
        <circle cx="${sunX}" cy="${sunY}" r="16" fill="url(#sunglow)" opacity="${sunOpacity}"/>
        <circle cx="${sunX}" cy="${sunY}" r="6" fill="var(--accent)" opacity="${sunOpacity}"
                style="filter:drop-shadow(0 0 6px var(--accent))"/>
        <circle cx="${x0}" cy="${cy}" r="3" fill="var(--muted)"/>
        <circle cx="${x1}" cy="${cy}" r="3" fill="var(--muted)"/>
      </svg>
      <div class="sunrow">
        <div class="suntime"><span class="sl">↑ ${t("label.sunrise")}</span><span class="sv">${fmtTime(today.sunrise, lang)}</span></div>
        <div class="daylen"><span class="sl">${t("label.daylength")}</span><span class="dlv">${dayLen}</span></div>
        <div class="suntime end"><span class="sl">↓ ${t("label.sunset")}</span><span class="sv">${fmtTime(today.sunset, lang)}</span></div>
      </div>
    </div>`;
}
