import { Function, NoArgsFunction } from '@xaendar/types';
import { _SSR_MARKERS } from '../../costants';
import { signal, untracked, type Signal as SignalType } from '../../signals';
import { _bindEffect } from '../../signals/effect/effect';
import type { IterationVariable } from '../../types/iteration-variable.type';
import { IterationVariablesHandle } from '../../types/iteration-variables.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { _Context } from '../context/context.util';
import type { TrackExpression } from '../../types/track-expression.type';
import type { ForEntry } from '../../types/for-entry.type';
import type { ForRun } from '../../types/for-run.type';

/**
 * Every variable a `@for` can declare in its body, created when the compiled code does not list the ones its body reads.
 */
const ITERATION_VARIABLES: readonly IterationVariable[] = ['item', '$index', '$first', '$last', '$even', '$odd'];

/**
 * Reactively iterates over a list of items. Items are matched across re-runs
 * by the key produced by `trackExpression`:
 * - key sopravvive → il Context e l'intero sottoalbero (stato, subscription,
 *   richieste pendenti) vengono riusati SEMPRE, indipendentemente da un
 *   eventuale cambio di indice: si spostano solo i nodi DOM, e se il body usa
 *   $index/$first/$last/$even/$odd questi vengono aggiornati in-place tramite
 *   `update`, senza ricreare nulla.
 * - key sparita → il Context viene distrutto.
 * - key nuova → il Context viene creato.
 *
 * The first run renders the items in order, getting their nodes with the strategy of the context: in the hydration of a
 * component, the items the server rendered are adopted when it rendered the same keys in the same order, otherwise
 * the block is emptied, with a warning, and the items created. Every later run reads the strategy of the context again:
 * once the hydration ends, the one creating the nodes.
 *
 * @param parentNode - The parent HTML element the items are rendered into.
 * @param parentContext - The context owning the items.
 * @param referenceNode - The node to insert the items before, `null` to append them.
 * @param condition - Ritorna gli item da iterare: un array, oppure un numero
 *   `n` iterato come `0, 1, ..., n - 1`.
 * @param trackExpression - Ritorna la key di un item, ricevendo l'item, il suo indice e $first/$last/$even/$odd
 *   come funzioni che li leggono, come i signal del body.
 * @param forFn - Callback invocata per creare un nuovo item. Deve ritornare
 *   sia il Context che possiede i nodi, sia (opzionalmente) una funzione
 *   `update` per aggiornare le variabili implicite in-place quando l'item
 *   viene riusato a un indice diverso.
 */
export function _for(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, condition: NoArgsFunction<unknown[] | number>, trackExpression: TrackExpression, forFn: Function<[HTMLElement, _Context, unknown[], number, Node | null, NodeStrategy], ForEntry>) {
  const nodeBlock = parentContext.nodeStrategy.block(parentContext, parentNode, referenceNode, 'for', _SSR_MARKERS.for);
  const run: ForRun = { 
    parentNode, parentContext, 
    nodeBlock, 
    condition, 
    trackExpression, 
    forFn, 
    entries: null 
  };
  
  _bindEffect(parentContext, runFor, run);
}

/**
 * Reads the items of a `@for` and their keys, then renders them: the callback of the effect of {@link _for}, shared by
 * every `@for`. Only the items and the track expression are tracked.
 *
 * @param run - The `@for`.
 */
function runFor(run: ForRun): void {
  const { trackExpression } = run;
  const iterable = run.condition();
  const items = typeof iterable === 'number' ? Array.from({ length: iterable }, (_, i) => i) : iterable;
  // The track expression reads the item, the index and the implicit variables as the body does, by calling them
  const newKeys = items.map((item, i) => trackExpression(() => item, () => i, () => i === 0, () => i === items.length - 1, () => i % 2 === 0, () => i % 2 !== 0));
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
  const { parentNode, parentContext, nodeBlock, forFn } = run;
  const { nodeStrategy } = parentContext;
  const entries = new Map<string | number, ForEntry[]>();
  const itemNodeStrategy = nodeStrategy.adoptItems(parentNode, nodeBlock, newKeys);
  for (let i = 0; i < items.length; i++) {
    const key = newKeys[i];
    const created = forFn(parentNode, parentContext, items, i, nodeBlock.anchor, itemNodeStrategy);
    parentContext.addChild(created.context);
    const keyEntries = entries.get(key) ?? new Array<ForEntry>(occurrences.counts.get(key)!);
    keyEntries[occurrences.indexes[i]] = created;
    entries.set(key, keyEntries);
  }

  run.entries = entries;
  nodeStrategy.close(parentNode, nodeBlock);
}

/**
 * Renders the items of a later run, reusing the entries of the keys that survive: their nodes are moved, and their
 * implicit variables updated. The entries of the keys gone are destroyed, the ones of the new keys created.
 *
 * @param run - The `@for`, already rendered.
 * @param items - The items.
 * @param newKeys - The key of each item.
 * @param occurrences - The occurrences of the keys.
 */
function updateItems(run: ForRun, items: unknown[], newKeys: Array<string | number>, occurrences: ReturnType<typeof countOccurrences>): void {
  const { parentNode, parentContext, forFn } = run;
  const entries = run.entries!;
  const newEntries = new Map<string | number, ForEntry[]>();

  // The entries of the keys gone, and of the occurrences of a key beyond its new count, are destroyed
  for (const [key, keyEntries] of entries) {
    const kept = occurrences.counts.get(key) ?? 0;
    for (let i = kept; i < keyEntries.length; i++) {
      keyEntries[i].context.clear();
      parentContext.removeChild(keyEntries[i].context);
    }
  }

  let nextReference: Node = run.nodeBlock.anchor;

  for (let i = items.length - 1; i >= 0; i--) {
    const key = newKeys[i];
    const occurrence = occurrences.indexes[i];
    const existing = entries.get(key)?.[occurrence];

    let entry: ForEntry;
    let nodes: Node[];

    if (existing) {
      nodes = getItemNodes(parentNode, existing.context);
      const lastNode = nodes[nodes.length - 1];
      if (lastNode?.nextSibling !== nextReference) {
        /*
          moveBefore keeps the nodes in the document: the components of the row are not disconnected, so they
          keep their render, their state and their effects. insertBefore would destroy and render them again
        */
        for (let j = 0; j < nodes.length; j++) {
          parentNode.moveBefore(nodes[j], nextReference);
        }
      }
      existing.update?.(i, items);
      entry = existing;
    } else {
      const created = forFn(parentNode, parentContext, items, i, nextReference, parentContext.nodeStrategy);
      parentContext.addChild(created.context);
      nodes = getItemNodes(parentNode, created.context);
      entry = created;
    }

    const keyEntries = newEntries.get(key) ?? new Array<ForEntry>(occurrences.counts.get(key)!);
    keyEntries[occurrence] = entry;
    newEntries.set(key, keyEntries);
    nextReference = nodes[0] ?? nextReference;
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
 * Returns, in DOM order, the nodes an item renders directly into `parentNode`: not only the ones owned
 * by its context, but also the ones owned by its descendant contexts (e.g. the content of a nested
 * `@if`/`@for`, which lives before its anchor). An item always occupies a contiguous range of
 * `parentNode`, so the nodes are the ones going from the first to the last of them.
 *
 * @param parentNode - The element the item is rendered into.
 * @param context - The context of the item.
 * @returns The nodes of the item, in DOM order, or an empty array if it does not render any.
 */
function getItemNodes(parentNode: Node, context: _Context): Node[] {
  const owned = new Array<Node>();
  collectNodes(parentNode, context, owned);

  if (!owned.length) {
    return owned;
  }

  let first = owned[0];
  let last = owned[0];
  for (let i = 1; i < owned.length; i++) {
    const node = owned[i];
    if (node.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) {
      first = node;
    } else if (node.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_PRECEDING) {
      last = node;
    }
  }

  const nodes = [first];
  for (let node = first; node !== last; node = node.nextSibling!) {
    nodes.push(node.nextSibling!);
  }

  return nodes;
}

/**
 * Collects the nodes owned by `context` and by its descendants that are rendered into `parentNode`.
 * Since all the nodes of a context are rendered into the same element, a context whose nodes are
 * rendered elsewhere (e.g. the children of an element) is skipped along with its descendants:
 * their nodes are moved together with the element containing them.
 *
 * @param parentNode - The element the nodes have to be rendered into.
 * @param context - The context to collect the nodes from.
 * @param nodes - The array the collected nodes are pushed into.
 */
function collectNodes(parentNode: Node, context: _Context, nodes: Node[]): void {
  const owned = context.getNodes();
  if (owned?.length) {
    if (owned[0].parentNode !== parentNode) {
      return;
    }

    nodes.push(...owned);
  }

  const children = context.getChildren();
  if (children?.length) {
    for (let i = 0; i < children.length; i++) {
      collectNodes(parentNode, children[i], nodes);
    }
  }
}

/**
 * Builds a record of iteration context variables for a given index in the loop.
 * The item and `$index`/`$first`/`$last`/`$even`/`$odd` are signals: when a row is
 * reused, for an item moved to a different position in the array or for a new item
 * with the same key, `update()` writes the new values into these signals in place,
 * instead of recreating the item's template output. Anything bound to these variables
 * re-runs reactively; everything else in the item's subtree (state, subscriptions,
 * pending requests) is left completely untouched.
 *
 * Only the variables in `used` are created, the ones the body of the `@for` reads: a signal per variable and per item
 * is what a large table pays for the variables its body never reads.
 *
 * @param context - The context of the body of the item, which the variables are declared in.
 * @param items - The full array being iterated.
 * @param index - The current iteration index.
 * @param itemName - The identifier to reference the i-th item during iteration, `undefined` when the `@for` declares none.
 * @param aliases - Aliases for implicit variables defined in the `@for` loop.
 * @param used - The variables to create, the ones the body reads: every one of them when omitted. The item is created
 *   only with an `itemName`.
 * @returns A handle exposing the resolved variables and an `update` function, which updates the variables created.
 */
export function _iterationVariables(context: _Context, items: unknown[], index: number, itemName: string | undefined, aliases: Readonly<Record<Exclude<IterationVariable, 'item'>, string>>, used: readonly IterationVariable[] = ITERATION_VARIABLES): IterationVariablesHandle {
  const vars: Record<string, SignalType<unknown>> = {};
  for (let i = 0; i < used.length; i++) {
    const variable = used[i];
    const name = variable === 'item' ? itemName : aliases[variable];
    if (name !== undefined) {
      const state = signal(iterationValue(variable, items, index));
      vars[name] = state;
      context.addIdentifier(name, state);
    }
  }

  return {
    vars,
    update(newIndex: number, newItems: unknown[]) {
      for (let i = 0; i < used.length; i++) {
        const variable = used[i];
        const name = variable === 'item' ? itemName : aliases[variable];
        if (name !== undefined) {
          vars[name].set(iterationValue(variable, newItems, newIndex));
        }
      }
    }
  };
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