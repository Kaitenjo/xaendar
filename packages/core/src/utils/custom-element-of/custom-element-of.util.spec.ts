// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { HYDRATE, INITIALIZE, INTERNAL_EXTENDS, INTERNAL_SELECTOR } from '../../costants';
import { CustomElement } from '../../models/custom-element/custom-element';
import { EMPTY_LAYOUT, _scope } from '../context/context.util';
import { _defineRender } from '../render-registry/render-registry.util';
import { customElementOf } from './custom-element-of.util';

loadSignals();

let counter = 0;

/**
 * The lifecycle callbacks of an element, which happy-dom does not call for a customized built-in element: it looks the
 * definition up by the local name, the tag the element extends.
 */
type Lifecycle = { connectedCallback(): void, disconnectedCallback(): void };

/**
 * Inserts an element into the document and connects it, as a browser does.
 */
function connect(element: HTMLElement): void {
  document.body.append(element);
  (element as unknown as Lifecycle).connectedCallback();
}

/**
 * Removes an element from the document and disconnects it, as a browser does.
 */
function disconnect(element: HTMLElement): void {
  element.remove();
  (element as unknown as Lifecycle).disconnectedCallback();
}

/**
 * Defines a class as `@WebComponent` does for a customized built-in element: its metadata hold the selector and the tag
 * it extends, and it is defined on that tag.
 */
function defineBuiltIn<T extends CustomElement>(klass: new () => T, tagName: keyof HTMLElementTagNameMap): string {
  const selector = `x-built-in-${counter++}`;
  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { [INTERNAL_SELECTOR]: selector, [INTERNAL_EXTENDS]: tagName } });
  customElements.define(selector, klass, { extends: tagName });
  return selector;
}

describe('customElementOf', () => {
  it('returns CustomElement for HTMLElement, the class of the tags whose class is HTMLElement', () => {
    expect(customElementOf(HTMLElement)).toBe(CustomElement);
  });

  it('creates one class for each native class, shared by every component extending it', () => {
    const button = customElementOf(HTMLButtonElement);

    expect(customElementOf(HTMLButtonElement)).toBe(button);
    expect(customElementOf(HTMLInputElement)).not.toBe(button);
    expect(Object.getPrototypeOf(button)).toBe(HTMLButtonElement);
  });

  it('gives the class the members of CustomElement, the same functions, but its constructor', () => {
    const { prototype } = customElementOf(HTMLAnchorElement);

    expect(prototype.effect).toBe(CustomElement.prototype.effect);
    expect(prototype.createComponent).toBe(CustomElement.prototype.createComponent);
    expect(prototype[HYDRATE]).toBe(CustomElement.prototype[HYDRATE]);
    expect(prototype[INITIALIZE]).toBe(CustomElement.prototype[INITIALIZE]);
    expect(prototype.constructor).toBe(customElementOf(HTMLAnchorElement));
  });

  it('creates elements of the native class initialized as the ones of CustomElement, instances of CustomElement', () => {
    class CopyButton extends customElementOf(HTMLButtonElement) { }
    const selector = defineBuiltIn(CopyButton, 'button');

    const element = document.createElement('button', { is: selector }) as CopyButton;

    expect(element).toBeInstanceOf(CopyButton);
    expect(element).toBeInstanceOf(HTMLButtonElement);
    expect(element).toBeInstanceOf(CustomElement);
    expect(element.hostDirectives.size).toBe(0);
  });

  it('connects an element without a template rendering nothing, its content kept', () => {
    const onInit = vi.fn();
    const afterRender = vi.fn();
    const onDestroy = vi.fn();
    class Plain extends customElementOf(HTMLButtonElement) {
      public onInit = onInit;
      public afterRender = afterRender;
      public onDestroy = onDestroy;
    }
    const selector = defineBuiltIn(Plain, 'button');
    const element = document.createElement('button', { is: selector }) as Plain;
    element.textContent = 'Copy';

    connect(element);

    expect(onInit).toHaveBeenCalledOnce();
    expect(afterRender).toHaveBeenCalledOnce();
    expect(element.shadowRoot).toBeNull();
    expect(element.textContent).toBe('Copy');

    disconnect(element);

    expect(onDestroy).toHaveBeenCalledOnce();
  });

  it('disposes on the disconnection the effects an element without a template creates', () => {
    const onCleanup = vi.fn();
    class Effectful extends customElementOf(HTMLInputElement) {
      public onInit(): void {
        this.effect(() => undefined, { onCleanup });
      }
    }
    const selector = defineBuiltIn(Effectful, 'input');
    const element = document.createElement('input', { is: selector }) as Effectful;
    connect(element);
    const stop = element.effect(() => undefined, { onCleanup });

    disconnect(element);

    expect(onCleanup).toHaveBeenCalledTimes(2);
    stop();
    expect(onCleanup).toHaveBeenCalledTimes(2);
  });

  it('renders the template of an element whose tag accepts a shadow root into its shadow root', () => {
    class Panel extends customElementOf(HTMLDivElement) { }
    const render = vi.fn(function (this: Panel) {
      this.shadowRoot!.append('rendered');
      return _scope(null, EMPTY_LAYOUT);
    });
    _defineRender(Panel, render);
    const selector = defineBuiltIn(Panel, 'div');
    const element = document.createElement('div', { is: selector }) as Panel;

    connect(element);

    expect(render).toHaveBeenCalledOnce();
    expect(element.shadowRoot!.textContent).toBe('rendered');
    disconnect(element);
  });
});
