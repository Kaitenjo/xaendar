import type { AccessorDecorator } from '@xaendar/types';
import type { EventHost } from './event-host.type';

/**
 * Represents the return type of an accessor decorator.
 */
export type ReturnTypeAccessorDecorator<Class extends EventHost, Output> = ReturnType<AccessorDecorator<Class, Output>>;
