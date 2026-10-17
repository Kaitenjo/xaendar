// Type-only: brings the `Array.prototype.removeItem` declaration into scope, the extension itself is installed at runtime by `@xaendar/signals` importing `@xaendar/common`
import type {} from '@xaendar/common';
import { Function, NoArgsVoidFunction } from '@xaendar/types';
import { trackNode } from '../track-node/track-node.util';

/**
 * What declares a variable before it is initialized (see `_Context.declare`): a template variable, initialized once the
 * element it names is rendered, or a `@let`, initialized once the render reaches it.
 */
export type _DeclarationKind = 'element' | 'let';

/**
 * Tracks identifier scope during run time template function execution
 * Each `Context` instance represents one lexical scope (e.g. a `@for` loop body)
 * and can be chained to a parent context for outer-scope resolution.
 */
export class _Context {
  /**
   * Function used to create new DOM elements within this context.
   */
  public createElement: Function<[string], Element>;
  /**
   * The value of a variable declared before it is initialized (see {@link declare}), by what declares it.
   */
  private static readonly _uninitialized: Readonly<Record<_DeclarationKind, symbol>> = {
    element: Symbol('uninitialized element'),
    let: Symbol('uninitialized @let')
  };
  /**
   * Child contexts representing nested scopes (e.g. `@for` loop iterations, `@if` branches).
   */
  private _children = new Array<_Context>;
  /**
   * Map containing the run time values of variables defines during the run time execution
   * (e.g. {@for} variables: 'index', 'item', etc...)
   */
  private _variables = new Map<string, unknown>();
  /**
   * DOM nodes directly mounted into this scope via {@link mountNode} or {@link trackNode} (does not
   * include nodes owned by child contexts). Used to determine, for a given
   * context, which DOM nodes belong to it — for example so `_for`'s keyed
   * diffing can move a reused item's nodes to a new position without
   * recreating them.
   */
  private _nodes = new Array<Node>();
  /**
   * Cleanup functions registered via {@link addUnlistener}.
   * Called when this context is destroyed to remove DOM nodes,
   * detach event listeners, and dispose signal effect subscriptions.
   */
  private _unlistenFns = new Array<NoArgsVoidFunction>;

  /**
   * Creates a new scope context.
   *
   * @param _parent - Parent context used for outer-scope resolution.
   */
  constructor(private _parent: _Context) {
    this.createElement = this._parent.createElement;
  }

  /**
   * Registers a new identifier name in this scope.
   *
   * @param name - The identifier name to register.
   * @param value - The run time value bound to the identifier.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public addIdentifier(name: string, value: unknown): void {
    if (this._variables.has(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }

    this._variables.set(name, value);
  }

  /**
   * Declares a variable of this scope without initializing it: a template variable, whose element is rendered after the
   * scope is created, or a `@let`. Until it is initialized (see {@link set}), reading it throws, as reading a `let`
   * before its declaration does, instead of reading a variable of an ancestor scope named like it.
   *
   * @param name - The name of the variable.
   * @param kind - What declares the variable. Defaults to a template variable.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public declare(name: string, kind: _DeclarationKind = 'element'): void {
    this.addIdentifier(name, _Context._uninitialized[kind]);
  }

  /**
   * Initializes a variable declared in this scope or in one of its ancestor scopes (see {@link declare}), as an
   * assignment does: e.g. the template variable of an element rendered in the context of the children of another
   * element, which doesn't declare it.
   *
   * @param name - The name of the variable.
   * @param value - The value of the variable.
   */
  public set(name: string, value: unknown): void {
    if (this._variables.has(name)) {
      this._variables.set(name, value);
    } else {
      this._parent.set(name, value);
    }
  }

  /**
   * Unregisters an identifier from this scope. Does nothing if the identifier is not declared here.
   *
   * @param name - The identifier name to remove.
   */
  public removeIdentifier(name: string): void {
    this._variables.delete(name);
  }

  /**
   * Resolves the value of an identifier by looking it up in this scope first,
   * then in its ancestor scopes.
   *
   * @param name - The identifier name to look up.
   * @returns The value bound to the identifier in the closest scope declaring it,
   *   or `undefined` if it is not declared in the scope chain.
   * @throws A `ReferenceError` when the closest scope declaring the identifier has not initialized it yet (see {@link declare}).
   */
  public get(name: string): unknown {
    if (!this._variables.has(name)) {
      return this._parent?.get(name);
    }

    const value = this._variables.get(name);
    switch (value) {
      case _Context._uninitialized.element:
        throw new ReferenceError(`Template variable "${name}" is read before the element it names is rendered`);

      case _Context._uninitialized.let:
        throw new ReferenceError(`@let "${name}" is read before its declaration is rendered`);

      default:
        return value;
    }
  }

  /**
   * Registers a child context as a nested scope of this context.
   *
   * @param context - The child context to add. If omitted, a new one is created with this context as parent.
   * @returns The registered child context.
   */
  public addChild(context?: _Context): _Context {
    context ??= new _Context(this);
    this._children.push(context);
    return context;
  }

  /**
   * Removes a previously registered child context from this scope.
   *
   * @param context - The child context to remove.
   */
  public removeChild(context: _Context): void {
    const index = this._children.indexOf(context);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
  }

  /**
   * Returns the child contexts registered in this scope, in registration order.
   *
   * @returns The child contexts of this context.
   */
  public getChildren(): ReadonlyArray<_Context> {
    return this._children;
  }

  /**
   * Registers a DOM node as directly owned by this context.
   *
   * @param node - The DOM node to track.
   */
  public addNode(node: Node): void {
    this._nodes.push(node);
  }

  /**
   * Removes a tracked DOM node from this context.
   *
   * @param nodeToRemove - The DOM node to untrack.
   */
  public removeNode(nodeToRemove: Node): void {
    this._nodes.removeItem(nodeToRemove);
  }

  /**
   * Returns the DOM nodes directly owned by this context (not recursively
   * including nodes owned by child contexts), in mount order. Used by
   * `_for`'s keyed diffing to locate a reused item's nodes so they can be
   * repositioned with `insertBefore` instead of being destroyed and recreated.
   *
   * @returns The nodes directly owned by this context.
   */
  public getNodes(): ReadonlyArray<Node> {
    return this._nodes;
  }

  /**
   * Registers one or more cleanup functions to be invoked when this context is cleared.
   * Typically used to remove DOM nodes, detach event listeners or dispose signal effects.
   *
   * @param fns - The cleanup functions to register.
   */
  public addUnlistener(...fns: NoArgsVoidFunction[]): void {
    this._unlistenFns.push(...fns);
  }

  /**
   * Unregisters one or more cleanup functions previously added via {@link addUnlistener},
   * so they are no longer invoked when this context is cleared.
   *
   * @param fns - The cleanup functions to unregister.
   */
  public removeUnlistener(...fns: NoArgsVoidFunction[]): void {
    this._unlistenFns = this._unlistenFns.filter(item => !fns.includes(item));
  }

  /**
   * Returns the cleanup functions registered in this scope via {@link addUnlistener},
   * in registration order. Does not include those registered on child contexts.
   *
   * @returns The cleanup functions that will be invoked when this context is cleared.
   */
  public getUnlistenFns(): NoArgsVoidFunction[] {
    return this._unlistenFns;
  }

  /**
   * Clear this context by invoking all registered cleanup functions,
   * recursively destroying child contexts, and clearing internal state.
   *
   * After calling `Clear`, this context and its entire subtree are
   * considered disposed and should no longer be used.
   */
  public clear(): void {
    for (let i = 0; i < this._unlistenFns.length; i++) {
      this._unlistenFns[i]();
    }

    for (let i = 0; i < this._children.length; i++) {
      this._children[i].clear();
    }

    this._unlistenFns = [];
    this._children = [];
    this._nodes = [];
    this._variables.clear();
  }
}


/**
 * Mounts a node into the DOM and binds it to the context lifecycle.
 *
 * Registers the node with the context, inserts it into `parentNode` at the
 * given position, and schedules a cleanup listener that removes the node
 * from both the context and the DOM when the context is destroyed.
 *
 * @param node - The node to mount.
 * @param parentNode - The parent HTML element to insert the node into.
 * @param context - The current template execution scope that owns the node's lifecycle.
 * @param referenceNode - The node to insert relative to (same semantics
 *   as `Node.insertBefore`). If `null`, the node is appended at the end of `parentNode`.
 */
export function mountNode(node: Node, parentNode: Element, context: _Context, referenceNode: Comment | null = null): void {
  trackNode(node, parentNode, context);
  parentNode.insertBefore(node, referenceNode);
}


/**
 * Creates a Comment node used as a positional placeholder for dynamic content
 * (`_if`, `_for`). It is inserted immediately, in order, and stays in place for
 * the entire lifetime of the given `context`: any future insertion of dynamic
 * content is done via `insertBefore(node, anchor)`, guaranteeing the correct
 * position even when sibling constructs update independently and asynchronously.
 *
 * @param label - Textual label for the comment, useful for debugging to visually
 *   distinguish in the DOM which construct (if/for) generated the anchor.
 * @param parentNode - The parent HTML element the anchor is inserted into.
 * @param context - The Context the anchor is bound to: it determines the anchor's
 *   lifecycle, since it will be removed from the DOM when this context is destroyed.
 * @param referenceNode - The node to insert the anchor relative to (same semantics
 *   as `Node.insertBefore`). If `null`, the anchor is appended at the end of `parentNode`.
 * @returns The created Comment node, to be used as the reference point for future
 *   insertions of dynamic content via `insertBefore(node, anchor)`.
 */
export function createAnchor(label: string, parentNode: Element, context: _Context, referenceNode: Comment | null = null): Comment {
  const anchor = document.createComment(label);
  mountNode(anchor, parentNode, context, referenceNode);
  return anchor;
}