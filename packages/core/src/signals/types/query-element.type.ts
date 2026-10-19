import type { QueryTarget } from './query-target.type';

/**
 * The type of the elements found by a query: the instance type of the class when
 * the target is a web component class, `ElementType` when it is a CSS selector.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @template ElementType - The type of the elements found by a CSS selector, given as a type argument of the query.
 */
export type QueryElement<
  Target extends QueryTarget, 
  ElementType extends HTMLElement
> = Target extends string ? ElementType : InstanceType<Exclude<Target, string>>;