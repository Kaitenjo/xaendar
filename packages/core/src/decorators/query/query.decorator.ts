import type { AccessorDecorator } from '@xaendar/types';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { createQuerySignal, createSlotQuerySignal, toMatcher, toRefMatcher } from '../../signals/query/query';
import type { QueryElement } from '../../signals/types/query-element.type';
import type { QueryMatcher } from '../../signals/types/query-matcher.type';
import type { QueryOptions } from '../../signals/types/query-options.type';
import type { QuerySignal } from '../../signals/types/query-signal.type';
import type { QuerySlotOptions } from '../../signals/types/query-slot-options.type';
import type { QueryTarget } from '../../signals/types/query-target.type';
import type { RefQueryDecorator } from '../../types/query/ref-query-decorator.type';
import type { SingleQueryDecorator } from '../../types/query/single-query-decorator.type';

/**
 * Decorator that binds an accessor of a web component to the first element
 * of its Shadow DOM that matches the given CSS selector, or that is an instance of the given web component.
 *
 * Transforms the decorated accessor into a read-only {@link QuerySignal}
 * holding the matching element, or `null` if there is none. The signal is
 * updated each time the Shadow DOM changes.
 *
 * The target is a CSS selector (a tag name, `.class`, `[attribute]`...), the class of a web component decorated with
 * `@WebComponent`, whose selector is matched, or the class of a custom directive, whose instance applied to an element
 * is held instead. The `read` option tells what is held for the element found: the element itself (`'element'`), also
 * when the target is a directive, or the instance of a directive applied to it, by its class.
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
 *
 * \@Query('.help', { read: TooltipDirective })
 * accessor helpTooltip: QuerySignal<TooltipDirective | null>;
 *
 * \@Query<HTMLButtonElement>(TooltipDirective, { read: 'element' })
 * accessor withTooltip: QuerySignal<HTMLButtonElement | null>;
 * ```
 */
export const Query = Object.assign(singleQuery(query) as unknown as SingleQueryDecorator<null, object>, {
  /**
   * Decorator that binds an accessor of a web component to the first element
   * of its Shadow DOM that matches the given CSS selector, or that is an instance of the given web component,
   * when there must be one. It takes the targets and the options of `@Query`.
   *
   * Transforms the decorated accessor into a read-only {@link QuerySignal}
   * holding the matching element. The signal is updated each time the Shadow DOM changes,
   * and reading it throws when no element matches, also before the element is connected for the first time.
   *
   * @example
   * ```ts
   * \@Query.required('[preview]')
   * accessor preview: QuerySignal<HTMLElement>;
   * ```
   */
  required: singleQuery(queryRequired) as unknown as SingleQueryDecorator<never, object>,
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
  all: function all<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string, Class extends CustomElement = CustomElement>(target: Target): AccessorDecorator<Class, QuerySignal<QueryElement<Target, ElementType>[]>> {
    return () => ({
      init() {
        return queryAll(this, target);
      }
    });
  },
  /**
   * Decorator that binds an accessor of a web component to the first element of its Shadow DOM named by an element ref
   * (`#name`) of its template, or, with the `read` option, to the instance of a directive applied to it.
   *
   * Transforms the decorated accessor into a read-only {@link QuerySignal}
   * holding the element, or `null` if there is none. The signal is
   * updated each time the Shadow DOM changes.
   *
   * @example
   * ```ts
   * \@Query.ref('field')
   * accessor field: QuerySignal<HTMLInputElement | null>;
   *
   * \@Query.ref('field', { read: TooltipDirective })
   * accessor fieldTooltip: QuerySignal<TooltipDirective | null>;
   * ```
   */
  ref: Object.assign(refQuery(queryRef) as unknown as RefQueryDecorator<null>, {
    /**
     * Decorator that binds an accessor of a web component to the first element of its Shadow DOM named by an element
     * ref (`#name`) of its template, when there must be one. It takes the options of `@Query.ref`.
     *
     * Transforms the decorated accessor into a read-only {@link QuerySignal}
     * holding the element. The signal is updated each time the Shadow DOM changes,
     * and reading it throws when no element is named by the ref, also before the element is connected for the first time.
     *
     * @example
     * ```ts
     * \@Query.ref.required('field')
     * accessor field: QuerySignal<HTMLInputElement>;
     * ```
     */
    required: refQuery(queryRefRequired) as unknown as RefQueryDecorator<never>,
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
  }),
  /**
   * Decorator that binds an accessor of a web component to the first element projected into its slots,
   * or one of their descendants, that matches the given CSS selector or is an instance of the given web component.
   * With the `lightDom` option the query is extended to the whole light DOM, including the elements not assigned to any slot.
   * It takes the targets of `@Query`, and the `read` option among the options of the slots.
   *
   * Transforms the decorated accessor into a read-only {@link QuerySignal}
   * holding the matching element, or `null` if there is none. The signal is
   * updated each time the projected content (or the light DOM) changes.
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
  content: Object.assign(singleQuery(querySlot) as unknown as SingleQueryDecorator<null, QuerySlotOptions>, {
    /**
     * Decorator that binds an accessor of a web component to the first element projected into its slots,
     * or one of their descendants, that matches the given CSS selector or is an instance of the given web component,
     * when there must be one. With the `lightDom` option the query is extended to the whole light DOM, including the elements
     * not assigned to any slot. It takes the targets and the options of `@Query.content`.
     *
     * Transforms the decorated accessor into a read-only {@link QuerySignal}
     * holding the matching element. The signal is updated each time the projected content (or the light DOM) changes,
     * and reading it throws when no element matches, also before the element is connected for the first time.
     *
     * @example
     * ```ts
     * \@Query.content.required('[header]')
     * accessor header: QuerySignal<HTMLElement>;
     * ```
     */
    required: singleQuery(querySlotRequired) as unknown as SingleQueryDecorator<never, QuerySlotOptions>,
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
  })
});

/**
 * Creates a decorator of a query holding a single element, given the function creating its signal: its typed
 * signatures are described by {@link SingleQueryDecorator}.
 *
 * @template Options - The options of the query.
 * @param create - Creates the signal of the query on the component, from its target and its options.
 * @returns The decorator, taking the target and the options.
 */
function singleQuery<Options>(create: (element: CustomElement, target: QueryTarget, options?: Options) => QuerySignal<unknown>): (target: QueryTarget, options?: Options) => AccessorDecorator<CustomElement, QuerySignal<unknown>> {
  return (target, options) => () => ({
    init() {
      return create(this, target, options);
    }
  });
}

/**
 * Creates a decorator of a query holding the element an element ref names, given the function creating its signal:
 * its typed signatures are described by {@link RefQueryDecorator}.
 *
 * @param create - Creates the signal of the query on the component, from the name of the ref and the options.
 * @returns The decorator, taking the name of the ref and the options.
 */
function refQuery(create: (element: CustomElement, name: string, options?: QueryOptions) => QuerySignal<unknown>): (name: string, options?: QueryOptions) => AccessorDecorator<CustomElement, QuerySignal<unknown>> {
  return (name, options) => () => ({
    init() {
      return create(this, name, options);
    }
  });
}

/**
 * Creates a signal holding the first element of the Shadow DOM of `element`
 * matching the target, or `null` if there is none.
 *
 * @template Value - What the query holds: the element, or the instance of a directive.
 * @param element - The component whose Shadow DOM is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @param options - What the query reads from the element.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function query<Value>(element: CustomElement, target: QueryTarget, options?: QueryOptions): QuerySignal<Value | null> {
  return queryFirst(element, toMatcher(target, options?.read));
}

/**
 * Creates a signal holding the first element of the Shadow DOM of `element` matching the target,
 * whose reading throws when there is none.
 *
 * @template Value - What the query holds: the element, or the instance of a directive.
 * @param element - The component whose Shadow DOM is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @param options - What the query reads from the element.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function queryRequired<Value>(element: CustomElement, target: QueryTarget, options?: QueryOptions): QuerySignal<Value> {
  const matcher = toMatcher(target, options?.read);
  return requireMatch(queryFirst<Value>(element, matcher), `No element matches the required query '${matcher.description}' of <${element.localName}>`);
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
 * @template Value - What the query holds: the element, or the instance of a directive.
 * @param element - The component whose Shadow DOM is queried.
 * @param name - The name of the ref, without the `#`.
 * @param options - What the query reads from the element.
 * @returns A {@link QuerySignal} of the element, or of the instance of the directive.
 */
export function queryRef<Value>(element: CustomElement, name: string, options?: QueryOptions): QuerySignal<Value | null> {
  return queryFirst(element, toRefMatcher(name, options?.read));
}

/**
 * Creates a signal holding the first element of the Shadow DOM of `element` named by an element ref, whose reading
 * throws when there is none.
 *
 * @template Value - What the query holds: the element, or the instance of a directive.
 * @param element - The component whose Shadow DOM is queried.
 * @param name - The name of the ref, without the `#`.
 * @param options - What the query reads from the element.
 * @returns A {@link QuerySignal} of the element, or of the instance of the directive.
 */
export function queryRefRequired<Value>(element: CustomElement, name: string, options?: QueryOptions): QuerySignal<Value> {
  const matcher = toRefMatcher(name, options?.read);
  return requireMatch(queryFirst<Value>(element, matcher), `No element is named by the required ref '${matcher.description}' of <${element.localName}>`);
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
 * @template Value - What the query holds: the element, or the instance of a directive.
 * @param element - The component whose projected content is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @param options - Restricts the query to some slots, or extends it to the whole light DOM, and tells what it reads
 *   from the element.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function querySlot<Value>(element: CustomElement, target: QueryTarget, options: QuerySlotOptions & QueryOptions = {}): QuerySignal<Value | null> {
  return createSlotQuerySignal<Value, Value | null>(element, toMatcher(target, options.read), options, items => items[0] ?? null, null);
}

/**
 * Creates a signal holding the first element projected into the slots of `element`, or one of their descendants,
 * matching the target, whose reading throws when there is none.
 *
 * @template Value - What the query holds: the element, or the instance of a directive.
 * @param element - The component whose projected content is queried.
 * @param target - A CSS selector, the class of a web component or the class of a custom directive.
 * @param options - Restricts the query to some slots, or extends it to the whole light DOM, and tells what it reads
 *   from the element.
 * @returns A {@link QuerySignal} of the matching element, or of the instance of the directive.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function querySlotRequired<Value>(element: CustomElement, target: QueryTarget, options?: QuerySlotOptions & QueryOptions): QuerySignal<Value> {
  return requireMatch(querySlot<Value>(element, target, options), `No element matches the required content query '${toMatcher(target, options?.read).description}' of <${element.localName}>`);
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
