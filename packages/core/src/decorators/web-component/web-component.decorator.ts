import type { ClassDecorator, Constructor, DecoratorMetadataContext } from '@xaendar/types';
import { INTERNAL_EXTENDS, INTERNAL_HOST_DIRECTIVES, INTERNAL_HYDRATE, INTERNAL_RENDER, INTERNAL_SELECTOR } from '../../costants';
import { CustomElement } from '../../models/custom-element/custom-element';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { WebComponentOptions } from '../../types/web-component/web-component-options.type';
import { _applyHostCallbacks } from '../../utils/host-callbacks/host-callbacks.util';
import { _resolveHostDirectives } from '../../utils/host-directives/host-directives.util';

/**
 * Decorator that registers a class as a custom web component.
 *
 * Registers the component with the browser's Custom Elements registry under the given selector, once the class is
 * complete (its static fields, such as `observedAttributes`, included). The selector is also stored in the class
 * metadata so that the component can be queried by class (see `Query`).
 *
 * The custom directives listed in `hostDirectives` are applied to every instance of the component, and of the
 * components extending it, on the component element itself: they are reached through `hostDirectives` of the
 * component, and the inputs and outputs they expose are bindable from the templates using the component, as its own.
 * They are resolved when the class is registered, so a declaration that cannot be applied throws then, and each exposed
 * input gets an accessor on the prototype of the class, so that code outside the templates sets it as an input of the
 * component.
 *
 * With `extends`, the component is a customized built-in element: it is defined on the native element it extends, whose
 * class its own extends through `customElementOf`, and templates write it with the tag of that element and its selector
 * as `is` (`<button is="my-button">`). Safari does not support customized built-in elements: a page needing them there
 * loads a polyfill first.
 *
 * The form callbacks the browser calls on a form-associated element (`formResetCallback`, `formDisabledCallback`…) the
 * component does not declare are forwarded to the host directives declaring them, and a host directive declaring one
 * makes the component form-associated: the decorator sets the static `formAssociated` the browser reads, which a class
 * can also declare itself. A customized built-in element cannot be form-associated, which the registration rejects.
 *
 * @param options - Configuration object containing at least a `selector`
 *   (the custom element tag name) and a `templateUrl`.
 * @returns A class decorator applied to the web component class.
 * @throws When the class is registered: a host directive cannot be applied, or a customized built-in element is
 *   form-associated.
 *
 * @example
 * ```ts
 * \@WebComponent({ selector: 'my-button', templateUrl: './my-button.html' })
 * class MyButtonComponent extends CustomElement {}
 * ```
 *
 * @example
 * ```ts
 * \@WebComponent({
 *   selector: 'my-field',
 *   hostDirectives: [{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'hint' }], events: ['opened'] }],
 *   templateUrl: './my-field.html'
 * })
 * class MyFieldComponent extends CustomElement {}
 * ```
 *
 * @example
 * ```ts
 * \@WebComponent({ selector: 'copy-button', extends: 'button' })
 * class CopyButtonComponent extends customElementOf(HTMLButtonElement) {}
 * ```
 */
export function WebComponent<T extends CustomElement>(options: WebComponentOptions): ClassDecorator<T, object, WebComponentMetadata> {
  return function (klass: Constructor<T>, context: DecoratorMetadataContext<ClassDecoratorContext<Constructor<T>>, WebComponentMetadata>): void {
    const metadata = context.metadata;
    
    metadata[INTERNAL_SELECTOR] = options.selector;
    if (options.extends) {
      metadata[INTERNAL_EXTENDS] = options.extends;
    }

    if (options.hostDirectives?.length) {
      metadata[INTERNAL_HOST_DIRECTIVES] = options.hostDirectives;
    }

    if (options.ssr?.hydrate) {
      metadata[INTERNAL_HYDRATE] = options.ssr.hydrate;
    }

    if (options.ssr?.render === false) {
      metadata[INTERNAL_RENDER] = false;
    }

    /*
      Class decorators run before the static fields are initialized and the metadata is assigned to the class, while the
      registry reads `observedAttributes` when the class is defined: the class is registered by an initializer, which
      runs once both are set.
    */
    context.addInitializer(() => {
      // Before the definition: the browser reads the static formAssociated and the callbacks then
      _applyHostCallbacks(klass, _resolveHostDirectives(klass));
      // A native control takes part in the forms by itself, and the browser gives a customized built-in no ElementInternals
      if (options.extends && (klass as { formAssociated?: unknown }).formAssociated === true) {
        throw new Error(`${klass.name} extends <${options.extends}> and is form-associated (a host directive declaring a form callback, or a static formAssociated): a customized built-in element cannot be, since attachInternals() throws for it. A native control (<input>, <select>, <textarea>, <button>) already takes part in the forms: use its value and setCustomValidity(), or make the component autonomous`);
      }

      // A customized built-in element is defined on the tag it extends, an autonomous one on its own
      options.extends ? customElements.define(options.selector, klass, { extends: options.extends }) : customElements.define(options.selector, klass);
    });
  };
}