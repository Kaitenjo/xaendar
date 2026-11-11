import type { Function } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';
import type { IterationVariables } from './iteration-variables.type';
import type { NodeStrategy } from './node-strategy.type';
import type { TemplateExpression } from './template-expression.type';
import type { TrackExpression } from './track-expression.type';

/**
 * A `@for`, as `_for` renders it: where its items come from, how they are keyed, and what renders each one.
 *
 * N.B. Deliberate, to save memory: a constant of the module of the template, shared by every instance of the `@for`,
 * whose functions are the ones of the module as they are, instead of the arrows and the bound function a `@for` would
 * create at each render, in every row of an outer `@for`. The runtime never writes it: the rows rendered are kept by the
 * `@for` (see `ForRun`). Do not build it in the render code.
 */
export type ForConfig = {
  /**
   * Computes the items to iterate: an array, or a number `n`, iterated as `0, 1, ..., n - 1`. A function of the module,
   * called with the component and the context of the scope holding the `@for`.
   */
  readonly items: TemplateExpression<unknown[] | number>;
  /**
   * Computes the key of an item.
   */
  readonly track: TrackExpression;
  /**
   * Renders a new item, returning the context of its body, where `_iterationVariables` declares the `variables`: a
   * function of the module, called as it is.
   */
  readonly block: Function<[HTMLElement, _Context, unknown[], number, Node | null, NodeStrategy], _Context>;
  /**
   * The variables the body reads, left out when it reads none.
   */
  readonly variables?: IterationVariables;
  /**
   * The names of the variables of the template the items and their keys read, left out when they read none.
   */
  readonly reads?: readonly string[];
};
