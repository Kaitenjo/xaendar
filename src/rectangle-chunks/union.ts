import type { RectangleData } from './types';

export default function union(
  rect: RectangleData,
  other: { x: number; y: number; width: number; height: number }
): { width: number; height: number; x: number; y: number } {
  const x = Math.min(rect._x, other.x);
  const y = Math.min(rect._y, other.y);
  const w = Math.max(rect._x + rect._width,  other.x + other.width)  - x;
  const h = Math.max(rect._y + rect._height, other.y + other.height) - y;
  return { width: w, height: h, x, y };
}
