import type { GetterDecorator } from '@xaendar/types';

/**
 * Rounds the number a getter returns.
 */
const Rounded: GetterDecorator<object, number> = getter => function () {
  return Math.round(getter.call(this));
};

/**
 * A circle.
 */
class Circle {
  /**
   * The radius.
   */
  public radius = 2;

  /**
   * The area, rounded.
   */
  @Rounded
  public get area(): number {
    return Math.PI * this.radius ** 2;
  }
}

new Circle().area;   // 13, not 12.566…
