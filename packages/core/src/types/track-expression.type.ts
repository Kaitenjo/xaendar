import type { Function, NoArgsFunction } from '@xaendar/types';

/**
 * Computes the key of an item, receiving the item, its index and the implicit variables derived from them as functions
 * reading them, like the signals of the body read them.
 */
export type TrackExpression = Function<[item: NoArgsFunction<unknown>, index: NoArgsFunction<number>, first: NoArgsFunction<boolean>, last: NoArgsFunction<boolean>, even: NoArgsFunction<boolean>, odd: NoArgsFunction<boolean>], string | number>;
