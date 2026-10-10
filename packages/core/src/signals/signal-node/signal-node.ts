/**
 * A node of the graph of the TC39 proposal that a function returned by `signal()`, `computed()`, `input()`
 * or a query wraps.
 */
export type SignalNode = Signal.State<unknown> | Signal.Computed<unknown>;

/**
 * The node each wrapper wraps.
 */
const NODES = new WeakMap<object, SignalNode>();

/**
 * The wrapper of each node.
 */
const WRAPPERS = new WeakMap<SignalNode, object>();

/**
 * Records that a function wraps a node, so that the functions of `subtle` accept the one in place of the other.
 *
 * @template Wrapper - The type of the wrapper.
 * @param wrapper - The function returned by `signal()`, `computed()`, `input()` or a query.
 * @param node - The node it wraps.
 * @returns The wrapper.
 * @internal
 */
export function wrapNode<Wrapper extends object>(wrapper: Wrapper, node: SignalNode): Wrapper {
  NODES.set(wrapper, node);
  WRAPPERS.set(node, wrapper);
  return wrapper;
}

/**
 * Returns the node a value wraps, or the value itself when it wraps none.
 *
 * @template Value - The type of the value.
 * @param value - A wrapper, a node or a watcher.
 * @returns The node it wraps, or `value`.
 * @internal
 */
export function toNode<Value>(value: Value): Value {
  return (typeof value === 'function' && NODES.get(value) as Value) || value;
}

/**
 * Returns the wrapper of a node, or the node itself when no function wraps it.
 *
 * @template Value - The type of the node.
 * @param node - A node or a watcher.
 * @returns Its wrapper, or `node`.
 * @internal
 */
export function toWrapper<Value extends object>(node: Value): Value {
  return WRAPPERS.get(node as SignalNode) as Value ?? node;
}
