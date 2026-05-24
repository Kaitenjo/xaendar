/**
 * Base class for all Web Components in the framework
 * 
 * This class internally has an `observedAttributes` property
 * add programmaticaly by the @WebComponent decorator. 
 * It won't appear by intellisense but it's there.
 */
export class BaseWebComponent extends HTMLElement {
  /**
   * The root of the Web Component, where the content is rendered
   */
  private readonly _root: ShadowRoot;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  /**
   * Method called by the @Property decorator to
   * update the rendering of the component
   * @internal 
   */
  private _render(): void { }

  /**
   * Method automatically called by the JavascriptEngine when an attribute
   * on the host element is changed
   * 
   * This method runs before the connectedCallback method if any observed attribute
   * is specified on the CustomElement tag in the HTML
   * 
   * @param name Name of the attribute changed
   * @param _oldValue Old value of the attribute
   * @param newValue New value of the attribute
   */
  private attributeChangedCallback(name: string, _oldValue: unknown, newValue: unknown): void {
    /*
      Since the 'Property Decorator add the property key to the ObservedAttributes
      We are sure that the property with the given name exists on the instance of the subclass
    */
    const context = this as BaseWebComponent & Record<string, unknown>;
    context[name] = newValue;
  }

  /**
   * Method automatically called by the JavascriptEngine when a CustomElement
   * is added to the DOM
   * 
   * This method is called EVERY time the element is added
   */
  private connectedCallback(): void {
    this._render();
  }

  /**
   * Method automatically called by the JavascriptEngine when a CustomElement
   * is removed from the DOM
   * 
   * This method is called EVERY time the element is removed
   * 
   * We use this method to reset the _initialized flag
   * so that if the element is re-added to the DOM
   * the properties initialization won't call the render method
   */
  private disconnectedCallback(): void {
  }
}