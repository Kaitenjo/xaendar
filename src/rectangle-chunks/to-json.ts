import type { RectangleData, Point } from './types';

export default function toJSON(rect: RectangleData, computed: {
  area: number; perimeter: number; diagonal: number; isSquare: boolean; center: Point;
}): object {
  return {
    width:     rect._width,
    height:    rect._height,
    x:         rect._x,
    y:         rect._y,
    color:     rect._color,
    area:      computed.area,
    perimeter: computed.perimeter,
    diagonal:  +computed.diagonal.toFixed(4),
    isSquare:  computed.isSquare,
    center:    computed.center,
  };
}
