import type { InputSignal } from '../../signals/types/input-signal.type';

/**
 * The name of a member when it is an input, `never` otherwise. `condition` is never one, since it is the key giving the
 * condition of a group of bindings.
 *
 * @template Target - The component or the directive declaring the member.
 * @template Name - The name of the member.
 */
export type InputName<Target, Name extends keyof Target> = Name extends 'condition' ? never : Target[Name] extends InputSignal ? Name : never;
