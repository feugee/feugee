/**
 * The Works Rail's proximity geometry as a pure function: how far each
 * line swells toward the pointer.
 *
 * The falloff is rational quadratic — flat-topped near the pointer, so
 * the hovered line holds its full length while the pointer wanders its
 * row, with a long tail so rows a step or two out still read as swollen.
 */
export const RAIL_LINE_REST_PX = 12;
export const RAIL_LINE_MAX_PX = 32;

// Distance at which the swell has fallen to half. One row pitch (32px
// rows + 16px gaps), so the immediate neighbors sit at about two thirds
// of the swell — the hovered line longest, each row out a step shorter.
export const RAIL_PROXIMITY_RADIUS_PX = 24;

// The nearest Work's title shows while the pointer is within this of its
// line — two row pitches, so scanning the rail keeps one title up the
// whole way while a pointer over the cards leaves them bare.
export const RAIL_TITLE_REVEAL_RADIUS_PX = 48;

export const railLineWidth = (distance: number): number => {
  const falloff = 1 / (1 + (distance / RAIL_PROXIMITY_RADIUS_PX) ** 2);
  return RAIL_LINE_REST_PX + (RAIL_LINE_MAX_PX - RAIL_LINE_REST_PX) * falloff;
};

export interface RailAnchor {
  x: number;
  y: number;
}
