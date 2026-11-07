import type { NoArgsVoidFunction } from '@xaendar/types';
import { _SSR_MARKERS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { DeferBlock } from '../../types/defer-block.type';
import type { DeferBlockFixture } from '../../types/defer-testing/defer-block-fixture.type';
import type { DeferBlockState } from '../../types/defer-testing/defer-block-state.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { Trigger } from '../../types/triggers/trigger.type';
import type { _Context } from '../context/context.util';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { registerDeferBlock } from '../defer-testing/defer-testing.util';
import { armTriggers, toIdle } from '../hydration-triggers/hydration-triggers.util';

/**
 * Renders a `@defer` block: its `@placeholder`, if any, until the first of its triggers fires, then its content, once
 * the modules of the components only the content renders are loaded. Meanwhile the `@loading` is shown, if any; when the
 * modules fail to load, the `@error` is rendered with the error, or, without one, the error is logged and the
 * `@placeholder` rendered again. The content is rendered once: the triggers are disarmed when the first one fires, and the
 * `when` expression, read in an effect, fires once it is truthy.
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
  const { anchor } = nodeBlock;
  const { placeholder, loading, error } = block;
  const disarms = new Array<NoArgsVoidFunction>();
  let active = true;
  let fired = false;
  let shown: _Context | undefined;
  let state: DeferBlockState = 'placeholder';
  let loaded: Promise<unknown> | undefined;

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

  // Replaces the part shown with another one, created, or with nothing
  const show = (next: DeferBlockState, render?: (strategy: NodeStrategy) => _Context) => untracked(() => {
    state = next;
    if (shown) {
      parentContext.removeChild(shown);
      shown.clear();
      shown = undefined;
    }

    if (render) {
      shown = parentContext.addChild(render(CREATE_NODES));
    }
  });

  const renderPlaceholder = placeholder && ((strategy: NodeStrategy) => placeholder(parentNode, parentContext, anchor, strategy));
  const renderLoading = loading && ((strategy: NodeStrategy) => loading(parentNode, parentContext, anchor, strategy));
  const renderContent = (strategy: NodeStrategy) => block.content(parentNode, parentContext, anchor, strategy);
  // The placeholder the server rendered is adopted
  if (renderPlaceholder) {
    shown = parentContext.addChild(renderPlaceholder(nodeStrategy.adopt(parentNode, nodeBlock, '')));
  }
  nodeStrategy.close(parentNode, nodeBlock);

  // When the placeholder has been shown for its minimum
  const placeholderEnd = performance.now() + (block.placeholderMinimum ?? 0);
  const load = () => loaded ??= block.load!();
  const prefetch = () => load().catch(() => undefined);

  // Runs a function once a time has come, while the block is rendered
  const at = (time: number, run: NoArgsVoidFunction) => {
    const left = time - performance.now();
    left > 0 ? setTimeout(() => active && run(), left) : run();
  };

  const fire = () => {
    if (fired) {
      return;
    }

    fired = true;
    disarm();
    if (!block.load) {
      at(placeholderEnd, () => show('complete', renderContent));
      return;
    }

    let settled = false;
    let loadingEnd = 0;
    if (renderLoading) {
      at(Math.max(placeholderEnd, performance.now() + (block.loadingAfter ?? 0)), () => {
        if (!settled) {
          show('loading', renderLoading);
          loadingEnd = performance.now() + (block.loadingMinimum ?? 0);
        }
      });
    }

    // The part following the placeholder and the @loading waits for them to be shown for their minimum
    const settle = (run: NoArgsVoidFunction) => {
      settled = true;
      if (active) {
        at(Math.max(placeholderEnd, loadingEnd), run);
      }
    };

    load().then(() => settle(() => show('complete', renderContent)), (failure: unknown) => settle(() => {
      if (error) {
        show('error', strategy => error(parentNode, parentContext, anchor, strategy, failure));
      } else {
        console.error(failure);
        show('placeholder', renderPlaceholder);
      }
    }));
  };

  const fixture: DeferBlockFixture = {
    get state() {
      return state;
    },
    render: async (next, failure) => {
      fired = true;
      disarm();
      switch (next) {
        case 'placeholder':
          show(next, required(renderPlaceholder, '@placeholder'));
          break;

        case 'loading':
          show(next, required(renderLoading, '@loading'));
          break;

        case 'error': {
          const renderError = required(error, '@error');
          show(next, strategy => renderError(parentNode, parentContext, anchor, strategy, failure));
          break;
        }

        default:
          if (block.load) {
            await load();
          }

          show(next, renderContent);
      }
    }
  };
  // The tests drive the block by hand
  if (registerDeferBlock(parentNode, parentContext, fixture)) {
    return;
  }

  const watched = (triggers: ReadonlyArray<Exclude<Trigger, 'never'>>, elements: readonly Element[]) => elements.length ? triggers : triggers.map(toIdle);
  queueMicrotask(() => {
    if (active && !fired) {
      const elements = elementsOf(shown, parentNode);
      disarms.push(armTriggers(watched(block.triggers, elements), elements, fire));
      if (block.prefetch) {
        disarms.push(armTriggers(watched(block.prefetch, elements), elements, prefetch));
      }
    }
  });

  if (block.when) {
    const when = block.when;
    // Fired once the effect has run: the effect is disposed by the trigger firing
    disarms.push(effect(() => {
      if (when()) {
        queueMicrotask(() => active && fire());
      }
    }));
  }

  if (block.prefetchWhen) {
    const prefetchWhen = block.prefetchWhen;
    disarms.push(effect(() => {
      if (prefetchWhen()) {
        queueMicrotask(() => active && !fired && prefetch());
      }
    }));
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
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && node.parentNode === parentNode) {
      elements.push(node as Element);
    }
  }

  const children = context.getChildren();
  for (let i = 0; i < children.length; i++) {
    elementsOf(children[i], parentNode, elements);
  }

  return elements;
}
