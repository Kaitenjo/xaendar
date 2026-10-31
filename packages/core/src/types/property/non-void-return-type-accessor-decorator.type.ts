import type { BindingHost } from '../binding-host.type';
import type { ReturnTypeAccessorDecorator } from './return-type-accessor-decorator.type';

/**
 * Represents the return type of an accessor decorator excluding 'void'.
 */
export type NonVoidReturnTypeAccessorDecorator<Class extends BindingHost, Value, IncomingValue> = Exclude<ReturnTypeAccessorDecorator<Class, Value, IncomingValue>, void>;
