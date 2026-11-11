import type { NoArgsVoidFunction } from '@xaendar/types';
import { _SSR_MARKERS } from '../../costants';
import { _bindEffect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { HydrateBlock } from '../../types/hydrate-block.type';
import type { HydrateRun } from '../../types/hydrate-run.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { ClaimNodes } from '../claim-nodes/claim-nodes.util';
import type { _Context } from '../context/context.util';
import { armTriggers, disarmAll, recordEvents, replayEvents, watchedTriggers } from '../hydration-triggers/hydration-triggers.util';
import { trackNode } from '../track-node/track-node.util';

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
 * `visible`, `interaction` and `hover` watch the elements of the content: content the server rendered without elements
 * waits for the browser to be idle in their place. The `when` expression is read by a binding (see `_bindEffect`), and
 * fires once it is truthy. The triggers following `prefetch`, and the expression of the `when` following it, load the modules of the
 * content without hydrating it: the trigger hydrating it waits for the same load. With `never`, the content stays the
 * HTML of the server for good: no event is recorded and no module is loaded.
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
  const nodeBlock = nodeStrategy.block(parentContext, parentNode, referenceNode, 'hydrate', _SSR_MARKERS.hydrate, block.last);
  const run: HydrateRun = {
    parentNode,
    parentContext,
    nodeBlock,
    block,
    disarms: [],
    serverNodes: [],
    active: true,
    fired: false,
    hydrated: false,
    interaction: false,
    prefetchInteraction: false
  };

  parentContext.addUnlistener(() => {
    run.active = false;
    disarmAll(run.disarms);
  });

  if (nodeBlock.marker === undefined) {
    load(run, () => show(run, nodeStrategy.adopt(parentNode, nodeBlock, '')));
    return;
  }

  /*
    The nodes the server rendered stay, owned by the context until the content adopts them, which removes them as its
    own: in an element, by the element
  */
  const serverNodes = run.serverNodes = nodeStrategy.skip(parentNode, nodeBlock);
  for (let i = 0; i < serverNodes.length; i++) {
    trackNode(serverNodes[i], parentNode, parentContext);
  }

  // Recording its events would stop them for good: the content stays plain HTML, and its modules are never loaded
  if (block.triggers.includes('never')) {
    return;
  }

  const elements = elementsOf(serverNodes);
  const triggers = watchedTriggers(block.triggers, elements);
  const prefetch = block.prefetch && watchedTriggers(block.prefetch, elements);
  run.interaction = triggers.includes('interaction');
  run.prefetchInteraction = !!prefetch?.includes('interaction');

  // An interaction fires through the events recorded
  run.disarms.push(armTriggers(run.interaction ? triggers.filter(trigger => trigger !== 'interaction') : triggers, elements, () => fire(run), run.parentContext));
  if (prefetch) {
    run.disarms.push(armTriggers(run.prefetchInteraction ? prefetch.filter(trigger => trigger !== 'interaction') : prefetch, elements, () => prefetchModules(run), run.parentContext));
  }

  if (block.prefetchWhen) {
    _bindEffect(parentContext, checkPrefetchWhen, run, undefined, undefined, block.prefetchWhenReads);
  }

  if (block.when) {
    _bindEffect(parentContext, checkWhen, run, undefined, undefined, block.whenReads);
  }

  // Recorded until the content is hydrated, after its trigger fires too, while its modules load
  const recorded = triggers.length && elements.length ? recordEvents(elements, () => interact(run)) : undefined;
  if (recorded) {
    run.recorded = recorded;
    parentContext.addUnlistener(recorded.stop);
    // Fired once the block has been rendered: what the contract recorded was an interaction too
    if (recorded.events.length) {
      queueMicrotask(() => run.active && interact(run));
    }
  }
}


/**
 * Reads the `when` expression of a block, firing the block once it is truthy, once the binding has run: the callback of
 * the binding of the expression (see `_bindEffect`). Once the block has fired it reads nothing, so it never runs again.
 *
 * @param run - The block, whose `when` is defined.
 */
function checkWhen(run: HydrateRun): void {
  if (!run.fired && run.block.when!.call(run.parentContext.component, run.parentContext)) {
    queueMicrotask(() => run.active && fire(run));
  }
}

/**
 * Reads the `when` expression following the `prefetch` of a block, loading the modules of its content once it is
 * truthy: the callback of the binding of the expression (see `_bindEffect`). Once the block has fired it reads nothing,
 * so it never runs again.
 *
 * @param run - The block, whose `prefetchWhen` is defined.
 */
function checkPrefetchWhen(run: HydrateRun): void {
  if (!run.fired && run.block.prefetchWhen!.call(run.parentContext.component, run.parentContext)) {
    queueMicrotask(() => run.active && !run.fired && prefetchModules(run));
  }
}

/**
 * Loads the modules of the content of a block, once, for the trigger hydrating it and the ones prefetching them.
 *
 * @param run - The block, whose `load` is defined.
 * @returns The load.
 */
function loadModules(run: HydrateRun): Promise<unknown> {
  return run.loaded ??= run.block.load!();
}

/**
 * Loads the modules of the content of a block without hydrating it: a failed prefetch is not reported, the trigger
 * hydrating the content logs its error.
 *
 * @param run - The block, whose `load` is defined.
 */
function prefetchModules(run: HydrateRun): void {
  loadModules(run).catch(() => undefined);
}

/**
 * Runs a task once the modules of the content of a block are loaded, while the block is rendered: when they fail to load,
 * the error is logged and `onError` runs.
 *
 * @param run - The block.
 * @param onLoad - The task.
 * @param onError - Runs when the modules fail to load.
 */
function load(run: HydrateRun, onLoad: NoArgsVoidFunction, onError?: NoArgsVoidFunction): void {
  if (!run.block.load) {
    onLoad();
    return;
  }

  loadModules(run).then(() => run.active && onLoad(), (error: unknown) => {
    if (run.active) {
      console.error(error);
      onError?.();
    }
  });
}

/**
 * Renders the content of a block, getting its nodes with a strategy.
 *
 * @param run - The block.
 * @param strategy - The node strategy.
 * @returns The context of the content.
 */
function show(run: HydrateRun, strategy: NodeStrategy): _Context {
  return untracked(() => run.parentContext.addChild(run.block.content(run.parentNode, run.parentContext, run.nodeBlock.anchor, strategy)));
}

/**
 * Hydrates the content of a block, once its modules are loaded: it adopts the nodes of the server, rendering again
 * without warnings what the state changed meanwhile, then the events recorded are replayed.
 *
 * @param run - The block.
 */
function fire(run: HydrateRun): void {
  if (run.fired) {
    return;
  }

  run.fired = true;
  disarmAll(run.disarms);
  load(run, () => adopt(run), () => run.recorded?.stop());
}

/**
 * Makes the content of a block adopt the nodes of the server, then replays the events recorded on them.
 *
 * @param run - The block.
 */
function adopt(run: HydrateRun): void {
  const { parentNode, parentContext, serverNodes, nodeBlock } = run;
  run.hydrated = true;
  for (let i = 0; i < serverNodes.length; i++) {
    parentContext.removeNode(serverNodes[i]);
  }

  const claim = new ClaimNodes(hostOf(parentNode), true);
  claim.startAt(parentNode, serverNodes[0] ?? nodeBlock.anchor);
  const content = show(run, claim);
  claim.close(parentNode, nodeBlock);
  // The hydration of the content is over: it gets its nodes as the component holding it does
  content.setNodeStrategy(parentContext.nodeStrategy);
  if (run.recorded) {
    replayEvents(run.recorded);
  }
}

/**
 * Handles an event on the content of a block: it fires `interaction`, the one following `prefetch` too.
 *
 * @param run - The block.
 */
function interact(run: HydrateRun): void {
  if (run.prefetchInteraction && !run.fired) {
    prefetchModules(run);
  }

  if (run.interaction) {
    fire(run);
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
