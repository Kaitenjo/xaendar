import type { GeneratorFunctionToProcess } from '@xaendar/compiler';
import type { ServerParent } from './server-parent.type';

/**
 * A function the server generator writes at module level, rendering the children of a node: a block of a control flow,
 * the body of a `@for`, the content of a template, or the content of an element a structural directive is applied to.
 */
export type ServerFunctionToProcess = {
  /**
   * What the function renders.
   */
  readonly fn: Pick<GeneratorFunctionToProcess['fn'], 'node' | 'context' | 'precode'> & {
    /**
     * Where the nodes of the function are rendered.
     */
    readonly parent: ServerParent
  };
  /**
   * The names of the parameters of the function, in order.
   */
  readonly args: readonly string[];
};
