import type { Aliased } from '../../signals/types/aliased.type';
import type { InputSignal } from '../../signals/types/input-signal.type';

/**
 * The name of a member when it is an input without alias, `never` otherwise: an input declaring an alias is bound by it
 * (see `AliasedInputs`). `condition` is never one, since it is the key giving the condition of a group of bindings.
 *
 * @template Target - The component or the directive declaring the member.
 * @template Name - The name of the member.
 */
export type InputName<Target, Name extends keyof Target> =
  Name extends 'condition' | number | symbol
    ? never
    : Target[Name] extends InputSignal
      ? Target[Name] extends Aliased<InputSignal, string>
        ? never
        : Name
      : never;
