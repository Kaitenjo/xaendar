import type { Function } from '@xaendar/types';
import { ServerElement } from '../server-element/server-element';
import type { ServerShadowRoot } from '../types/server-shadow-root.type';

/**
 * The `HTMLElement` of the server DOM, which the components extend: it can only be constructed as a custom element
 * defined in the registry, which gives it its tag name, as in a browser.
 */
export class ServerHTMLElement extends ServerElement {
  /**
   * The open shadow root attached to the element, `null` until it attaches one.
   */
  public shadowRoot: ServerShadowRoot | null = null;
  /**
   * Whether the element attached a shadow root.
   */
  private _attached = false;

  /**
   * Creates the element of a custom element, with the tag name the registry defines its class with.
   *
   * @throws A `TypeError` when the class is not defined in the registry.
   */
  constructor() {
    const localName = globalThis.customElements?.getName(new.target as unknown as CustomElementConstructor);
    if (!localName) {
      throw new TypeError('Illegal constructor');
    }

    super();
    this.localName = localName;
  }

  /**
   * Attaches a shadow root to the element.
   *
   * @param init - The options of the shadow root.
   * @returns The shadow root.
   * @throws A `NotSupportedError` when the element already attached one.
   */
  public attachShadow(init: ShadowRootInit): ServerShadowRoot {
    if (this._attached) {
      throw new DOMException(`<${this.localName}> already has a shadow root`, 'NotSupportedError');
    }

    this._attached = true;
    const root: ServerShadowRoot = { 
      host: this, 
      mode: init.mode, 
      adoptedStyleSheets: [] 
    };
    
    if (init.mode === 'open') {
      this.shadowRoot = root;
    }

    return root;
  }

  /**
   * Writes an attribute, calling `attributeChangedCallback` when the class observes it.
   *
   * @param name - The name of the attribute.
   * @param value - The value.
   */
  public override setAttribute(name: string, value: string): void {
    const oldValue = this.getAttribute(name);
    super.setAttribute(name, value);
    this._attributeChanged(name, oldValue);
  }

  /**
   * Removes an attribute, calling `attributeChangedCallback` when the class observes it.
   *
   * @param name - The name of the attribute.
   */
  public override removeAttribute(name: string): void {
    const oldValue = this.getAttribute(name);
    super.removeAttribute(name);
    this._attributeChanged(name, oldValue);
  }

  /**
   * Calls `attributeChangedCallback` of the element, when its class declares it and observes the attribute
   * (`observedAttributes`), as a browser does.
   *
   * @param name - The name of the attribute.
   * @param oldValue - The value of the attribute before the change.
   */
  private _attributeChanged(name: string, oldValue: string | null): void {
    const observed = (this.constructor as { observedAttributes?: readonly string[] }).observedAttributes;
    const callback = (this as { attributeChangedCallback?: Function<[name: string, oldValue: string | null, newValue: string | null], void> }).attributeChangedCallback;
    if (callback && observed?.includes(name)) {
      callback.call(this, name, oldValue, this.getAttribute(name));
    }
  }
}
