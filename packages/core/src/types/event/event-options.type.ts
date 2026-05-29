import { Beautify, RequireOne } from '@xaendar/types';

/**
 * Rapresent the options to configure an @Event Decorator in a Web Component.
 */
export type EventOptions = Beautify<RequireOne<Omit<CustomEventInit, 'detail'>>>;