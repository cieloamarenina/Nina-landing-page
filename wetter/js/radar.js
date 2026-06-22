// Animated precipitation radar (RainViewer) on a Leaflet dark base map.
// Leaflet MUST be initialised while its container is visible & sized, so call
// mountRadar() only after the radar tab is first shown. Returns an API with
// recenter(place) so the map follows the active city.

const RAINVIEWER_INDEX = "https://api.rainviewer.com/public/weather-maps.json";
const FRAME_MS = 600;

export function mountRadar(host, { place, t }) {
  if (host._radar) return host._radar; // guard double-mount

  const L = window.L;
  host.innerHTML = `
    <div class="radar-wrap">
      <div id="radar-map" class="radar-map"></div>
      <div class="radar-bar">
        <button class="radar-play" type="button" aria-label="${t ? t("radar.pause") : "Pause"}">⏸</button>
        <span class="radar-time">—</span>
      </div>
    </div>`;

  const mapEl = host.querySelector("#radar-map");
  const playBtn = host.querySelector(".radar-play");
  const timeEl = host.querySelector(".radar-time");

  const map = L.map(mapEl, { zoomControl: true, attributionControl: true })
    .setView([place.lat, place.lon], 6);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd", maxZoom: 19,
  }).addTo(map);

  let frames = [];      // [{ time, path }]
  let apiHost = "";     // RainViewer tile host
  let idx = 0;
  let activeLayer = null;
  let timer = null;
  let playing = true;

  function frameUrl(frame) {
    return `${apiHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
  }

  function showFrame(i) {
    if (!frames.length) return;
    idx = ((i % frames.length) + frames.length) % frames.length;
    const frame = frames[idx];
    const layer = L.tileLayer(frameUrl(frame), { opacity: 0.7, zIndex: 5 }).addTo(map);
    const prev = activeLayer;
    activeLayer = layer;
    // Cross-fade: remove the previous layer once the new one is added so the
    // animation doesn't flash to empty between frames.
    layer.once("load", () => { if (prev) map.removeLayer(prev); });
    setTimeout(() => { if (prev && map.hasLayer(prev)) map.removeLayer(prev); }, 700);
    const d = new Date(frame.time * 1000);
    timeEl.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function start() {
    stop();
    playing = true;
    playBtn.textContent = "⏸";
    if (t) playBtn.setAttribute("aria-label", t("radar.pause"));
    timer = setInterval(() => showFrame(idx + 1), FRAME_MS);
  }
  function stop() {
    playing = false;
    playBtn.textContent = "▶";
    if (t) playBtn.setAttribute("aria-label", t("radar.play"));
    if (timer) { clearInterval(timer); timer = null; }
  }
  playBtn.addEventListener("click", () => (playing ? stop() : start()));

  fetch(RAINVIEWER_INDEX)
    .then((r) => r.json())
    .then((data) => {
      apiHost = data.host;
      const past = (data.radar && data.radar.past) || [];
      const nowcast = (data.radar && data.radar.nowcast) || [];
      frames = past.concat(nowcast);
      if (frames.length) { showFrame(frames.length - 1); start(); }
      else timeEl.textContent = "—";
    })
    .catch(() => { timeEl.textContent = "—"; });

  const api = {
    map,
    invalidate() { map.invalidateSize(); },
    recenter(p) { if (p) map.setView([p.lat, p.lon], map.getZoom()); },
    destroy() { stop(); map.remove(); host._radar = null; },
  };
  host._radar = api;
  return api;
}
