/** Where an arrow key moves focus. */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Where an element sits on screen, as `getBoundingClientRect` reports it. */
export type Box = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

/** Rounding can make neighbours overlap by a fraction of a pixel. */
const tolerance = 1;

/** How much being off to the side counts against a candidate, compared with being further away. */
const sidewaysWeight = 3;

/**
 * The index of the candidate that focus moves to from `from` in the given direction, or
 * `undefined` if none lies that way: the nearest one beyond `from`, where being out of line
 * counts more than distance, so focus follows rows and columns.
 */
export function nearestInDirection(
  from: Box,
  candidates: readonly Box[],
  direction: Direction,
): number | undefined {
  return candidates
    .map((candidate, index) => ({ index, score: scoreOf(from, candidate, direction) }))
    .filter((scored): scored is { index: number; score: number } => scored.score !== undefined)
    .reduce<{ index: number; score: number } | undefined>(
      (best, scored) => (best === undefined || scored.score < best.score ? scored : best),
      undefined,
    )?.index;
}

/** How far a candidate is from `from` in the direction, or `undefined` if it isn't that way. */
function scoreOf(from: Box, candidate: Box, direction: Direction): number | undefined {
  const ahead = distanceAhead(from, candidate, direction);

  return ahead < -tolerance
    ? undefined
    : Math.max(ahead, 0) + sidewaysWeight * sideways(from, candidate, direction);
}

function distanceAhead(from: Box, candidate: Box, direction: Direction): number {
  switch (direction) {
    case 'up':
      return from.top - candidate.bottom;
    case 'down':
      return candidate.top - from.bottom;
    case 'left':
      return from.left - candidate.right;
    case 'right':
      return candidate.left - from.right;
  }
}

/** How far a candidate lies outside `from`'s row (moving sideways) or column (moving up or down). */
function sideways(from: Box, candidate: Box, direction: Direction): number {
  return direction === 'left' || direction === 'right'
    ? gapBetween([from.top, from.bottom], [candidate.top, candidate.bottom])
    : gapBetween([from.left, from.right], [candidate.left, candidate.right]);
}

/** The space between two ranges on one axis, 0 where they overlap. */
function gapBetween(
  [start, end]: readonly [number, number],
  [otherStart, otherEnd]: readonly [number, number],
): number {
  return Math.max(otherStart - end, start - otherEnd, 0);
}
