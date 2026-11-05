import type { NoArgsVoidFunction } from '@xaendar/types';
import { _SSR_MARKERS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { DeferBlock } from '../../types/defer-block.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { _Context } from '../context/context.util';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { armTriggers, toIdle } from '../hydration-triggers/hydration-triggers.util';

/**
 * Renders a `@defer` block: its `@placeholder`, if any, until the first of its triggers fires, then its content, once
 * the modules of the components only the content renders are loaded. Meanwhile the `@loading` is shown, if any; when the
 * modules fail to load, the `@error` is rendered with the error, or, without one, the error is logged and the
 * `@placeholder` rendered again. The content is rendered once: the triggers are disarmed when the first one fires, and the
 * `when` expression, read in an effect, fires once it is truthy.
 *
 * `visible` and `interaction` watch the elements the `@placeholder` renders where the block is: without any, the block
 * waits for the browser to be idle in their place.
 *
 * In a page rendered on the server, the server rendered only the `@placeholder`, which the block adopts, its listeners
 * bound, while the component holding it hydrates: the other parts are created once a trigger fires, which is always
 * after the hydration. Nothing happens once the context is destroyed.
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
  const disarms = new Array<NoArgsVoidFunction>();
  let active = true;
  let shown: _Context | undefined;

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
  const show = (render?: (strategy: NodeStrategy) => _Context) => untracked(() => {
    if (shown) {
      parentContext.removeChild(shown);
      shown.clear();
      shown = undefined;
    }

    if (render) {
      shown = parentContext.addChild(render(CREATE_NODES));
    }
  });

  const { placeholder, loading, error } = block;
  const showPlaceholder = placeholder && ((strategy: NodeStrategy) => placeholder(parentNode, parentContext, anchor, strategy));
  // The placeholder the server rendered is adopted
  if (showPlaceholder) {
    shown = parentContext.addChild(showPlaceholder(nodeStrategy.adopt(parentNode, nodeBlock, '')));
  }
  nodeStrategy.close(parentNode, nodeBlock);

  const showContent = () => show(strategy => block.content(parentNode, parentContext, anchor, strategy));
  let fired = false;
  const fire = () => {
    if (fired) {
      return;
    }

    fired = true;
    disarm();
    if (!block.load) {
      showContent();
      return;
    }

    if (loading) {
      show(strategy => loading(parentNode, parentContext, anchor, strategy));
    }

    block.load().then(() => active && showContent(), (failure: unknown) => {
      if (!active) {
        return;
      }

      if (error) {
        show(strategy => error(parentNode, parentContext, anchor, strategy, failure));
      } else {
        console.error(failure);
        show(showPlaceholder);
      }
    });
  };

  const elements = elementsOf(shown, parentNode);
  disarms.push(armTriggers(elements.length ? block.triggers : block.triggers.map(toIdle), elements, fire));
  if (block.when) {
    const when = block.when;
    // Fired once the effect has run: the effect is disposed by the trigger firing
    disarms.push(effect(() => {
      if (when()) {
        queueMicrotask(() => active && fire());
      }
    }));
  }
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
