import { CLEANUP, COMPONENT, CONTAINER_SLOTS, CONTENT, HEADER, KEYS, LAYOUT, PARENT, PARENT_NODE } from '../../costants';
import { _runBinding } from '../../models/effect/effect';
import type { BindingSite } from '../../types/binding-site.type';
import type { Binding } from '../../types/binding.type';
import type { Cleanup } from '../../types/cleanup.type';
import type { Container } from '../../types/container.type';
import type { _Context } from '../../types/context.type';
import type { _DeclarationKind } from '../../types/declaration-kind.type';
import type { Effect } from '../../types/effect.type';
import type { Branch } from '../../types/if/branch.type';
import type { InlineBranch } from '../../types/inline-branch.type';
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
 * The layout of the scope of an element structural directives are applied to: the element, then the container of the
 * scope its content creates, when it declares names or renders blocks (see `renderElementChildren`).
 */
export const STRUCTURAL_LAYOUT: _ScopeLayout = Object.freeze({ size: HEADER + 1 + CONTAINER_SLOTS, nodes: HEADER, containers: HEADER + 1 });

/**
 * The identifiers of the variables changed in the refresh running (see {@link refresh}), the ones of the scopes
 * enclosing the scope being refreshed included: `null` while none runs.
 *
 * N.B. Deliberate, to save memory: refreshing is synchronous, so the identifiers travel through a variable of the module
 * instead of an argument of every scope visited, and the scope keeps no list of its own.
 */
let changedIds: readonly number[] | null = null;

/**
 * Whether a refresh is running (see {@link refresh}): the scopes it creates join {@link refreshedScopes}.
 */
let refreshing = false;

/**
 * The scopes the refresh running refreshed, and the ones it created, which render with the values already changed: none
 * is refreshed twice. Emptied once the outermost refresh is done.
 *
 * N.B. Deliberate, to save memory: a set of the module, alive only while a refresh runs, instead of a slot of every scope
 * holding the number of the last refresh, which every scope paid, the rows of a table included, though only a refresh
 * reads it. Do not give the scopes a slot for it again.
 */
const refreshedScopes = new Set<_Context>();

/**
 * The strategies getting the nodes of the scopes adopting the nodes of the server (see {@link getNodeStrategy}): a scope
 * creating its nodes, nearly every scope and every scope once the hydration ends, has none.
 *
 * N.B. Deliberate, to save memory: a strategy other than creating the nodes lives only while a hydration runs, so it is
 * kept by a map of the module, weak, so that a scope dropped meanwhile is not kept alive, instead of a slot of every
 * scope, which every scope paid for the whole life of the page. Do not give the scopes a slot for it again.
 */
const strategies = new WeakMap<_Context, NodeStrategy>();

/**
 * The number of scopes {@link strategies} holds a strategy for, as far as it was told: `0` once every hydration has
 * ended, so that a scope gets its strategy without a lookup. A scope dropped without being cleared keeps it above `0`,
 * which costs a lookup, never a wrong strategy.
 */
let strategyCount = 0;

/**
 * The scope a branch is being rendered inline into (see {@link renderInline}), `null` while none is: the nodes, the
 * bindings and the cleanups rendered into it go to the slots of the branch, and its nodes are got with the strategy of
 * the branch.
 *
 * N.B. Deliberate, to save memory: rendering is synchronous, so the branch being rendered travels through three
 * variables of the module, checked against the scope every helper receives, instead of an argument every helper and
 * every function of the template would take, or a scope of its own for the branch. A component rendered by the branch
 * renders into scopes of its own, which are never this one. Do not pass the branch down the calls.
 */
let inlineScope: _Context | null = null;

/**
 * The branch being rendered inline into {@link inlineScope}.
 */
let inlineBranch: InlineBranch | null = null;

/**
 * The strategy getting the nodes of the branch being rendered inline into {@link inlineScope}.
 */
let inlineStrategy: NodeStrategy = CREATE_NODES;

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
  scope[COMPONENT] = component === undefined ? parent?.[COMPONENT] : component;
  scope[CLEANUP] = null;
  scope[LAYOUT] = layout;
  // A strategy other than creating the nodes is the one of a hydration, inherited by the scopes created while it runs
  const strategy = nodeStrategy ?? (strategyCount && parent ? strategies.get(parent) : undefined);
  if (strategy) {
    setStrategy(scope, strategy);
  }

  // Created by a refresh running, the scope renders with the values already changed
  if (refreshing) {
    refreshedScopes.add(scope);
  }

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
  const outer = refreshing;
  changedIds = outerIds ? outerIds.concat(ids) : ids;
  refreshing = true;
  try {
    refreshScope(scope);
  } finally {
    changedIds = outerIds;
    refreshing = outer;
    // The outermost refresh is done: the next one refreshes every scope again
    if (!outer) {
      refreshedScopes.clear();
    }
  }
}

/**
 * Returns the slot of the container of a block in the scope rendering it (see `_ScopeLayout`).
 *
 * @param scope - The scope rendering the block.
 * @param container - The index of the container among the containers of the scope, as the compiler gives it to the
 *   block. Defaults to the first one.
 * @returns The slot.
 */
export function containerSlot(scope: _Context, container = 0): number {
  return scope[LAYOUT].containers! + CONTAINER_SLOTS * container;
}

/**
 * Returns the node a block renders into, from the slot of its container telling where it renders (see `POSITION`).
 *
 * @param position - The anchor of the block, or the node it renders into, for the last block of its parent.
 * @returns The node.
 */
export function blockParent(position: Node): Node {
  return position.nodeType === Node.COMMENT_NODE ? position.parentNode! : position;
}

/**
 * Returns the node the content of a block is inserted before, from the slot of its container telling where it renders
 * (see `POSITION`).
 *
 * @param position - The anchor of the block, or the node it renders into, for the last block of its parent.
 * @returns The anchor, `null` for the last block of its parent, whose content is appended to it.
 */
export function blockAnchor(position: Node): Comment | null {
  return position.nodeType === Node.COMMENT_NODE ? position as Comment : null;
}

/**
 * Renders a branch of an `@if` or of a `@switch` inline into the scope holding the block (see `InlineBranch`): while it
 * renders, the nodes at its top, its bindings and its cleanups go to the slots of the branch, and its nodes are got with
 * the given strategy.
 *
 * @param scope - The scope holding the block.
 * @param branch - The branch.
 * @param parentNode - The node the block renders into.
 * @param anchor - The node the branch is inserted before, `null` to append it.
 * @param nodeStrategy - The strategy getting the nodes of the branch.
 * @throws The error of the render of the branch.
 */
export function renderInline(scope: _Context, branch: Branch & InlineBranch, parentNode: HTMLElement, anchor: Node | null, nodeStrategy: NodeStrategy): void {
  const previousScope = inlineScope;
  const previousBranch = inlineBranch;
  const previousStrategy = inlineStrategy;
  inlineScope = scope;
  inlineBranch = branch;
  inlineStrategy = nodeStrategy;
  try {
    branch.block(parentNode, scope, anchor, nodeStrategy);
  } finally {
    inlineScope = previousScope;
    inlineBranch = previousBranch;
    inlineStrategy = previousStrategy;
  }
}

/**
 * Returns the slot the slots of the bindings rendered into a scope are counted from (see `BindingSite`): the first slot
 * of the bindings of its layout, or the first slot of the branch being rendered inline into it.
 *
 * @param scope - The scope.
 * @returns The slot.
 */
export function bindingsBase(scope: _Context): number {
  return scope === inlineScope ? inlineBranch!.base : scope[LAYOUT].bindings!;
}

/**
 * Empties the slots of a branch rendered inline (see `InlineBranch`), as {@link clear} empties a scope: removes its
 * nodes from the node they are inserted into, from the last to the first, disposes the effects of its bindings, then
 * runs its cleanups.
 *
 * @param scope - The scope holding the block.
 * @param branch - The branch.
 * @param detach - Whether the nodes are removed from the DOM.
 * @param parentNode - The node the nodes are removed from, only if they are still there: `null` to remove them from the
 *   one they are inserted into, as a scope tracking no node does.
 */
export function clearInline(scope: _Context, branch: InlineBranch, detach: boolean, parentNode: Node | null): void {
  const { base, nodes, sites, cleanup } = branch;
  if (detach) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = scope[base + nodes[i]] as Node | null | undefined;
      const current = node?.parentNode;
      if (current && (parentNode === null || current === parentNode)) {
        current.removeChild(node!);
      }
    }
  }

  if (sites) {
    disposeSites(scope, sites, base);
  }

  if (cleanup !== undefined) {
    runCleanups(scope[base + cleanup] as Cleanup | Cleanup[] | undefined);
  }

  // Emptied as created: a binding not bound yet is passed over by a refresh
  scope.fill(undefined, base, base + branch.size);
}

/**
 * Visits the branches rendered inline into a scope (see `InlineBranch`), in the order of the containers of their blocks.
 *
 * @template Argument - What the visit receives besides the scope and the branch.
 * @param scope - The scope.
 * @param visit - The visit, a function of a module, never a closure.
 * @param argument - What the visit receives besides the scope and the branch.
 */
export function forEachInline<Argument>(scope: _Context, visit: (scope: _Context, branch: InlineBranch, argument: Argument) => void, argument: Argument): void {
  const { containers } = scope[LAYOUT];
  if (containers === undefined) {
    return;
  }

  for (let i = containers; i < scope.length; i += CONTAINER_SLOTS) {
    const content = scope[i + CONTENT] as Container;
    if (isInline(content)) {
      visit(scope, content, argument);
    }
  }
}

/**
 * Visits the scopes the containers of a scope hold, in the order of the containers, the rows of a `@for` in their order:
 * each container is read when its turn comes, so that visiting a scope may change the ones after it.
 *
 * @template Argument - What the visit receives besides the scope.
 * @param scope - The scope.
 * @param visit - The visit, a function of a module, never a closure.
 * @param argument - What the visit receives besides the scope.
 */
export function forEachChild<Argument>(scope: _Context, visit: (child: _Context, argument: Argument) => void, argument: Argument): void {
  const { containers } = scope[LAYOUT];
  if (containers === undefined) {
    return;
  }

  for (let i = containers; i < scope.length; i += CONTAINER_SLOTS) {
    const content = scope[i + CONTENT] as Container;
    // The keys tell a @for, whose content is the list of its rows, from a block showing a scope
    if (Array.isArray(scope[i + KEYS])) {
      const rows = content as readonly _Context[];
      for (let j = 0; j < rows.length; j++) {
        visit(rows[j], argument);
      }
    } else if (Array.isArray(content)) {
      visit(content as _Context, argument);
    }
  }
}

/**
 * Returns the slot after the last node at the top of the block of a scope: the first binding, the first container, or
 * the end of the scope.
 *
 * @param scope - The scope.
 * @returns The slot.
 */
export function nodesEnd(scope: _Context): number {
  const layout = scope[LAYOUT];
  return layout.bindings ?? layout.containers ?? scope.length;
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
 * A node at the top of a branch rendered inline (see {@link renderInline}) is kept in the slot of the branch, counted
 * from its first one: it is inserted into the node of the block, not the one of the scope.
 *
 * @param slot - The slot of the node in the scope, `undefined` for a node no scope tracks.
 * @throws In development, when the scope tracks nodes inserted into another node.
 */
export function trackNode(node: Node, parentNode: Node, scope: _Context, slot: number | undefined): void {
  if (slot === undefined) {
    return;
  }

  if (scope === inlineScope) {
    scope[inlineBranch!.base + slot] = node;
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
 * {@link refresh}). The cleanups of a branch rendered inline (see {@link renderInline}) go to the slot of the branch.
 *
 * @param scope - The scope.
 * @param cleanup - The cleanup to register.
 */
export function addCleanup(scope: _Context, cleanup: Cleanup): void {
  const slot = scope === inlineScope ? inlineBranch!.base + inlineBranch!.cleanup! : CLEANUP;
  const current = scope[slot] as Cleanup | Cleanup[] | null | undefined;
  if (Array.isArray(current)) {
    current.push(cleanup);
  } else {
    // The second cleanup gets an array of exactly two items: a push into an empty array would reserve room for many more
    scope[slot] = current ? [current, cleanup] : cleanup;
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
 * Returns how the nodes rendered in a scope are got: the strategy of the branch, while one is rendered inline into it
 * (see {@link renderInline}).
 *
 * @param scope - The scope.
 * @returns The strategy.
 */
export function getNodeStrategy(scope: _Context): NodeStrategy {
  if (scope === inlineScope) {
    return inlineStrategy;
  }

  // No hydration running: every scope creates its nodes
  return strategyCount ? strategies.get(scope) ?? CREATE_NODES : CREATE_NODES;
}

/**
 * Sets how the nodes rendered in a scope, and in the scopes it holds, are got: once a hydration ends, they all create
 * what they render from then on.
 *
 * @param scope - The scope.
 * @param nodeStrategy - The strategy.
 */
export function setNodeStrategy(scope: _Context, nodeStrategy: NodeStrategy): void {
  setStrategy(scope, nodeStrategy);
  const cleanup = scope[CLEANUP];
  if (Array.isArray(cleanup)) {
    for (let i = 0; i < cleanup.length; i++) {
      setHeldNodeStrategy(cleanup[i], nodeStrategy);
    }
  } else if (cleanup) {
    setHeldNodeStrategy(cleanup, nodeStrategy);
  }

  forEachChild(scope, setNodeStrategy, nodeStrategy);
}

/**
 * Sets how the nodes rendered in a scope are got, without changing the scopes it holds: the strategy of the children of
 * an element, for the time they are rendered (see `renderElement`).
 *
 * @param scope - The scope.
 * @param nodeStrategy - The strategy.
 */
export function swapNodeStrategy(scope: _Context, nodeStrategy: NodeStrategy): void {
  if (scope === inlineScope) {
    inlineStrategy = nodeStrategy;
  } else {
    setStrategy(scope, nodeStrategy);
  }
}

/**
 * Moves the cleanups of a scope to another one, leaving it empty: a staging scope, collecting what is created before the
 * scope it belongs to exists (the effects, the components `createComponent` creates), hands them over to it.
 *
 * @param scope - The staging scope.
 * @param target - The scope receiving the cleanups.
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

  scope[CLEANUP] = null;
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
 * The scopes of its containers are cleared after the cleanups, the ones of a `@for` in the order of their rows, each one
 * removing its own nodes when nothing removes them already (see {@link clearChild}): only the highest scope cleared
 * removes the nodes at its top, and the child scopes whose nodes are beside them, while the nodes inside them go with
 * them. The scopes its cleanups hold (see `ScopeHolder`) are cleared with the cleanups. The branches rendered inline
 * into it are emptied with the scopes of the containers, as the scopes of their own they stand for were: their nodes
 * are removed when they are beside the ones of the scope, or when it tracks none.
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
    for (let i = nodesEnd(scope) - 1; i >= scope[LAYOUT].nodes; i--) {
      const node = scope[i] as Node | null | undefined;
      if (node?.parentNode === parentNode) {
        parentNode.removeChild(node);
      }
    }
  }

  const { sites, bindings, containers } = scope[LAYOUT];
  if (sites) {
    disposeSites(scope, sites, bindings!);
  }

  runCleanups(scope[CLEANUP]);
  if (containers !== undefined) {
    const holder = detach ? scope : null;
    for (let i = containers; i < scope.length; i += CONTAINER_SLOTS) {
      const content = scope[i + CONTENT] as Container;
      if (Array.isArray(scope[i + KEYS])) {
        const rows = content as readonly _Context[];
        for (let j = 0; j < rows.length; j++) {
          clearChild(rows[j], holder);
        }
      } else if (Array.isArray(content)) {
        clearChild(content as _Context, holder);
      } else if (isInline(content)) {
        clearInline(scope, content, detach, parentNode);
      }
    }
  }

  scope[PARENT_NODE] = null;
  scope[CLEANUP] = null;
  scope.fill(null, HEADER);
  // A scope adopting nodes, cleared while the hydration runs, is not kept by the map of the strategies
  setStrategy(scope, CREATE_NODES);
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
 * Tells whether a container holds a branch rendered inline, an object, rather than a scope, the rows of a `@for`, which
 * are arrays, or nothing.
 *
 * @param content - What the container holds.
 * @returns `true` for a branch rendered inline.
 */
function isInline(content: Container): content is InlineBranch {
  return !!content && !Array.isArray(content);
}

/**
 * Disposes the effects of the bindings a scope keeps in its slots (see `BindingSite`).
 *
 * @param scope - The scope.
 * @param sites - The bindings.
 * @param base - The slot their slots are counted from.
 */
function disposeSites(scope: _Context, sites: readonly BindingSite[], base: number): void {
  for (let i = 0; i < sites.length; i++) {
    (scope[base + sites[i].effect!] as Effect | null | undefined)?.dispose();
  }
}

/**
 * Runs the cleanups of a slot holding them (see {@link addCleanup}).
 *
 * @param cleanup - What the slot holds: a single cleanup, an array of them from the second, nothing.
 */
function runCleanups(cleanup: Cleanup | Cleanup[] | null | undefined): void {
  if (Array.isArray(cleanup)) {
    for (let i = 0; i < cleanup.length; i++) {
      runCleanup(cleanup[i]);
    }
  } else if (cleanup) {
    runCleanup(cleanup);
  }
}

/**
 * Runs again the bindings a scope keeps in its slots reading a variable changed in the refresh running, reading the
 * identifiers at each binding: the ones a `@let` adds while the scope runs reach the bindings after it.
 *
 * @param scope - The scope.
 * @param sites - The bindings, in the order they were rendered.
 * @param base - The slot their slots are counted from.
 */
function refreshSites(scope: _Context, sites: readonly BindingSite[], base: number): void {
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    if (site.reads && readsAny(site.reads, changedIds!)) {
      rerunSite(scope, site, base);
    }
  }
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
 * Keeps the strategy of a scope (see {@link strategies}): a strategy other than creating the nodes is kept, creating the
 * nodes drops the one kept, if any.
 *
 * @param scope - The scope.
 * @param nodeStrategy - The strategy.
 */
function setStrategy(scope: _Context, nodeStrategy: NodeStrategy): void {
  if (nodeStrategy !== CREATE_NODES) {
    if (!strategies.has(scope)) {
      strategyCount++;
    }

    strategies.set(scope, nodeStrategy);
  } else if (strategies.delete(scope)) {
    strategyCount--;
  }
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
  } else if ('scope' in cleanup) {
    // A scope held outside of the containers renders nothing beside the nodes of the scope holding it: it removes its own
    clear(cleanup.scope);
  } else {
    cleanup.dispose();
  }
}

/**
 * Gives its strategy to the scope a cleanup holds, if any (see {@link setNodeStrategy}).
 *
 * @param cleanup - The cleanup.
 * @param nodeStrategy - The strategy.
 */
function setHeldNodeStrategy(cleanup: Cleanup, nodeStrategy: NodeStrategy): void {
  if (typeof cleanup !== 'function' && 'scope' in cleanup) {
    setNodeStrategy(cleanup.scope, nodeStrategy);
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
  refreshedScopes.add(scope);
  const { sites, bindings, containers } = scope[LAYOUT];
  if (sites) {
    refreshSites(scope, sites, bindings!);
  }

  const cleanup = scope[CLEANUP];
  if (Array.isArray(cleanup)) {
    for (let i = 0; i < cleanup.length; i++) {
      refreshCleanup(cleanup[i]);
    }
  } else if (cleanup) {
    refreshCleanup(cleanup);
  }

  // The containers are read when their turn comes: a binding run again may have shown another branch, or other rows
  if (containers !== undefined) {
    for (let i = containers; i < scope.length; i += CONTAINER_SLOTS) {
      const content = scope[i + CONTENT] as Container;
      if (Array.isArray(scope[i + KEYS])) {
        const rows = content as readonly _Context[];
        for (let j = 0; j < rows.length; j++) {
          refreshChild(rows[j]);
        }
      } else if (Array.isArray(content)) {
        refreshChild(content as _Context);
      } else if (isInline(content) && content.sites) {
        refreshSites(scope, content.sites, content.base);
      }
    }
  }

  changedIds = ids;
}

/**
 * Refreshes a scope inside the one being refreshed, unless the refresh running already did, or created it.
 *
 * @param child - The scope.
 */
function refreshChild(child: _Context): void {
  if (!refreshedScopes.has(child)) {
    refreshScope(child);
  }
}

/**
 * Clears a scope of a container of a scope being cleared, removing its nodes from the DOM when nothing removes them
 * already: when the parent removes its own, the child removes the ones beside them, in the same node, but not the ones
 * inside them, which go with them; when it does not, nothing of its subtree does. A child tracking no node, or under a
 * scope tracking none, removes its nodes, if any, since nothing tells where they are.
 *
 * N.B. Deliberate, to save time and memory: deciding by the node the nodes of the child are inserted into, which every
 * scope keeps (see `PARENT_NODE`), instead of a flag the compiler would write for every block, or of a scope removing
 * every node of its subtree one by one. The parent travels as the argument of the visit, `null` when it keeps the DOM as
 * it is, so that the visit is a function of the module. Do not remove the nodes of the children unconditionally again:
 * clearing a row of a `@for` would remove every node of its cells, and disconnecting a component every node of its
 * template.
 *
 * @param child - The child scope.
 * @param parent - The scope being cleared, `null` when it does not remove its nodes.
 */
function clearChild(child: _Context, parent: _Context | null): void {
  const parentNode = child[PARENT_NODE];
  clear(child, parent !== null && (parentNode === null || parent[PARENT_NODE] === null || parentNode === parent[PARENT_NODE]));
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
 * Runs a cleanup of a scope again when it is a binding reading one of the variables changed in the refresh running, and
 * refreshes the scope it holds, if any (see {@link refresh}).
 *
 * @param cleanup - The cleanup.
 */
function refreshCleanup(cleanup: Cleanup): void {
  if ('reads' in cleanup) {
    if (readsAny(cleanup.reads, changedIds!)) {
      rerunBinding(cleanup);
    }
  } else if ('scope' in cleanup) {
    refreshChild(cleanup.scope);
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

/**
 * Runs again a binding a scope keeps in its slots (see `BindingSite`), with its target and the current values of the
 * variables, as {@link rerunBinding} does: its previous effect, if any, is disposed. A binding not bound yet, whose
 * effect slot is still empty, is passed over: its first run reads the current values.
 *
 * @param scope - The scope.
 * @param site - The binding.
 * @param base - The first slot of the bindings of the scope.
 */
function rerunSite(scope: _Context, site: BindingSite, base: number): void {
  const slot = base + site.effect!;
  const previous = scope[slot] as Effect | null | undefined;
  if (previous === undefined) {
    return;
  }

  let effect: Effect | null;
  try {
    effect = _runBinding(site.update!, scope, targetOf(scope, site, base), site);
  } catch (error) {
    queueMicrotask(() => {
      throw error;
    });
    return;
  }

  previous?.dispose();
  scope[slot] = effect;
}

/**
 * Gives what a binding a scope keeps in its slots is run again with: its target, the index of the slot of its target for
 * a binding keeping its last value (see `BindingSite.indexed`), `undefined` for a binding without target.
 *
 * @param scope - The scope.
 * @param site - The binding.
 * @param base - The first slot of the bindings of the scope.
 * @returns The target, or the index of its slot.
 */
function targetOf(scope: _Context, { target, indexed }: BindingSite, base: number): unknown {
  if (target === undefined) {
    return undefined;
  }

  return indexed ? base + target : scope[base + target];
}
