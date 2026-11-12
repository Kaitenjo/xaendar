import type { Effect } from './effect.type';

/**
 * A binding of a template reading variables of the template (the item and the implicit variables of a `@for`, a `@let`,
 * the parameters of a template), which are values, not signals: its scope keeps it, and runs it again when one of the
 * variables it reads changes (see `refresh` of `utils/context`). While its last run read a signal, it is an effect too,
 * running again whenever that signal changes.
 *
 * Only the bindings the runtime renders in a scope of its own are kept this way, among the cleanups of the scope: the
 * branches of the conditional bindings, the element structural directives are applied to and its content when it
 * declares nothing, the bindings `createComponent` builds. The bindings of a compiled template live in the slots of their
 * scope instead (see `BindingSite`).
 *
 * N.B. Deliberate, to save memory: a binding reading only variables of the template is this record, with neither a
 * computed signal nor a watcher. It holds only what runs it again (the callback, declared once at module level, and its
 * three arguments, as an effect holds them), the identifiers of the variables it reads, a constant of the module shared
 * by every binding of the same place of the template, and its effect, only while it reads a signal. The last value is
 * the one its target holds (the text of the node, the attribute, the input, the branch rendered), which the callback
 * compares, so it is not copied here. Do not turn every binding into an effect again, nor add a closure, the last value
 * or a field per variable.
 */
export type Binding = {
  /**
   * Runs the binding with its three arguments: it computes the value and applies it to the target, when it changed.
   *
   * It is a method signature, so that the callback of any binding fits it whatever the types of its arguments, as
   * methods compare their parameters bivariantly.
   *
   * @param first - The first argument.
   * @param second - The second argument.
   * @param third - The third argument.
   */
  callback(first: unknown, second: unknown, third: unknown): void;
  /**
   * The first argument of the callback.
   */
  readonly first: unknown;
  /**
   * The second argument of the callback.
   */
  readonly second: unknown;
  /**
   * The third argument of the callback.
   */
  readonly third: unknown;
  /**
   * The identifiers of the variables of the template the binding reads, unique in their template, the ones of the
   * enclosing scopes included: it runs again when one of them changes.
   */
  readonly reads: readonly number[];
  /**
   * The effect of the binding while its last run read a signal, `null` otherwise.
   */
  effect: Effect | null;
};
