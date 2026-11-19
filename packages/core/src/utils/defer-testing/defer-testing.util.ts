import type { DeferBlockBehavior } from '../../types/defer-testing/defer-block-behavior.type';
import type { DeferBlockFixture } from '../../types/defer-testing/defer-block-fixture.type';
import type { _Context } from '../../types/context.type';
import { addCleanup } from '../context/context.util';

/**
 * How the `@defer` blocks behave in the tests, `undefined` outside of them: `@xaendar/core/testing` sets it once
 * imported, so that a page registers none of its blocks.
 */
let behavior: DeferBlockBehavior | undefined;

/**
 * The `@defer` blocks the tests can drive, by the root node they are rendered in, in the order they are rendered.
 */
const blocks = new WeakMap<Node, DeferBlockFixture[]>();

/**
 * Sets how the `@defer` blocks rendered from now on behave in the tests: `playthrough`, the default once
 * `@xaendar/core/testing` is imported, as in the browser, or `manual`, their triggers never armed, each part shown by
 * the `render` of the blocks {@link getDeferBlocks} finds. Call it before rendering the components to test.
 *
 * @example
 * setDeferBlockBehavior('manual');
 * const element = document.body.appendChild(document.createElement('blog-post'));
 * const [comments] = getDeferBlocks(element);
 * await comments.render('complete');
 *
 * @param value - The behavior.
 */
export function setDeferBlockBehavior(value: DeferBlockBehavior): void {
  behavior = value;
}

/**
 * Registers a `@defer` block in the tests, which find it by the component whose shadow root holds it, until its context
 * is destroyed. Does nothing outside of the tests.
 *
 * @param parentNode - The node the block is rendered into.
 * @param parentContext - The context owning the block.
 * @param fixture - Drives the block.
 * @returns `true` when the tests drive the blocks by hand, so that the triggers of the block are never armed.
 */
export function registerDeferBlock(parentNode: Node, parentContext: _Context, fixture: DeferBlockFixture): boolean {
  if (!behavior) {
    return false;
  }

  const root = parentNode.getRootNode();
  const registered = blocks.get(root);
  registered ? registered.push(fixture) : blocks.set(root, [fixture]);
  addCleanup(parentContext, () => {
    const list = blocks.get(root)!;
    list.splice(list.indexOf(fixture), 1);
  });

  return behavior === 'manual';
}

/**
 * Finds the `@defer` blocks a component renders in its shadow root, in the order they are rendered, the ones rendered by
 * the content of other blocks included once rendered, and the ones destroyed left out. Only the blocks rendered once
 * `@xaendar/core/testing` is imported are found.
 *
 * @param host - The element of the component.
 * @returns The blocks, each one with the part it shows and the function showing another one.
 */
export function getDeferBlocks(host: Element): DeferBlockFixture[] {
  const registered = host.shadowRoot && blocks.get(host.shadowRoot);
  return registered ? Array.from(registered) : [];
}