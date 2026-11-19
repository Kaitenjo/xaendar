import type { IsAny } from 'type-fest';
import type { ModelSignal } from '../../signals/types/model-signal.type';
import type { InputAlias } from '../property/input-alias.type';

/**
 * The name of the event of change of a member when it is a model, `never` otherwise: the name the model is bound with,
 * its alias when its type declares one (see `Aliased`), followed by `Change`. A member typed `any` has none: it would
 * match every branch and add `${string}Change` to the names.
 *
 * @template Target - The component or the directive declaring the member.
 * @template Name - The name of the member.
 */
export type ModelChangeName<Target, Name extends keyof Target> =
  Name extends string
    ? IsAny<Target[Name]> extends true
      ? never
      : Target[Name] extends ModelSignal
        ? `${[InputAlias<Target[Name]>] extends [never] ? Name : InputAlias<Target[Name]>}Change`
        : never
    : never;
