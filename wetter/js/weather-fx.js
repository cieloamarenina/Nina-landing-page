export function applyFx(sceneEl, fxEl, { fx, isDay }) {
  sceneEl.dataset.fx = fx;
  sceneEl.dataset.day = isDay ? "day" : "night";
  fxEl.innerHTML = "";
  if (fx === "rain" || fx === "storm") spawnRain(fxEl, fx === "storm");
  if (fx === "snow") spawnSnow(fxEl);
}
function spawnRain(el, storm) {
  for (let i=0;i<90;i++){const d=document.createElement("div");d.className="drop";
    d.style.left=Math.random()*100+"%";d.style.animationDuration=(0.5+Math.random()*0.5)+"s";
    d.style.animationDelay=(-Math.random()*2)+"s";d.style.opacity=0.3+Math.random()*0.6;el.appendChild(d);}
  if (storm){const l=document.createElement("div");l.className="lightning";el.appendChild(l);}
}
function spawnSnow(el){
  for (let i=0;i<60;i++){const s=document.createElement("div");s.className="flake";
    s.style.left=Math.random()*100+"%";s.style.animationDuration=(3+Math.random()*4)+"s";
    s.style.animationDelay=(-Math.random()*5)+"s";el.appendChild(s);}
}
