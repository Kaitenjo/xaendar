import type { _Context } from './context.type';

/**
 * A binding of a template as the compiler describes it (see `_bindSite`): a constant of the module of the template, the
 * configuration of the text, the attribute, the block or the `@let` it binds, shared by every instance of the scope
 * holding it, and listed, in the order they are rendered, by the layout of that scope (`_ScopeLayout.sites`).
 *
 * N.B. Deliberate, to save memory: what a binding needs to run again (its callback, the identifiers of the variables it
 * reads, its constant parameters) lives once in the module, and each instance of the scope keeps only what varies, in
 * slots the compiler reserves after its nodes: the effect, `null` while the binding reads no signal, and, for a binding
 * reading variables of the template, the target it writes (the node, the element, the directive). The scope finds its
 * bindings in its layout, instead of an object per binding (the callback, its three arguments, the reads, the effect)
 * among its cleanups, which a large table paid for every text and attribute of every row. Do not register the bindings
 * of a compiled template among the cleanups again.
 */
export type BindingSite = {
  /**
   * Runs the binding: computes the value and applies it to the target, when it changed. Written by the compiler for the
   * bindings it reserves slots for, which the scope runs again when it is refreshed (see `refresh`): a function of the
   * runtime, shared by every binding of its kind.
   *
   * It is a method signature, so that the callback of any binding fits it whatever the type of its target, as methods
   * compare their parameters bivariantly.
   *
   * @param scope - The scope the binding lives in, which its expression reads.
   * @param target - What the binding writes: the node, the element, the directive, `undefined` for a binding writing
   *   its scope (a block, a `@let`).
   * @param site - The binding.
   */
  update?(scope: _Context, target: unknown, site: BindingSite): void;
  /**
   * The identifiers of the variables of the template the binding reads, unique in their template, the ones of the
   * enclosing scopes included: left out when it reads none.
   */
  readonly reads?: readonly number[];
  /**
   * The slot of the effect of the binding, counted from the first slot of the bindings of its scope (see
   * `_ScopeLayout.bindings`). Left out for a binding the runtime renders in a scope of its own, which has no layout of
   * the compiler (the branch of a conditional binding, the element structural directives are applied to, the element of
   * `createComponent`): it is kept among the cleanups of the scope (see `Binding`).
   */
  readonly effect?: number;
  /**
   * The slot of the target, counted as {@link effect}: given only to a binding writing a target and reading variables of
   * the template, which the scope runs again with it.
   */
  readonly target?: number;
  /**
   * Whether the binding keeps, in the slot after the one of its target, the value it computed last, which it compares
   * the next one with: the callback receives the absolute index of the slot of the target, instead of the target, and
   * reads the target and the value through it. Given only to the bindings of `class` and `style` (see `_RenderStyling`),
   * which always have a target.
   *
   * N.B. Deliberate: the slots of a branch rendered inline are counted from the area of its block, known only while it
   * renders (see `bindingsBase`), so the callback run again by an effect could not find them from the scope alone. Do not
   * pass the target instead of the index.
   */
  readonly indexed?: true;
};
