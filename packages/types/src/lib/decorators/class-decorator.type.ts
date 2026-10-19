import { Constructor } from '../constructors/constructor.type';
import type { DecoratorMetadataContext } from './decorator-metadata-context.type';

/**
 * Represents a TC39 stage-3 class decorator function.
 *
 * Receives the class constructor and its decorator context, and returns `void`:
 * the original class is left in place, it cannot be replaced.
 *
 * @template T - The instance type of the decorated class.
 * @template Statics - Optional static members of the class.
 * @template Metadata - The shape of the metadata of the class (see {@link DecoratorMetadataContext}).
 */
export type ClassDecorator<
  T extends Object,
  Statics extends { [key: string]: any } = { [key: string]: any },
  Metadata extends object = DecoratorMetadataObject
> = (klass: Constructor<T, Statics>, context: DecoratorMetadataContext<ClassDecoratorContext<Constructor<T, Statics>>, Metadata>) => void;
