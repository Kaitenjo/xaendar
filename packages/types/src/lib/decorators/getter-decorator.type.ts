import type { DecoratorMetadataContext } from './decorator-metadata-context.type';

/**
 * Represents a TC39 stage-3 class getter decorator function.
 *
 * Receives the original getter and its decorator context, and may return a
 * replacement getter or `void` to leave the original unchanged.
 *
 * @template Class - The class that owns the decorated getter.
 * @template Value - The type the getter returns.
 * @template Metadata - The shape of the metadata of the class (see {@link DecoratorMetadataContext}).
 */
export type GetterDecorator<
  Class extends Object,
  Value,
  Metadata extends object = DecoratorMetadataObject
> = (value: (this: Class) => Value, context: DecoratorMetadataContext<ClassGetterDecoratorContext<Class, Value>, Metadata>) => ((this: Class) => Value) | void;
