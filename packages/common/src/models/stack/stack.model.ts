export class Stack<T = unknown> {

  private _elements = new Array<T>;

  public get length(): number {
    return this._elements.length;
  }

  public get values(): T[] {
    return [...this._elements];
  }

  public pop(): T | undefined {
    return this._elements.pop();
  }

  public push(element: T): number {
    return this._elements.push(element);
  }
}