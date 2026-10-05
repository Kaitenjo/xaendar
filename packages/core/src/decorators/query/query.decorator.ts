import type { AccessorDecorator } from '@xaendar/types';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { createQuerySignal, toSelector } from '../../signals/query/query';
import type { QueryElement } from '../../signals/types/query-element.type';
import type { QuerySignal } from '../../signals/types/query-signal.type';
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
export function Query<Class extends CustomElement, Target extends QueryTarget = string>(target: Target): AccessorDecorator<Class, QuerySignal<QueryElement<Target> | null>> {
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
Query.all = function all<Class extends CustomElement, Target extends QueryTarget = string>(target: Target): AccessorDecorator<Class, QuerySignal<QueryElement<Target>[]>> {
  return () => ({
    init() {
      return queryAll(this, target);
    }
  });
};

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
export function query<Target extends QueryTarget>(element: CustomElement, target: Target): QuerySignal<QueryElement<Target> | null> {
  const selector = toSelector(target);
  return createQuerySignal<QueryElement<Target> | null>(element, shadowRoot => shadowRoot.querySelector<HTMLElement>(selector) as QueryElement<Target> | null, null);
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
export function queryAll<Target extends QueryTarget>(element: CustomElement, target: Target): QuerySignal<QueryElement<Target>[]> {
  const selector = toSelector(target);
  const equals = (a: QueryElement<Target>[], b: QueryElement<Target>[]) => a.length === b.length && a.every((item, index) => item === b[index]);
  return createQuerySignal<QueryElement<Target>[]>(element, shadowRoot => Array.from(shadowRoot.querySelectorAll<HTMLElement>(selector)) as QueryElement<Target>[], [], equals);
}
