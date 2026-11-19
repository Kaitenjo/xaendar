import type { RenderConditionalBinding } from '../../types/render-conditional-binding.type';
import { COMPONENT } from '../../costants';
import type { _Context } from '../../types/context.type';

/**
 * Selects the branch of a conditional binding to apply: the first one, in declaration order, whose condition holds
 * (see {@link _selectBranchIndex}).
 *
 * @template Bindings - The bindings held by each branch.
 * @param conditionalBinding - The conditional binding to select the branch of.
 * @param context - The context the conditions read.
 * @returns The selected branch, or `undefined` when no condition holds.
 */
export function _selectBranch<Bindings>(conditionalBinding: RenderConditionalBinding<Bindings>, context: _Context): Bindings | undefined {
  const index = _selectBranchIndex(conditionalBinding, context);
  return index === -1 ? undefined : conditionalBinding.branches[index];
}

/**
 * Selects the branch of a conditional binding, or of an `@if` or a `@switch` block, which have the same shape: the
 * first one, in declaration order, whose condition holds. The condition of a `@switch` branch holds when one of its
 * values is strictly equal to the value of the expression, while a branch without condition (`@else`, `@default`)
 * always holds: in the conditional binding of a tag when it is reached, in a `@switch` block (`defaultLast`) only when
 * no `@case` holds, wherever the `@default` is written.
 *
 * The expression and the conditions, functions of the module of the template, are called with the component of the
 * context as `this` and the context, which they read the variables of the template from. They are evaluated once per
 * call: inside an effect, the signals they read are tracked by it, and the branch is selected again when one of them
 * changes. The conditions following the one of the selected branch are not evaluated, so the signals they read are not
 * tracked.
 *
 * @template Bindings - The bindings held by each branch.
 * @param conditionalBinding - The conditional binding to select the branch of.
 * @param context - The context the conditions read.
 * @param defaultLast - Whether the `@default` of a `@switch` holds only when no `@case` does, as in a block.
 * @returns The index of the selected branch, `-1` when no condition holds.
 */
export function _selectBranchIndex<Bindings>(conditionalBinding: RenderConditionalBinding<Bindings>, context: _Context, defaultLast = false): number {
  const component = context[COMPONENT];
  // Only a @switch declares an expression
  if (conditionalBinding.expression) {
    const value = conditionalBinding.expression.call(component, context);
    const cases = conditionalBinding.branches;
    let fallback = -1;
    for (let i = 0; i < cases.length; i++) {
      const values = cases[i].condition;
      if (values ? includes(values, value) : !defaultLast) {
        return i;
      }

      if (!values && fallback === -1) {
        fallback = i;
      }
    }

    return fallback;
  }

  const { branches } = conditionalBinding;
  for (let i = 0; i < branches.length; i++) {
    const { condition } = branches[i];
    if (!condition || condition.call(component, context)) {
      return i;
    }
  }

  return -1;
}

/**
 * Tells whether one of the values of a `@case` is strictly equal to the value of the `@switch`.
 *
 * @param values - The values of the `@case`.
 * @param value - The value of the `@switch`.
 * @returns `true` when one of them is.
 */
function includes(values: readonly unknown[], value: unknown): boolean {
  for (let i = 0; i < values.length; i++) {
    if (values[i] === value) {
      return true;
    }
  }

  return false;
}
