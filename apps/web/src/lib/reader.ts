const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
// a pointer that moves more than this between down and up is a pan, not a tap.
const TAP_THRESHOLD_PX = 10;
// left/right edge fraction that turns pages; the middle is reserved for scroll/pan.
const EDGE = 0.35;
// a horizontal drag longer than this (and clearly more horizontal than vertical)
// counts as a page-turn swipe rather than a scroll.
const SWIPE_THRESHOLD_PX = 45;

/** scale that makes a page's intrinsic (scale-1) width fill the viewport width. */
export function fitWidthScale(pageWidthAt1: number, viewportWidth: number): number {
  if (pageWidthAt1 <= 0 || viewportWidth <= 0) {
    return 1;
  }
  return viewportWidth / pageWidthAt1;
}

/** multiplicative zoom by 20% per step, clamped to sane bounds. */
export function zoomStep(scale: number, dir: 1 | -1): number {
  const next = dir === 1 ? scale * 1.2 : scale / 1.2;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
}

/** keep a page number within [1, total]. */
export function clampPage(page: number, total: number): number {
  if (total < 1) {
    return 1;
  }
  return Math.min(total, Math.max(1, page));
}

/** classify a pointer release: a small movement near an edge turns the page. */
export function tapZone(clickX: number, width: number, movedPx: number): "prev" | "next" | "none" {
  if (movedPx > TAP_THRESHOLD_PX || width <= 0) {
    return "none";
  }
  if (clickX < width * EDGE) {
    return "prev";
  }
  if (clickX > width * (1 - EDGE)) {
    return "next";
  }
  return "none";
}

/** classify a pointer drag as a page turn. right (dx>0) = prev, left = next. */
export function swipeDir(
  dx: number,
  dy: number,
  threshold = SWIPE_THRESHOLD_PX,
): "prev" | "next" | "none" {
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) {
    return "none";
  }
  return dx > 0 ? "prev" : "next";
}
