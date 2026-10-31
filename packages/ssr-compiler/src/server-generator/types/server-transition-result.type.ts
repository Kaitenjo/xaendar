import type { ServerCodePiece } from './server-code-piece.type';
import type { ServerFunctionToProcess } from './server-function-to-process.type';

/**
 * The code the server generator writes for one or more nodes.
 */
export type ServerTransitionResult = {
  /**
   * The pieces of the code rendering the nodes, in order.
   */
  readonly pieces: ServerCodePiece[];
  /**
   * The functions the code calls, written at module level, by name.
   */
  readonly functionsToProcess?: ReadonlyMap<string, ServerFunctionToProcess>;
};
