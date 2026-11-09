import type { Aliased } from '../../signals/types/aliased.type';
import type { InputSignal } from '../../signals/types/input-signal.type';
import type { InputAlias } from '../property/input-alias.type';

/**
 * The alias of a member when it is an input declaring one (see `Aliased`), `never` otherwise. `condition` is never one,
 * since it is the key giving the condition of a group of bindings.
 *
 * @template Target - The component or the directive declaring the member.
 * @template Name - The name of the member.
 */
export type AliasedInputName<Target, Name extends keyof Target> =
  Name extends number | symbol
    ? never
    : Target[Name] extends Aliased<InputSignal, string>
      ? Exclude<InputAlias<Target[Name]>, 'condition'>
      : never;
