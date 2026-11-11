import type { NoArgsFunction } from '@xaendar/types';
import type { Block } from './if/block.type';
import type { TemplateExpression } from './template-expression.type';
import type { Trigger } from './triggers/trigger.type';

/**
 * A `@hydrate` block, as the compiler-generated render code describes it to `_hydrate`: the content is rendered before
 * the anchor it receives, getting its nodes with the strategy it receives. A constant of the module of the template,
 * shared by every instance of the block: its functions are the ones of the module, the expressions called with the
 * component and the context of the scope holding the block.
 */
export type HydrateBlock = {
  /**
   * The triggers written by name or with their arguments, any of which hydrates the content.
   */
  triggers: Trigger[],
  /**
   * The expression of the `when` trigger, which fires once it is truthy, if the block declares one.
   */
  when?: TemplateExpression<unknown>,
  /**
   * The names of the variables of the template the expression of `when` reads (see `_bindEffect`), omitted when it
   * reads none.
   */
  whenReads?: readonly string[],
  /**
   * Loads the modules of the components only the content renders, if any: the content is rendered once they are loaded.
   */
  load?: NoArgsFunction<Promise<unknown>>,
  /**
   * The triggers following `prefetch`, any of which loads the modules of the content without rendering it, if the block
   * declares some and has modules to load.
   */
  prefetch?: Trigger[],
  /**
   * The expression of the `when` trigger following `prefetch`, which loads the modules of the content once it is truthy,
   * if the block declares one and has modules to load.
   */
  prefetchWhen?: TemplateExpression<unknown>,
  /**
   * The names of the variables of the template the expression of the `when` following `prefetch` reads (see
   * `_bindEffect`), omitted when it reads none.
   */
  prefetchWhenReads?: readonly string[],
  /**
   * Renders the content.
   */
  content: Block['block']
};
