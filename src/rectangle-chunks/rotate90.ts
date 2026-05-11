import type { RectangleData } from './types';

export default function rotate90(rect: RectangleData): void {
  [rect._width, rect._height] = [rect._height, rect._width];
}
