import type { TupleOfLength } from '@xaendar/types';

/**
 * Splits a color into its red, green and blue channels.
 *
 * @param hex - The color, as #rrggbb.
 * @returns The three channels, from 0 to 255.
 */
function channels(hex: string): TupleOfLength<3> {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/**
 * The channels of the accent color, destructured: [79, 70, 229]
 */
const [red, green, blue] = channels('#4f46e5');

/**
 * A 2×2 matrix: [[number, number], [number, number]]
 */
type Matrix = TupleOfLength<2, TupleOfLength<2>>;
