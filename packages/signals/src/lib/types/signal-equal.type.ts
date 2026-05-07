import { Computed } from "../models/computed/computed";
import { State } from "../models/state/state";

/**
 * A function that compares two values of type `T` and returns `true` if they are considered equal, or `false` otherwise. 
 * This function is used to determine if a signal's value has changed and if dependent computations need to be re-evaluated.
 */
export type SignalEqual<T> = (this: State<T> | Computed<T>, t: any, t2: any) => boolean;