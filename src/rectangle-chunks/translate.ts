import type { RectangleData } from './types';

export default function translate(rect: RectangleData, dx: number, dy: number): void {
  rect._x += dx;
  rect._y += dy;
}
