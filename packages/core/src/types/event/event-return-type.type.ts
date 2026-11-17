import { Beautify } from '@xaendar/types';
import type { EventHost } from './event-host.type';
import type { NonVoidReturnTypeAccessorDecorator } from './non-void-return-type-accessor-decorator.type';

/**
 * Represents the return type of an event decorator: only `get`, which creates the output lazily.
 */
export type EventDecoratorReturnType<Class extends EventHost, Output> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Output>, 'get'>>>;
