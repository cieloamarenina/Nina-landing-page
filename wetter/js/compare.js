import { geocodeUrl, parseGeocode, forecastUrl, parseForecast, cachedJson } from "./api.js";
import { describeCode } from "./weather-codes.js";

// Two-city side-by-side comparison. Each slot has a small geocode search;
// picking a city fetches its forecast and renders a column. The "winner"
// per metric is highlighted in accent.
export function mountCompare(host, { lang, t, currentPlace }) {
  host.innerHTML = `
    <div class="cmp">
      <div class="cmp-slots">
        <div class="cmp-slot" data-slot="a"></div>
        <div class="cmp-div"></div>
        <div class="cmp-slot" data-slot="b"></div>
      </div>
    </div>`;

  const slotEls = {
    a: host.querySelector('[data-slot="a"]'),
    b: host.querySelector('[data-slot="b"]'),
  };
  const data = { a: null, b: null }; // { place, forecast }

  function renderSlot(key, place) {
    const el = slotEls[key];
    const ph = key === "a" ? t("compare.slotA") : t("compare.slotB");
    el.innerHTML = `
      <div class="cmp-search">
        <input class="search cmp-q" placeholder="${ph}">
        <div class="results cmp-res"></div>
      </div>
      <div class="cmp-col"></div>`;
    wireSearch(key, el);
    if (place) {
      el.querySelector(".cmp-q").value = place.name;
      load(key, place);
    } else {
      data[key] = null;
      renderColumns();
    }
  }

  function wireSearch(key, el) {
    const q = el.querySelector(".cmp-q");
    const results = el.querySelector(".cmp-res");
    let timer;
    q.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (q.value.trim().length < 2) { results.innerHTML = ""; return; }
        const json = await cachedJson(geocodeUrl(q.value.trim(), lang), { ttlMs: 60000 });
        const places = parseGeocode(json);
        results.innerHTML = places.map((p, i) =>
          `<div class="res" data-i="${i}">${p.name}${p.admin1 ? `, ${p.admin1}` : ""} · ${p.country}</div>`).join("")
          || `<div class="res muted">${t("msg.noresults")}</div>`;
        results.querySelectorAll(".res[data-i]").forEach(d =>
          d.onclick = () => {
            results.innerHTML = "";
            const p = places[+d.dataset.i];
            q.value = p.name;
            load(key, p);
          });
      }, 250);
    });
  }

  async function load(key, place) {
    const col = slotEls[key].querySelector(".cmp-col");
    col.innerHTML = `<div class="cmp-loading">…</div>`;
    try {
      const json = await cachedJson(forecastUrl(place));
      data[key] = { place, forecast: parseForecast(json) };
    } catch {
      data[key] = null;
      col.innerHTML = `<div class="cmp-loading muted">${t("msg.noresults")}</div>`;
      return;
    }
    renderColumns();
  }

  // Returns a comparable set of metrics for a slot, or null.
  function metrics(d) {
    if (!d) return null;
    const c = d.forecast.current;
    const day = d.forecast.days[0] || {};
    const pop = (d.forecast.hours[0] && d.forecast.hours[0].pop) ?? null;
    return {
      temp: c.temp, code: c.code, isDay: c.isDay,
      max: day.max, min: day.min,
      wind: c.wind, humidity: c.humidity, pop,
    };
  }

  function renderColumns() {
    const ma = metrics(data.a);
    const mb = metrics(data.b);
    // winners: higher temp/max/min wins accent; lower wind/humidity/pop wins.
    const win = (a, b, higher) => {
      if (a == null || b == null) return { a: false, b: false };
      if (a === b) return { a: false, b: false };
      const aWins = higher ? a > b : a < b;
      return { a: aWins, b: !aWins };
    };
    const W = {
      temp: win(ma?.temp, mb?.temp, true),
      max: win(ma?.max, mb?.max, true),
      min: win(ma?.min, mb?.min, true),
      wind: win(ma?.wind, mb?.wind, false),
      humidity: win(ma?.humidity, mb?.humidity, false),
      pop: win(ma?.pop, mb?.pop, false),
    };
    paintColumn("a", data.a, ma, W);
    paintColumn("b", data.b, mb, W);
  }

  function paintColumn(key, d, m, W) {
    const col = slotEls[key].querySelector(".cmp-col");
    if (!col) return;
    if (!d || !m) { col.innerHTML = ""; return; }
    const wx = describeCode(m.code, m.isDay);
    const hi = (metric) => W[metric][key] ? " hi" : "";
    const val = (v, suffix = "") => (v == null ? "–" : `${v}${suffix}`);
    col.innerHTML = `
      <div class="cmp-card card">
        <div class="cmp-name">${d.place.name}</div>
        <div class="cmp-now">
          <span class="cmp-ico">${wx.icon}</span>
          <span class="cmp-temp${hi("temp")}">${val(m.temp, "°")}</span>
        </div>
        <div class="cmp-cond">${t(wx.textKey)}</div>
        <div class="cmp-metrics">
          <div class="cmp-m"><span class="cmp-ml">${t("label.today")}</span><span class="cmp-mv"><span class="${W.max[key] ? "hi" : ""}">${val(m.max, "°")}</span> / <span class="${W.min[key] ? "hi" : ""}">${val(m.min, "°")}</span></span></div>
          <div class="cmp-m"><span class="cmp-ml">${t("label.wind")}</span><span class="cmp-mv${hi("wind")}">${val(m.wind, " km/h")}</span></div>
          <div class="cmp-m"><span class="cmp-ml">${t("label.humidity")}</span><span class="cmp-mv${hi("humidity")}">${val(m.humidity, "%")}</span></div>
          <div class="cmp-m"><span class="cmp-ml">${t("compare.precip")}</span><span class="cmp-mv${hi("pop")}">${val(m.pop, "%")}</span></div>
        </div>
      </div>`;
  }

  renderSlot("a", currentPlace || null);
  renderSlot("b", null);
}
