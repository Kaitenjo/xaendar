import type { RectangleData, Point } from './types';

export default function containsPoint(rect: RectangleData, point: Point): boolean {
  return (
    point.x >= rect._x &&
    point.x <= rect._x + rect._width &&
    point.y >= rect._y &&
    point.y <= rect._y + rect._height
  );
}
