import { Beautify } from '@xaendar/types';
import type { BindingHost } from '../binding-host.type';
import type { NonVoidReturnTypeAccessorDecorator } from './non-void-return-type-accessor-decorator.type';

/**
 * Represents the return type of a property decorator, ensuring it has a 'get' method and only 'get' method.
 */
export type PropertyDecoratorReturnType<Class extends BindingHost, Value, IncomingValue> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Value, IncomingValue>, 'init' | 'set'>>>;
