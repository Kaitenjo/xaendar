import type { Beautify } from '@xaendar/types';
import type { BindingHost } from '../binding-host.type';
import type { NonVoidReturnTypeAccessorDecorator } from '../property/non-void-return-type-accessor-decorator.type';

/**
 * Represents the return type of a model decorator: `init`, which creates the model of an instance, and `set`, which writes
 * into it.
 */
export type ModelDecoratorReturnType<Class extends BindingHost, Value, IncomingValue> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Value, IncomingValue>, 'init' | 'set'>>>;
