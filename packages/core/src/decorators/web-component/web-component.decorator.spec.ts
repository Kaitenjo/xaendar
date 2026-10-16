// @vitest-environment happy-dom
import { Constructor } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_HOST_DIRECTIVES, INTERNAL_SELECTOR } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import type { WebComponentOptions } from '../../types/web-component/web-component-options.type';
import { WebComponent } from './web-component.decorator';

type Initializer = (this: Constructor<CustomElement>) => void;

/**
 * Applies the decorator as the runtime does: the decorator first, then the static fields (`setStaticFields`),
 * then the initializers the decorator added.
 */
function decorate(selector: string, klass: Constructor<CustomElement>, metadata: object = {}, hostDirectives?: WebComponentOptions['hostDirectives'], setStaticFields?: () => void): void {
  const initializers = new Array<Initializer>();
  const context = { metadata, addInitializer: (initializer: Initializer) => initializers.push(initializer) };
  WebComponent({ selector, hostDirectives, templateUrl: './x.html' })(klass, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);
  setStaticFields?.();
  for (let i = 0; i < initializers.length; i++) {
    initializers[i].call(klass);
  }
}

describe('WebComponent decorator', () => {
  it('registers the class under its selector', () => {
    class Single extends CustomElement { }
    decorate('x-single', Single);

    expect(customElements.get('x-single')).toBe(Single);
  });

  it('registers the class only once its static fields are set, so that the registry reads observedAttributes', () => {
    const changed = vi.fn();
    class Observing extends CustomElement {
      public attributeChangedCallback(name: string): void {
        changed(name);
      }
    }
    decorate('x-observing', Observing, {}, undefined, () => {
      expect(customElements.get('x-observing')).toBeUndefined();
      Object.assign(Observing, { observedAttributes: ['disabled'] });
    });

    document.createElement('x-observing').setAttribute('disabled', '');

    expect(changed).toHaveBeenCalledWith('disabled');
  });

  it('stores the selector in the class metadata', () => {
    const metadata = {};
    decorate('x-with-metadata', class extends CustomElement { }, metadata);

    expect(metadata).toEqual({ [INTERNAL_SELECTOR]: 'x-with-metadata' });
  });

  it('stores the host directives in the class metadata', () => {
    class Directive extends CustomDirective { }
    const hostDirectives = [Directive, { directive: Directive, properties: ['text'] }];
    const metadata = {};
    decorate('x-with-host-directives', class extends CustomElement { }, metadata, hostDirectives);

    expect(metadata).toEqual({ [INTERNAL_SELECTOR]: 'x-with-host-directives', [INTERNAL_HOST_DIRECTIVES]: hostDirectives });
  });

  it('stores no host directives when it declares none', () => {
    const metadata = {};
    decorate('x-without-host-directives', class extends CustomElement { }, metadata, []);

    expect(metadata).toEqual({ [INTERNAL_SELECTOR]: 'x-without-host-directives' });
  });

  it('throws when the selector is already used by another component', () => {
    decorate('x-duplicated', class extends CustomElement { });

    expect(() => decorate('x-duplicated', class extends CustomElement { })).toThrow();
  });
});
