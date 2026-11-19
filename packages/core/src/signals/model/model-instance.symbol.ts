import type { ModelSignal } from '../types/model-signal.type';

/**
 * Unique symbol marking a `ModelSignal`, set to `true` on the prototype every model shares. Used by
 * {@link isModelSignal} to tell a model from the other inputs.
 */
export const MODEL_SIGNAL_INSTANCE_SYMBOL = Symbol('ModelSignalInstance');

/**
 * The key under which the getter of a model keeps the component or the directive declaring it, which dispatches its
 * events of change.
 */
export const MODEL_HOST = Symbol('modelHost');

/**
 * The key under which the prototype of the models of an accessor keeps what every model of the accessor shares: the
 * event of change and the equality of the values (see `ModelChange`).
 */
export const MODEL_CHANGE = Symbol('modelChange');

/**
 * Type guard that checks whether a given value is a `ModelSignal`.
 *
 * @param instance - The value to inspect.
 * @returns `true` if `instance` is a `ModelSignal`, `false` otherwise.
 */
export function isModelSignal(instance: unknown): instance is ModelSignal {
  return typeof instance === 'function' && MODEL_SIGNAL_INSTANCE_SYMBOL in instance;
}
