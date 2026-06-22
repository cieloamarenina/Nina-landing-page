// Vertical cyan gradient under the line: opaque-ish at top → transparent at bottom.
function areaGradient(u) {
  const ctx = u.ctx;
  const { top, height } = u.bbox;
  const g = ctx.createLinearGradient(0, top, 0, top + height);
  g.addColorStop(0, "rgba(0,212,255,0.35)");
  g.addColorStop(1, "rgba(0,212,255,0)");
  return g;
}

function lineSeries() {
  return {
    stroke: "#00d4ff",
    width: 2.5,
    points: { show: false },
    fill: areaGradient,
  };
}

export function renderTrendChart(host, days) {
  const xs = days.map((_, i) => i);
  const ys = days.map(d => d.max);
  const opts = {
    width: host.clientWidth || 360, height: 150,
    scales: { x: { time: false } },
    axes: [{ stroke: "#6b7fa3" }, { stroke: "#6b7fa3" }],
    cursor: { show: false },
    legend: { show: false },
    series: [ {}, lineSeries() ],
  };
  // eslint-disable-next-line no-undef
  new uPlot(opts, [xs, ys], host);
}

export function renderHourlyChart(host, hours) {
  const data = hours.slice(0, 24);
  const xs = data.map((_, i) => i);
  const ys = data.map(h => h.temp);
  const opts = {
    width: host.clientWidth || 360, height: 150,
    scales: { x: { time: false } },
    axes: [{ stroke: "#6b7fa3" }, { stroke: "#6b7fa3" }],
    cursor: { show: false },
    legend: { show: false },
    series: [ {}, lineSeries() ],
  };
  // eslint-disable-next-line no-undef
  new uPlot(opts, [xs, ys], host);
}
