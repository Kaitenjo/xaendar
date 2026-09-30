import { AccessorDecorator, Beautify } from '@xaendar/types';
import type { BindingHost } from '../binding-host.type';

/**
 * Represents the return type of an event decorator, ensuring it has a 'get' method and only 'get' method.
 */
export type EventDecoratorReturnType<Class extends BindingHost, Output> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Output>, 'get'>>>;

/**
 * Represents the return type of an accessor decorator excluding 'void'.
 */
type NonVoidReturnTypeAccessorDecorator<Class extends BindingHost, Output> = Exclude<ReturnTypeAccessorDecorator<Class, Output>, void>;

/**
 * Represents the return type of an accessor decorator.
 */
type ReturnTypeAccessorDecorator<Class extends BindingHost, Output> = ReturnType<AccessorDecorator<Class, Output>>;