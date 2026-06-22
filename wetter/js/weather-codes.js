// WMO weather code → display + fx bucket
const RAIN = new Set([51,53,55,56,57,61,63,65,66,67,80,81,82]);
const SNOW = new Set([71,73,75,77,85,86]);
const STORM = new Set([95,96,99]);
const CLOUDS = new Set([1,2,3,45,48]);

export function describeCode(code, isDay) {
  if (code === 0) return { icon: isDay ? "☀️" : "🌙", textKey: "wx.clear", fx: "clear" };
  if (STORM.has(code)) return { icon: "⛈️", textKey: "wx.storm", fx: "storm" };
  if (SNOW.has(code)) return { icon: "❄️", textKey: "wx.snow", fx: "snow" };
  if (RAIN.has(code)) return { icon: "🌧️", textKey: "wx.rain", fx: "rain" };
  if (CLOUDS.has(code)) return { icon: isDay ? "⛅" : "☁️", textKey: "wx.clouds", fx: "clouds" };
  return { icon: "⛅", textKey: "wx.clouds", fx: "clouds" };
}
