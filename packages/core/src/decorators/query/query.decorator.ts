import type { AccessorDecorator } from '@xaendar/types';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { createQuerySignal, createSlotQuerySignal, toSelector } from '../../signals/query/query';
import type { QueryElement } from '../../signals/types/query-element.type';
import type { QuerySignal } from '../../signals/types/query-signal.type';
import type { QuerySlotOptions } from '../../signals/types/query-slot-options.type';
import type { QueryTarget } from '../../signals/types/query-target.type';

/**
 * Decorator that binds an accessor of a web component to the first element
 * of its Shadow DOM that matches the given CSS selector, or that is an instance of the given web component.
 *
 * Transforms the decorated accessor into a read-only {@link QuerySignal}
 * holding the matching element, or `null` if there is none. The signal is
 * updated each time the Shadow DOM changes.
 *
 * @param target - A CSS selector (a tag name, `.class`, `[attribute]`...), or the class of a
 *   web component decorated with `@WebComponent`, whose selector is matched.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * @Query('[preview]')
 * accessor preview: QuerySignal<HTMLElement | null>;
 *
 * @Query(MyButtonComponent)
 * accessor button: QuerySignal<MyButtonComponent | null>;
 * ```
 */
export function Query<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType> | null>> {
  return () => ({
    init() {
      return query(this, target);
    }
  });
}

/**
 * Decorator that binds an accessor of a web component to all the elements
 * of its Shadow DOM that match the given CSS selector, or that are instances of the given web component.
 *
 * Transforms the decorated accessor into a read-only {@link QuerySignal}
 * holding the array of the matching elements, in document order (empty if there
 * are none). The signal is updated each time the Shadow DOM changes.
 *
 * @param target - A CSS selector (a tag name, `.class`, `[attribute]`...), or the class of a
 *   web component decorated with `@WebComponent`, whose selector is matched.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * @Query.all('[item]')
 * accessor items: QuerySignal<HTMLElement[]>;
 *
 * @Query.all(MyButtonComponent)
 * accessor buttons: QuerySignal<MyButtonComponent[]>;
 * ```
 */
Query.all = function all<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType>[]>> {
  return () => ({
    init() {
      return queryAll(this, target);
    }
  });
};

/**
 * Decorator that binds an accessor of a web component to the first element projected into its slots,
 * or one of their descendants, that matches the given CSS selector or is an instance of the given web component.
 * With the `lightDom` option the query is extended to the whole light DOM, including the elements not assigned to any slot.
 *
 * Transforms the decorated accessor into a read-only {@link QuerySignal}
 * holding the matching element, or `null` if there is none. The signal is
 * updated each time the projected content (or the light DOM) changes.
 *
 * @param target - A CSS selector (a tag name, `.class`, `[attribute]`...), or the class of a
 *   web component decorated with `@WebComponent`, whose selector is matched.
 * @param options - Restricts the query to a single slot, or extends it to the whole light DOM.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * @Query.slot('[header]')
 * accessor header: QuerySignal<HTMLElement | null>;
 *
 * @Query.slot(MyButtonComponent, { slot: 'footer' })
 * accessor footerButton: QuerySignal<MyButtonComponent | null>;
 *
 * @Query.slot('[item]', { lightDom: true })
 * accessor item: QuerySignal<HTMLElement | null>;
 * ```
 */
Query.content = Object.assign(function slot<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target, options?: QuerySlotOptions): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType> | null>> {
  return () => ({
    init() {
      return querySlot(this, target, options);
    }
  });
}, {
  /**
   * Decorator that binds an accessor of a web component to all the elements projected into its slots,
   * and their descendants, that match the given CSS selector or are instances of the given web component.
   * With the `lightDom` option the query is extended to the whole light DOM, including the elements not assigned to any slot.
   *
   * Transforms the decorated accessor into a read-only {@link QuerySignal}
   * holding the array of the matching elements (empty if there are none). The signal is
   * updated each time the projected content (or the light DOM) changes.
   *
   * @param target - A CSS selector (a tag name, `.class`, `[attribute]`...), or the class of a
   *   web component decorated with `@WebComponent`, whose selector is matched.
   * @param options - Restricts the query to a single slot, or extends it to the whole light DOM.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   *
   * @example
   * ```ts
   * @Query.slot.all('[item]')
   * accessor items: QuerySignal<HTMLElement[]>;
   *
   * @Query.slot.all(MyButtonComponent, { slot: 'footer' })
   * accessor footerButtons: QuerySignal<MyButtonComponent[]>;
   * ```
   */
  all: function all<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target, options?: QuerySlotOptions): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType>[]>> {
    return () => ({
      init() {
        return querySlotAll(this, target, options);
      }
    });
  }
});

/**
 * Creates a signal holding the first element of the Shadow DOM of `element`
 * matching the target, or `null` if there is none.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose Shadow DOM is queried.
 * @param target - A CSS selector, or the class of a web component.
 * @returns A {@link QuerySignal} of the matching element.
 * @throws When the target is a class not decorated with `@WebComponent`.
 */
export function query<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target): QuerySignal<QueryElement<Target, ElementType> | null> {
  const selector = toSelector(target);
  return createQuerySignal<QueryElement<Target, ElementType> | null>(element, shadowRoot => shadowRoot.querySelector<QueryElement<Target, ElementType>>(selector), null);
}

/**
 * Creates a signal holding all the elements of the Shadow DOM of `element`
 * matching the target, in document order.
 * The signal notifies only when the set of matching elements changes.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose Shadow DOM is queried.
 * @param target - A CSS selector, or the class of a web component.
 * @returns A {@link QuerySignal} of the matching elements.
 * @throws When the target is a class not decorated with `@WebComponent`.
 */
export function queryAll<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target): QuerySignal<QueryElement<Target, ElementType>[]> {
  const selector = toSelector(target);
  return createQuerySignal<QueryElement<Target, ElementType>[]>(element, shadowRoot => Array.from(shadowRoot.querySelectorAll<QueryElement<Target, ElementType>>(selector)), [], sameElements);
}

/**
 * Creates a signal holding the first element projected into the slots of , or one of their descendants,
 * matching the target, or  if there is none.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose projected content is queried.
 * @param target - A CSS selector, or the class of a web component.
 * @param options - Restricts the query to a single slot, or extends it to the whole light DOM.
 * @returns A {@link QuerySignal} of the matching element.
 * @throws When the target is a class not decorated with .
 */
export function querySlot<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target, options: QuerySlotOptions = {}): QuerySignal<QueryElement<Target, ElementType> | null> {
  return createSlotQuerySignal<QueryElement<Target, ElementType>, QueryElement<Target, ElementType> | null>(element, toSelector(target), options, elements => elements[0] ?? null, null);
}

/**
 * Creates a signal holding all the elements projected into the slots of , and their descendants,
 * matching the target, in order: slots in tree order, then assigned elements in assignment order.
 * With the  option they are in document order.
 * The signal notifies only when the set of matching elements changes.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose projected content is queried.
 * @param target - A CSS selector, or the class of a web component.
 * @param options - Restricts the query to a single slot, or extends it to the whole light DOM.
 * @returns A {@link QuerySignal} of the matching elements.
 * @throws When the target is a class not decorated with .
 */
export function querySlotAll<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target, options: QuerySlotOptions = {}): QuerySignal<QueryElement<Target, ElementType>[]> {
  return createSlotQuerySignal<QueryElement<Target, ElementType>, QueryElement<Target, ElementType>[]>(element, toSelector(target), options, elements => elements, [], sameElements);
}

/**
 * Tells whether two lists hold the same elements in the same order.
 *
 * @param a - The first list.
 * @param b - The second list.
 * @returns  when the lists are equal.
 */
function sameElements(a: ReadonlyArray<Element>, b: ReadonlyArray<Element>): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}
