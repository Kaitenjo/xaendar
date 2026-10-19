import type { AccessorDecorator, Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import type { QuerySignal } from '../../signals/types/query-signal.type';

/**
 * A decorator of a query holding the element an element ref names (`@Query.ref`, `@Query.ref.required`), or the
 * instance of a directive applied to it with the `read` option.
 *
 * @template Missing - What the signal holds when no element is named by the ref: `null`, or `never` for a required query.
 */
export type RefQueryDecorator<Missing> = {
  /**
   * Holds the element named by the ref, typed by `ElementType`.
   *
   * @param name - The name of the ref, without the `#`.
   * @param options - The options of the query, reading the element, which is the default.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   */
  <ElementType extends Element = HTMLElement, Class extends CustomElement = CustomElement>(name: string, options?: { read?: 'element' }): AccessorDecorator<Class, QuerySignal<ElementType | Missing>>;
  /**
   * Holds the instance of a directive applied to the element named by the ref.
   *
   * @param name - The name of the ref, without the `#`.
   * @param options - The options of the query, reading the directive by its class.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   */
  <Read extends Constructor<CustomDirective>, Class extends CustomElement = CustomElement>(name: string, options: { read: Read }): AccessorDecorator<Class, QuerySignal<InstanceType<Read> | Missing>>;
};
