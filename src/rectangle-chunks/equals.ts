import type { RectangleData } from './types';

export default function equals(
  rect: RectangleData,
  other: { width: number; height: number; x: number; y: number }
): boolean {
  return (
    rect._width  === other.width  &&
    rect._height === other.height &&
    rect._x === other.x &&
    rect._y === other.y
  );
}
