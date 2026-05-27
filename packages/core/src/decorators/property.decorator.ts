import { INTERNAL_OBSERVED_ATTRIBUTES } from '../costants';
import { BaseWebComponent } from '../directives/base-web-component';

export function Property<
  Class extends BaseWebComponent,
  Signal extends Signal.State
>(params?: { alias?: string, required?: boolean }) {
  return function (_target: undefined, context: ClassFieldDecoratorContext<Class, Signal>): void {
    const propertyKey = context.name;

    /*
      We need to check if the property key is a symbol because observedAttributes only accepts string attribute names

      https://html.spec.whatwg.org/multipage/custom-elements.html
      Let observedAttributes be an empty sequence<DOMString>.
    */
    if (typeof propertyKey === 'symbol') {
      throw new Error('Symbol properties are not supported');
    }

    const metadata = context.metadata as { [INTERNAL_OBSERVED_ATTRIBUTES]?: string[] };
    metadata[INTERNAL_OBSERVED_ATTRIBUTES] ??= [];
    metadata[INTERNAL_OBSERVED_ATTRIBUTES].push(propertyKey);
  };
}