import type { AbstractConstructor } from '@xaendar/types';

/**
 * A shape of a drawing.
 */
abstract class Shape {
  /**
   * Computes the area of the shape.
   *
   * @returns The area, in square pixels.
   */
  public abstract area(): number;
}

/**
 * Keeps the items that are instances of a class.
 *
 * @param items - The items to filter.
 * @param type - The class, abstract or not.
 * @returns The instances of the class, in order.
 */
function instancesOf<Instance extends object>(items: readonly unknown[], type: AbstractConstructor<Instance>): Instance[] {
  return items.filter((item): item is Instance => item instanceof type);
}

instancesOf(drawing.items, Shape); // Shape[]: Constructor<Shape> would reject an abstract class
