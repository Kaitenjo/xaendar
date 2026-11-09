import type { Aliased } from '../../signals/types/aliased.type';
import type { InputSignal } from '../../signals/types/input-signal.type';

/**
 * The type of an input `@Property` decorates: the signal, {@link Aliased} when the decorator declares an alias.
 *
 * @template Signal - The signal of the input.
 * @template Alias - The alias the decorator declares, `never` without one.
 */
export type WithAlias<Signal extends InputSignal, Alias extends string> = [Alias] extends [never] ? Signal : Aliased<Signal, Alias>;
