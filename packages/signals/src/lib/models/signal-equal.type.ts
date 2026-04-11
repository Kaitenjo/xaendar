import { Signal } from './signal.interface';

/**
 * A function that compares two values of type `T` and returns `true` if they are considered equal, or `false` otherwise. 
 * This function is used to determine if a signal's value has changed and if dependent computations need to be re-evaluated.
 */
export type SignalEqual<T> = (this: Signal<T>, t: T, t2: T) => boolean;