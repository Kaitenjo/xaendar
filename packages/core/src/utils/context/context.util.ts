import { CHILDREN, CLEANUP, COMPONENT, HEADER, LAYOUT, PARENT, PARENT_NODE, STATE, STRATEGY } from '../../costants';
import { _runBinding } from '../../models/effect/effect';
import type { Binding } from '../../types/binding.type';
import type { Cleanup } from '../../types/cleanup.type';
import type { _Context } from '../../types/context.type';
import type { _DeclarationKind } from '../../types/declaration-kind.type';
import type { Effect } from '../../types/effect.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { DEV_MODE } from '../dev-mode/dev-mode.util';
import { captureContext } from '../try-scope/try-scope.util';

/**
 * The value of a variable declared before it is initialized (see {@link _declare}), by what declares it.
 */
const UNINITIALIZED: Readonly<Record<_DeclarationKind, symbol>> = {
  element: Symbol('uninitialized element'),
  let: Symbol('uninitialized @let')
};

/**
 * The layout of the scopes the runtime creates holding neither variables nor nodes: the staging scopes of the
 * components and of the directives, the holder of a `@try`, the branches of the conditional bindings.
 */
export const EMPTY_LAYOUT: _ScopeLayout = Object.freeze({ size: HEADER, nodes: HEADER });

/**
 * The layout of the scopes the runtime creates holding a single element: the one of a component `createComponent`
 * creates, the one of an element structural directives are applied to.
 */
export const ELEMENT_LAYOUT: _ScopeLayout = Object.freeze({ size: HEADER + 1, nodes: HEADER });

/**
 * The identifiers of the variables changed in the refresh running (see {@link refresh}), the ones of the scopes
 * enclosing the scope being refreshed included: `null` while none runs.
 *
 * N.B. Deliberate, to save memory: refreshing is synchronous, so the identifiers travel through a variable of the module
 * instead of an argument of every scope visited, and the scope keeps no list of its own.
 */
let changedIds: readonly number[] | null = null;

/**
 * The refresh running (see {@link refresh}): the scopes refreshed by it, and the ones it creates, which render with the
 * values already changed, are marked with it, so that none is refreshed twice. `0` while none runs.
 */
let currentPass = 0;

/**
 * The number of refreshes run so far, numbering the next one.
 */
let passCount = 0;

/**
 * Creates the scope of an instance of a block: an array of the exact length of its layout, holding its header, then
 * the slots of its variables and of its nodes, empty until the block fills them. Created in the first render of the
 * content of a `@try`, it is collected by the `@try`, which clears it when the content throws (see `_try`).
 *
 * @param parent - The scope declaring the block, whose variables it reads: `null` for the root of a render and for the
 *   scopes outside of any template.
 * @param layout - The layout of the scopes of the block, a constant of its module.
 * @param nodeStrategy - How the nodes of the scope are got. Defaults to the strategy of the parent, or to creating them
 *   without a parent.
 * @param component - The component whose template the scope renders. Defaults to the one of the parent: only the root of
 *   a render passes it.
 * @returns The scope.
 */
export function _scope(parent: _Context | null, layout: _ScopeLayout, nodeStrategy?: NodeStrategy, component?: unknown): _Context {
  const scope = new Array(layout.size) as _Context;
  scope[PARENT] = parent;
  scope[PARENT_NODE] = null;
  // Created by a refresh running, the scope renders with the values already changed
  scope[STATE] = currentPass;
  scope[COMPONENT] = component === undefined ? parent?.[COMPONENT] : component;
  scope[STRATEGY] = nodeStrategy === undefined ? parent?.[STRATEGY] ?? null : toStrategySlot(nodeStrategy);
  scope[CLEANUP] = null;
  scope[LAYOUT] = layout;
  scope[CHILDREN] = null;
  captureContext(scope);
  return scope;
}

/**
 * Reads a variable of the template: the one the scope `depth` scopes up the chain of the declaring scopes holds in
 * `slot`, both computed by the compiler.
 *
 * @param scope - The scope the expression reading the variable is evaluated in.
 * @param depth - How many scopes up the variable is declared, `0` for the scope itself.
 * @param slot - The slot of the variable in the scope declaring it.
 * @returns The value of the variable.
 * @throws A `ReferenceError` when the variable is not initialized yet (see {@link _declare}).
 */
export function _read(scope: _Context, depth: number, slot: number): unknown {
  const owner = ancestorOf(scope, depth);
  const value = owner[slot];
  if (value === UNINITIALIZED.element || value === UNINITIALIZED.let) {
    throwUninitialized(owner, slot, value);
  }

  return value;
}

/**
 * Initializes a variable declared in a scope of the chain (see {@link _declare}), as an assignment does: the element ref
 * of an element rendered in the scope of the children of another element, or of the element a structural directive is
 * applied to, a `@let` whose value is a literal.
 *
 * @param scope - The scope the variable is written from.
 * @param depth - How many scopes up the variable is declared, `0` for the scope itself.
 * @param slot - The slot of the variable in the scope declaring it.
 * @param value - The value of the variable.
 */
export function _set(scope: _Context, depth: number, slot: number, value: unknown): void {
  ancestorOf(scope, depth)[slot] = value;
}

/**
 * Declares a variable of a scope without initializing it: an element ref, whose element is rendered after the scope is
 * created, or a `@let`. Until it is initialized (see {@link _set}, {@link update}), reading it throws, as reading a `let`
 * before its declaration does.
 *
 * @param scope - The scope declaring the variable.
 * @param slot - The slot of the variable.
 * @param kind - What declares the variable. Defaults to an element ref.
 */
export function _declare(scope: _Context, slot: number, kind: _DeclarationKind = 'element'): void {
  scope[slot] = UNINITIALIZED[kind];
}

/**
 * Sets the value of a variable a scope declares, telling whether it changed: the item of a `@for` reused for another
 * item, a `@let` computing another value, a parameter of a template rendered with another argument. Values are compared
 * as `Object.is` does. A variable declared without a value (see {@link _declare}) is initialized, which is no change.
 *
 * @param scope - The scope declaring the variable.
 * @param slot - The slot of the variable.
 * @param value - The new value.
 * @returns `true` when the variable held another value.
 */
export function update(scope: _Context, slot: number, value: unknown): boolean {
  const previous = scope[slot];
  scope[slot] = value;
  return previous !== UNINITIALIZED.let && previous !== UNINITIALIZED.element && !Object.is(previous, value);
}

/**
 * Tells a scope that a variable it declares changed outside of a refresh, as a `@let` reading a signal does, or during
 * the one visiting it, as a `@let` reading another variable does: in the first case the scope is refreshed, in the
 * second one the refresh running carries the identifier on, to the bindings rendered after the `@let` and to the scopes
 * inside this one.
 *
 * @param scope - The scope declaring the variable.
 * @param id - The identifier of the variable, unique in its template.
 */
export function propagate(scope: _Context, id: number): void {
  changedIds ? changedIds = changedIds.concat(id) : refresh(scope, [id]);
}

/**
 * Updates a scope after some of its variables changed, as Angular checks a view: the item and the implicit variables of
 * the row of a `@for` reused for another item or at another index, the parameters of an instance of a template, a
 * `@let`. The variables are values, so nothing is notified of the change: the scope runs again, in the order they were
 * rendered, its bindings reading one of them, which apply the value only when it differs, then the scopes inside it,
 * which may read them too. A block run again keeps reacting as it does to a signal: an `@if` renders another branch, a
 * `@for` reconciles its rows.
 *
 * Each binding run again decides again whether it is an effect, as on its first run: it reads the signals its new
 * values lead it to (see `_runBinding`). A binding reading only signals is left alone, as the bindings reading no
 * variable that changed are.
 *
 * A refresh run inside another one, as the one of a row of a `@for` reconciled by the refresh of the row holding it,
 * carries the identifiers of the outer one too, and a scope is never refreshed twice by the same one: the ones it
 * created already render with the new values. An error thrown by a binding is reported as the one of an effect, in a
 * microtask of its own, and the others run anyway.
 *
 * @param scope - The scope declaring the variables.
 * @param ids - The identifiers of the variables changed, unique in their template.
 */
export function refresh(scope: _Context, ids: readonly number[]): void {
  const outerIds = changedIds;
  const outerPass = currentPass;
  changedIds = outerIds ? outerIds.concat(ids) : ids;
  currentPass = outerPass || ++passCount;
  try {
    refreshScope(scope);
  } finally {
    changedIds = outerIds;
    currentPass = outerPass;
  }
}

/**
 * Registers a scope inside another one, as a nested block: it is cleared, and refreshed, with it.
 *
 * @param scope - The scope holding the child.
 * @param child - The child scope. If omitted, a scope declaring nothing is created, whose parent is `scope`.
 * @returns The child scope.
 */
export function addChild(scope: _Context, child: _Context = _scope(scope, EMPTY_LAYOUT)): _Context {
  const children = scope[CHILDREN];
  if (isScopeList(children)) {
    children.length ? children.push(child) : scope[CHILDREN] = child;
  } else {
    // The second child gets an array of exactly two items: a push into an empty array would reserve room for many more
    scope[CHILDREN] = children ? [children, child] : child;
  }

  return child;
}

/**
 * Removes a scope registered inside another one, without clearing it.
 *
 * @param scope - The scope holding the child.
 * @param child - The child scope.
 */
export function removeChild(scope: _Context, child: _Context): void {
  const children = scope[CHILDREN];
  if (children === child) {
    scope[CHILDREN] = null;
  } else if (isScopeList(children)) {
    const index = children.indexOf(child);
    if (index !== -1) {
      children.splice(index, 1);
    }
  }
}

/**
 * Returns the number of scopes registered inside a scope, which {@link getChild} reads.
 *
 * @param scope - The scope.
 * @returns The number of child scopes.
 */
export function getChildCount(scope: _Context): number {
  const children = scope[CHILDREN];
  return isScopeList(children) ? children.length : children ? 1 : 0;
}

/**
 * Returns a scope registered inside a scope, by its position in registration order.
 *
 * @param scope - The scope.
 * @param index - The position of the child scope, lower than {@link getChildCount}.
 * @returns The child scope.
 */
export function getChild(scope: _Context, index: number): _Context {
  const children = scope[CHILDREN]!;
  return isScopeList(children) ? children[index] : children;
}

/**
 * Registers a node at the top of the block of a scope in the slot the compiler gave it, so that the scope removes it
 * from the node it is inserted into when it is cleared, if it is still there. Only the nodes rendered at the top of a
 * block get a slot, all inserted into the same node: the ones rendered into an element of the template are removed with
 * the element, and the root of a render keeps none, its nodes staying in the shadow root of its component, removed
 * with it.
 *
 * Lets a caller register the node before binding what it binds to the node, and insert the node afterwards. A node never
 * inserted, as the element whose bindings threw in the content of a `@try`, or moved into another node, is not removed.
 *
 * @param node - The node to track.
 * @param parentNode - The node the node is inserted into: the same for every node a scope tracks.
 * @param scope - The scope owning the node.
 * @param slot - The slot of the node in the scope, `undefined` for a node no scope tracks.
 * @throws In development, when the scope tracks nodes inserted into another node.
 */
export function trackNode(node: Node, parentNode: Node, scope: _Context, slot: number | undefined): void {
  if (!slot) {
    return;
  }

  const current = scope[PARENT_NODE];
  if (current === null) {
    scope[PARENT_NODE] = parentNode;
  } else if (DEV_MODE && current !== parentNode) {
    throw new Error('A scope tracks the nodes inserted into a single node: this one is inserted into another node');
  }

  scope[slot] = node;
}

/**
 * Registers what a scope runs or disposes when it is cleared: a function is called, an object, as an effect, is disposed
 * with its `dispose()`, so that it is registered without a closure calling it, and a binding reading variables of the
 * template has its effect, if any, disposed, and runs again when the scope is refreshed with one of them (see
 * {@link refresh}).
 *
 * @param scope - The scope.
 * @param cleanup - The cleanup to register.
 */
export function addCleanup(scope: _Context, cleanup: Cleanup): void {
  const current = scope[CLEANUP];
  if (Array.isArray(current)) {
    current.push(cleanup);
  } else {
    // The second cleanup gets an array of exactly two items: a push into an empty array would reserve room for many more
    scope[CLEANUP] = current ? [current, cleanup] : cleanup;
  }
}

/**
 * Unregisters a cleanup registered with {@link addCleanup}, so that it no longer runs when the scope is cleared.
 *
 * @param scope - The scope.
 * @param cleanup - The cleanup to unregister.
 */
export function removeCleanup(scope: _Context, cleanup: Cleanup): void {
  const current = scope[CLEANUP];
  if (current === cleanup) {
    scope[CLEANUP] = null;
  } else if (Array.isArray(current)) {
    const index = current.indexOf(cleanup);
    if (index !== -1) {
      // The last cleanup left is kept as it is, as the first one is
      current.length === 2 ? scope[CLEANUP] = current[1 - index] : current.splice(index, 1);
    }
  }
}

/**
 * Returns how the nodes rendered in a scope are got.
 *
 * @param scope - The scope.
 * @returns The strategy.
 */
export function getNodeStrategy(scope: _Context): NodeStrategy {
  return scope[STRATEGY] ?? CREATE_NODES;
}

/**
 * Sets how the nodes rendered in a scope, and in the scopes it holds, are got: once a hydration ends, they all create
 * what they render from then on.
 *
 * @param scope - The scope.
 * @param nodeStrategy - The strategy.
 */
export function setNodeStrategy(scope: _Context, nodeStrategy: NodeStrategy): void {
  scope[STRATEGY] = toStrategySlot(nodeStrategy);
  for (let i = 0; i < getChildCount(scope); i++) {
    setNodeStrategy(getChild(scope, i), nodeStrategy);
  }
}

/**
 * Sets how the nodes rendered in a scope are got, without changing the scopes it holds: the strategy of the children of
 * an element, for the time they are rendered (see `renderElement`).
 *
 * @param scope - The scope.
 * @param nodeStrategy - The strategy.
 */
export function swapNodeStrategy(scope: _Context, nodeStrategy: NodeStrategy): void {
  scope[STRATEGY] = toStrategySlot(nodeStrategy);
}

/**
 * Moves the cleanups and the child scopes of a scope to another one, leaving it empty: a staging scope, collecting what
 * is created before the scope it belongs to exists, hands them over to it.
 *
 * @param scope - The staging scope.
 * @param target - The scope receiving the cleanups and the child scopes.
 */
export function moveTo(scope: _Context, target: _Context): void {
  const cleanup = scope[CLEANUP];
  if (Array.isArray(cleanup)) {
    for (let i = 0; i < cleanup.length; i++) {
      addCleanup(target, cleanup[i]);
    }
  } else if (cleanup) {
    addCleanup(target, cleanup);
  }

  for (let i = 0; i < getChildCount(scope); i++) {
    addChild(target, getChild(scope, i));
  }

  scope[CLEANUP] = null;
  scope[CHILDREN] = null;
}

/**
 * Clears a scope: removes its nodes from the DOM, runs its cleanups, then clears the scopes it holds, and empties its
 * slots, so that a scope the runtime reuses, as the one of an element structural directives are applied to, is ready for
 * the next render.
 *
 * The nodes are removed first, from the last to the first, only from the node they were inserted into and only if they
 * are still there: a node moved elsewhere, or never inserted, is left where it is. A scope told not to remove them leaves
 * the DOM as it is: its nodes are inside a node removed already, or in the shadow root of a component removed from the
 * DOM, which goes with the component (see `CustomElement`).
 *
 * Each child scope is cleared after the cleanups, removing its own nodes when nothing removes them already (see
 * {@link childDetaches}): only the highest scope cleared removes the nodes at its top, and the child scopes whose nodes
 * are beside them, while the nodes inside them go with them.
 *
 * @param scope - The scope.
 * @param detach - Whether the nodes are removed from the DOM. Defaults to `true`.
 */
export function clear(scope: _Context, detach = true): void {
  /*
    Nodes are removed before the cleanups to let events fired on onDestroy actually work: the cleanups remove the
    listeners on the nodes, preventing the parent to listen the event emitted on the destruction of the element
  */
  const parentNode = scope[PARENT_NODE];
  if (detach && parentNode) {
    for (let i = scope.length - 1; i >= scope[LAYOUT].nodes; i--) {
      const node = scope[i] as Node | null | undefined;
      if (node?.parentNode === parentNode) {
        parentNode.removeChild(node);
      }
    }
  }

  const cleanup = scope[CLEANUP];
  if (Array.isArray(cleanup)) {
    for (let i = 0; i < cleanup.length; i++) {
      runCleanup(cleanup[i]);
    }
  } else if (cleanup) {
    runCleanup(cleanup);
  }

  for (let i = 0; i < getChildCount(scope); i++) {
    const child = getChild(scope, i);
    clear(child, childDetaches(scope, child, detach));
  }

  scope[PARENT_NODE] = null;
  scope[CLEANUP] = null;
  scope[CHILDREN] = null;
  scope.fill(null, HEADER);
}

/**
 * Mounts a node into the DOM and binds it to the lifecycle of a scope: registers the node with the scope, which removes
 * it from `parentNode` when it is cleared, and inserts it into `parentNode` at the given position.
 *
 * @param node - The node to mount.
 * @param parentNode - The node to insert the node into: an element, or the shadow root of a component.
 * @param scope - The scope owning the node.
 * @param referenceNode - The node to insert relative to (same semantics as `Node.insertBefore`). If `null`, the node is
 *   appended at the end of `parentNode`.
 * @param slot - The slot of the node in the scope, `undefined` for a node no scope tracks (see {@link trackNode}).
 */
export function mountNode(node: Node, parentNode: Node, scope: _Context, referenceNode: Node | null = null, slot?: number): void {
  trackNode(node, parentNode, scope, slot);
  parentNode.insertBefore(node, referenceNode);
}

/**
 * Creates a Comment node used as a positional placeholder for dynamic content (`_if`, `_for`). It is inserted
 * immediately, in order, and stays in place for the entire lifetime of the scope: any future insertion of dynamic
 * content is done via `insertBefore(node, anchor)`, guaranteeing the correct position even when sibling constructs
 * update independently and asynchronously.
 *
 * @param label - Textual label for the comment, useful for debugging to visually distinguish in the DOM which construct
 *   generated the anchor.
 * @param parentNode - The node the anchor is inserted into: an element, or the shadow root of a component.
 * @param scope - The scope the anchor is bound to, which removes it from the DOM when it is cleared.
 * @param referenceNode - The node to insert the anchor relative to (same semantics as `Node.insertBefore`). If `null`,
 *   the anchor is appended at the end of `parentNode`.
 * @param slot - The slot of the anchor in the scope, `undefined` for an anchor no scope tracks (see {@link trackNode}).
 * @returns The created Comment node, to be used as the reference point for future insertions of dynamic content via
 *   `insertBefore(node, anchor)`.
 */
export function createAnchor(label: string, parentNode: Node, scope: _Context, referenceNode: Node | null = null, slot?: number): Comment {
  const anchor = document.createComment(label);
  mountNode(anchor, parentNode, scope, referenceNode, slot);
  return anchor;
}

/**
 * Tells whether the child scopes of a scope are a list of scopes, the array they are held in from the second, rather
 * than a single scope, itself an array: a scope holds a number in its `STATE` slot, a list a scope or nothing there.
 *
 * @param children - The child scopes of a scope.
 * @returns `true` for a list of scopes.
 */
function isScopeList(children: _Context | _Context[] | null): children is _Context[] {
  return children !== null && typeof children[STATE] !== 'number';
}

/**
 * Returns the scope some scopes up the chain of the declaring scopes.
 *
 * @param scope - The scope to start from.
 * @param depth - How many scopes up, `0` for the scope itself.
 * @returns The scope.
 */
function ancestorOf(scope: _Context, depth: number): _Context {
  let ancestor = scope;
  for (let i = 0; i < depth; i++) {
    ancestor = ancestor[PARENT]!;
  }

  return ancestor;
}

/**
 * Throws the error of a variable read before it is initialized, naming it from the layout of its scope.
 *
 * @param scope - The scope declaring the variable.
 * @param slot - The slot of the variable.
 * @param value - The value marking it uninitialized.
 * @throws A `ReferenceError` naming the variable.
 */
function throwUninitialized(scope: _Context, slot: number, value: unknown): never {
  const name = scope[LAYOUT].variables?.[slot - HEADER];
  throw new ReferenceError(value === UNINITIALIZED.element
    ? `Element ref "${name}" is read before the element it names is rendered`
    : `@let "${name}" is read before its declaration is rendered`);
}

/**
 * Turns a strategy into the value of the slot holding it: `null` for `CREATE_NODES`.
 *
 * @param nodeStrategy - The strategy.
 * @returns The value of the slot.
 */
function toStrategySlot(nodeStrategy: NodeStrategy): NodeStrategy | null {
  return nodeStrategy === CREATE_NODES ? null : nodeStrategy;
}

/**
 * Runs a cleanup of a scope being cleared (see {@link addCleanup}).
 *
 * @param cleanup - The cleanup.
 */
function runCleanup(cleanup: Cleanup): void {
  if (typeof cleanup === 'function') {
    cleanup();
  } else if ('reads' in cleanup) {
    cleanup.effect?.dispose();
  } else {
    cleanup.dispose();
  }
}

/**
 * Runs again the bindings of a scope reading a variable changed in the refresh running, then refreshes the scopes inside
 * it it has not refreshed yet (see {@link refresh}). The identifiers a `@let` of the scope adds while it runs (see
 * {@link propagate}) are dropped once the scope is done: the scopes beside it cannot read it.
 *
 * @param scope - The scope.
 */
function refreshScope(scope: _Context): void {
  const ids = changedIds!;
  scope[STATE] = currentPass;
  const cleanup = scope[CLEANUP];
  if (Array.isArray(cleanup)) {
    for (let i = 0; i < cleanup.length; i++) {
      refreshCleanup(cleanup[i]);
    }
  } else if (cleanup) {
    refreshCleanup(cleanup);
  }

  // The children are read at each iteration: refreshing one may add or remove the ones after it
  for (let i = 0; i < getChildCount(scope); i++) {
    const child = getChild(scope, i);
    if (child[STATE] !== currentPass) {
      refreshScope(child);
    }
  }

  changedIds = ids;
}

/**
 * Tells whether a child scope, cleared along with its parent, removes its nodes from the DOM: when the parent removes
 * its own, the child removes the ones beside them, in the same node, but not the ones inside them, which go with them;
 * when it does not, nothing of its subtree does. A child tracking no node, or under a scope tracking none, removes its
 * nodes, if any, since nothing tells where they are.
 *
 * A child outside of any template, as the scope of a component `createComponent` creates, renders its element into its
 * target, wherever it is: it always removes it.
 *
 * N.B. Deliberate, to save time and memory: deciding by the node the nodes of the child are inserted into, which every
 * scope keeps (see `PARENT_NODE`), instead of a flag the compiler would write for every block, or of a scope removing
 * every node of its subtree one by one. Do not remove the nodes of the children unconditionally again: clearing a row of
 * a `@for` would remove every node of its cells, and disconnecting a component every node of its template.
 *
 * @param scope - The scope being cleared.
 * @param child - The child scope.
 * @param detach - Whether the scope removes its nodes.
 * @returns `true` when the child removes its nodes.
 */
function childDetaches(scope: _Context, child: _Context, detach: boolean): boolean {
  if (child[PARENT] === null) {
    return true;
  }

  const parentNode = child[PARENT_NODE];
  return detach && (parentNode === null || scope[PARENT_NODE] === null || parentNode === scope[PARENT_NODE]);
}

/**
 * Tells whether a binding reads one of the variables changed.
 *
 * @param reads - The identifiers of the variables the binding reads.
 * @param ids - The identifiers of the variables changed.
 * @returns `true` when one identifier is in both.
 */
function readsAny(reads: readonly number[], ids: readonly number[]): boolean {
  for (let i = 0; i < reads.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (reads[i] === ids[j]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Runs a cleanup of a scope again when it is a binding reading one of the variables changed in the refresh running (see
 * {@link refresh}).
 *
 * @param cleanup - The cleanup.
 */
function refreshCleanup(cleanup: Cleanup): void {
  if (typeof cleanup !== 'function' && 'reads' in cleanup && readsAny(cleanup.reads, changedIds!)) {
    rerunBinding(cleanup);
  }
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
