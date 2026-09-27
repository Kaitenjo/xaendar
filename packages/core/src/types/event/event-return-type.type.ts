import { AccessorDecorator, Beautify } from '@xaendar/types';
import { BaseWebComponent } from '../../directives/base-web-component';

/**
 * Represents the return type of an event decorator, ensuring it has a 'get' method and only 'get' method.
 */
export type EventDecoratorReturnType<Class extends BaseWebComponent, Output> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Output>, 'get'>>>;

/**
 * Represents the return type of an accessor decorator excluding 'void'.
 */
type NonVoidReturnTypeAccessorDecorator<Class extends BaseWebComponent, Output> = Exclude<ReturnTypeAccessorDecorator<Class, Output>, void>;

/**
 * Represents the return type of an accessor decorator.
 */
type ReturnTypeAccessorDecorator<Class extends BaseWebComponent, Output> = ReturnType<AccessorDecorator<Class, Output>>;