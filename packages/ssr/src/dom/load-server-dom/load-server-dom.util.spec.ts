import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServerCustomElementRegistry } from '../server-custom-element-registry/server-custom-element-registry';
import { ServerHTMLElement } from '../server-html-element/server-html-element';
import { loadServerDom } from './load-server-dom.util';

describe('loadServerDom', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('installs HTMLElement and customElements of the server DOM', () => {
    vi.stubGlobal('HTMLElement', undefined);
    vi.stubGlobal('customElements', undefined);

    loadServerDom();

    expect(globalThis.HTMLElement).toBe(ServerHTMLElement);
    expect(globalThis.customElements).toBeInstanceOf(ServerCustomElementRegistry);
  });

  it('keeps the globals already there', () => {
    const element = class { };
    const registry = {};
    vi.stubGlobal('HTMLElement', element);
    vi.stubGlobal('customElements', registry);

    loadServerDom();

    expect(globalThis.HTMLElement).toBe(element);
    expect(globalThis.customElements).toBe(registry);
  });
});
