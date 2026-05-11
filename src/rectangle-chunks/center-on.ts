import type { RectangleData, Point } from './types';

export default function centerOn(rect: RectangleData, point: Point): void {
  rect._x = point.x - rect._width  / 2;
  rect._y = point.y - rect._height / 2;
}
