import type { _Context } from '../utils/context/context.util';
import type { RenderConditionalBinding } from './render-conditional-binding.type';

/**
 * A conditional binding of a tag while it is applied (see `bindConditionalBindings` of `_renderElement`): its branches,
 * what they bind, the context holding the bindings of the selected one, and that branch, held by its binding as the
 * argument of its callback.
 *
 * N.B. Deliberate, to save memory: the state of a conditional binding lives in this object, passed to a function declared
 * once at module level, and what its branches bind is applied by another one (`bind`), receiving the target, instead of
 * local variables captured by arrows created per conditional binding, which would cost a closure and its context for
 * each one, on every element of a large table. Do not move it back into a closure.
 *
 * @template Target - What the branches bind: the element being rendered (see `ElementBinding`), a directive, or the
 *   collector of the structural directives of an element.
 * @template Bindings - The bindings held by each branch.
 */
export type ConditionalBindingRun<Target, Bindings extends { readonly conditionalBindings?: ReadonlyArray<RenderConditionalBinding<Bindings>> }> = {
  /**
   * The conditional binding, a constant of the module of the template.
   */
  readonly conditionalBinding: RenderConditionalBinding<Bindings>;
  /**
   * The context the bindings of the selected branch are applied in, cleared when another branch, or none, is selected.
   */
  readonly branchContext: _Context;
  /**
   * What the branches bind.
   */
  readonly target: Target;
  /**
   * Applies the bindings of a branch to the target, registering their cleanup in the given context: a function of the
   * module of the runtime, shared by every conditional binding of the same kind.
   *
   * @param target - What the branch binds.
   * @param context - The context of the branch.
   * @param branch - The branch.
   */
  readonly bind: (target: Target, context: _Context, branch: Bindings) => void;
  /**
   * The branch applied, `undefined` while none is.
   */
  current: Bindings | undefined;
};
