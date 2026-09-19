import { ClassDecorator, Constructor } from '@xaendar/types';
import { BaseWebComponent } from '../../directives/base-web-component';
import { WebComponentDecoratorParams } from '../../types/web-component/web-component-decorator-params.type';

/**
 * Decorator that registers a class as a custom web component.
 *
 * Registers the component with the browser's Custom Elements registry under the given selector(s).
 *
 * @param options - Configuration object containing at least a `selector`
 *   (the custom element tag name) and a `templateUrl`.
 * @returns A class decorator applied to the web component class.
 *
 * @example
 * ```ts
 * @WebComponent({ selector: 'my-button', templateUrl: './my-button.html' })
 * class MyButtonComponent extends BaseWebComponent {}
 * ```
 */
export function WebComponent<T extends BaseWebComponent>(options: WebComponentDecoratorParams): ClassDecorator<T> {
  return function (klass: Constructor<T>, context: ClassDecoratorContext<Constructor<T>>): void {
    setSelectors(klass, options.selector);
  };
}

/**
 * Registers the component class in the browser's Custom Elements registry
 * under the given selector(s).
 *
 * @param klass - The web component class to register.
 * @param selectors - One or more custom element tag names to associate with the class.
 */
function setSelectors<T extends BaseWebComponent>(klass: Constructor<T>, selectors: string | string[]): void {
  if (typeof selectors === 'string') {
    customElements.define(selectors, klass);
  } else {
    for (let i = 0; i < selectors.length; i++) {
      customElements.define(selectors[i], klass)
    }
  } 
}