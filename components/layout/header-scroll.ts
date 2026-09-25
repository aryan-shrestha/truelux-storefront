/** Scroll movement smaller than this is trackpad jitter, not a direction. */
const JITTER = 6;

/**
 * Whether the header should be hidden after the page scrolls from `previousY`
 * to `y`: hidden while moving down, shown while moving up, and always shown
 * within `offset` of the top, where it sits in the page's own flow.
 */
export function isHeaderHidden(previousY: number, y: number, wasHidden: boolean, offset: number) {
  if (y <= offset) return false;
  const delta = y - previousY;
  if (Math.abs(delta) < JITTER) return wasHidden;
  return delta > 0;
}
