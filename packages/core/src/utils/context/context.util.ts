import { Function } from '@xaendar/types';
import { _runBinding } from '../../models/effect/effect';
import { trackNode } from '../track-node/track-node.util';
import type { Binding } from '../../types/binding.type';
import type { _DeclarationKind } from '../../types/declaration-kind.type';
import type { Effect } from '../../types/effect.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { Unlistener } from '../../types/unlistener.type';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { captureContext } from '../try-scope/try-scope.util';

/**
 * The number of variables a context keeps in an array, looked through at every read: a scope declaring more keeps them
 * in a `Map`.
 */
const VARIABLES_LIMIT = 16;

/**
 * The parent of the staging contexts of the components and of the directives (`CustomElement`, `CustomDirective`),
 * which never read a name through it. An internal of the runtime, as its `_` tells: the API reference leaves it out.
 *
 * N.B. Deliberate, to save memory: one object shared by every instance, instead of an empty object created for each
 * one. Do not replace it with `{}` in the constructors.
 */
export const _EMPTY_CONTEXT = {} as unknown as _Context;

/**
 * The names of the variables changed in the refresh running (see {@link _Context.refresh}), the ones of the scopes
 * enclosing the context being refreshed included: `null` while none runs.
 *
 * N.B. Deliberate, to save memory: refreshing is synchronous, so the names travel through a variable of the module
 * instead of an argument of every context visited, and the context keeps no list of its own.
 */
let changedNames: readonly string[] | null = null;

/**
 * The refresh running (see {@link _Context.refresh}): the contexts refreshed by it, and the ones it creates, which
 * render with the values already changed, are marked with it, so that none is refreshed twice. `0` while none runs.
 */
let currentPass = 0;

/**
 * The number of refreshes run so far, numbering the next one.
 */
let passCount = 0;

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
   * recreating them. Only the nodes at the top of the block are tracked, all rendered into the same node: the ones
   * rendered into an element of the template are removed with it (see `trackNode`).
   */
  private _nodes: Array<Node> | null = null;
  /**
   * The node each node of {@link _nodes}, at the same index, is inserted into, which {@link clear} removes it from: `null`
   * for a node tracked without one, which the context does not remove. `null` while the context tracks no node.
   */
  private _parentNodes: Array<Node | null> | null = null;
  /**
   * Cleanup functions registered via {@link addUnlistener}.
   * Called when this context is destroyed to remove DOM nodes,
   * detach event listeners, and dispose signal effect subscriptions.
   */
  private _unlistenFns: Array<Unlistener> | null = null;
  /**
   * The bindings of this scope reading variables of the template, registered via {@link addBinding}, in the order they
   * were rendered: {@link refresh} runs again the ones reading a variable that changed. `null` while the scope has none.
   */
  private _bindings: Binding[] | null = null;
  /**
   * The last refresh that brought this context up to date (see {@link refresh}): the one running when it was created, or
   * the last one that visited it.
   */
  private _pass: number;

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
    // Created by a refresh running, the context renders with the values already changed
    this._pass = currentPass;
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
   * Sets the value of a variable declared in this scope, telling whether it changed: the item of a `@for` reused for
   * another item, a `@let` computing another value, a parameter of a template rendered with another argument. Values
   * are compared as `Object.is` does. A variable declared without a value (see {@link declare}) is initialized, which
   * is no change.
   *
   * @param name - The name of the variable.
   * @param value - The new value.
   * @returns `true` when the variable held another value.
   * @throws When this scope does not declare the variable.
   */
  public update(name: string, value: unknown): boolean {
    const variables = this._variables;
    let previous: unknown;
    if (variables instanceof Map) {
      previous = variables.get(name);
      variables.set(name, value);
    } else {
      const index = variables ? indexOfVariable(variables, name) : -1;
      if (index === -1) {
        throw new Error(`Identifier "${name}" is not declared in this scope.`);
      }

      previous = variables![index + 1];
      variables![index + 1] = value;
    }

    return previous !== _Context._uninitialized.let && previous !== _Context._uninitialized.element && !Object.is(previous, value);
  }

  /**
   * Tells the scope that a variable it declares changed outside of a refresh, as a `@let` reading a signal does, or
   * during the one visiting it, as a `@let` reading another variable does: in the first case the scope is refreshed,
   * in the second one the refresh running carries the name on, to the bindings rendered after the `@let` and to the
   * contexts inside this one.
   *
   * @param name - The name of the variable.
   */
  public propagate(name: string): void {
    changedNames ? changedNames = changedNames.concat(name) : this.refresh([name]);
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
   * Registers a DOM node as directly owned by this context: when the context is cleared, the node is removed from the
   * node it is inserted into, if it is still there.
   *
   * @param node - The DOM node to track.
   * @param parentNode - The node the node is inserted into, or `null` for a node the context does not remove, as the
   *   nodes of the server a `@hydrate` holds until its content adopts them.
   */
  public addNode(node: Node, parentNode: Node | null = null): void {
    // The first node gets arrays of exactly one item: a push into an empty array would reserve room for many more
    if (this._nodes) {
      this._nodes.push(node);
      this._parentNodes!.push(parentNode);
    } else {
      this._nodes = [node];
      this._parentNodes = [parentNode];
    }
  }

  /**
   * Removes a tracked DOM node from this context, along with the node it is inserted into.
   *
   * @param nodeToRemove - The DOM node to untrack.
   */
  public removeNode(nodeToRemove: Node): void {
    const index = this._nodes ? this._nodes.indexOf(nodeToRemove) : -1;
    if (index !== -1) {
      this._nodes!.splice(index, 1);
      this._parentNodes!.splice(index, 1);
    }
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
   * A function is called, an object, as an effect, is disposed with its `dispose()`, so that it is registered without
   * a closure calling it.
   *
   * @param fns - The cleanups to register.
   */
  public addUnlistener(...fns: Unlistener[]): void {
    this._unlistenFns ? this._unlistenFns.push(...fns) : this._unlistenFns = [...fns];
  }

  /**
   * Unregisters one or more cleanup functions previously added via {@link addUnlistener},
   * so they are no longer invoked when this context is cleared.
   *
   * @param fns - The cleanups to unregister.
   */
  public removeUnlistener(...fns: Unlistener[]): void {
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
  public getUnlistenFns(): Unlistener[] | null {
    return this._unlistenFns;
  }

  /**
   * Registers a binding reading variables of the template, which {@link refresh} runs again when one of them changes.
   * Its effect, if any, is disposed when the context is cleared.
   *
   * @param binding - The binding.
   */
  public addBinding(binding: Binding): void {
    this._bindings ? this._bindings.push(binding) : this._bindings = [binding];
  }

  /**
   * Updates the scope after some of its variables changed, as Angular checks a view: the item and the implicit
   * variables of the row of a `@for` reused for another item or at another index, the parameters of an instance of a
   * template, a `@let`. The variables are values, so nothing is notified of the change: the scope runs again, in the
   * order they were rendered, its bindings reading one of them, which apply the value only when it differs, then the
   * contexts inside it, which may read them too (the branch of an `@if`, the rows of a `@for`, an instance of a
   * template, the content of an element applying structural directives...). A block run again keeps reacting as it
   * does to a signal: an `@if` renders another branch, a `@for` reconciles its rows.
   *
   * Each binding run again decides again whether it is an effect, as on its first run: it reads the signals its new
   * values lead it to (see `_runBinding`). A binding reading only signals is left alone, as the bindings reading no
   * variable that changed are.
   *
   * A refresh run inside another one, as the one of a row of a `@for` reconciled by the refresh of the row holding it,
   * carries the names of the outer one too, and a context is never refreshed twice by the same one: the ones it created
   * already render with the new values. An error thrown by a binding is reported as the one of an effect, in a
   * microtask of its own, and the others run anyway.
   *
   * @param names - The names of the variables changed, the ones the scope declares.
   */
  public refresh(names: readonly string[]): void {
    const outerNames = changedNames;
    const outerPass = currentPass;
    changedNames = outerNames ? outerNames.concat(names) : names;
    currentPass = outerPass || ++passCount;
    try {
      this._refresh();
    } finally {
      changedNames = outerNames;
      currentPass = outerPass;
    }
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
   * Runs again the bindings of this context reading a variable changed in the refresh running, then refreshes the
   * contexts inside it it has not refreshed yet (see {@link refresh}). The names a `@let` of this scope adds while it
   * runs (see {@link propagate}) are dropped once the context is done: the scopes beside it cannot read it.
   */
  private _refresh(): void {
    const names = changedNames!;
    this._pass = currentPass;
    if (this._bindings) {
      for (let i = 0; i < this._bindings.length; i++) {
        const binding = this._bindings[i];
        if (readsAny(binding.reads, changedNames!)) {
          rerunBinding(binding);
        }
      }
    }

    if (this._children) {
      for (let i = 0; i < this._children.length; i++) {
        const child = this._children[i];
        if (child._pass !== currentPass) {
          child._refresh();
        }
      }
    }

    changedNames = names;
  }

  /**
   * Clear this context by removing its nodes from the DOM, invoking all registered cleanup functions,
   * recursively destroying child contexts, and clearing internal state.
   *
   * The nodes are removed first, from the last to the first, each one only from the node it was inserted into and only
   * if it is still there: a node moved elsewhere, or never inserted, is left where it is.
   *
   * After calling `Clear`, this context and its entire subtree are
   * considered disposed and should no longer be used.
   */
  public clear(): void {
    /*
      Nodes are removed before unlistenFns to let events fired on
      onDestroy actually works. UnlistenFns remove the listener on the node
      preventing the parent to listen the event emitted on the destruction of the
      element when is removed
    */
    if (this._nodes) {
      for (let i = this._nodes.length - 1; i >= 0; i--) {
        const node = this._nodes[i];
        const parentNode = this._parentNodes![i];
        if (parentNode !== null && node.parentNode === parentNode) {
          parentNode.removeChild(node);
        }
      }
    }

    if (this._unlistenFns) {
      for (let i = 0; i < this._unlistenFns.length; i++) {
        const unlistener = this._unlistenFns[i];
        typeof unlistener === 'function' ? unlistener() : unlistener.dispose();
      }
    }

    if (this._bindings) {
      for (let i = 0; i < this._bindings.length; i++) {
        this._bindings[i].effect?.dispose();
      }
    }

    if (this._children) {
      for (let i = 0; i < this._children.length; i++) {
        this._children[i].clear();
      }
    }

    this._unlistenFns = null;
    this._bindings = null;
    this._children = null;
    this._nodes = null;
    this._parentNodes = null;
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
 * Tells whether a binding reads one of the variables changed.
 *
 * @param reads - The names of the variables the binding reads.
 * @param names - The names of the variables changed.
 * @returns `true` when one name is in both.
 */
function readsAny(reads: readonly string[], names: readonly string[]): boolean {
  for (let i = 0; i < reads.length; i++) {
    for (let j = 0; j < names.length; j++) {
      if (reads[i] === names[j]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Runs a binding again, with the current values of the variables: the run decides again whether it is an effect (see
 * `_runBinding`), so its previous effect, if any, is disposed. When the run throws, the binding stays as it was and the
 * error is reported in a microtask, as the one of an effect run by the queue: the refresh goes on.
 *
 * @param binding - The binding.
 */
function rerunBinding(binding: Binding): void {
  let effect: Effect | null;
  try {
    effect = _runBinding(binding.callback, binding.first, binding.second, binding.third);
  } catch (error) {
    queueMicrotask(() => {
      throw error;
    });
    return;
  }

  binding.effect?.dispose();
  binding.effect = effect;
}

/**
 * Mounts a node into the DOM and binds it to the context lifecycle.
 *
 * Registers the node with the context, which removes it from `parentNode`
 * when it is destroyed, and inserts it into `parentNode` at the given position.
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