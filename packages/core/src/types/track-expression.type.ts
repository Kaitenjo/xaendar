import type { Function } from '@xaendar/types';

/**
 * Computes the key of an item, receiving the item, its index and the implicit variables derived from them as values,
 * as the body reads them.
 */
export type TrackExpression = Function<[item: unknown, index: number, first: boolean, last: boolean, even: boolean, odd: boolean], string | number>;
