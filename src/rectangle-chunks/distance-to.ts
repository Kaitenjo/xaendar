import type { Point } from './types';

export default function distanceTo(selfCenter: Point, otherCenter: Point): number {
  const dx = selfCenter.x - otherCenter.x;
  const dy = selfCenter.y - otherCenter.y;
  return Math.sqrt(dx ** 2 + dy ** 2);
}
