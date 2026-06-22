import { isTap, clampPos } from "./drag.js";

const PLAYLISTS = [
  { emoji:"💻", label:"Coding", id:"53ebDyYHhHmElRY1Epe97N", name:"Nina is coding" },
  { emoji:"🎛️", label:"Test", id:"0rF7rgJx8xR5aU87Y4qlSP", name:"Testing 123" },
  { emoji:"🥁", label:"Alesis", id:"362d7BAhWSIjPTmd74o1pL", name:"Alesis" },
  { emoji:"🧊", label:"Chill", id:"37i9dQZF1DX4WYpdgoIcn6", name:"Chill Hits" },
  { emoji:"🌊", label:"Aqua Feelin'", id:"0gmft5pcMN8iDI30vspobp", name:"Aqua Feelin'" },
  { emoji:"🏆", label:"Top All-Time", id:"2R10VQvUU02ga3185KXjR6", name:"Your All-Time Top Songs" },
];

// Load the official Spotify IFrame API once (gives a controller with play()/loadUri()
// — the same approach as the penalty game; programmatic play works inside a user gesture).
function ensureSpotifyApi(cb) {
  if (window.__spotifyIframeAPI) { cb(window.__spotifyIframeAPI); return; }
  (window.__spotifyApiCbs = window.__spotifyApiCbs || []).push(cb);
  if (window.__spotifyApiLoading) return;
  window.__spotifyApiLoading = true;
  window.onSpotifyIframeApiReady = (API) => {
    window.__spotifyIframeAPI = API;
    (window.__spotifyApiCbs || []).forEach(fn => fn(API));
    window.__spotifyApiCbs = [];
  };
  const s = document.createElement("script");
  s.src = "https://open.spotify.com/embed/iframe-api/v1";
  s.async = true;
  document.head.appendChild(s);
}

export function mountPablo(rootEl, { storage }) {
  const el = document.createElement("div");
  el.className = "player playing"; // start expanded so the player + play button are visible
  el.innerHTML = `
    <div class="ppanel">
      <div class="mlabel"><span class="pablo-now-dot"></span><span id="mtitle">${PLAYLISTS[0].name}</span></div>
      <div class="pchips"></div>
      <div id="spotify-embed"></div>
    </div>
    <button class="ptoggle"><span class="pablo-ring"></span><img src="img/pablo.png" alt="Pablo"></button>
    <div class="pablo-label">PABLO</div>`;
  rootEl.appendChild(el);

  const chips = el.querySelector(".pchips"), title = el.querySelector("#mtitle");
  let controller = null, wantPlay = false, cur = PLAYLISTS[0].id;

  // Start (or resume) playback. Must be called from within a user gesture the first time.
  function startMusic() {
    if (!controller) { wantPlay = true; return; }
    try { controller.play(); } catch (e) { try { controller.resume(); } catch (_) {} }
  }

  ensureSpotifyApi((API) => {
    API.createController(
      el.querySelector("#spotify-embed"),
      { uri: "spotify:playlist:" + cur, width: "100%", height: 152 },
      (ctrl) => { controller = ctrl; if (wantPlay) startMusic(); }
    );
  });

  const load = (p, btn) => {
    title.textContent = p.name;
    chips.querySelectorAll("button").forEach(b => b.classList.remove("on"));
    btn?.classList.add("on");
    if (p.id !== cur) {
      cur = p.id;
      if (controller) controller.loadUri("spotify:playlist:" + p.id);
    }
    startMusic(); // a chip click is a user gesture → play
  };
  PLAYLISTS.forEach((p, i) => {
    const b = document.createElement("button");
    b.textContent = `${p.emoji} ${p.label}`;
    b.onclick = () => load(p, b);
    if (i === 0) b.classList.add("on");
    chips.appendChild(b);
  });

  // Auto-start on the FIRST interaction anywhere in the app (kickoff-style; bypasses
  // the browser autoplay block because it runs inside a real user gesture).
  const firstGesture = () => {
    startMusic();
    window.removeEventListener("pointerdown", firstGesture, true);
    window.removeEventListener("keydown", firstGesture, true);
  };
  window.addEventListener("pointerdown", firstGesture, true);
  window.addEventListener("keydown", firstGesture, true);

  // restore position
  const saved = JSON.parse(storage.getItem("aether.pablo.pos") || "null");
  if (saved) { el.style.right="auto"; el.style.bottom="auto"; el.style.left=saved.x+"px"; el.style.top=saved.y+"px"; }

  // drag + tap
  const toggle = el.querySelector(".ptoggle");
  toggle.style.touchAction = "none";
  let drag = null;
  toggle.addEventListener("pointerdown", e => {
    const r = el.getBoundingClientRect();
    drag = { sx:e.clientX, sy:e.clientY, ox:r.left, oy:r.top, moved:false };
    el.style.transition = "none"; toggle.setPointerCapture(e.pointerId);
  });
  toggle.addEventListener("pointermove", e => {
    if (!drag) return; const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy;
    if (!isTap(dx, dy)) {
      drag.moved = true; el.style.right="auto"; el.style.bottom="auto";
      const pos = clampPos(drag.ox+dx, drag.oy+dy, innerWidth, innerHeight, 84, 110);
      el.style.left = pos.x+"px"; el.style.top = pos.y+"px";
    }
  });
  toggle.addEventListener("pointerup", () => {
    if (drag && !drag.moved) { el.classList.toggle("collapsed"); el.classList.add("playing"); startMusic(); }
    else if (drag) storage.setItem("aether.pablo.pos", JSON.stringify({ x: parseInt(el.style.left), y: parseInt(el.style.top) }));
    drag = null;
  });
}
