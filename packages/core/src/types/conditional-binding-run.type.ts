import type { VoidFunction } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';
import type { RenderConditionalBinding } from './render-conditional-binding.type';

/**
 * A conditional binding of a tag while it is applied (see `bindConditionalBindings` of `_renderElement`): its branches,
 * the context holding the bindings of the selected one, and that branch, held by its binding as the argument of its
 * callback.
 *
 * N.B. Deliberate, to save memory: the state of a conditional binding lives in this object, passed to a function declared
 * once at module level, instead of local variables captured by an arrow created per conditional binding, which would
 * cost a closure and its context for each one, on every element of a large table. Do not move it back into a closure.
 *
 * @template Bindings - The bindings held by each branch.
 */
export type ConditionalBindingRun<Bindings extends { conditionalBindings: RenderConditionalBinding<Bindings>[] }> = {
  /**
   * The conditional binding.
   */
  readonly conditionalBinding: RenderConditionalBinding<Bindings>;
  /**
   * The context the bindings of the selected branch are applied in, cleared when another branch, or none, is selected.
   */
  readonly branchContext: _Context;
  /**
   * Applies the bindings of a branch, registering their cleanup in the given context.
   */
  readonly bind: VoidFunction<[context: _Context, branch: Bindings]>;
  /**
   * The branch applied, `undefined` while none is.
   */
  current: Bindings | undefined;
};
