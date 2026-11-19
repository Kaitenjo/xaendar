import type { IsAny } from 'type-fest';
import type { Aliased } from '../../signals/types/aliased.type';
import type { InputSignal } from '../../signals/types/input-signal.type';
import type { InputName } from './input-name.type';

/**
 * The type of the input of a component or of a directive bound with a name: the input declaring it as its alias (see
 * `Aliased`), or the input without alias named so. The members are filtered in the `as` clause of a mapped type, which
 * reads the members a class declares even when it has an index signature. A member typed `any` is skipped: it would
 * declare every alias and turn the type of every input into `any`.
 *
 * @template Target - The component or the directive declaring the input.
 * @template Bound - The name the input is bound with.
 */
export type InputOfName<Target, Bound extends string> = {
  [Name in keyof Target as IsAny<Target[Name]> extends true ? never : Target[Name] extends Aliased<InputSignal, Bound> ? Name : Name extends Bound ? InputName<Target, Name> : never]: Target[Name]
} extends infer Inputs ? Inputs[keyof Inputs] : never;
