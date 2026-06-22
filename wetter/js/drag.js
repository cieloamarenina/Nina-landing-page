export function isTap(dx, dy, threshold = 5) {
  return Math.abs(dx) <= threshold && Math.abs(dy) <= threshold;
}
export function clampPos(x, y, vw, vh, w, h, pad = 6) {
  return {
    x: Math.max(pad, Math.min(vw - w - pad, x)),
    y: Math.max(pad, Math.min(vh - h - pad, y))
  };
}
