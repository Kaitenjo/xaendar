import type { _Context } from './context.type';
import type { InlineBranch } from './inline-branch.type';

/**
 * What the first slot of a container of a scope holds (see `CONTENT`): the scope a block shows, `null` (or `undefined`
 * before its first run) while it shows none, the scopes of the rows of a `@for`, in order, or the branch of an `@if` or
 * of a `@switch` rendered inline.
 */
export type Container = _Context | readonly _Context[] | InlineBranch | null | undefined;
