import { VirtualNode } from "../models/virtual-node.type";
import { VirtualTree } from "../models/virtual-tree.type";
import { Parser } from "../utils/parser";

/**
 * Base class for all Web Components in the framework
 * 
 * This class internally has an `observedAttributes` property
 * add programmaticaly by the @WebComponent decorator. 
 * It won't appear by intellisense but it's there.
 */
export abstract class BaseWebComponent extends HTMLElement {

  public static rendererTimes = 0;

  private _previousVirtualTree: VirtualTree | undefined;

  /**
   * Flag to track if the component has been initialized
   * When istance is created, the flag is false
   * After the connectedCallback has been called and all the attributes
   * have been reflected on the relatives properties, the flag is set to true
   * 
   * This prevents the render method to be called by the properties setters
   * before the component is fully initialized.
   * 
   * Otherwise the render function would be called N times where N is the
   * number of properties decorated with @Property and specified as attributes
   * on the CustomElement tag in the HTML
  */
  private _initialized = false;

  private readonly _root: ShadowRoot;


  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  public abstract template(): string;

  public abstract css(): string;

  /**
   * Method called by the @Property decorator to
   * update the rendering of the component
   * @internal 
   */
  public internalRender(): void {
    if (this._initialized) {
      console.warn('Render times:', ++BaseWebComponent.rendererTimes);
      const virtualTree = Parser.fromTemplateToVTree(this.template());
      virtualTree.forEach((node, index) => BaseWebComponent.updateElement(this._root, this._previousVirtualTree?.[index], node, index));
      this._previousVirtualTree = virtualTree;
    }
  }

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
    this._initialized = true;
    this.internalRender();
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
    this._initialized = false
  }

  /**
   * Create a DOM Node from a VirtualNode.
   * @param virtualNode VirtualNode to convert
   * @returns A DOM Element representing the VirtualNode
   */
  private static createDOMNode(virtualNode: VirtualNode): HTMLElement {
    const el = document.createElement(virtualNode.tag);
    Object.entries(virtualNode.props).forEach(([key, value]) => el.setAttribute(key, value));
    virtualNode.children.forEach(child => el.appendChild(typeof child === 'string' ? document.createTextNode(child) : BaseWebComponent.createDOMNode(child)));
    return el;
  }

  private static updateElement(parent: ShadowRoot | HTMLElement, oldVirtualNode: VirtualNode | string | undefined, newVirtualNode: VirtualNode | string | undefined, index = 0) {
    const existingNode = parent.childNodes[index];

    // Element has been removed
    if (!newVirtualNode) {
      if (existingNode) {
        parent.removeChild(existingNode)
      };
      return;
    }

    // Element is new (no old node)
    if (!oldVirtualNode) {
      const nodeToAppend = typeof newVirtualNode === 'string'
        ? document.createTextNode(newVirtualNode)
        : BaseWebComponent.createDOMNode(newVirtualNode);
      parent.appendChild(nodeToAppend);
      return;
    }

    // Both are text nodes
    if (typeof oldVirtualNode === 'string' && typeof newVirtualNode === 'string') {
      // If existing node is a text node, update its content; otherwise replace it
      if (existingNode?.nodeType === Node.TEXT_NODE) {
        if (existingNode.textContent !== newVirtualNode) {
          existingNode.textContent = newVirtualNode;
        }
      } else {
        // replace (or insert) with a text node
        const textNode = document.createTextNode(newVirtualNode);
        existingNode ? parent.replaceChild(textNode, existingNode) : parent.appendChild(textNode);
      }
      return;
    }

    // old is text, new is element -> replace text node with element
    if (typeof oldVirtualNode === 'string' && typeof newVirtualNode !== 'string') {
      const newEl = BaseWebComponent.createDOMNode(newVirtualNode);
      existingNode ? parent.replaceChild(newEl, existingNode) : parent.appendChild(newEl);
      return;
    }

    // old is element, new is text -> replace element with text node
    if (typeof oldVirtualNode !== 'string' && typeof newVirtualNode === 'string') {
      const textNode = document.createTextNode(newVirtualNode);
      existingNode ? parent.replaceChild(textNode, existingNode) : parent.appendChild(textNode);
      return;
    }

    // From here: both oldVirtualNode and newVirtualNode are VirtualNode (objects)
    const previousVirtualNode = oldVirtualNode as VirtualNode;
    const currentVirtualNode = newVirtualNode as VirtualNode;

    // If existingNode doesn't exist (shouldn't happen often), create & append
    if (!existingNode) {
      parent.appendChild(BaseWebComponent.createDOMNode(currentVirtualNode));
      return;
    }

    // If tag is different, replace the whole node
    if (previousVirtualNode.tag !== currentVirtualNode.tag) {
      parent.replaceChild(BaseWebComponent.createDOMNode(currentVirtualNode), existingNode);
      return;
    }

    // Now safe to treat existingNode as Element
    const element = existingNode as HTMLElement;

    // Update attributes
    for (const [key, value] of Object.entries(currentVirtualNode.props)) {
      if (element.getAttribute(key) !== value) {
        element.setAttribute(key, value);
      }
    }
    // Remove attributes no longer present
    for (const key in previousVirtualNode.props) {
      if (!(key in currentVirtualNode.props)) {
        element.removeAttribute(key);
      }
    }

    // Update children
    const oldChildren = previousVirtualNode.children;
    const newChildren = currentVirtualNode.children;
    const max = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < max; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];

      // Both strings (text nodes)
      if (typeof oldChild === 'string' && typeof newChild === 'string') {
        const childNode = element.childNodes[i];
        if (childNode && childNode.nodeType === Node.TEXT_NODE) {
          if (childNode.textContent !== newChild) {
            childNode.textContent = newChild;
          }
        } else if (typeof newChild !== 'undefined') {
          // replace non-text with text
          const tn = document.createTextNode(newChild);
          if (childNode) element.replaceChild(tn, childNode);
          else element.appendChild(tn);
        }
      } else {
        // Handle cases where either side may be undefined (add/remove) or types differ
        BaseWebComponent.updateElement(
          element,
          oldChild as VirtualNode | string | undefined,
          newChild as VirtualNode | string | undefined,
          i
        );
      }
    }
  }
}