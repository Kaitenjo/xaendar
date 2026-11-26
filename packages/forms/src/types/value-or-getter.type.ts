/**
 * A value, or a function giving it: a signal, an input or an arrow function reading one, so that what depends on it
 * follows its changes. A function the value itself must be is not supported.
 *
 * @template Value - The type of the value.
 */
export type ValueOrGetter<Value> = Value | (() => Value);
