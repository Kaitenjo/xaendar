/**
 * The key under which the getter returned by `signal`, `computed` and `input` keeps its underlying
 * {@link Signal.State} or {@link Signal.Computed}, read by the methods of their shared prototypes.
 */
export const NODE = Symbol('node');
