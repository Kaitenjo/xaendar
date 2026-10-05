import { ClassDecorator, Constructor } from '@xaendar/types';
import { INTERNAL_SELECTOR } from '../../costants';
import { CustomElement } from '../../models/custom-element/custom-element';
import { WebComponentOptions } from '../../types/web-component/web-component-options.type';

/**
 * Decorator that registers a class as a custom web component.
 *
 * Registers the component with the browser's Custom Elements registry under the given selector,
 * which is also stored in the class metadata so that the component can be queried by class (see `Query`).
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
 */
export function WebComponent<T extends CustomElement>(options: WebComponentOptions): ClassDecorator<T> {
  return function (klass: Constructor<T>, context: ClassDecoratorContext<Constructor<T>>): void {
    const metadata = context.metadata as { [INTERNAL_SELECTOR]?: string };
    metadata[INTERNAL_SELECTOR] = options.selector;
    customElements.define(options.selector, klass);
  };
}
