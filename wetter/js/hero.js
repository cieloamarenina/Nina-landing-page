import { describeCode } from "./weather-codes.js";

let liveTimer = null;

// Photo is the default hero image. If a live cam exists, show a "● Live" toggle
// button (top-right of the arch) that swaps the arch image to the live cam and
// back. The 60s refresh interval only runs while live mode is active.
export function setHeroImage(photoEl, { liveId, photoUrl, liveLabel, liveText, photoText }) {
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  if (photoUrl) photoEl.style.backgroundImage = `url('${photoUrl}')`;

  const arch = photoEl.closest(".arch");
  if (!arch) return;

  let img = arch.querySelector("img.cam");
  let btn = arch.querySelector(".livebtn");

  if (!liveId) {
    if (img) img.remove();
    if (btn) btn.remove();
    return;
  }

  // Ensure the cam <img> exists (hidden by default — photo shows first).
  if (!img) {
    img = document.createElement("img");
    img.className = "cam";
    img.referrerPolicy = "no-referrer";
    img.alt = liveLabel || "live";
    photoEl.after(img);
  }
  img.style.display = "none";

  const startLive = () => {
    const tick = () => { img.src = `https://imgproxy.windy.com/_/preview/plain/current/${liveId}/original.jpg?t=${Date.now()}`; };
    tick();
    liveTimer = setInterval(tick, 60000);
  };
  const stopLive = () => { if (liveTimer) { clearInterval(liveTimer); liveTimer = null; } };

  // Ensure the toggle button exists.
  if (!btn) {
    btn = document.createElement("button");
    btn.className = "livebtn";
    arch.appendChild(btn);
  }
  let live = false;
  const sync = () => {
    btn.innerHTML = `<span class="dot"></span> ${live ? (photoText || "Foto") : (liveText || "Live")}`;
    btn.classList.toggle("on", live);
    img.style.display = live ? "block" : "none";
  };
  btn.onclick = () => {
    live = !live;
    if (live) startLive(); else stopLive();
    sync();
  };
  sync();
}

export function renderHero(el, { place, forecast, t }) {
  const c = forecast.current;
  const wx = describeCode(c.code, c.isDay);
  el.innerHTML = `
    <div class="hero">
      <div class="arch">
        <div class="photo" id="hero-photo"></div>
        <div class="fx" id="hero-fx"></div>
        <div class="flare"></div>
        <div class="grade"></div>
        <div class="scrim"></div>
        <div class="hero-info">
          <div class="loc">📍 ${place.name}, ${place.country}</div>
          <div class="temprow">
            <div class="temp"><span class="tval">${c.temp}</span><sup>°</sup></div>
            <div class="cond">
              <div class="c">${wx.icon} ${t(wx.textKey)}</div>
              <div class="f">${t("label.feels", { t: c.feels })}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="scrollhint" aria-hidden="true">⌄</div>
    </div>`;
  countUp(el.querySelector(".tval"), c.temp);
}

// Subtle count-up tween for the big hero temperature (0 → real value, ~600ms).
function countUp(node, target) {
  if (!node || typeof target !== "number" || !isFinite(target)) return;
  const dur = 600, start = performance.now(), from = 0;
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = Math.round(from + (target - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
