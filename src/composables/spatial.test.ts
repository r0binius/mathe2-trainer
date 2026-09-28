import { describe, expect, it } from 'vitest';

import type { Box } from './spatial';
import { nearestInDirection } from './spatial';

/** A box 50px high, as tall as a card or row. */
function box(left: number, top: number, width = 100): Box {
  return { left, top, right: left + width, bottom: top + 50 };
}

// Two columns of cards, 12px apart, as in the library.
const grid = [box(0, 0), box(112, 0), box(0, 62), box(112, 62)];

describe('nearestInDirection', () => {
  it('moves across and down a grid', () => {
    const [topLeft, topRight, bottomLeft] = grid;

    expect(topLeft && nearestInDirection(topLeft, grid, 'right')).toBe(1);
    expect(topLeft && nearestInDirection(topLeft, grid, 'down')).toBe(2);
    expect(topRight && nearestInDirection(topRight, grid, 'left')).toBe(0);
    expect(bottomLeft && nearestInDirection(bottomLeft, grid, 'up')).toBe(0);
  });

  it('takes the next row of a list, not one further down', () => {
    const rows = [box(0, 0, 500), box(0, 52, 500), box(0, 104, 500)];

    expect(nearestInDirection(box(0, 0, 500), rows, 'down')).toBe(1);
  });

  it('prefers an element in line over a nearer one off to the side', () => {
    const inLine = box(400, 0);
    const offToTheSide = box(120, 200);

    expect(nearestInDirection(box(0, 0), [offToTheSide, inLine], 'right')).toBe(1);
  });

  it('finds nothing where there is nothing in that direction', () => {
    const [topLeft] = grid;

    expect(topLeft && nearestInDirection(topLeft, grid, 'left')).toBeUndefined();
    expect(topLeft && nearestInDirection(topLeft, grid, 'up')).toBeUndefined();
  });
});
