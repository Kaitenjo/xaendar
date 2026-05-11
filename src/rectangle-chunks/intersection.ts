import type { RectangleData } from './types';

export default function intersection(
  rect: RectangleData,
  other: { x: number; y: number; width: number; height: number }
): { width: number; height: number; x: number; y: number } | null {
  const x = Math.max(rect._x, other.x);
  const y = Math.max(rect._y, other.y);
  const w = Math.min(rect._x + rect._width,  other.x + other.width)  - x;
  const h = Math.min(rect._y + rect._height, other.y + other.height) - y;
  if (w <= 0 || h <= 0) return null;
  return { width: w, height: h, x, y };
}
