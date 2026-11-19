import type { IsAny } from 'type-fest';
import type { Output } from '../../models/output/output';

/**
 * The name of a member when it is an output, `never` otherwise. `condition` is never one, since it is the key giving the
 * condition of a group of bindings, nor is a member typed `any`, which would match every branch.
 *
 * @template Target - The component or the directive declaring the member.
 * @template Name - The name of the member.
 */
export type OutputName<Target, Name extends keyof Target> =
  Name extends 'condition'
    ? never
    : IsAny<Target[Name]> extends true
      ? never
      : Target[Name] extends Output<never>
        ? Name
        : never;
