import { describe, expect, it, vi } from 'vitest';
import { ServerCustomElementRegistry } from '../server-custom-element-registry/server-custom-element-registry';
import { ServerHTMLElement } from './server-html-element';

const registry = new ServerCustomElementRegistry();
vi.stubGlobal('customElements', registry);

class CardElement extends ServerHTMLElement {
  public static observedAttributes = ['title'];
  public changes = new Array<[string, string | null, string | null]>();

  public attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    this.changes.push([name, oldValue, newValue]);
  }
}
registry.define('card-element', CardElement as unknown as CustomElementConstructor);

class PlainElement extends ServerHTMLElement { }
registry.define('plain-element', PlainElement as unknown as CustomElementConstructor);

describe('ServerHTMLElement', () => {
  it('takes the tag name its class is defined with', () => {
    expect(new CardElement().localName).toBe('card-element');
  });

  it('throws when its class is not defined, as an illegal constructor', () => {
    expect(() => new (class extends ServerHTMLElement { })()).toThrow(new TypeError('Illegal constructor'));
  });

  it('attaches one shadow root, held by shadowRoot when it is open', () => {
    const open = new CardElement();
    const root = open.attachShadow({ mode: 'open' });
    const closed = new PlainElement();

    expect(root).toEqual({ host: open, mode: 'open', adoptedStyleSheets: [] });
    expect(open.shadowRoot).toBe(root);
    expect(closed.attachShadow({ mode: 'closed' }).mode).toBe('closed');
    expect(closed.shadowRoot).toBeNull();
    expect(() => open.attachShadow({ mode: 'open' })).toThrow(expect.objectContaining({ name: 'NotSupportedError' }));
  });

  it('calls attributeChangedCallback for the attributes its class observes', () => {
    const element = new CardElement();
    element.setAttribute('title', 'a');
    element.setAttribute('id', 'b');
    element.removeAttribute('title');

    expect(element.changes).toEqual([['title', null, 'a'], ['title', 'a', null]]);
  });

  it('writes the attributes of a class observing none or without the callback', () => {
    const element = new PlainElement();
    element.setAttribute('title', 'a');
    element.removeAttribute('title');

    expect(element.hasAttribute('title')).toBe(false);
  });
});
