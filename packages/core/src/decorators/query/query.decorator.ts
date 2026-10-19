import type { AccessorDecorator } from '@xaendar/types';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { createQuerySignal, createSlotQuerySignal, toMatcher, toRefMatcher } from '../../signals/query/query';
import type { QueryElement } from '../../signals/types/query-element.type';
import type { QueryMatcher } from '../../signals/types/query-matcher.type';
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
 *   web component decorated with `@WebComponent`, whose selector is matched, or the class of a custom directive, whose
 *   instances applied to the elements are held instead.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * \@Query('[preview]')
 * accessor preview: QuerySignal<HTMLElement | null>;
 *
 * \@Query(MyButtonComponent)
 * accessor button: QuerySignal<MyButtonComponent | null>;
 *
 * \@Query(TooltipDirective)
 * accessor tooltip: QuerySignal<TooltipDirective | null>;
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
 * Decorator that binds an accessor of a web component to the first element
 * of its Shadow DOM that matches the given CSS selector, or that is an instance of the given web component,
 * when there must be one.
 *
 * Transforms the decorated accessor into a read-only {@link QuerySignal}
 * holding the matching element. The signal is updated each time the Shadow DOM changes,
 * and reading it throws when no element matches, also before the element is connected for the first time.
 *
 * @param target - A CSS selector (a tag name, `.class`, `[attribute]`...), or the class of a
 *   web component decorated with `@WebComponent`, whose selector is matched, or the class of a custom directive, whose
 *   instances applied to the elements are held instead.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * \@Query.required('[preview]')
 * accessor preview: QuerySignal<HTMLElement>;
 * ```
 */
Query.required = function required<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType>>> {
  return () => ({
    init() {
      return queryRequired(this, target);
    }
  });
};

/**
 * Decorator that binds an accessor of a web component to all the elements
 * of its Shadow DOM that match the given CSS selector, or that are instances of the given web component.
 *
 * Transforms the decorated accessor into a read-only {@link QuerySignal}
 * holding the array of the matching elements, in document order (empty if there
 * are none). The signal is updated each time the Shadow DOM changes.
 *
 * @param target - A CSS selector (a tag name, `.class`, `[attribute]`...), or the class of a
 *   web component decorated with `@WebComponent`, whose selector is matched, or the class of a custom directive, whose
 *   instances applied to the elements are held instead.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * \@Query.all('[item]')
 * accessor items: QuerySignal<HTMLElement[]>;
 *
 * \@Query.all(MyButtonComponent)
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
 * Decorator that binds an accessor of a web component to the first element of its Shadow DOM named by an element ref
 * (`#name`) of its template.
 *
 * Transforms the decorated accessor into a read-only {@link QuerySignal}
 * holding the element, or `null` if there is none. The signal is
 * updated each time the Shadow DOM changes.
 *
 * @param name - The name of the ref, without the `#`.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * \@Query.ref('field')
 * accessor field: QuerySignal<HTMLInputElement | null>;
 * ```
 */
Query.ref = Object.assign(function ref<ElementType extends Element = HTMLElement, Class extends CustomElement = CustomElement>(name: string): AccessorDecorator<Class, QuerySignal<ElementType | null>> {
  return () => ({
    init() {
      return queryRef<ElementType>(this, name);
    }
  });
}, {
  /**
   * Decorator that binds an accessor of a web component to the first element of its Shadow DOM named by an element
   * ref (`#name`) of its template, when there must be one.
   *
   * Transforms the decorated accessor into a read-only {@link QuerySignal}
   * holding the element. The signal is updated each time the Shadow DOM changes,
   * and reading it throws when no element is named by the ref, also before the element is connected for the first time.
   *
   * @param name - The name of the ref, without the `#`.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   *
   * @example
   * ```ts
   * \@Query.ref.required('field')
   * accessor field: QuerySignal<HTMLInputElement>;
   * ```
   */
  required: function required<ElementType extends Element = HTMLElement, Class extends CustomElement = CustomElement>(name: string): AccessorDecorator<Class, QuerySignal<ElementType>> {
    return () => ({
      init() {
        return queryRefRequired<ElementType>(this, name);
      }
    });
  },
  /**
   * Decorator that binds an accessor of a web component to all the elements of its Shadow DOM named by an element ref
   * (`#name`) of its template: one for each row of the `@for` declaring it.
   *
   * Transforms the decorated accessor into a read-only {@link QuerySignal}
   * holding the array of the elements, in document order (empty if there
   * are none). The signal is updated each time the Shadow DOM changes.
   *
   * @param name - The name of the ref, without the `#`.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   *
   * @example
   * ```ts
   * \@Query.ref.all('note')
   * accessor notes: QuerySignal<HTMLInputElement[]>;
   * ```
   */
  all: function all<ElementType extends Element = HTMLElement, Class extends CustomElement = CustomElement>(name: string): AccessorDecorator<Class, QuerySignal<ElementType[]>> {
    return () => ({
      init() {
        return queryRefAll<ElementType>(this, name);
      }
    });
  }
});

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
 *   web component decorated with `@WebComponent`, whose selector is matched, or the class of a custom directive, whose
 *   instances applied to the elements are held instead.
 * @param options - Restricts the query to some slots, or extends it to the whole light DOM.
 * @returns An accessor decorator that replaces the field with a `QuerySignal`.
 *
 * @example
 * ```ts
 * \@Query.content('[header]')
 * accessor header: QuerySignal<HTMLElement | null>;
 *
 * \@Query.content(MyButtonComponent, { slots: 'footer' })
 * accessor footerButton: QuerySignal<MyButtonComponent | null>;
 *
 * \@Query.content('[item]', { lightDom: true })
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
   * Decorator that binds an accessor of a web component to the first element projected into its slots,
   * or one of their descendants, that matches the given CSS selector or is an instance of the given web component,
   * when there must be one. With the `lightDom` option the query is extended to the whole light DOM, including the elements
   * not assigned to any slot.
   *
   * Transforms the decorated accessor into a read-only {@link QuerySignal}
   * holding the matching element. The signal is updated each time the projected content (or the light DOM) changes,
   * and reading it throws when no element matches, also before the element is connected for the first time.
   *
   * @param target - A CSS selector (a tag name, `.class`, `[attribute]`...), or the class of a
   *   web component decorated with `@WebComponent`, whose selector is matched, or the class of a custom directive, whose
   *   instances applied to the elements are held instead.
   * @param options - Restricts the query to some slots, or extends it to the whole light DOM.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   *
   * @example
   * ```ts
   * \@Query.content.required('[header]')
   * accessor header: QuerySignal<HTMLElement>;
   * ```
   */
  required: function required<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target, options?: QuerySlotOptions): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType>>> {
    return () => ({
      init() {
        return querySlotRequired(this, target, options);
      }
    });
  },
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
   *   web component decorated with `@WebComponent`, whose selector is matched, or the class of a custom directive, whose
   *   instances applied to the elements are held instead.
   * @param options - Restricts the query to some slots, or extends it to the whole light DOM.
   * @returns An accessor decorator that replaces the field with a `QuerySignal`.
   *
   * @example
   * ```ts
   * \@Query.content.all('[item]')
   * accessor items: QuerySignal<HTMLElement[]>;
   *
   * \@Query.content.all(MyButtonComponent, { slots: 'footer' })
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
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function query<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target): QuerySignal<QueryElement<Target, ElementType> | null> {
  return queryFirst(element, toMatcher(target));
}

/**
 * Creates a signal holding the first element of the Shadow DOM of `element` matching the target,
 * whose reading throws when there is none.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose Shadow DOM is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function queryRequired<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target): QuerySignal<QueryElement<Target, ElementType>> {
  const matcher = toMatcher(target);
  return requireMatch(queryFirst(element, matcher), `No element matches the required query '${matcher.description}' of <${element.localName}>`);
}

/**
 * Creates a signal holding all the elements of the Shadow DOM of `element`
 * matching the target, in document order.
 * The signal notifies only when the set of matching elements changes.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose Shadow DOM is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @returns A {@link QuerySignal} of the matching elements, or of the instances of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function queryAll<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target): QuerySignal<QueryElement<Target, ElementType>[]> {
  return queryEvery(element, toMatcher(target));
}

/**
 * Creates a signal holding the first element of the Shadow DOM of `element` named by an element ref, or `null` if
 * there is none.
 *
 * @template ElementType - The type of the element.
 * @param element - The component whose Shadow DOM is queried.
 * @param name - The name of the ref, without the `#`.
 * @returns A {@link QuerySignal} of the element.
 */
export function queryRef<ElementType extends Element>(element: CustomElement, name: string): QuerySignal<ElementType | null> {
  return queryFirst(element, toRefMatcher(name));
}

/**
 * Creates a signal holding the first element of the Shadow DOM of `element` named by an element ref, whose reading
 * throws when there is none.
 *
 * @template ElementType - The type of the element.
 * @param element - The component whose Shadow DOM is queried.
 * @param name - The name of the ref, without the `#`.
 * @returns A {@link QuerySignal} of the element.
 */
export function queryRefRequired<ElementType extends Element>(element: CustomElement, name: string): QuerySignal<ElementType> {
  return requireMatch(queryRef<ElementType>(element, name), `No element is named by the required ref '#${name}' of <${element.localName}>`);
}

/**
 * Creates a signal holding all the elements of the Shadow DOM of `element` named by an element ref, one for each row
 * of the `@for` declaring it, in document order. The signal notifies only when the set of elements changes.
 *
 * @template ElementType - The type of the elements.
 * @param element - The component whose Shadow DOM is queried.
 * @param name - The name of the ref, without the `#`.
 * @returns A {@link QuerySignal} of the elements.
 */
export function queryRefAll<ElementType extends Element>(element: CustomElement, name: string): QuerySignal<ElementType[]> {
  return queryEvery(element, toRefMatcher(name));
}

/**
 * Creates a signal holding the first element projected into the slots of `element`, or one of their descendants,
 * matching the target, or `null` if there is none.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose projected content is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @param options - Restricts the query to some slots, or extends it to the whole light DOM.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function querySlot<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target, options: QuerySlotOptions = {}): QuerySignal<QueryElement<Target, ElementType> | null> {
  return createSlotQuerySignal<QueryElement<Target, ElementType>, QueryElement<Target, ElementType> | null>(element, toMatcher(target), options, items => items[0] ?? null, null);
}

/**
 * Creates a signal holding the first element projected into the slots of `element`, or one of their descendants,
 * matching the target, whose reading throws when there is none.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose projected content is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @param options - Restricts the query to some slots, or extends it to the whole light DOM.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function querySlotRequired<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target, options?: QuerySlotOptions): QuerySignal<QueryElement<Target, ElementType>> {
  return requireMatch(querySlot<Target, ElementType>(element, target, options), `No element matches the required content query '${toMatcher(target).description}' of <${element.localName}>`);
}

/**
 * Creates a signal holding all the elements projected into the slots of `element`, and their descendants,
 * matching the target, in order: slots in tree order, then assigned elements in assignment order.
 * With the `lightDom` option they are in document order.
 * The signal notifies only when the set of matching elements changes.
 *
 * @template Target - The {@link QueryTarget} of the query.
 * @param element - The component whose projected content is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @param options - Restricts the query to some slots, or extends it to the whole light DOM.
 * @returns A {@link QuerySignal} of the matching elements, or of the instances of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function querySlotAll<Target extends QueryTarget, ElementType extends HTMLElement>(element: CustomElement, target: Target, options: QuerySlotOptions = {}): QuerySignal<QueryElement<Target, ElementType>[]> {
  return createSlotQuerySignal<QueryElement<Target, ElementType>, QueryElement<Target, ElementType>[]>(element, toMatcher(target), options, items => items, [], sameElements);
}

/**
 * Creates a signal holding the first value a matcher finds in the Shadow DOM of `element`, or `null` if there is none.
 *
 * @template Value - The type of the value.
 * @param element - The component whose Shadow DOM is queried.
 * @param matcher - How the query finds what it looks for.
 * @returns A {@link QuerySignal} of the value.
 */
function queryFirst<Value>(element: CustomElement, { selector, pick }: QueryMatcher): QuerySignal<Value | null> {
  const read = pick
    ? (shadowRoot: ShadowRoot) => (pick(Array.from(shadowRoot.querySelectorAll(selector)))[0] ?? null) as Value | null
    : (shadowRoot: ShadowRoot) => shadowRoot.querySelector(selector) as Value | null;
  return createQuerySignal<Value | null>(element, read, null);
}

/**
 * Creates a signal holding all the values a matcher finds in the Shadow DOM of `element`, in document order.
 * The signal notifies only when the set of values changes.
 *
 * @template Value - The type of the values.
 * @param element - The component whose Shadow DOM is queried.
 * @param matcher - How the query finds what it looks for.
 * @returns A {@link QuerySignal} of the values.
 */
function queryEvery<Value>(element: CustomElement, { selector, pick }: QueryMatcher): QuerySignal<Value[]> {
  const read = (shadowRoot: ShadowRoot) => {
    const elements = Array.from(shadowRoot.querySelectorAll(selector));
    return (pick ? pick(elements) : elements) as Value[];
  };
  return createQuerySignal<Value[]>(element, read, [], sameElements);
}

/**
 * Wraps the signal of a query looking for one element so that reading it throws when there is none.
 *
 * @template Value - The type of the matching element.
 * @param signal - The signal of the query, holding `null` when no element matches.
 * @param message - The message of the error thrown when no element matches.
 * @returns A {@link QuerySignal} of the matching element.
 */
function requireMatch<Value>(signal: QuerySignal<Value | null>, message: string): QuerySignal<Value> {
  const get = () => {
    const value = signal.get();
    if (value === null) {
      throw new Error(message);
    }

    return value;
  };

  return Object.assign(function () { return get(); }, { get });
}

/**
 * Tells whether two lists hold the same elements, or directives, in the same order.
 *
 * @param a - The first list.
 * @param b - The second list.
 * @returns `true` when the lists are equal.
 */
function sameElements(a: ReadonlyArray<unknown>, b: ReadonlyArray<unknown>): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}
