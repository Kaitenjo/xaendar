import { ClassDecorator, Constructor } from '@xaendar/types';
import { INTERNAL_HOST_DIRECTIVES, INTERNAL_SELECTOR } from '../../costants';
import { CustomElement } from '../../models/custom-element/custom-element';
import { WebComponentOptions } from '../../types/web-component/web-component-options.type';

/**
 * Decorator that registers a class as a custom web component.
 *
 * Registers the component with the browser's Custom Elements registry under the given selector,
 * which is also stored in the class metadata so that the component can be queried by class (see `Query`).
 *
 * The custom directives listed in `hostDirectives` are applied to every instance of the component, on the component
 * element itself: they are reached through `hostDirectives` of the component, and the inputs and outputs
 * they expose are bindable from the templates using the component.
 *
 * @param options - Configuration object containing at least a `selector`
 *   (the custom element tag name) and a `templateUrl`.
 * @returns A class decorator applied to the web component class.
 *
 * @example
 * ```ts
 * @WebComponent({ selector: 'my-button', templateUrl: './my-button.html' })
 * class MyButtonComponent extends CustomElement {}
 * ```
 *
 * @example
 * ```ts
 * @WebComponent({
 *   selector: 'my-field',
 *   hostDirectives: [{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'hint' }], events: ['opened'] }],
 *   templateUrl: './my-field.html'
 * })
 * class MyFieldComponent extends CustomElement {}
 * ```
 */
export function WebComponent<T extends CustomElement>(options: WebComponentOptions): ClassDecorator<T> {
  return function (klass: Constructor<T>, context: ClassDecoratorContext<Constructor<T>>): void {
    const metadata = context.metadata as { 
      [INTERNAL_SELECTOR]?: string, 
      [INTERNAL_HOST_DIRECTIVES]?: WebComponentOptions['hostDirectives'] 
    };
    
    metadata[INTERNAL_SELECTOR] = options.selector;
    if (options.hostDirectives?.length) {
      metadata[INTERNAL_HOST_DIRECTIVES] = options.hostDirectives;
    }

    customElements.define(options.selector, klass);
  };
}
