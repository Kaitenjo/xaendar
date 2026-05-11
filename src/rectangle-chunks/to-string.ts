import type { RectangleData } from './types';

export default function toString(rect: RectangleData, area: number, perimeter: number): string {
  return (
    `Rectangle { width: ${rect._width}, height: ${rect._height}, ` +
    `x: ${rect._x}, y: ${rect._y}, color: "${rect._color}", ` +
    `area: ${area}, perimeter: ${perimeter} }`
  );
}
