import type { Constructor } from '@xaendar/types';
import { INITIALIZE } from '../../costants';
import { CustomElement } from '../../models/custom-element/custom-element';

/**
 * The class of `CustomElement` created on the class of each native element, by {@link customElementOf}: `HTMLElement`
 * has `CustomElement` itself.
 *
 * N.B. Deliberate: one class per native class, shared by every component extending it, instead of a class per call,
 * which would copy the prototype of `CustomElement` for each component. Do not create it at each call.
 */
const CLASSES = new WeakMap<Constructor<HTMLElement>, Constructor<CustomElement>>([[HTMLElement, CustomElement]]);

/**
 * Returns the class a customized built-in element extends: the class of the native element of its tag, with the members
 * of `CustomElement`. A component extending it declares the tag in `extends` of `@WebComponent`, and templates write it
 * with that tag and its selector as `is` (`<button is="copy-button">`): it inherits what the native element does (the
 * semantics, the focus, the forms, the accessibility) and adds its inputs, its events, its host bindings and its host
 * directives, rendering a template only when its tag accepts a shadow root.
 *
 * The class is created once for each native class and shared: `customElementOf(HTMLButtonElement)` is the same class
 * for every component extending it, and `customElementOf(HTMLElement)` is `CustomElement` itself, the class of
 * `article`, `section` and the other tags whose class is `HTMLElement`. Its prototype holds the members of
 * `CustomElement`, the same functions, and its constructor initializes the element as the one of `CustomElement` does:
 * `instanceof CustomElement` holds for its elements too.
 *
 * Safari does not support customized built-in elements: a page needing them there loads a polyfill first.
 *
 * @example
 * ```ts
 * \@WebComponent({ selector: 'copy-button', extends: 'button' })
 * class CopyButtonComponent extends customElementOf(HTMLButtonElement) {
 *   \@HostListener('click')
 *   public copy(): void { … }
 * }
 * ```
 *
 * @param base - The class of the native element, such as `HTMLButtonElement`.
 * @returns The class extending it with the members of `CustomElement`.
 */
export function customElementOf<Element extends HTMLElement>(base: Constructor<Element>): Constructor<CustomElement & Element> {
  let klass = CLASSES.get(base);
  if (!klass) {
    klass = createCustomElementClass(base);
    CLASSES.set(base, klass);
  }

  return klass as unknown as Constructor<CustomElement & Element>;
}

/**
 * Creates the class of `CustomElement` on the class of a native element: its constructor initializes the element as
 * the one of `CustomElement` does, and its prototype holds the members of `CustomElement`, the same functions, since a
 * class can extend only one class.
 *
 * @param base - The class of the native element.
 * @returns The class.
 */
function createCustomElementClass(base: Constructor<HTMLElement>): Constructor<CustomElement> {
  const klass = class extends base {
    /**
     * Creates the element, initialized as the one of `CustomElement`.
     *
     * @throws When a host directive is declared twice or exposes an input or an event it does not declare.
     */
    constructor() {
      super();
      (this as unknown as CustomElement)[INITIALIZE]();
    }
  };

  const members = Object.getOwnPropertyDescriptors(CustomElement.prototype);
  const keys = Reflect.ownKeys(members);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== 'constructor') {
      Object.defineProperty(klass.prototype, key, members[key as keyof typeof members]);
    }
  }

  return klass as unknown as Constructor<CustomElement>;
}
