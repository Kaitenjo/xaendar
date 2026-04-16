/**
 * A generic LIFO (Last In, First Out) stack data structure.
 *
 * @template T - The type of elements held in the stack. Defaults to `unknown`.
 */
export class Stack<T = unknown> {
  /**
   * Internal array holding the stack elements, ordered from bottom to top.
   */
  private _elements = new Array<T>;

  [index: number]: T;

  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === 'string') {
          return isNaN(Number(prop)) ? (target as unknown as { [prop]: unknown })[prop] : target._elements[Number(prop)];
        }
      }
    });
  }

  /**
   * The number of elements currently in the stack.
   */
  public get length(): number {
    return this._elements.length;
  }

  /**
   * A shallow copy of the elements in the stack, ordered from bottom to top.
   */
  public get values(): T[] {
    return [...this._elements];
  }

  /**
   * Removes and returns the top element of the stack.
   *
   * @returns The top element, or `undefined` if the stack is empty.
   */
  public pop(): T | undefined {
    return this._elements.pop();
  }

  /**
   * Pushes an element onto the top of the stack.
   *
   * @param element - The element to push.
   * @returns The new length of the stack.
   */
  public push(element: T): number {
    return this._elements.push(element);
  }
}