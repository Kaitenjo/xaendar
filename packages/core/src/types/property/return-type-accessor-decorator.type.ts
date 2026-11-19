import type { AccessorDecorator } from '@xaendar/types';
import type { BindingHost } from '../binding-host.type';

/**
 * Represents the return type of an accessor decorator. Its setter takes the values assigned to the element, written
 * into the input before the `transform`, and the type of the accessor, which TypeScript requires it to accept.
 */
export type ReturnTypeAccessorDecorator<Class extends BindingHost, Value, IncomingValue> = ReturnType<AccessorDecorator<Class, Value, DecoratorMetadataObject, Value | NoInfer<IncomingValue>>>;
