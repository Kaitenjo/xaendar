import type { Function } from '@xaendar/types';

/**
 * The listeners of the native events of an HTML element, by event name.
 */
export type NativeListeners = {
  [Name in keyof HTMLElementEventMap]?: Function<[event: HTMLElementEventMap[Name]], unknown>
};
