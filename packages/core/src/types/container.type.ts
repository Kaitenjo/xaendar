import type { _Context } from './context.type';

/**
 * What a container of a scope holds (see `_ScopeLayout`): the scope a block shows, `null` while it shows none, or the
 * run of a `@for`, holding the scopes of its rows, in order.
 */
export type Container = _Context | {
  /**
   * The scopes of the rows of the `@for`, in order: `null` before its first render.
   */
  readonly rows: readonly _Context[] | null;
} | null;
