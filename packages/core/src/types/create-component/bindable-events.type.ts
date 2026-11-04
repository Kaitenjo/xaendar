import type { OutputListeners } from './output-listeners.type';
import type { NativeListeners } from './native-listeners.type';

/**
 * The events listened to by `createComponent` on the element of a component or of a directive, each one with its listener:
 * the outputs of the component or of the directive, and the native events of an HTML element.
 *
 * @template Target - The component or the directive dispatching the events.
 */
export type BindableEvents<Target> = OutputListeners<Target> & NativeListeners;
