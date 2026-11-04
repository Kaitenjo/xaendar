import { Function } from '../functions/function.type';
import type { DecoratorMetadataContext } from './decorator-metadata-context.type';

/**
 * Represents a TC39 stage-3 class method decorator function.
 *
 * Receives the original method and its decorator context, and may return a
 * replacement method or `void` to leave the original unchanged.
 *
 * @template T - The class that owns the decorated method.
 * @template Method - The type of the method being decorated.
 * @template Metadata - The shape of the metadata of the class (see {@link DecoratorMetadataContext}).
 */
export type MethodDecorator<
  T extends Object,
  Method extends Function,
  Metadata extends object = DecoratorMetadataObject
> = (value: Method, context: DecoratorMetadataContext<ClassMethodDecoratorContext<T, Method>, Metadata>) => Method | void;
