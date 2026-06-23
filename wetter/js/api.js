import { CONFIG } from "../config.js";

const HOURLY = [
  "temperature_2m","apparent_temperature","precipitation_probability",
  "weather_code","wind_speed_10m","wind_gusts_10m","uv_index","relative_humidity_2m"
].join(",");
const DAILY = [
  "weather_code","temperature_2m_max","temperature_2m_min","sunrise","sunset",
  "precipitation_sum","uv_index_max","wind_speed_10m_max"
].join(",");

export function forecastUrl({ lat, lon }) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current_weather=true&hourly=${HOURLY}&daily=${DAILY}&forecast_days=16&timezone=auto`;
}
export function geocodeUrl(query, lang) {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}`
    + `&count=8&language=${lang}&format=json`;
}
export function airQualityUrl({ lat, lon }) {
  const fields = "european_aqi,pm2_5,alder_pollen,birch_pollen,grass_pollen";
  return `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}`
    + `&current=${fields}&timezone=auto`;
}

const memStore = new Map();
export async function cachedJson(url, opts = {}) {
  const ttlMs = opts.ttlMs ?? 10 * 60 * 1000;
  const now = opts.now ?? Date.now;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const store = opts.store ?? memStore;
  const hit = store.get(url);
  if (hit && now() - hit.t < ttlMs) return hit.data;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`fetch failed ${url}`);
  const data = await res.json();
  store.set(url, { t: now(), data });
  return data;
}

export function windyNearbyUrl({ lat, lon }) {
  return `https://api.windy.com/webcams/api/v3/webcams?nearby=${lat},${lon},50&limit=5&include=images,location`;
}
export function parseWindy(json) {
  const cam = (json.webcams || []).find(w => w.status === "active");
  return cam ? { id: cam.webcamId, title: cam.title } : null;
}
export function liveImageUrl(id) {
  return `https://imgproxy.windy.com/_/preview/plain/current/${id}/original.jpg`;
}
// Both helpers go through the n8n proxy (CONFIG.PROXY) so the Windy/Pexels keys
// never reach the browser. The proxy forwards the upstream JSON unchanged.
export async function fetchWindyCam(place) {
  if (!CONFIG.PROXY) return null;
  const res = await fetch(`${CONFIG.PROXY}?type=cam&lat=${place.lat}&lon=${place.lon}`);
  if (!res.ok) return null;
  return parseWindy(await res.json());
}
export async function photoUrl(place, partOfDay) {
  if (!CONFIG.PROXY) return null;
  // "<city> skyline <day|night>": "skyline" keeps the shot recognizably the
  // right city; the day/night word matches the local time so a daytime view
  // isn't a dark night photo (and vice-versa).
  const q = encodeURIComponent(`${place.name} skyline ${partOfDay}`);
  const res = await fetch(`${CONFIG.PROXY}?type=photo&q=${q}`);
  if (!res.ok) return null;
  const j = await res.json();
  const list = j.photos || [];
  if (!list.length) return null;
  // Rotate through the day so the hero isn't the same photo all day long:
  // the hour-of-day picks one of the ~20 results (stable within the hour).
  const idx = new Date().getHours() % list.length;
  return (list[idx] || list[0]).src?.portrait || null;
}

export function parseGeocode(json) {
  return (json.results || []).map(r => ({
    name: r.name, country: r.country, admin1: r.admin1, lat: r.latitude, lon: r.longitude
  }));
}
export function parseForecast(json) {
  const cw = json.current_weather || {};
  const h = json.hourly || {};
  const d = json.daily || {};
  // find current hour index by matching is_day flag source: use first hour for fields not in current_weather
  const i = 0;
  const current = {
    temp: Math.round(cw.temperature),
    feels: Math.round((h.apparent_temperature||[])[i] ?? cw.temperature),
    code: cw.weathercode,
    wind: Math.round(cw.windspeed),
    gust: Math.round((h.wind_gusts_10m||[])[i] ?? 0),
    humidity: (h.relative_humidity_2m||[])[i] ?? null,
    uv: (h.uv_index||[])[i] ?? null,
    isDay: cw.is_day === 1
  };
  const hours = (h.time||[]).map((iso, k) => ({
    iso, temp: Math.round(h.temperature_2m[k]), code: h.weather_code[k], pop: h.precipitation_probability[k]
  }));
  const days = (d.time||[]).map((iso, k) => ({
    iso, code: d.weather_code[k], max: Math.round(d.temperature_2m_max[k]),
    min: Math.round(d.temperature_2m_min[k]), sunrise: d.sunrise[k], sunset: d.sunset[k]
  }));
  return { current, hours, days };
}
