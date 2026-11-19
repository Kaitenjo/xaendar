import type { BlockPosition } from '../block-position.type';
import type { RenderConditionalBinding } from '../render-conditional-binding.type';
import type { Branch } from './branch.type';

/**
 * An `@if` chain or a `@switch` block, as `_if` and `_switch` render it: its branches, each one with what selects it and
 * what renders it, selected as the branches of a conditional binding of a tag are (see `_selectBranchIndex`). An `@if`
 * chain declares a condition per branch but the `@else`, a `@switch` its expression and the values of each `@case`.
 *
 * N.B. Deliberate, to save memory: a constant of the module of the template, shared by every instance of the block,
 * whose functions are the ones of the module as they are, instead of an array, an object per branch and a bound function
 * per branch created at each render. The runtime never writes it: the branch rendered is kept by the container of the block (see `CONTAINER_SLOTS`).
 * Do not build it in the render code.
 */
export type BlockConfig = RenderConditionalBinding<Branch> & BlockPosition;
