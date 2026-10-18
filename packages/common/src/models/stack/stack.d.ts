/**
 * A generic LIFO (Last In, First Out) stack data structure.
 *
 * @template T - The type of elements held in the stack. Defaults to `unknown`.
 */
export declare class Stack<T = unknown> {
    /**
     * Internal array holding the stack elements, ordered from bottom to top.
     */
    private _elements;
    [index: number]: T;
    [prop: string | symbol]: unknown;
    constructor();
    /**
     * The number of elements currently in the stack.
     */
    get length(): number;
    /**
     * A shallow copy of the elements in the stack, ordered from bottom to top.
     */
    get values(): T[];
    /**
     * Removes and returns the top element of the stack.
     *
     * @returns The top element, or `undefined` if the stack is empty.
     */
    pop(): T | undefined;
    /**
     * Pushes an element onto the top of the stack.
     *
     * @param element - The element to push.
     * @returns The new length of the stack.
     */
    push(element: T): number;
}
