import type { EventHost } from './event-host.type';
import type { ReturnTypeAccessorDecorator } from './return-type-accessor-decorator.type';

/**
 * Represents the return type of an accessor decorator excluding 'void'.
 */
export type NonVoidReturnTypeAccessorDecorator<Class extends EventHost, Output> = Exclude<ReturnTypeAccessorDecorator<Class, Output>, void>;
