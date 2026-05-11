import type { RectangleData } from './types';

export default function contains(
  rect: RectangleData,
  other: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    other.x >= rect._x &&
    other.y >= rect._y &&
    other.x + other.width  <= rect._x + rect._width &&
    other.y + other.height <= rect._y + rect._height
  );
}
