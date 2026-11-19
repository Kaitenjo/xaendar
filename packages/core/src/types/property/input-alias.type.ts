import type { Aliased } from '../../signals/types/aliased.type';
import type { InputSignal } from '../../signals/types/input-signal.type';

/**
 * The alias the type of an input declares (see {@link Aliased}), `never` for an input without alias.
 *
 * @template Input - The type of the input.
 */
export type InputAlias<Input> = Input extends Aliased<InputSignal, infer Alias> ? Alias : never;
