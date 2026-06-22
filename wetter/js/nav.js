const TABS = [
  { view: "home", icon: "🏠", key: "nav.home" },
  { view: "map", icon: "🗺️", key: "nav.map" },
  { view: "radar", icon: "🌧️", key: "nav.radar" },
  { view: "compare", icon: "⚖️", key: "nav.compare" },
];

// Renders a fixed bottom glass tab bar and wires tap → onSwitch(viewName),
// highlighting the active tab. Returns the bar element.
export function mountNav(rootEl, { t, onSwitch }) {
  const nav = document.createElement("nav");
  nav.className = "tabbar";

  const buttons = TABS.map(tab => {
    const b = document.createElement("button");
    b.className = "tab";
    b.dataset.view = tab.view;
    b.innerHTML = `<span class="ti">${tab.icon}</span><span class="tl">${t(tab.key)}</span>`;
    b.onclick = () => { setActive(tab.view); onSwitch(tab.view); };
    nav.appendChild(b);
    return b;
  });

  function setActive(view) {
    buttons.forEach(b => b.classList.toggle("on", b.dataset.view === view));
  }
  setActive("home");

  rootEl.appendChild(nav);
  return nav;
}
