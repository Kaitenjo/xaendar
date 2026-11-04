import type { RenderConditionalBinding } from '../../types/render-conditional-binding.type';

/**
 * Selects the branch of a conditional binding to apply: the first one, in declaration order, whose condition holds.
 * The condition of a `@switch` branch holds when one of its values is strictly equal to the value of the
 * expression, while a branch without condition (`@else`, `@default`) always holds.
 *
 * The expression and the conditions are evaluated once per call: inside an effect, the signals they read are tracked
 * by it, and the branch is selected again when one of them changes. The conditions following the one of the selected
 * branch are not evaluated, so the signals they read are not tracked.
 *
 * @param conditionalBinding - The conditional binding to select the branch of.
 * @returns The selected branch, or `undefined` when no condition holds.
 */
export function _selectBranch<Bindings extends { conditionalBindings: RenderConditionalBinding<Bindings>[] }>(conditionalBinding: RenderConditionalBinding<Bindings>): Bindings | undefined {
  // Only a @switch declares an expression
  if (conditionalBinding.expression) {
    const value = conditionalBinding.expression();
    return conditionalBinding.branches.find(({ condition }) => !condition || condition.some(candidate => candidate === value));
  }

  return conditionalBinding.branches.find(({ condition }) => !condition || condition());
}
