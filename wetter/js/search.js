import { geocodeUrl, parseGeocode, cachedJson } from "./api.js";
export function mountSearch(el, { lang, t, onPick }) {
  el.innerHTML = `<div class="topbar">
    <input id="q" class="search" placeholder="${t("app.search")}">
    <button id="gps" class="icobtn" title="GPS">📍</button>
    <div id="results" class="results"></div></div>`;
  const q = el.querySelector("#q"), results = el.querySelector("#results");
  let timer;
  q.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (q.value.trim().length < 2) { results.innerHTML = ""; return; }
      const json = await cachedJson(geocodeUrl(q.value.trim(), lang), { ttlMs: 60000 });
      const places = parseGeocode(json);
      results.innerHTML = places.map((p, i) =>
        `<div class="res" data-i="${i}">${p.name}${p.admin1?`, ${p.admin1}`:""} · ${p.country}</div>`).join("")
        || `<div class="res muted">${t("msg.noresults")}</div>`;
      results.querySelectorAll(".res[data-i]").forEach(d =>
        d.onclick = () => { results.innerHTML=""; q.value=""; onPick(places[+d.dataset.i]); });
    }, 250);
  });
  el.querySelector("#gps").onclick = () => {
    navigator.geolocation?.getCurrentPosition(pos =>
      onPick({ name: "📍", country: "", lat: pos.coords.latitude, lon: pos.coords.longitude }));
  };
}
