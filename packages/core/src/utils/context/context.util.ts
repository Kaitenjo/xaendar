import { removeItem } from '@xaendar/common';
import { Function, NoArgsVoidFunction } from '@xaendar/types';
import { trackNode } from '../track-node/track-node.util';
import type { _DeclarationKind } from '../../types/declaration-kind.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { captureContext } from '../try-scope/try-scope.util';

/**
 * The number of variables a context keeps in an array, looked through at every read: a scope declaring more keeps them
 * in a `Map`.
 */
const VARIABLES_LIMIT = 16;

/**
 * Shared object as a parent for the Context object
 */
export const EMPTY_CONTEXT = {} as unknown as _Context;

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
   * How the nodes rendered within this context are got: created, or adopted from the HTML rendered on the server.
   * Inherited from the parent context, unless the context is created with its own.
   */
  public nodeStrategy: NodeStrategy;
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
  private _children: Array<_Context> | null = null;
  /**
   * The variables declared in this scope (e.g. the variables of a `@for`, the element refs, the `@let`), by name. Up to
   * {@link VARIABLES_LIMIT} variables, an array alternating names and values (`[name, value, name, value]`), sized when
   * the context is created from the number of variables the compiled code declares, the free slots having no name;
   * beyond, a `Map`. `null` while the scope declares none.
   */
  private _variables: unknown[] | Map<string, unknown> | null;
  /**
   * DOM nodes directly mounted into this scope via {@link mountNode} or {@link trackNode} (does not
   * include nodes owned by child contexts). Used to determine, for a given
   * context, which DOM nodes belong to it — for example so `_for`'s keyed
   * diffing can move a reused item's nodes to a new position without
   * recreating them.
   */
  private _nodes: Array<Node> | null = null;
  /**
   * Cleanup functions registered via {@link addUnlistener}.
   * Called when this context is destroyed to remove DOM nodes,
   * detach event listeners, and dispose signal effect subscriptions.
   */
  private _unlistenFns: Array<NoArgsVoidFunction> | null = null;

  /**
   * Creates a new scope context. Created in the first render of the content of a `@try`, it is collected by the `@try`,
   * which disposes it when the content throws (see `_try`).
   *
   * @param _parent - Parent context used for outer-scope resolution.
   * @param nodeStrategy - How the nodes of the context are got. Defaults to the strategy of the parent, or to creating them
   *   when the parent has none, as the root of a render or of a component created in code.
   * @param variableCount - The number of variables the scope declares, which the compiled code knows: up to
   *   {@link VARIABLES_LIMIT} they are kept in an array of that size, beyond in a `Map`. Without it the variables are
   *   still accepted, the array growing with each of them (see {@link addIdentifier}).
   */
  constructor(private _parent: _Context, nodeStrategy?: NodeStrategy, variableCount = 0) {
    this.createElement = this._parent.createElement;
    this.nodeStrategy = nodeStrategy ?? this._parent.nodeStrategy ?? CREATE_NODES;
    this._variables = variableCount > VARIABLES_LIMIT ? new Map() : variableCount ? new Array(2 * variableCount) : null;
    captureContext(this);
  }

  /**
   * Registers a new identifier name in this scope, in the first free slot of the array of the variables. A scope declaring
   * more variables than its context was created for, as one created by code compiled without their number, gets an
   * array one variable longer, or a `Map` beyond {@link VARIABLES_LIMIT}.
   *
   * @param name - The identifier name to register.
   * @param value - The run time value bound to the identifier.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public addIdentifier(name: string, value: unknown): void {
    const variables = this._variables;
    if (variables instanceof Map) {
      if (variables.has(name)) {
        throw new Error(`Identifier "${name}" is already declared in this scope.`);
      }

      variables.set(name, value);
      return;
    }

    if (!variables) {
      this._variables = [name, value];
      return;
    }

    const free = findFreeSlot(variables, name);
    if (free !== -1) {
      variables[free] = name;
      variables[free + 1] = value;
    } else if (variables.length < 2 * VARIABLES_LIMIT) {
      // Wrapped in an array, so that a value which is an array is not spread
      this._variables = variables.concat([name, value]);
    } else {
      this._variables = toMap(variables).set(name, value);
    }
  }

  /**
   * Declares a variable of this scope without initializing it: an element ref, whose element is rendered after the
   * scope is created, or a `@let`. Until it is initialized (see {@link set}), reading it throws, as reading a `let`
   * before its declaration does, instead of reading a variable of an ancestor scope named like it.
   *
   * @param name - The name of the variable.
   * @param kind - What declares the variable. Defaults to an element ref.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public declare(name: string, kind: _DeclarationKind = 'element'): void {
    this.addIdentifier(name, _Context._uninitialized[kind]);
  }

  /**
   * Initializes a variable declared in this scope or in one of its ancestor scopes (see {@link declare}), as an
   * assignment does: e.g. the element ref of an element rendered in the context of the children of another
   * element, which doesn't declare it.
   *
   * @param name - The name of the variable.
   * @param value - The value of the variable.
   */
  public set(name: string, value: unknown): void {
    const variables = this._variables;
    if (variables instanceof Map) {
      if (variables.has(name)) {
        variables.set(name, value);
        return;
      }
    } else if (variables) {
      const index = indexOfVariable(variables, name);
      if (index !== -1) {
        variables[index + 1] = value;
        return;
      }
    }

    this._parent.set(name, value);
  }

  /**
   * Unregisters an identifier from this scope, freeing its slot of the array of the variables. Does nothing if the
   * identifier is not declared here.
   *
   * @param name - The identifier name to remove.
   */
  public removeIdentifier(name: string): void {
    const variables = this._variables;
    if (variables instanceof Map) {
      variables.delete(name);
    } else if (variables) {
      const index = indexOfVariable(variables, name);
      if (index !== -1) {
        variables[index] = undefined;
        variables[index + 1] = undefined;
      }
    }
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
    const variables = this._variables;
    if (!variables) {
      return this._parent?.get(name);
    }

    let value: unknown;
    if (variables instanceof Map) {
      if (!variables.has(name)) {
        return this._parent?.get(name);
      }

      value = variables.get(name);
    } else {
      const index = indexOfVariable(variables, name);
      if (index === -1) {
        return this._parent?.get(name);
      }

      value = variables[index + 1];
    }

    switch (value) {
      case _Context._uninitialized.element:
        throw new ReferenceError(`Element ref "${name}" is read before the element it names is rendered`);

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
    this._children?.length ? this._children.push(context) : this._children = [context]
    return context;
  }

  /**
   * Removes a previously registered child context from this scope.
   *
   * @param context - The child context to remove.
   */
  public removeChild(context: _Context): void {
    if (this._children) {
      const index = this._children.indexOf(context);
      if (index !== -1) {
        this._children.splice(index, 1);
      }
    }
  }

  /**
   * Returns the child contexts registered in this scope, in registration order.
   *
   * @returns The child contexts of this context.
   */
  public getChildren(): ReadonlyArray<_Context> | null {
    return this._children;
  }

  /**
   * Registers a DOM node as directly owned by this context.
   *
   * @param node - The DOM node to track.
   */
  public addNode(node: Node): void {
    this._nodes ?  this._nodes.push(node) : this._nodes = [node];
  }

  /**
   * Removes a tracked DOM node from this context.
   *
   * @param nodeToRemove - The DOM node to untrack.
   */
  public removeNode(nodeToRemove: Node): void {
    this._nodes && removeItem(this._nodes, nodeToRemove);
  }

  /**
   * Returns the DOM nodes directly owned by this context (not recursively
   * including nodes owned by child contexts), in mount order. Used by
   * `_for`'s keyed diffing to locate a reused item's nodes so they can be
   * repositioned with `moveBefore` instead of being destroyed and recreated.
   *
   * @returns The nodes directly owned by this context.
   */
  public getNodes(): ReadonlyArray<Node> | null {
    return this._nodes;
  }

  /**
   * Registers one or more cleanup functions to be invoked when this context is cleared.
   * Typically used to remove DOM nodes, detach event listeners or dispose signal effects.
   *
   * @param fns - The cleanup functions to register.
   */
  public addUnlistener(...fns: NoArgsVoidFunction[]): void {
    this._unlistenFns ? this._unlistenFns.push(...fns) : this._unlistenFns = [...fns];
  }

  /**
   * Unregisters one or more cleanup functions previously added via {@link addUnlistener},
   * so they are no longer invoked when this context is cleared.
   *
   * @param fns - The cleanup functions to unregister.
   */
  public removeUnlistener(...fns: NoArgsVoidFunction[]): void {
    if (this._unlistenFns) {
      this._unlistenFns = this._unlistenFns.filter(item => !fns.includes(item));
    }
  }

  /**
   * Returns the cleanup functions registered in this scope via {@link addUnlistener},
   * in registration order. Does not include those registered on child contexts.
   *
   * @returns The cleanup functions that will be invoked when this context is cleared.
   */
  public getUnlistenFns(): NoArgsVoidFunction[] | null {
    return this._unlistenFns;
  }

  /**
   * Sets how the nodes rendered within this context, and within the contexts it holds, are got: once a hydration ends,
   * they all create what they render from then on.
   *
   * @param nodeStrategy - The strategy.
   */
  public setNodeStrategy(nodeStrategy: NodeStrategy): void {
    this.nodeStrategy = nodeStrategy;
    if (this._children) {
      for (let i = 0; i < this._children.length; i++) {
        this._children[i].setNodeStrategy(nodeStrategy);
      }
    }
  }

  /**
   * Moves the cleanup functions and the child contexts of this context to another one, leaving this one empty: a staging
   * context, collecting what is created before the context it belongs to exists, hands them over to it.
   *
   * @param context - The context receiving the cleanup functions and the child contexts.
   */
  public moveTo(context: _Context): void {
    if (this._unlistenFns?.length) {
      context.addUnlistener(...this._unlistenFns);
    }

    if (this._children) {
      for (let i = 0; i < this._children.length; i++) {
        context.addChild(this._children[i]);
      }
    }

    this._unlistenFns = null;
    this._children = null;
  }

  /**
   * Clear this context by invoking all registered cleanup functions,
   * recursively destroying child contexts, and clearing internal state.
   *
   * After calling `Clear`, this context and its entire subtree are
   * considered disposed and should no longer be used.
   */
  public clear(): void {
    if (this._unlistenFns) {
      for (let i = 0; i < this._unlistenFns.length; i++) {
        this._unlistenFns[i]();
      }
    }

    if (this._children) {
      for (let i = 0; i < this._children.length; i++) {
        this._children[i].clear();
      }
    }

    this._unlistenFns = null;
    this._children = null;
    this._nodes = [];
    this._variables = null;
  }
}

/**
 * Finds the slot of a variable in the array of the variables of a context.
 *
 * @param variables - The names and the values, alternated.
 * @param name - The name of the variable.
 * @returns The index of its name, the value following it, or `-1` when the array does not hold it.
 */
function indexOfVariable(variables: unknown[], name: string): number {
  for (let i = 0; i < variables.length; i += 2) {
    if (variables[i] === name) {
      return i;
    }
  }

  return -1;
}

/**
 * Finds the first free slot of the array of the variables of a context, the one of a variable declared and not
 * registered yet, or of one removed, checking that the name is not declared already.
 *
 * @param variables - The names and the values, alternated: a free slot has no name.
 * @param name - The name of the variable to register.
 * @returns The index of the free slot, `-1` when the array is full.
 * @throws When the array already holds a variable with the name.
 */
function findFreeSlot(variables: unknown[], name: string): number {
  let free = -1;
  for (let i = 0; i < variables.length; i += 2) {
    const slot = variables[i];
    if (slot === name) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }

    if (slot === undefined && free === -1) {
      free = i;
    }
  }

  return free;
}

/**
 * Moves the variables of a context to a `Map`, once the array would hold more than {@link VARIABLES_LIMIT} of them.
 *
 * @param variables - The names and the values, alternated: a full array, without free slots.
 * @returns The variables, by name.
 */
function toMap(variables: unknown[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (let i = 0; i < variables.length; i += 2) {
    map.set(variables[i] as string, variables[i + 1]);
  }

  return map;
}

/**
 * Mounts a node into the DOM and binds it to the context lifecycle.
 *
 * Registers the node with the context, inserts it into `parentNode` at the
 * given position, and schedules a cleanup listener that removes the node
 * from both the context and the DOM when the context is destroyed.
 *
 * @param node - The node to mount.
 * @param parentNode - The node to insert the node into: an element, or the shadow root of a component.
 * @param context - The current template execution scope that owns the node's lifecycle.
 * @param referenceNode - The node to insert relative to (same semantics
 *   as `Node.insertBefore`). If `null`, the node is appended at the end of `parentNode`.
 */
export function mountNode(node: Node, parentNode: Node, context: _Context, referenceNode: Node | null = null): void {
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
 * @param parentNode - The node the anchor is inserted into: an element, or the shadow root of a component.
 * @param context - The Context the anchor is bound to: it determines the anchor's
 *   lifecycle, since it will be removed from the DOM when this context is destroyed.
 * @param referenceNode - The node to insert the anchor relative to (same semantics
 *   as `Node.insertBefore`). If `null`, the anchor is appended at the end of `parentNode`.
 * @returns The created Comment node, to be used as the reference point for future
 *   insertions of dynamic content via `insertBefore(node, anchor)`.
 */
export function createAnchor(label: string, parentNode: Node, context: _Context, referenceNode: Node | null = null): Comment {
  const anchor = document.createComment(label);
  mountNode(anchor, parentNode, context, referenceNode);
  return anchor;
}