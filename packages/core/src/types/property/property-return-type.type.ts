import { Beautify } from '@xaendar/types';
import type { BindingHost } from '../binding-host.type';
import type { NonVoidReturnTypeAccessorDecorator } from './non-void-return-type-accessor-decorator.type';

/**
 * Represents the return type of a property decorator: `init`, which creates the input of an element holding a value assigned before
 * its upgrade, `get`, which creates the input lazily, and `set`, which writes into it.
 */
export type PropertyDecoratorReturnType<Class extends BindingHost, Value, IncomingValue> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Value, IncomingValue>, 'init' | 'get' | 'set'>>>;
