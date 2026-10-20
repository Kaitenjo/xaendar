import type { NoArgsFunction } from '@xaendar/types';
import type { InputSignal } from '../../signals/types/input-signal.type';

/**
 * The inputs of a component or of a directive bound by `createComponent`, each one with the getter of its value. The getter
 * runs in an effect, so the input follows the signals it reads.
 *
 * Written as a mapped type over `keyof Target`, filtering the names in the `as` clause, with the type of the getter computed
 * by a conditional type: this form lets TypeScript keep the literal returned by a getter (`() => 'wide'`) for an input typed
 * as a union of literals, and infer the type of a directive from its entry.
 *
 * @template Target - The component or the directive declaring the inputs.
 */
export type BindableProperties<Target> = {
  [Name in keyof Target as InputName<Target, Name>]?: InputGetter<Target[Name]>
};

/**
 * The name of a member when it is an input, `never` otherwise. `condition` is never one, since it is the key giving the
 * condition of a group of bindings.
 *
 * @template Target - The component or the directive declaring the member.
 * @template Name - The name of the member.
 */
type InputName<Target, Name extends keyof Target> = Name extends 'condition' ? never : Target[Name] extends InputSignal ? Name : never;

/**
 * The getter of the value of an input.
 *
 * @template Input - The signal of the input.
 */
type InputGetter<Input> = Input extends InputSignal<infer Value> ? NoArgsFunction<Value> : never;
