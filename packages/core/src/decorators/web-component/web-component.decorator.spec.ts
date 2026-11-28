// @vitest-environment happy-dom
import { Constructor } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_ATTRIBUTE_INPUTS, INTERNAL_EXTENDS, INTERNAL_HOST_DIRECTIVES, INTERNAL_HYDRATE, INTERNAL_RENDER, INTERNAL_SELECTOR, INTERNAL_SHADOW_ROOT } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import type { WebComponentOptions } from '../../types/web-component/web-component-options.type';
import { customElementOf } from '../../utils/custom-element-of/custom-element-of.util';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
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

  it('stores the trigger hydrating the component in the class metadata', () => {
    const metadata = {};
    const context = { metadata, addInitializer: () => undefined };
    WebComponent({ selector: 'x-hydrated', ssr: { hydrate: 'visible' }, templateUrl: './x.html' })(class extends CustomElement { }, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);

    expect(metadata).toEqual({ [INTERNAL_SELECTOR]: 'x-hydrated', [INTERNAL_HYDRATE]: 'visible' });
  });

  it('stores in the metadata that the component renders only in the browser', () => {
    const metadata = {};
    const context = { metadata, addInitializer: () => undefined };

    WebComponent({ selector: 'x-browser', ssr: { render: false }, templateUrl: './x.html' })(class extends CustomElement { }, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);

    expect(metadata).toEqual({ [INTERNAL_SELECTOR]: 'x-browser', [INTERNAL_RENDER]: false });
  });

  it('observes the attributes writing the inputs of the class before defining it', () => {
    class Meter extends CustomElement { }
    const metadata = { [INTERNAL_ATTRIBUTE_INPUTS]: { value: { property: 'value', convert: Number, reflects: false } } };
    Object.defineProperty(Meter, Symbol.for('Symbol.metadata'), { value: metadata });

    decorate('x-attribute-meter', Meter, metadata);

    expect((Meter as unknown as { observedAttributes: string[] }).observedAttributes).toEqual(['value']);
    expect(typeof (Meter.prototype as unknown as { attributeChangedCallback: unknown }).attributeChangedCallback).toBe('function');
  });

  it('stores the options of the shadow root in the class metadata', () => {
    const metadata = {};
    const context = { metadata, addInitializer: () => undefined };
    const shadowRoot = { delegatesFocus: true };

    WebComponent({ selector: 'x-delegating', shadowRoot, templateUrl: './x.html' })(class extends CustomElement { }, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);

    expect(metadata).toEqual({ [INTERNAL_SELECTOR]: 'x-delegating', [INTERNAL_SHADOW_ROOT]: shadowRoot });
  });

  it('accepts the options of the shadow root of a customized built-in element with a template', () => {
    class Panel extends customElementOf(HTMLElement) { }
    _defineRender(Panel, () => undefined as never);
    const initializers = new Array<Initializer>();
    const context = { metadata: {}, addInitializer: (initializer: Initializer) => initializers.push(initializer) };

    WebComponent({ selector: 'x-focus-panel', extends: 'section', templateUrl: './x.html', shadowRoot: { delegatesFocus: true } })(Panel, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);
    initializers[0].call(Panel);

    expect(customElements.get('x-focus-panel')).toBe(Panel);
  });

  it('rejects the options of the shadow root of a customized built-in element without a template, which has none', () => {
    class Panel extends customElementOf(HTMLElement) { }
    const initializers = new Array<Initializer>();
    const context = { metadata: {}, addInitializer: (initializer: Initializer) => initializers.push(initializer) };

    WebComponent({ selector: 'x-empty-panel', extends: 'section', shadowRoot: { delegatesFocus: true } })(Panel, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);

    expect(() => initializers[0].call(Panel)).toThrow('Panel extends <section> without a template and declares shadowRoot: the element has no shadow root, which only a templateUrl gives it');
    expect(customElements.get('x-empty-panel')).toBeUndefined();
  });

  it('defines a customized built-in element on the tag it extends, storing the tag in the class metadata', () => {
    class CopyButton extends customElementOf(HTMLButtonElement) { }
    const metadata = {};
    const initializers = new Array<Initializer>();
    const context = { metadata, addInitializer: (initializer: Initializer) => initializers.push(initializer) };

    WebComponent({ selector: 'x-copy-button', extends: 'button' })(CopyButton, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);
    initializers[0].call(CopyButton);

    expect(metadata).toEqual({ [INTERNAL_SELECTOR]: 'x-copy-button', [INTERNAL_EXTENDS]: 'button' });
    expect(customElements.get('x-copy-button')).toBe(CopyButton);
    expect(document.createElement('button', { is: 'x-copy-button' })).toBeInstanceOf(CopyButton);
  });

  it('makes form-associated a component declaring a host directive with a form callback, forwarding it the callbacks', () => {
    const calls = new Array<string>();
    class FormControl extends CustomDirective {
      public formResetCallback(): void {
        calls.push('reset');
      }
    }
    class Rating extends CustomElement { }
    const metadata = {};
    Object.defineProperty(Rating, Symbol.for('Symbol.metadata'), { value: metadata });

    decorate('x-form-rating', Rating, metadata, [FormControl]);

    expect((Rating as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
    (document.createElement('x-form-rating') as unknown as { formResetCallback(): void }).formResetCallback();
    expect(calls).toEqual(['reset']);
  });

  it('rejects a customized built-in element declaring static formAssociated = true, which the browser cannot give internals', () => {
    class FormButton extends customElementOf(HTMLButtonElement) {
      public static formAssociated = true;
    }
    const initializers = new Array<Initializer>();
    const context = { metadata: {}, addInitializer: (initializer: Initializer) => initializers.push(initializer) };

    WebComponent({ selector: 'x-form-button', extends: 'button' })(FormButton, context as unknown as ClassDecoratorContext<Constructor<CustomElement>>);

    expect(() => initializers[0].call(FormButton)).toThrow('FormButton extends <button> and is form-associated (a host directive declaring a form callback, or a static formAssociated): a customized built-in element cannot be');
    expect(customElements.get('x-form-button')).toBeUndefined();
  });

  it('throws when the selector is already used by another component', () => {
    decorate('x-duplicated', class extends CustomElement { });

    expect(() => decorate('x-duplicated', class extends CustomElement { })).toThrow();
  });
});
