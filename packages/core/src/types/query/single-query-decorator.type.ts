import type { AccessorDecorator, Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import type { QueryElement } from '../../signals/types/query-element.type';
import type { QuerySignal } from '../../signals/types/query-signal.type';
import type { QueryTarget } from '../../signals/types/query-target.type';

/**
 * A decorator of a query holding a single element (`@Query`, `@Query.required`, `@Query.content`,
 * `@Query.content.required`): what it holds is typed by the target, or by the `read` option when it is given.
 *
 * @template Missing - What the signal holds when nothing matches: `null`, or `never` for a required query.
 * @template Options - The options of the query besides `read`, such as the slots of a content query.
 */
export type SingleQueryDecorator<Missing, Options extends object> = {
  /**
   * Holds the element matching the target: typed by `ElementType` for a CSS selector, as an instance of the class
   * for a component, or the instance of the directive for the class of a directive.
   *
   * @param target - A CSS selector, the class of a component or the class of a custom directive.
   * @param options - The options of the query, without `read`.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   */
  <ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target, options?: Options & { read?: undefined }): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType> | Missing>>;
  /**
   * Holds the element matching the target, also when the target is the class of a directive: the element it is
   * applied to, typed by `ElementType`.
   *
   * @param target - A CSS selector, the class of a component or the class of a custom directive.
   * @param options - The options of the query, reading the element.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   */
  <ElementType extends Element = HTMLElement, Class extends CustomElement = CustomElement>(target: QueryTarget, options: Options & { read: 'element' }): AccessorDecorator<Class, QuerySignal<ElementType | Missing>>;
  /**
   * Holds the instance of a directive applied to the element matching the target.
   *
   * @param target - A CSS selector, the class of a component or the class of a custom directive.
   * @param options - The options of the query, reading the directive by its class.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   */
  <Read extends Constructor<CustomDirective>, Class extends CustomElement = CustomElement>(target: QueryTarget, options: Options & { read: Read }): AccessorDecorator<Class, QuerySignal<InstanceType<Read> | Missing>>;
};
