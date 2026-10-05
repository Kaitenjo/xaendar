import type { QueryTarget } from './query-target.type';

/**
 * The type of the elements found by a query: the instance type of the class when
 * the target is a web component class, a plain `HTMLElement` when it is a CSS selector.
 *
 * @template Target - The {@link QueryTarget} of the query.
 */
export type QueryElement<Target extends QueryTarget> = Target extends string ? HTMLElement : InstanceType<Exclude<Target, string>>;
