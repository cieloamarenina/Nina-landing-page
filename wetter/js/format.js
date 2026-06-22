export function aqiCategory(aqi) {
  if (aqi <= 20) return { key: "aqi.good", color: "#a3e635" };
  if (aqi <= 40) return { key: "aqi.fair", color: "#22c55e" };
  if (aqi <= 60) return { key: "aqi.moderate", color: "#febc2e" };
  if (aqi <= 80) return { key: "aqi.poor", color: "#f87171" };
  return { key: "aqi.verypoor", color: "#ef4444" };
}
export function fmtTime(iso, lang) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}
export function fmtHour(iso, lang) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(lang, { hour: "numeric" }).format(d);
}
