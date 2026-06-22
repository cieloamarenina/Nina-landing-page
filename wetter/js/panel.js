import { describeCode } from "./weather-codes.js";
import { aqiCategory, fmtTime, fmtHour } from "./format.js";
export function renderPanel(el, { forecast, air, t, lang }) {
  const hours = forecast.hours.slice(0, 24).map(h => {
    const wx = describeCode(h.code, true);
    return `<div class="hour"><span class="h">${fmtHour(h.iso, lang)}</span><span class="i">${wx.icon}</span><span class="tp">${h.temp}°</span><span class="p">${h.pop}%</span></div>`;
  }).join("");
  const c = forecast.current;
  const aq = air ? aqiCategory(air.european_aqi) : null;
  const dayRow = d => {
    const wx = describeCode(d.code, true);
    return `<div class="day"><span class="dn">${d.iso.slice(5)}</span><span class="di">${wx.icon}</span><span class="bar"></span><span class="dt">${d.max}° <span>${d.min}°</span></span></div>`;
  };
  const firstDays = forecast.days.slice(0, 3).map(dayRow).join("");
  const restDays = forecast.days.slice(3).map(dayRow).join("");
  el.innerHTML = `
    <div class="panel">
      <div class="card"><div class="label">${t("label.hourly")} · ${t("label.today")}</div><div class="hours">${hours}</div></div>
      <div class="grid">
        <div class="card tile"><div class="s">${t("label.uv")}</div><div class="v">${c.uv ?? "–"}</div></div>
        <div class="card tile"><div class="s">${t("label.humidity")}</div><div class="v">${c.humidity ?? "–"}%</div></div>
        <div class="card tile"><div class="s">${t("label.wind")} · ${t("label.gust")}</div><div class="v">${c.wind}<span class="sub"> / ${c.gust}</span></div></div>
        <div class="card tile"><div class="s">${t("label.airquality")}</div><div class="v">${aq ? air.european_aqi : "–"} <span style="color:${aq?aq.color:'inherit'}">${aq ? t(aq.key) : ""}</span></div></div>
      </div>
      <div class="card"><div class="label">${t("label.forecast")}</div>
        <div class="daily">${firstDays}</div>
        <div class="daily daily-rest" id="daily-rest">${restDays}</div>
        <button class="daystoggle" type="button" aria-expanded="false">
          <span class="dt-label">${t("label.showall")}</span><span class="dt-chev">⌄</span>
        </button>
      </div>
    </div>`;
  const toggle = el.querySelector(".daystoggle");
  const rest = el.querySelector("#daily-rest");
  if (toggle && rest) {
    toggle.onclick = () => {
      const open = rest.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector(".dt-label").textContent = open ? t("label.showless") : t("label.showall");
    };
  }
}
