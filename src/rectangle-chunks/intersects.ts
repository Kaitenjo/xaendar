import type { RectangleData } from './types';

export default function intersects(
  rect: RectangleData,
  other: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    other.x > rect._x + rect._width  ||
    other.x + other.width  < rect._x ||
    other.y > rect._y + rect._height ||
    other.y + other.height < rect._y
  );
}
