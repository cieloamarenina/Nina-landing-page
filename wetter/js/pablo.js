import { isTap, clampPos } from "./drag.js";
const PLAYLISTS = [
  { emoji:"💻", label:"Coding", id:"53ebDyYHhHmElRY1Epe97N", name:"Nina is coding" },
  { emoji:"🎛️", label:"Test", id:"0rF7rgJx8xR5aU87Y4qlSP", name:"Testing 123" },
  { emoji:"🥁", label:"Alesis", id:"362d7BAhWSIjPTmd74o1pL", name:"Alesis" },
  { emoji:"🧊", label:"Chill", id:"37i9dQZF1DX4WYpdgoIcn6", name:"Chill Hits" },
  { emoji:"🌊", label:"Aqua Feelin'", id:"0gmft5pcMN8iDI30vspobp", name:"Aqua Feelin'" },
  { emoji:"🏆", label:"Top All-Time", id:"2R10VQvUU02ga3185KXjR6", name:"Your All-Time Top Songs" },
];
export function mountPablo(rootEl, { storage }) {
  const el = document.createElement("div");
  el.className = "player collapsed";
  el.innerHTML = `
    <div class="ppanel">
      <div class="mlabel"><span class="pablo-now-dot"></span><span id="mtitle">${PLAYLISTS[0].name}</span></div>
      <div class="pchips"></div>
      <iframe id="spotify" width="100%" height="80" frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
    </div>
    <button class="ptoggle"><span class="pablo-ring"></span><img src="img/pablo.png" alt="Pablo"></button>
    <div class="pablo-label">PABLO</div>`;
  rootEl.appendChild(el);

  const chips = el.querySelector(".pchips"), iframe = el.querySelector("#spotify"), title = el.querySelector("#mtitle");
  let cur = "";
  const load = (p, btn) => {
    if (p.id !== cur) { cur = p.id; iframe.src = `https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator`; }
    title.textContent = p.name;
    chips.querySelectorAll("button").forEach(b => b.classList.remove("on")); btn?.classList.add("on");
  };
  PLAYLISTS.forEach((p, i) => { const b = document.createElement("button"); b.textContent = `${p.emoji} ${p.label}`;
    b.onclick = () => load(p, b); if (i===0) b.classList.add("on"); chips.appendChild(b); });
  load(PLAYLISTS[0], chips.firstChild);

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
    if (drag && !drag.moved) { el.classList.toggle("collapsed"); el.classList.add("playing"); }
    else if (drag) storage.setItem("aether.pablo.pos", JSON.stringify({ x: parseInt(el.style.left), y: parseInt(el.style.top) }));
    drag = null;
  });
}
