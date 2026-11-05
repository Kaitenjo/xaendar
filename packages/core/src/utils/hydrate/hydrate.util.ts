import type { NoArgsVoidFunction } from '@xaendar/types';
import { _SSR_MARKERS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { HydrateBlock } from '../../types/hydrate-block.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { ClaimNodes } from '../claim-nodes/claim-nodes.util';
import type { _Context } from '../context/context.util';
import { armTriggers, recordEvents, replayEvents, toIdle } from '../hydration-triggers/hydration-triggers.util';

/**
 * Renders a `@hydrate` block, whose content the server rendered waits for the first of its triggers to hydrate.
 *
 * In a page rendered on the server, the content stays as the server rendered it, inert, while the component holding it
 * hydrates: its nodes are owned by the context, which removes them, and moves them with the row of a `@for`. The events
 * on it are recorded, unless only `when` triggers it. Once a trigger fires and the modules of the components only the
 * content renders are loaded, the content adopts its nodes, the components it holds hydrate whatever their
 * `@WebComponent` declares, and the events are replayed. What the state changed meanwhile is rendered again, without
 * warnings. When the modules fail to load, the error is logged and the content stays inert.
 *
 * `visible` and `interaction` watch the elements of the content: content the server rendered without elements waits for
 * the browser to be idle in their place. The `when` expression is read in an effect, and fires once it is truthy. With
 * `never`, the content stays the HTML of the server for good: no event is recorded and no module is loaded.
 *
 * In a page rendered in the browser, the block is as if it were not there: the content is rendered as soon as its
 * modules are loaded, whatever its triggers. Nothing happens once the context is destroyed.
 *
 * @param parentNode - The parent HTML element the block is rendered into.
 * @param parentContext - The context owning the block.
 * @param referenceNode - The node to insert the block before, `null` to append it.
 * @param block - The triggers and the content.
 */
export function _hydrate(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, block: HydrateBlock): void {
  const { nodeStrategy } = parentContext;
  const nodeBlock = nodeStrategy.block(parentContext, parentNode, referenceNode, 'hydrate', _SSR_MARKERS.hydrate);
  const disarms = new Array<NoArgsVoidFunction>();
  let active = true;

  const disarm = () => {
    for (let i = 0; i < disarms.length; i++) {
      disarms[i]();
    }
    disarms.length = 0;
  };
  parentContext.addUnlistener(() => {
    active = false;
    disarm();
  });

  // Runs `onLoad` once the modules of the content are loaded: when they fail to load, the error is logged and `onError` runs
  const load = (onLoad: NoArgsVoidFunction, onError?: NoArgsVoidFunction) => {
    if (!block.load) {
      onLoad();
      return;
    }

    block.load().then(() => active && onLoad(), (error: unknown) => {
      if (active) {
        console.error(error);
        onError?.();
      }
    });
  };

  // Renders the content, getting its nodes with a strategy
  const show = (strategy: NodeStrategy) => untracked(() => parentContext.addChild(block.content(parentNode, parentContext, nodeBlock.anchor, strategy)));

  if (nodeBlock.marker === undefined) {
    load(() => show(nodeStrategy.adopt(parentNode, nodeBlock, '')));
    return;
  }

  // The nodes the server rendered stay, owned by the context until the content adopts them
  const serverNodes = nodeStrategy.skip(parentNode, nodeBlock);
  let hydrated = false;
  for (let i = 0; i < serverNodes.length; i++) {
    parentContext.addNode(serverNodes[i]);
  }

  parentContext.addUnlistener(() => {
    let i = 0;
    while (!hydrated && i < serverNodes.length) {
      parentContext.removeNode(serverNodes[i]);
      serverNodes[i].parentNode?.removeChild(serverNodes[i]);
      i++;
    }
  });

  // Recording its events would stop them for good: the content stays plain HTML, and its modules are never loaded
  if (block.triggers.includes('never')) {
    return;
  }

  // Adopts the nodes of the server, rendering again without warnings what the state changed meanwhile, then replays the events
  const hydrate = () => load(() => {
    hydrated = true;
    for (let i = 0; i < serverNodes.length; i++) {
      parentContext.removeNode(serverNodes[i]);
    }

    const claim = new ClaimNodes(hostOf(parentNode), true);
    claim.startAt(parentNode, serverNodes[0] ?? nodeBlock.anchor);
    const content = show(claim);
    claim.close(parentNode, nodeBlock);
    // The hydration of the content is over: it gets its nodes as the component holding it does
    content.setNodeStrategy(parentContext.nodeStrategy);
    if (recorded) {
      replayEvents(recorded);
    }
  }, () => recorded?.stop());

  const elements = elementsOf(serverNodes);
  const triggers = elements.length ? block.triggers : block.triggers.map(toIdle);
  const interaction = triggers.includes('interaction');
  let fired = false;
  const fire = () => {
    if (!fired) {
      fired = true;
      disarm();
      hydrate();
    }
  };

  // An interaction fires through the events recorded
  disarms.push(armTriggers(interaction ? triggers.filter(trigger => trigger !== 'interaction') : triggers, elements, fire));
  if (block.when) {
    const when = block.when;
    // Fired once the effect has run: the effect is disposed by the trigger firing
    disarms.push(effect(() => {
      if (when()) {
        queueMicrotask(() => active && fire());
      }
    }));
  }

  // Recorded until the content is hydrated, after its trigger fires too, while its modules load
  const recorded = triggers.length && elements.length ? recordEvents(elements, () => interaction && fire()) : undefined;
  if (recorded) {
    parentContext.addUnlistener(recorded.stop);
    // Fired once the block has been rendered: what the contract recorded was an interaction too
    if (interaction && recorded.events.length) {
      queueMicrotask(() => active && fire());
    }
  }
}

/**
 * Returns the elements among some nodes.
 *
 * @param nodes - The nodes, if any.
 * @returns The elements.
 */
function elementsOf(nodes: readonly Node[]): Element[] {
  const elements = new Array<Element>();
  if (nodes.length) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeType === Node.ELEMENT_NODE) {
        elements.push(nodes[i] as Element);
      }
    }
  }

  return elements;
}

/**
 * Returns the tag name of the component whose shadow root holds a node, named by the warnings of the hydration.
 *
 * @param node - The node.
 * @returns The tag name.
 */
function hostOf(node: Node): string {
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host.localName : node.nodeName.toLowerCase();
}
