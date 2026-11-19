import type { NoArgsFunction } from '@xaendar/types';

/**
 * A group of bindings passed to `createComponent`: without a condition, the bindings are applied as long as the component lives;
 * with a condition, as an `@if` written in a tag, they are applied only while the condition holds and unbound as soon as it doesn't.
 *
 * @template Bindings - The bindings of the group, by name.
 */
export type BindingGroup<Bindings> = Bindings & {
  /**
   * The condition the bindings of the group are applied with: it runs in an effect, so the group follows the signals it reads.
   */
  condition?: NoArgsFunction<boolean>
};
