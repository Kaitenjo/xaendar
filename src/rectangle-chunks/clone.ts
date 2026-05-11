import type { RectangleData } from './types';

export default function clone(rect: RectangleData): {
  width: number; height: number; x: number; y: number; color: string;
} {
  return {
    width: rect._width,
    height: rect._height,
    x: rect._x,
    y: rect._y,
    color: rect._color,
  };
}
