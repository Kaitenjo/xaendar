import { AccessorDecorator, Beautify } from '@xaendar/types';
import type { BindingHost } from '../binding-host.type';

/**
 * Represents the return type of a property decorator, ensuring it has a 'get' method and only 'get' method.
 */
export type PropertyDecoratorReturnType<Class extends BindingHost, Value, IncomingValue> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Value, IncomingValue>, 'init' | 'set'>>>;

/**
 * Represents the return type of an accessor decorator excluding 'void'.
 */
type NonVoidReturnTypeAccessorDecorator<Class extends BindingHost, Value, IncomingValue> = Exclude<ReturnTypeAccessorDecorator<Class, Value, IncomingValue>, void>;

/**
 * Represents the return type of an accessor decorator. Its setter takes the values assigned to the element, written
 * into the input before the `transform`, and the type of the accessor, which TypeScript requires it to accept.
 */
type ReturnTypeAccessorDecorator<Class extends BindingHost, Value, IncomingValue> = ReturnType<AccessorDecorator<Class, Value, DecoratorMetadataObject, Value | NoInfer<IncomingValue>>>;