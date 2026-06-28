import { forecastUrl, airQualityUrl, parseForecast, cachedJson, fetchWindyCam, photoUrl } from "./api.js";
import { pickLang, translator, loadDict } from "./i18n.js";
import { renderHero, setHeroPhoto, setHeroLive } from "./hero.js";
import { renderPanel } from "./panel.js";
import { renderSunCard } from "./sun.js";
import { renderDreamCard } from "./dream.js";
import { applyFx } from "./weather-fx.js";
import { describeCode } from "./weather-codes.js";
import { renderTrendChart, renderHourlyChart } from "./charts.js";
import { mountSearch } from "./search.js";
import { makeFavorites, idOf } from "./favorites.js";
import { mountPablo } from "./pablo.js";
import { mountNav } from "./nav.js";
import { mountCompare } from "./compare.js";
import { mountWorldMap } from "./worldmap.js";
import { mountRadar } from "./radar.js";

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});

const AVAILABLE = ["de","en","es","fr","it","he"];
const DEFAULT = { name:"Berlin", country:"Deutschland", lat:52.52, lon:13.40 };
const LAST_KEY = "aether.last";
const LANG_KEY = "aether.lang";
const FORECAST_KEY = "aether.lastForecast";

let t, lang, favs, stage, favsHost;
let views = {};
let currentPlace = null;
let compareMounted = false;
let mapMounted = false;
let mapApi = null;
let mapIsDay = true; // tracks current place's day/night, applied when map mounts/loads
let radarApi = null;

// Show the selected view, hide the others.
function switchView(view) {
  for (const [name, el] of Object.entries(views)) {
    el.style.display = name === view ? "" : "none";
  }
  // Mount the compare view lazily on first open; guard against double-mount.
  if (view === "compare" && !compareMounted) {
    compareMounted = true;
    mountCompare(views.compare, { lang, t, currentPlace });
  }
  // Mount the radar lazily on first open. Leaflet needs a visible, sized
  // container, so we init here (the view is now display:"") then invalidate.
  if (view === "radar") {
    if (!radarApi && currentPlace) {
      radarApi = mountRadar(views.radar, { place: currentPlace, t });
    }
    if (radarApi) requestAnimationFrame(() => radarApi.invalidate());
  }
  // Mount the world map lazily on first open; tapping a city loads it on home.
  if (view === "map" && !mapMounted) {
    mapMounted = true;
    Promise.resolve(mountWorldMap(views.map, {
      lang, t, isDay: mapIsDay,
      onPickCity: (city) => {
        const place = { name: city.name, country: "", lat: city.lat, lon: city.lon };
        localStorage.setItem(LAST_KEY, JSON.stringify(place));
        loadPlace(place);
        switchView("home");
        document.querySelector('.tabbar .tab[data-view="home"]')?.classList.add("on");
        document.querySelectorAll('.tabbar .tab:not([data-view="home"])').forEach(b => b.classList.remove("on"));
      },
    })).then(api => { mapApi = api; mapApi.setTime(mapIsDay); });
  }
}
let renderSeq = 0;

async function loadPlace(place) {
  // Token guards against stale async renders: only the latest call commits to the DOM.
  const token = ++renderSeq;

  let forecast, air = null, offline = false;
  try {
    // Fetch first (async), then clear + render synchronously so concurrent
    // loadPlace calls cannot interleave their appends (no stacking).
    const json = await cachedJson(forecastUrl(place));
    try { const aj = await cachedJson(airQualityUrl(place)); air = aj.current; } catch {}
    if (token !== renderSeq) return; // a newer loadPlace started; abandon this render
    forecast = parseForecast(json);
    currentPlace = place;
    if (radarApi) radarApi.recenter(place); // follow the active city on the radar
    localStorage.setItem(FORECAST_KEY, JSON.stringify({ place, forecast }));
  } catch {
    if (token !== renderSeq) return; // a newer loadPlace started; abandon this render
    const cached = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null");
    if (!cached) return; // no data and no cache — nothing to show
    place = cached.place;
    forecast = cached.forecast;
    currentPlace = place;
    offline = true;
  }

  // Clear previous render so switching places replaces content (no stacking).
  stage.innerHTML = "";

  if (offline) {
    const banner = document.createElement("div");
    banner.className = "offline-banner";
    banner.textContent = t("msg.offline");
    stage.appendChild(banner);
  }

  const heroHost = document.createElement("div");
  stage.appendChild(heroHost);
  renderHero(heroHost, { place, forecast, t, lang });
  addFavStar(heroHost, place);

  const current = forecast.current;
  // Theme the world map by the active place's day/night.
  mapIsDay = !!current.isDay;
  if (mapApi) mapApi.setTime(mapIsDay);
  const wx = describeCode(current.code, current.isDay);
  applyFx(document.querySelector(".scene"), heroHost.querySelector("#hero-fx"), { fx: wx.fx, isDay: current.isDay });

  // Hero imagery — city photo (Pexels) + optional Windy live cam. Failures fall back silently.
  const part = current.isDay ? "day" : "night";
  const photoEl = heroHost.querySelector("#hero-photo");
  // Photo first — INDEPENDENT so a slow/hanging/missing cam never blocks the hero photo.
  photoUrl(place, part).catch(() => null).then(photo => {
    if (token !== renderSeq) return;
    setHeroPhoto(photoEl, photo);
  });
  // Live cam (the "● Live" toggle) — separate; if it hangs or fails, the photo already shows.
  fetchWindyCam(place).catch(() => null).then(cam => {
    if (token !== renderSeq || !cam) return;
    setHeroLive(photoEl, {
      liveId: cam.id,
      liveLabel: `${t("label.live")} · ${place.name}`,
      liveText: t("label.live"), photoText: t("label.photo")
    });
  });

  const panelHost = document.createElement("div");
  stage.appendChild(panelHost);
  renderPanel(panelHost, { forecast, air, t, lang });

  const panel = panelHost.querySelector(".panel");

  const sunHost = document.createElement("div");
  panel.appendChild(sunHost);
  renderSunCard(sunHost, forecast.days[0], lang, t);

  // Traumwetter / dream-weather contrast card — its async fetch is detached, so
  // it stays inside the render-token guard via the stage clear on city switch.
  const dreamHost = document.createElement("div");
  panel.appendChild(dreamHost);
  renderDreamCard(dreamHost, {
    currentTemp: forecast.current.temp,
    current: place,
    lang, t,
    onPick: (place) => {
      localStorage.setItem(LAST_KEY, JSON.stringify(place));
      loadPlace(place);
      switchView("home");
      document.querySelector('.tabbar .tab[data-view="home"]')?.classList.add("on");
      document.querySelectorAll('.tabbar .tab:not([data-view="home"])').forEach(b => b.classList.remove("on"));
    },
  });

  const hourlyCard = document.createElement("div");
  hourlyCard.className = "card chartcard";
  hourlyCard.innerHTML = `<div class="label">${t("label.hourly")} · °</div><div id="hourly"></div>`;
  panel.appendChild(hourlyCard);
  renderHourlyChart(hourlyCard.querySelector("#hourly"), forecast.hours);

  const chartCard = document.createElement("div");
  chartCard.className = "card chartcard";
  chartCard.innerHTML = `<div class="label">${t("label.trend")}</div><div id="trend"></div>`;
  panel.appendChild(chartCard);
  renderTrendChart(chartCard.querySelector("#trend"), forecast.days);

  // Smooth city switch: fade the freshly-rendered stage in.
  stage.classList.remove("fade-in");
  void stage.offsetWidth; // reflow so the animation restarts on each render
  stage.classList.add("fade-in");

  renderFavs();
}

function addFavStar(heroHost, place) {
  const info = heroHost.querySelector(".arch") || heroHost.querySelector(".hero");
  if (!info) return;
  const star = document.createElement("button");
  star.className = "star icobtn";
  const id = idOf(place);
  const sync = () => { star.textContent = favs.has(id) ? "★" : "☆"; star.classList.toggle("on", favs.has(id)); };
  star.onclick = () => {
    if (favs.has(id)) favs.remove(id); else favs.add(place);
    sync(); renderFavs();
  };
  sync();
  info.appendChild(star);
}

function renderFavs() {
  if (!favsHost) return;
  const list = favs.list();
  favsHost.innerHTML = list.length
    ? `<div class="favs">${list.map((p, i) =>
        `<button class="fav" data-i="${i}"><span class="fn">${p.name}</span><span class="fc">${p.country || ""}</span></button>`).join("")}</div>`
    : "";
  favsHost.querySelectorAll(".fav[data-i]").forEach(b =>
    b.onclick = () => { const p = list[+b.dataset.i]; localStorage.setItem(LAST_KEY, JSON.stringify(p)); loadPlace(p); });
}

function cycleLang() {
  const i = AVAILABLE.indexOf(lang);
  const next = AVAILABLE[(i + 1) % AVAILABLE.length];
  localStorage.setItem(LANG_KEY, next);
  boot();
}

async function boot() {
  const saved = localStorage.getItem(LANG_KEY);
  lang = saved && AVAILABLE.includes(saved) ? saved : pickLang(navigator.language, AVAILABLE);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  t = translator(await loadDict(lang));
  favs = makeFavorites(localStorage);

  const scene = document.querySelector(".scene");
  scene.innerHTML = "";

  // Home view wraps the existing weather content (search, favorites, stage).
  const home = document.createElement("div");
  home.id = "view-home";
  scene.appendChild(home);

  const bar = document.createElement("div");
  home.appendChild(bar);
  mountSearch(bar, { lang, t, onPick: p => { localStorage.setItem(LAST_KEY, JSON.stringify(p)); loadPlace(p); } });

  const langRow = document.createElement("div");
  langRow.id = "lang";
  langRow.className = "lang-row";
  AVAILABLE.forEach(code => {
    const b = document.createElement("button");
    b.className = "lang-btn" + (code === lang ? " on" : "");
    b.dataset.lang = code;
    b.textContent = code === "he" ? "עברית" : code.toUpperCase();
    if (code === "he") b.lang = "he";
    b.onclick = () => {
      if (code === lang) return;
      localStorage.setItem(LANG_KEY, code);
      boot();
    };
    langRow.appendChild(b);
  });
  const topbar = bar.querySelector(".topbar");
  (topbar || bar).appendChild(langRow);

  favsHost = document.createElement("div");
  home.appendChild(favsHost);

  stage = document.createElement("div");
  stage.id = "stage";
  home.appendChild(stage);

  // Placeholder views — later tasks fill these.
  const placeholder = (id, key) => {
    const el = document.createElement("div");
    el.id = id;
    el.className = "view-placeholder";
    el.style.display = "none";
    el.innerHTML = `<div class="ph-label">${t(key)}</div>`;
    scene.appendChild(el);
    return el;
  };
  const map = document.createElement("div");
  map.id = "view-map";
  map.className = "view-map";
  map.style.display = "none";
  scene.appendChild(map);
  mapMounted = false;

  const radar = document.createElement("div");
  radar.id = "view-radar";
  radar.className = "view-radar";
  radar.style.display = "none";
  scene.appendChild(radar);
  radarApi = null;

  const compare = document.createElement("div");
  compare.id = "view-compare";
  compare.className = "view-compare";
  compare.style.display = "none";
  scene.appendChild(compare);
  compareMounted = false;

  views = { home, map, radar, compare };

  mountNav(scene, { t, onSwitch: switchView });
  switchView("home");

  const last = JSON.parse(localStorage.getItem(LAST_KEY) || "null");
  await loadPlace(last || DEFAULT);
}
boot();
mountPablo(document.body, { storage: localStorage });
