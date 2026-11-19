import { GRAVE_ACCENT, GREATER_THEN, LEFT_BRACE, LEFT_BRACKET, LESS_THAN, LPAREN, RIGHT_BRACE, RIGHT_BRACKET, RPAREN } from './chars.constant';

/**
 * The character closing each character that opens a group, or a template literal.
 */
export const CLOSERS: ReadonlyMap<number, number> = new Map([
  [LPAREN, RPAREN],
  [LEFT_BRACKET, RIGHT_BRACKET],
  [LEFT_BRACE, RIGHT_BRACE],
  [LESS_THAN, GREATER_THEN],
  [GRAVE_ACCENT, GRAVE_ACCENT]
]);
