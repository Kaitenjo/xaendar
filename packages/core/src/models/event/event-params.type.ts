import { Beautify, RequireOne } from '@xendar/common';

/**
 * Rapresent the options to configure an @Event Decorator in a Web Component.
 */
export type EventParams = Beautify<RequireOne<Omit<CustomEventInit, 'detail'>>>;