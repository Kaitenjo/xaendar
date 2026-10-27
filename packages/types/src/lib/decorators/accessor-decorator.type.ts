import type { DecoratorMetadataContext } from './decorator-metadata-context.type';

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

/**
 * Represents a class accessor decorator function. It may return a replacement getter, setter or initializer,
 * or `void` to leave the accessor unchanged.
 *
 * @template Class - The class that owns the decorated accessor.
 * @template Value - The type of the accessor's value, the same for the original accessor and its replacement.
 * @template Metadata - The shape of the metadata of the class (see {@link DecoratorMetadataContext}).
 * @template SetValue - The type accepted by the replacement setter. It must include `Value`, or TypeScript rejects the
 * decorator on the accessor.
 */
export type AccessorDecorator<
  Class extends object,
  Value = unknown,
  Metadata extends object = DecoratorMetadataObject,
  SetValue = Value
> =(value: ClassAccessorDecoratorValue<Value>, context: DecoratorMetadataContext<ClassAccessorDecoratorContext<Class, Value>, Metadata>) => {
  /**
   * Replacement getter returning a value of `Value`.
   */
  get?(this: Class): Value;
  /**
   * Replacement setter accepting a value of `SetValue`.
   */
  set?(this: Class, value: SetValue): void;
  /**
   * Initializer called with the original field value; should return a `Value`.
   */
  init?(this: Class, initialValue: Value): Value;
} | void;
