/** Scroll movement smaller than this is trackpad jitter, not a direction. */
const JITTER = 6;

export function isHeaderHidden(previousY: number, y: number, wasHidden: boolean, offset: number) {
  if (y <= offset) return false;
  const delta = y - previousY;
  if (Math.abs(delta) < JITTER) return wasHidden;
  return delta > 0;
}
