import { ClassDecorator, Constructor } from '@xaendar/types';
import { CustomElement } from '../../models/custom-element/custom-element';
import { WebComponentDecoratorParams } from '../../types/web-component/web-component-decorator-params.type';

/**
 * Decorator that registers a class as a custom web component.
 *
 * Registers the component with the browser's Custom Elements registry under the given selector.
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
export function WebComponent<T extends CustomElement>(options: WebComponentDecoratorParams): ClassDecorator<T> {
  return function (klass: Constructor<T>, _context: ClassDecoratorContext<Constructor<T>>): void {
    customElements.define(options.selector, klass);
  };
}
