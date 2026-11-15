import type { _Context } from './context.type';

/**
 * A node at the top of a cleared scope waiting before leaving the DOM (see `onLeave`), held among the cleanups of the
 * scope holding the block it belonged to: clearing that scope removes the node at once, as its content goes.
 */
export type LeavingNode = {
  /**
   * The node leaving.
   */
  readonly node: Element;
  /**
   * The node it is removed from, if it is still there.
   */
  readonly parentNode: Node;
  /**
   * The scope holding the block the node belonged to, which holds this among its cleanups until the node is removed.
   */
  readonly holder: _Context;
  /**
   * The timer removing the node once `LEAVE_TIMEOUT` has passed, whatever its handler does.
   */
  timer: ReturnType<typeof setTimeout> | undefined;
  /**
   * Removes the node at once: the scope holding the block is cleared.
   */
  dispose(): void;
};
