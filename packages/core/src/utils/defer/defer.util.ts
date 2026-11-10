import type { NoArgsVoidFunction } from '@xaendar/types';
import { _SSR_MARKERS } from '../../costants';
import { _bindEffect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { DeferBlock } from '../../types/defer-block.type';
import type { DeferBlockFixture } from '../../types/defer-testing/defer-block-fixture.type';
import type { DeferBlockState } from '../../types/defer-testing/defer-block-state.type';
import type { DeferRun } from '../../types/defer-run.type';
import type { _Context } from '../context/context.util';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { registerDeferBlock } from '../defer-testing/defer-testing.util';
import { armTriggers, disarmAll, watchedTriggers } from '../hydration-triggers/hydration-triggers.util';

/**
 * Renders a `@defer` block: its `@placeholder`, if any, until the first of its triggers fires, then its content, once
 * the modules of the components only the content renders are loaded. Meanwhile the `@loading` is shown, if any; when the
 * modules fail to load, the `@error` is rendered with the error, or, without one, the error is logged and the
 * `@placeholder` rendered again. The content is rendered once: the triggers are disarmed when the first one fires, and the
 * `when` expression, read by a binding (see `_bindEffect`), fires once it is truthy.
 *
 * The triggers following `prefetch`, and the expression of the `when` following it, load the modules without rendering
 * the content: the trigger rendering it waits for the same load. The `@placeholder` is shown at least for its `minimum`,
 * from when it is rendered. The `@loading` is shown once the modules have loaded for its `after`, and the `@placeholder`
 * has been shown for its `minimum`: it is never shown when they load sooner. Once shown, it stays at least for its own
 * `minimum`.
 *
 * The triggers are armed once the template holding the block is rendered, so that the element refs they name are
 * initialized, the ones of the elements following the block too. `visible`, `interaction` and `hover` watch the element
 * they name, or the elements the `@placeholder` renders where the block is: without any, the block waits for the
 * browser to be idle in their place.
 *
 * In a page rendered on the server, the server rendered only the `@placeholder`, which the block adopts, its listeners
 * bound, while the component holding it hydrates: the other parts are created once a trigger fires, which is always
 * after the hydration. Nothing happens once the context is destroyed. In the tests, the block can be driven by hand
 * (see `registerDeferBlock`).
 *
 * @param parentNode - The parent HTML element the block is rendered into.
 * @param parentContext - The context owning the block.
 * @param referenceNode - The node to insert the block before, `null` to append it.
 * @param block - The triggers, the content and the blocks following it.
 */
export function _defer(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, block: DeferBlock): void {
  const { nodeStrategy } = parentContext;
  const nodeBlock = nodeStrategy.block(parentContext, parentNode, referenceNode, 'defer', _SSR_MARKERS.defer);
  const run: DeferRun = {
    parentNode,
    parentContext,
    anchor: nodeBlock.anchor,
    block,
    disarms: [],
    placeholderEnd: 0,
    loadingEnd: 0,
    active: true,
    fired: false,
    settled: false,
    state: 'placeholder'
  };

  parentContext.addUnlistener(() => {
    run.active = false;
    disarmAll(run.disarms);
  });

  // The placeholder the server rendered is adopted
  if (block.placeholder) {
    run.shown = parentContext.addChild(block.placeholder(parentNode, parentContext, run.anchor, nodeStrategy.adopt(parentNode, nodeBlock, '')));
  }
  nodeStrategy.close(parentNode, nodeBlock);
  run.placeholderEnd = performance.now() + (block.placeholderMinimum ?? 0);

  const fixture: DeferBlockFixture = {
    get state() {
      return run.state;
    },
    render: (next, failure) => renderByHand(run, next, failure)
  };
  
  // The tests drive the block by hand
  if (registerDeferBlock(parentNode, parentContext, fixture)) {
    return;
  }

  queueMicrotask(() => {
    if (run.active && !run.fired) {
      const elements = elementsOf(run.shown, parentNode);
      run.disarms.push(armTriggers(watchedTriggers(block.triggers, elements), elements, () => fire(run)));
      if (block.prefetch) {
        run.disarms.push(armTriggers(watchedTriggers(block.prefetch, elements), elements, () => prefetch(run)));
      }
    }
  });

  if (block.when) {
    _bindEffect(parentContext, checkWhen, run, undefined, undefined, block.whenReads);
  }

  if (block.prefetchWhen) {
    _bindEffect(parentContext, checkPrefetchWhen, run, undefined, undefined, block.prefetchWhenReads);
  }
}

/**
 * Reads the `when` expression of a block, firing the block once it is truthy, once the binding has run: the callback of
 * the binding of the expression (see `_bindEffect`). Once the block has fired it reads nothing, so it never runs again.
 *
 * @param run - The block, whose `when` is defined.
 */
function checkWhen(run: DeferRun): void {
  if (!run.fired && run.block.when!()) {
    queueMicrotask(() => run.active && fire(run));
  }
}

/**
 * Reads the `when` expression following the `prefetch` of a block, loading its modules once it is truthy: the callback
 * of the binding of the expression (see `_bindEffect`). Once the block has fired it reads nothing, so it never runs
 * again.
 *
 * @param run - The block, whose `prefetchWhen` is defined.
 */
function checkPrefetchWhen(run: DeferRun): void {
  if (!run.fired && run.block.prefetchWhen!()) {
    queueMicrotask(() => run.active && !run.fired && prefetch(run));
  }
}


/**
 * Replaces the part of a block shown with another one, created, or with nothing.
 *
 * @param run - The block.
 * @param next - The part to show.
 * @param part - Renders the part, `undefined` to show nothing.
 * @param failure - The error the modules failed to load with, for the `@error`.
 */
function show(run: DeferRun, next: DeferBlockState, part?: DeferBlock['error'], failure?: unknown): void {
  untracked(() => {
    run.state = next;
    if (run.shown) {
      run.parentContext.removeChild(run.shown);
      run.shown.clear();
      run.shown = undefined;
    }

    if (part) {
      run.shown = run.parentContext.addChild(part(run.parentNode, run.parentContext, run.anchor, CREATE_NODES, failure));
    }
  });
}

/**
 * Loads the modules of the content of a block, once.
 *
 * @param run - The block, whose `load` is defined.
 * @returns The load.
 */
function load(run: DeferRun): Promise<unknown> {
  return run.loaded ??= run.block.load!();
}

/**
 * Loads the modules of the content of a block without rendering it, silent when they fail to load.
 *
 * @param run - The block, whose `load` is defined.
 * @returns The load, never rejected.
 */
async function prefetch(run: DeferRun): Promise<unknown> {
  return load(run).catch(() => undefined);
}

/**
 * Runs a task once a time has come, while the block is rendered.
 *
 * @param run - The block.
 * @param time - The time, as `performance.now()` measures it.
 * @param task - The task.
 */
function at(run: DeferRun, time: number, task: NoArgsVoidFunction): void {
  const left = time - performance.now();
  left > 0 ? setTimeout(() => run.active && task(), left) : task();
}

/**
 * Renders the content of a block, once a trigger fires: the `@loading` while its modules load, then the content, or the
 * `@error`.
 *
 * @param run - The block.
 */
function fire(run: DeferRun): void {
  if (run.fired) {
    return;
  }

  run.fired = true;
  disarmAll(run.disarms);
  const { block } = run;
  if (!block.load) {
    at(run, run.placeholderEnd, () => show(run, 'complete', block.content));
    return;
  }

  if (block.loading) {
    at(run, Math.max(run.placeholderEnd, performance.now() + (block.loadingAfter ?? 0)), () => showLoading(run));
  }

  load(run).then(() => settle(run, () => show(run, 'complete', block.content)), (failure: unknown) => settle(run, () => fail(run, failure)));
}

/**
 * Shows the `@loading` of a block, unless its modules have already loaded.
 *
 * @param run - The block, which declares a `@loading`.
 */
function showLoading(run: DeferRun): void {
  if (!run.settled) {
    show(run, 'loading', run.block.loading);
    run.loadingEnd = performance.now() + (run.block.loadingMinimum ?? 0);
  }
}

/**
 * Runs the task following the load of the modules of a block, once the `@placeholder` and the `@loading` have been
 * shown for their minimum.
 *
 * @param run - The block.
 * @param task - The task.
 */
function settle(run: DeferRun, task: NoArgsVoidFunction): void {
  run.settled = true;
  if (run.active) {
    at(run, Math.max(run.placeholderEnd, run.loadingEnd), task);
  }
}

/**
 * Shows the `@error` of a block whose modules failed to load, or, without one, logs the error and shows the
 * `@placeholder` again.
 *
 * @param run - The block.
 * @param failure - The error the modules failed to load with.
 */
function fail(run: DeferRun, failure: unknown): void {
  const { error, placeholder } = run.block;
  if (error) {
    show(run, 'error', error, failure);
  } else {
    console.error(failure);
    show(run, 'placeholder', placeholder);
  }
}

/**
 * Shows a part of a block a test asks for, disarming its triggers: the content once its modules are loaded.
 *
 * @param run - The block.
 * @param next - The part to show.
 * @param failure - The error the `@error` is rendered with.
 * @throws When the block does not declare the part.
 */
async function renderByHand(run: DeferRun, next: DeferBlockState, failure: unknown): Promise<void> {
  run.fired = true;
  disarmAll(run.disarms);
  const { block } = run;
  switch (next) {
    case 'placeholder':
      show(run, next, required(block.placeholder, '@placeholder'));
      break;

    case 'loading':
      show(run, next, required(block.loading, '@loading'));
      break;

    case 'error':
      show(run, next, required(block.error, '@error'), failure);
      break;

    default:
      if (block.load) {
        await load(run);
      }

      show(run, next, block.content);
  }
}


/**
 * Returns a part of a block a test shows, throwing when the block does not declare it.
 *
 * @param part - The part, `undefined` when the block does not declare it.
 * @param keyword - The keyword of the part, named by the error.
 * @returns The part.
 * @throws When the block does not declare the part.
 */
function required<TPart>(part: TPart | undefined, keyword: string): TPart {
  if (!part) {
    throw new Error(`The @defer declares no ${keyword} to render`);
  }

  return part;
}

/**
 * Returns the elements a part of a block renders where the block is: the ones the context of the part, or a context it
 * holds, renders into the node of the block.
 *
 * @param context - The context of the part, `undefined` when no part is rendered.
 * @param parentNode - The node the block is rendered into.
 * @param elements - The elements, filled as they are found.
 * @returns The elements.
 */
function elementsOf(context: _Context | undefined, parentNode: Node, elements = new Array<Element>()): Element[] {
  if (!context) {
    return elements;
  }

  const nodes = context.getNodes();
  if (nodes?.length) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && node.parentNode === parentNode) {
        elements.push(node as Element);
      }
    }
  }

  const children = context.getChildren();
  if (children?.length) {
    for (let i = 0; i < children.length; i++) {
      elementsOf(children[i], parentNode, elements);
    }
  }

  return elements;
}
