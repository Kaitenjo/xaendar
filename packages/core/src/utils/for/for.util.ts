import { Function, NoArgsFunction } from '@xaendar/types';
import { effect, signal, untracked } from '../../signals';
import { IterationVariablesHandle } from '../../types/iteration-variables.type';
import { _Context, createAnchor } from '../context/context.util';

/**
 * Computes the key of an item, receiving the item, its index and the implicit variables derived from them as functions
 * reading them, like the signals of the body read them.
 */
type TrackExpression = Function<[item: NoArgsFunction<unknown>, index: NoArgsFunction<number>, first: NoArgsFunction<boolean>, last: NoArgsFunction<boolean>, even: NoArgsFunction<boolean>, odd: NoArgsFunction<boolean>], string | number>;

type ForEntry = {
  context: _Context;
  update?: (newIndex: number, items: unknown[]) => void;
};

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
 * @param condition - Ritorna gli item da iterare: un array, oppure un numero
 *   `n` iterato come `0, 1, ..., n - 1`.
 * @param trackExpression - Ritorna la key di un item, ricevendo l'item, il suo indice e $first/$last/$even/$odd
 *   come funzioni che li leggono, come i signal del body.
 * @param forFn - Callback invocata per creare un nuovo item. Deve ritornare
 *   sia il Context che possiede i nodi, sia (opzionalmente) una funzione
 *   `update` per aggiornare le variabili implicite in-place quando l'item
 *   viene riusato a un indice diverso.
 */
export function _for(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, condition: NoArgsFunction<unknown[] | number>, trackExpression: TrackExpression, forFn: Function<[HTMLElement, _Context, unknown[], number, Node | null], { context: _Context, update?: Function<[newIndex: number, items: unknown[]], void> }>) {
  const anchor = createAnchor('for', parentNode, parentContext, referenceNode);
  // The entries of each key, in the order of the items: a key repeated in the items has an entry per occurrence
  let entries = new Map<string | number, ForEntry[]>();

  const unlistener = effect(() => {
    const iterable = condition();
    const items = typeof iterable === 'number' ? Array.from({ length: iterable }, (_, i) => i) : iterable;
    // The track expression reads the item, the index and the implicit variables as the body does, by calling them
    const newKeys = items.map((item, i) => trackExpression(() => item, () => i, () => i === 0, () => i === items.length - 1, () => i % 2 === 0, () => i % 2 !== 0));
    const occurrences = countOccurrences(newKeys);

    untracked(() => {
      const newEntries = new Map<string | number, ForEntry[]>();

      // The entries of the keys gone, and of the occurrences of a key beyond its new count, are destroyed
      for (const [key, keyEntries] of entries) {
        const kept = occurrences.counts.get(key) ?? 0;
        for (let i = kept; i < keyEntries.length; i++) {
          keyEntries[i].context.clear();
          parentContext.removeChild(keyEntries[i].context);
        }
      }

      let nextReference: Node = anchor;

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
            for (let i = 0; i < nodes.length; i++) {
              parentNode.moveBefore(nodes[i], nextReference);
            }
          }
          existing.update?.(i, items);
          entry = existing;
        } else {
          const created = forFn(parentNode, parentContext, items, i, nextReference);
          parentContext.addChild(created.context);
          nodes = getItemNodes(parentNode, created.context);
          entry = created;
        }

        const keyEntries = newEntries.get(key) ?? new Array<ForEntry>(occurrences.counts.get(key)!);
        keyEntries[occurrence] = entry;
        newEntries.set(key, keyEntries);
        nextReference = nodes[0] ?? nextReference;
      }

      entries = newEntries;
    });
  });

  parentContext.addUnlistener(unlistener);
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
  if (owned.length && owned[0].parentNode !== parentNode) {
    return;
  }

  nodes.push(...owned);
  const children = context.getChildren();
  for (let i = 0; i < children.length; i++) {
    collectNodes(parentNode, children[i], nodes);
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
 * @param items - The full array being iterated.
 * @param index - The current iteration index.
 * @param itemName - The identifier to reference the i-th item during iteration, `undefined` when the `@for` declares none.
 * @param aliases - Aliases for implicit variables defined in the `@for` loop.
 * @returns A handle exposing the resolved variables and an `update` function.
 */
export function _iterationVariables(context: _Context, items: unknown[], index: number, itemName: string | undefined, aliases: { $index: string, $first: string, $last: string, $even: string, $odd: string }): IterationVariablesHandle {
  const $index = signal(index);
  const $first = signal(index === 0);
  const $last = signal(index === items.length - 1);
  const $even = signal(index % 2 === 0);
  const $odd = signal(index % 2 !== 0);
  const item = signal(items[index]);

  const retVal: IterationVariablesHandle = {
    vars: {
      [aliases.$index]: $index,
      [aliases.$first]: $first,
      [aliases.$last]: $last,
      [aliases.$even]: $even,
      [aliases.$odd]: $odd,
    },
    update(newIndex: number, newItems: unknown[]) {
      $index.set(newIndex);
      $first.set(newIndex === 0);
      $last.set(newIndex === newItems.length - 1);
      $even.set(newIndex % 2 === 0);
      $odd.set(newIndex % 2 !== 0);
      item.set(newItems[newIndex]);
    }
  };

  if (itemName !== undefined) {
    retVal.vars[itemName] = item;
  }

  const entries = Object.entries(retVal.vars);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    context.addIdentifier(key, value)
  }

  return retVal
}