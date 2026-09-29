import { AccessorDecorator, Beautify } from '@xaendar/types';
import { CustomElement } from '../../models/custom-element/custom-element';

/**
 * Represents the return type of an event decorator, ensuring it has a 'get' method and only 'get' method.
 */
export type EventDecoratorReturnType<Class extends CustomElement, Output> = Beautify<Required<Pick<NonVoidReturnTypeAccessorDecorator<Class, Output>, 'get'>>>;

/**
 * Represents the return type of an accessor decorator excluding 'void'.
 */
type NonVoidReturnTypeAccessorDecorator<Class extends CustomElement, Output> = Exclude<ReturnTypeAccessorDecorator<Class, Output>, void>;

/**
 * Represents the return type of an accessor decorator.
 */
type ReturnTypeAccessorDecorator<Class extends CustomElement, Output> = ReturnType<AccessorDecorator<Class, Output>>;