import { _SSR_MARKERS, COMPONENT, HEADER, LAYOUT, PARENT_NODE } from '../../costants';
import { untracked } from '../../signals';
import { _bindEffect } from '../../signals/effect/effect';
import type { IterationVariable } from '../../types/iteration-variable.type';
import type { IterationVariables } from '../../types/iteration-variables.type';
import type { _Context } from '../../types/context.type';
import { addChild, clear, getChild, getChildCount, getNodeStrategy, refresh, removeChild, update } from '../context/context.util';
import type { ForConfig } from '../../types/for-config.type';
import type { ForRun } from '../../types/for-run.type';

/**
 * The first node, in DOM order, of the item whose bounds {@link findItemBounds} found last, `null` when it renders none.
 *
 * N.B. Deliberate, to save memory: rendering is synchronous, so the bounds of an item travel through two variables of
 * the module, read right after they are found, instead of an array of the nodes of the item, allocated for every item
 * at every run, or an object holding the two nodes. Do not collect the nodes into an array again.
 */
let firstNode: Node | null = null;

/**
 * The last node, in DOM order, of the item whose bounds {@link findItemBounds} found last, `null` when it renders none.
 */
let lastNode: Node | null = null;

/**
 * Reactively iterates over a list of items. Items are matched across re-runs
 * by the key produced by the track expression of the `@for`:
 * - key sopravvive → il Context e l'intero sottoalbero (stato, subscription,
 *   richieste pendenti) vengono riusati SEMPRE, indipendentemente da un
 *   eventuale cambio di indice: si spostano solo i nodi DOM, e se il body usa
 *   l'item o $index/$first/$last/$even/$odd, questi vengono aggiornati in-place
 *   (see {@link updateIterationVariables}), senza ricreare nulla.
 * - key sparita → il Context viene distrutto.
 * - key nuova → il Context viene creato.
 *
 * The items and their keys are read by a binding (see `_bindEffect`): the `@for` runs again whenever a signal, or a
 * variable of the template, they read changes.
 *
 * The first run renders the items in order, getting their nodes with the strategy of the context: in the hydration of a
 * component, the items the server rendered are adopted when it rendered the same keys in the same order, otherwise
 * the block is emptied, with a warning, and the items created. Every later run reads the strategy of the context again:
 * once the hydration ends, the one creating the nodes.
 *
 * @param parentNode - The parent HTML element the items are rendered into.
 * @param parentContext - The context owning the items.
 * @param referenceNode - The node to insert the items before, `null` to append them.
 * @param config - The `@for`, a constant of the module of the template: its items and their keys, functions of the
 *   module called with the component and the context, the function rendering an item, the variables the body reads and
 *   the variables of the template the items and their keys read (see `ForConfig`).
 */
export function _for(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, config: ForConfig): void {
  const nodeBlock = getNodeStrategy(parentContext).block(parentContext, parentNode, referenceNode, 'for', _SSR_MARKERS.for, config.last, config.slot);
  const run: ForRun = {
    parentNode, parentContext,
    nodeBlock,
    config,
    entries: null
  };

  _bindEffect(parentContext, runFor, run, undefined, undefined, config.reads);
}

/**
 * Reads the items of a `@for` and their keys, then renders them: the callback of the binding of {@link _for}, shared by
 * every `@for`. Only the items and the track expression are tracked.
 *
 * @param run - The `@for`.
 */
function runFor(run: ForRun): void {
  const { config, parentContext } = run;
  const component = parentContext[COMPONENT];
  const iterable = config.items.call(component, parentContext);
  const items = typeof iterable === 'number' ? Array.from({ length: iterable }, (_, i) => i) : iterable;
  // The track expression reads the item, the index and the implicit variables as the body does: as values
  const last = items.length - 1;
  const newKeys = new Array<string | number>(items.length);
  for (let i = 0; i < items.length; i++) {
    newKeys[i] = config.track.call(component, parentContext, items[i], i, i === 0, i === last, i % 2 === 0, i % 2 !== 0);
  }

  const occurrences = countOccurrences(newKeys);
  untracked(() => run.entries ? updateItems(run, items, newKeys, occurrences) : renderItems(run, items, newKeys, occurrences));
}

/**
 * Renders the items of the first run, run synchronously by {@link _for}, in order before the anchor, getting their nodes
 * with the strategy of the context: in a hydration, they are adopted when the server rendered the same keys.
 *
 * @param run - The `@for`.
 * @param items - The items.
 * @param newKeys - The key of each item.
 * @param occurrences - The occurrences of the keys.
 */
function renderItems(run: ForRun, items: unknown[], newKeys: Array<string | number>, occurrences: ReturnType<typeof countOccurrences>): void {
  const { parentNode, parentContext, nodeBlock, config } = run;
  const nodeStrategy = getNodeStrategy(parentContext);
  const entries = new Map<string | number, _Context[]>();
  const itemNodeStrategy = nodeStrategy.adoptItems(parentNode, nodeBlock, newKeys);
  for (let i = 0; i < items.length; i++) {
    const key = newKeys[i];
    const created = config.block(parentNode, parentContext, items, i, nodeBlock.anchor, itemNodeStrategy);
    addChild(parentContext, created);
    const keyEntries = entries.get(key) ?? new Array<_Context>(occurrences.counts.get(key)!);
    keyEntries[occurrences.indexes[i]] = created;
    entries.set(key, keyEntries);
  }

  run.entries = entries;
  nodeStrategy.close(parentNode, nodeBlock);
}

/**
 * Renders the items of a later run, reusing the entries of the keys that survive: their variables are updated, which
 * refreshes the bindings reading them, and their nodes moved, read once refreshed, since a block at the top of the body
 * may render other nodes. The entries of the keys gone are destroyed, the ones of the new keys created.
 *
 * @param run - The `@for`, already rendered.
 * @param items - The items.
 * @param newKeys - The key of each item.
 * @param occurrences - The occurrences of the keys.
 */
function updateItems(run: ForRun, items: unknown[], newKeys: Array<string | number>, occurrences: ReturnType<typeof countOccurrences>): void {
  const { parentNode, parentContext, config } = run;
  const { variables } = config;
  const entries = run.entries!;
  const newEntries = new Map<string | number, _Context[]>();

  // The entries of the keys gone, and of the occurrences of a key beyond its new count, are destroyed
  for (const [key, keyEntries] of entries) {
    const kept = occurrences.counts.get(key) ?? 0;
    for (let i = kept; i < keyEntries.length; i++) {
      clear(keyEntries[i]);
      removeChild(parentContext, keyEntries[i]);
    }
  }

  let nextReference: Node | null = run.nodeBlock.anchor;

  for (let i = items.length - 1; i >= 0; i--) {
    const key = newKeys[i];
    const occurrence = occurrences.indexes[i];
    const existing = entries.get(key)?.[occurrence];

    let entry: _Context;

    if (existing) {
      if (variables) {
        updateIterationVariables(existing, variables, items, i);
      }

      findItemBounds(parentNode, existing);
      if (lastNode && lastNode.nextSibling !== nextReference) {
        moveItem(parentNode, firstNode!, lastNode, nextReference);
      }

      entry = existing;
    } else {
      const created = config.block(parentNode, parentContext, items, i, nextReference, getNodeStrategy(parentContext));
      addChild(parentContext, created);
      findItemBounds(parentNode, created);
      entry = created;
    }

    const keyEntries = newEntries.get(key) ?? new Array<_Context>(occurrences.counts.get(key)!);
    keyEntries[occurrence] = entry;
    newEntries.set(key, keyEntries);
    nextReference = firstNode ?? nextReference;
  }

  run.entries = newEntries;
}

/**
 * Numbers the occurrences of each key: a key may be repeated in the items, and each occurrence keeps its own entry.
 *
 * @param keys - The keys of the items, in order.
 * @returns For each item, the index of its occurrence among the items with the same key, and the count of the occurrences of each key.
 */
function countOccurrences(keys: Array<string | number>): { indexes: number[], counts: Map<string | number, number> } {
  const counts = new Map<string | number, number>();
  const indexes = keys.map(key => {
    const occurrence = counts.get(key) ?? 0;
    counts.set(key, occurrence + 1);
    return occurrence;
  });

  return { indexes, counts };
}

/**
 * Finds the first and the last node, in DOM order, an item renders directly into `parentNode` (see {@link firstNode}
 * and {@link lastNode}): not only the ones owned by its context, but also the ones owned by its descendant contexts
 * (e.g. the content of a nested `@if`/`@for`, which lives before its anchor). An item always occupies a contiguous
 * range of `parentNode`, so its nodes are the ones going from the first to the last of them.
 *
 * @param parentNode - The element the item is rendered into.
 * @param context - The context of the item.
 */
function findItemBounds(parentNode: Node, context: _Context): void {
  firstNode = null;
  lastNode = null;
  collectBounds(parentNode, context);
}

/**
 * Widens the bounds of an item (see {@link findItemBounds}) to the nodes owned by `context` and by its descendants that
 * are rendered into `parentNode`. Since all the nodes of a context are rendered into the same element, a context whose
 * nodes are rendered elsewhere (e.g. the children of an element) is skipped along with its descendants: their nodes are
 * moved together with the element containing them.
 *
 * @param parentNode - The element the nodes have to be rendered into.
 * @param context - The context to read the nodes of.
 */
function collectBounds(parentNode: Node, context: _Context): void {
  // The nodes of a context are all inserted into the same node
  if (context[PARENT_NODE] !== null && context[PARENT_NODE] !== parentNode) {
    return;
  }

  for (let i = context[LAYOUT].nodes; i < context.length; i++) {
    const node = context[i] as Node | null | undefined;
    if (node) {
      if (!firstNode) {
        firstNode = lastNode = node;
      } else if (node.compareDocumentPosition(firstNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
        firstNode = node;
      } else if (node.compareDocumentPosition(lastNode!) & Node.DOCUMENT_POSITION_PRECEDING) {
        lastNode = node;
      }
    }
  }

  for (let i = 0; i < getChildCount(context); i++) {
    collectBounds(parentNode, getChild(context, i));
  }
}

/**
 * Moves the nodes of an item, from its first to its last one, before a node, keeping their order: from the last one
 * back, each one before the one moved after it.
 *
 * moveBefore keeps the nodes in the document: the components of the row are not disconnected, so they keep their
 * render, their state and their effects. insertBefore would destroy and render them again.
 *
 * @param parentNode - The element the item is rendered into.
 * @param first - The first node of the item.
 * @param last - The last node of the item.
 * @param reference - The node to move the item before, `null` to move it to the end.
 */
function moveItem(parentNode: Element, first: Node, last: Node, reference: Node | null): void {
  let node = last;
  let previous = node.previousSibling;
  parentNode.moveBefore(node, reference);
  while (node !== first) {
    const moved: Node = previous!;
    previous = moved.previousSibling;
    parentNode.moveBefore(moved, node);
    node = moved;
  }
}

/**
 * Declares in the context of the body of an item of a `@for` the variables the body reads: the item and
 * `$index`/`$first`/`$last`/`$even`/`$odd`, as values. When a row is reused, for an item moved to a different
 * position in the array or for a new item with the same key, `_for` writes the new values into the context in place
 * and refreshes it (see {@link updateIterationVariables}), instead of recreating the item's template output: the
 * bindings reading the variables run again, everything else in the item's subtree (state, subscriptions, pending
 * requests) is left completely untouched.
 *
 * Only the variables the body reads are declared, in the slots following the header of the context, in the order of
 * `used`: the compiled code does not call it for a body reading none.
 *
 * @param context - The context of the body of the item, which the variables are declared in.
 * @param items - The full array being iterated.
 * @param index - The current iteration index.
 * @param variables - The variables to declare, declared once for the `@for` by the compiled code, and given to `_for`
 *   too.
 */
export function _iterationVariables(context: _Context, items: unknown[], index: number, variables: IterationVariables): void {
  const { used } = variables;
  for (let i = 0; i < used.length; i++) {
    context[HEADER + i] = iterationValue(used[i], items, index);
  }
}

/**
 * Writes into the context of an item reused by a later run of a `@for` the values of its new position, then refreshes
 * it with the identifiers of the variables that changed, if any (see `refresh`).
 *
 * N.B. Deliberate, to save memory: a single function of the module, given the context of the item and the variables of
 * the `@for`, instead of an `update` closure created by {@link _iterationVariables} for each item, capturing its
 * variables, which cost a function and its context per item. Do not move it back into a closure per item.
 *
 * @param context - The context of the item.
 * @param variables - The variables the body reads.
 * @param items - The full array being iterated.
 * @param index - The new index of the item.
 */
function updateIterationVariables(context: _Context, { used, ids }: IterationVariables, items: unknown[], index: number): void {
  let changed: number[] | null = null;
  for (let i = 0; i < used.length; i++) {
    if (update(context, HEADER + i, iterationValue(used[i], items, index))) {
      changed ? changed.push(ids[i]) : changed = [ids[i]];
    }
  }

  if (changed) {
    refresh(context, changed);
  }
}

/**
 * Computes the value of a variable of a `@for` for an item.
 *
 * @param variable - The variable.
 * @param items - The full array being iterated.
 * @param index - The index of the item.
 * @returns The item for `item`, its index for `$index`, whether it is the first, the last, at an even or an odd index
 *   for the other variables.
 */
function iterationValue(variable: IterationVariable, items: unknown[], index: number): unknown {
  switch (variable) {
    case 'item':
      return items[index];
    case '$index':
      return index;
    case '$first':
      return index === 0;
    case '$last':
      return index === items.length - 1;
    case '$even':
      return index % 2 === 0;
    default:
      return index % 2 !== 0;
  }
}
