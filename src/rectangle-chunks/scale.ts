import type { RectangleData } from './types';

export default function scale(rect: RectangleData, factor: number): void {
  if (factor <= 0) throw new Error("Il fattore di scala deve essere positivo.");
  rect._width  *= factor;
  rect._height *= factor;
}
