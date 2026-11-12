import type { _Context } from './context.type';

/**
 * Computes the key of an item: a function of the module of the template, called with the component as `this` and the
 * context of the scope holding the `@for`, which it reads the variables of the enclosing scopes from, then the item, its
 * index and the implicit variables derived from them, as values, as the body reads them.
 */
export type TrackExpression = (this: unknown, context: _Context, item: unknown, index: number, first: boolean, last: boolean, even: boolean, odd: boolean) => string | number;
