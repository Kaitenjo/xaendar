/**
 * Represents the accessor descriptor passed to a class accessor decorator,
 * containing the original `get` and `set` methods of the decorated accessor.
 *
 * @template Field - The type of the accessor's value.
 */
export type ClassAccessorDecoratorValue<Field = unknown> = {
  /**
   * Returns the current value of the accessor.
   */
  get(this: unknown): Field;
  /**
   * Sets the value of the accessor.
   */
  set(this: unknown, value: Field): void;
};
