import { Function, NoArgsFunction } from '@xaendar/types';
import { effect, signal, untracked } from '../../signals';
import { IterationVariablesHandle } from '../../types/iteration-variables.type';
import { _Context, createAnchor } from '../context/context.util';

type ForKey = string | number;

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
 * @param forFn - Callback invocata per creare un nuovo item. Deve ritornare
 *   sia il Context che possiede i nodi, sia (opzionalmente) una funzione
 *   `update` per aggiornare le variabili implicite in-place quando l'item
 *   viene riusato a un indice diverso.
 */
export function _for(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, condition: NoArgsFunction<unknown[]>, trackExpression: Function<[unknown, number], ForKey>, forFn: Function<[HTMLElement, _Context, unknown[], number, Node | null], { context: _Context, update?: Function<[newIndex: number, items: unknown[]], void> }>) {
  const anchor = createAnchor('for', parentNode, parentContext, referenceNode);
  let entries = new Map<ForKey, ForEntry>();

  const unlistener = effect(() => {
    const items = condition();
    const newKeys = items.map((item, i) => trackExpression(item, i));
    const newKeySet = new Set(newKeys);

    untracked(() => {
      const newEntries = new Map<ForKey, ForEntry>();

      for (const [key, entry] of entries) {
        if (!newKeySet.has(key)) {
          entry.context.clear();
          parentContext.removeChild(entry.context);
        }
      }

      let nextReference: Node = anchor;

      for (let i = items.length - 1; i >= 0; i--) {
        const key = newKeys[i];
        const existing = entries.get(key);

        let entry: ForEntry;
        let nodes: Node[];

        if (existing) {
          nodes = getItemNodes(parentNode, existing.context);
          const lastNode = nodes[nodes.length - 1];
          if (lastNode?.nextSibling !== nextReference) {
            for (let i = 0; i < nodes.length; i++) {
              parentNode.insertBefore(nodes[i], nextReference);
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

        newEntries.set(key, entry);
        nextReference = nodes[0] ?? nextReference;
      }

      entries = newEntries;
    });
  });

  parentContext.addUnlistener(unlistener);
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
 * `item` is a plain value (identity-stable across moves thanks to the key),
 * while `$index`/`$first`/`$last`/`$even`/`$odd` are signals: when an item is
 * moved to a different position in the array, `update()` writes the new
 * values into these signals in place, instead of recreating the item's
 * template output. Anything bound to these variables re-runs reactively;
 * everything else in the item's subtree (state, subscriptions, pending
 * requests) is left completely untouched.
 *
 * @param items - The full array being iterated.
 * @param index - The current iteration index.
 * @param itemName - The identifier to reference the i-th item during iteration.
 * @param aliases - Aliases for implicit variables defined in the `@for` loop.
 * @returns A handle exposing the resolved variables and an `update` function.
 */
export function _iterationVariables(context: _Context, items: unknown[], index: number, itemName: string, aliases: { $index: string, $first: string, $last: string, $even: string, $odd: string }): IterationVariablesHandle {
  const $index = signal(index);
  const $first = signal(index === 0);
  const $last = signal(index === items.length - 1);
  const $even = signal(index % 2 === 0);
  const $odd = signal(index % 2 !== 0);

  const retVal = {
    vars: {
      [itemName]: items[index],
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
    }
  };

  const entries = Object.entries(retVal.vars);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    context.addIdentifier(key, value)
  }

  return retVal
}