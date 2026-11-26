import type { CustomElement } from '../../models/custom-element/custom-element';
import type { FormCallbackName } from '../../types/host/form-callback-name.type';
import type { ResolvedHostDirectives } from '../../types/web-component/resolved-host-directives.type';

/**
 * The form callbacks the browser calls on a form-associated custom element, each forwarding its arguments to the host
 * directives of the component declaring it (see {@link forwardFormCallback}).
 *
 * N.B. Deliberate: one function per callback, shared by every component, instead of one created per class. Do not create
 * them in {@link _applyHostCallbacks}.
 */
const FORM_CALLBACKS: Readonly<Record<FormCallbackName, (this: CustomElement, first?: unknown, second?: unknown) => void>> = {
  /**
   * Forwards the form the element now belongs to, `null` for none.
   */
  formAssociatedCallback(this: CustomElement, form?: unknown): void {
    forwardFormCallback(this, 'formAssociatedCallback', form, undefined);
  },
  /**
   * Forwards whether the element is disabled.
   */
  formDisabledCallback(this: CustomElement, disabled?: unknown): void {
    forwardFormCallback(this, 'formDisabledCallback', disabled, undefined);
  },
  /**
   * Forwards the reset of the form.
   */
  formResetCallback(this: CustomElement): void {
    forwardFormCallback(this, 'formResetCallback', undefined, undefined);
  },
  /**
   * Forwards the value the browser gives back, and why.
   */
  formStateRestoreCallback(this: CustomElement, state?: unknown, mode?: unknown): void {
    forwardFormCallback(this, 'formStateRestoreCallback', state, mode);
  }
};

/**
 * Gives the class of a component the form callbacks its host directives declare, before it is defined, when the browser
 * reads it: the browser calls them on the element, and the component forwards them to every host directive declaring
 * them. A host directive declaring one makes the component form-associated, the static `formAssociated` the browser
 * reads, since it calls them only on those: no option tells it. A callback the class, or one of its ancestors, declares
 * itself is left as it is: it calls the one of the directive when it needs it.
 *
 * @param klass - The class of the component.
 * @param resolved - Its host directives, the ones of its ancestors included.
 */
export function _applyHostCallbacks(klass: object, { directives }: ResolvedHostDirectives): boolean {
  let retVal = false;
  
  const prototype = (klass as { prototype: object }).prototype;
  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i].directive;
    for (const name in FORM_CALLBACKS) {
      if (typeof directive.prototype[name] === 'function') {
        retVal = true;
        if (!(name in prototype)) {
          Object.defineProperty(prototype, name, { configurable: true, writable: true, value: FORM_CALLBACKS[name as FormCallbackName] });
        }
      }
    }
  }

  return retVal;
}

/**
 * Calls a form callback on every host directive of a component declaring it, in the order of the declarations.
 *
 * @param element - The element of the component.
 * @param name - The name of the callback.
 * @param first - Its first argument, if any.
 * @param second - Its second argument, if any.
 */
function forwardFormCallback(element: CustomElement, name: FormCallbackName, first: unknown, second: unknown): void {
  for (const directive of element.hostDirectives.values()) {
    const callback = directive[name];
    if (typeof callback === 'function') {
      callback.call(directive, first, second);
    }
  }
}
