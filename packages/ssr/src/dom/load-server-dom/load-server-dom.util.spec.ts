import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServerCustomElementRegistry } from '../server-custom-element-registry/server-custom-element-registry';
import { ServerHTMLElement } from '../server-html-element/server-html-element';
import { loadServerDom } from './load-server-dom.util';

describe('loadServerDom', () => {
  // The globals of Node, so that the ones the server DOM adds are removed after each test
  const nodeGlobals = new Set(Reflect.ownKeys(globalThis));

  afterEach(() => {
    vi.unstubAllGlobals();
    const added = Reflect.ownKeys(globalThis).filter(key => !nodeGlobals.has(key));
    for (let i = 0; i < added.length; i++) {
      Reflect.deleteProperty(globalThis, added[i]);
    }
  });

  it('installs HTMLElement and customElements of the server DOM', () => {
    vi.stubGlobal('HTMLElement', undefined);
    vi.stubGlobal('customElements', undefined);

    loadServerDom();

    expect(globalThis.HTMLElement).toBe(ServerHTMLElement);
    expect(globalThis.customElements).toBeInstanceOf(ServerCustomElementRegistry);
  });

  it('installs the classes of the native HTML elements as HTMLElement, which customElementOf extends', () => {
    vi.stubGlobal('HTMLElement', undefined);

    loadServerDom();

    expect(globalThis.HTMLButtonElement).toBe(ServerHTMLElement);
    expect(globalThis.HTMLHeadingElement).toBe(ServerHTMLElement);
    expect(globalThis.HTMLVideoElement).toBe(ServerHTMLElement);
  });

  it('keeps the globals already there', () => {
    const element = class { };
    const registry = {};
    vi.stubGlobal('HTMLElement', element);
    vi.stubGlobal('customElements', registry);
    vi.stubGlobal('HTMLButtonElement', class { });
    const button = globalThis.HTMLButtonElement;

    loadServerDom();

    expect(globalThis.HTMLElement).toBe(element);
    expect(globalThis.customElements).toBe(registry);
    expect(globalThis.HTMLButtonElement).toBe(button);
    expect(globalThis.HTMLInputElement).toBe(element);
  });
});
