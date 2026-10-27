import type { DecoratorMetadataContext } from './decorator-metadata-context.type';

/**
 * Represents a TC39 stage-3 class field decorator function.
 *
 * Receives the initial `undefined` value and the field decorator context.
 * May return an initializer that maps the declared field value to its stored
 * (possibly transformed) representation, or `void` to leave the field unchanged.
 *
 * @template Class - The class that owns the decorated field.
 * @template Field - The declared type of the field.
 * @template ReturnType - The type the initializer transforms the value into. Defaults to `Field`.
 * @template Metadata - The shape of the metadata of the class (see {@link DecoratorMetadataContext}).
 */
export type FieldDecorator<
  Class extends object = object,
  Field = unknown,
  ReturnType = Field,
  Metadata extends object = DecoratorMetadataObject
> = (field: undefined, context: DecoratorMetadataContext<ClassFieldDecoratorContext<Class, Field>, Metadata>) => ((value: Field) => ReturnType) | void;
