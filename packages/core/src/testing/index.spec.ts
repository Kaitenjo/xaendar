// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { NodeStrategy } from '../types/node-strategy.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context } = await import('../utils/context/context.util');
const { _renderElement } = await import('../utils/render-element/render-element.util');
const { _defer } = await import('../utils/defer/defer.util');
const { getDeferBlocks, setDeferBlockBehavior } = await import('./index');

type Context = InstanceType<typeof _Context>;

/**
 * A part rendering an element through the strategy it receives.
 */
const part = (tagName: string) => (parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = new _Context(parentContext, nodeStrategy);
  _renderElement(parentNode, context, anchor as Comment | null, { tagName });
  return context;
};

/**
 * Renders a block in the shadow root of a host, returning the host.
 */
const host = () => {
  const element = document.body.appendChild(document.createElement('x-host'));
  const shadowRoot = element.attachShadow({ mode: 'open' });
  _defer(shadowRoot as unknown as HTMLElement, new _Context({ createElement: (tag: string) => document.createElement(tag) } as never), null, { triggers: ['interaction'], content: part('b'), placeholder: part('i') });
  return element;
};

describe('@xaendar/core/testing', () => {
  it('lets the tests find the blocks rendered once imported, which play through', () => {
    const [block] = getDeferBlocks(host());

    expect(block.state).toBe('placeholder');
  });

  it('lets the tests drive the blocks by hand', async () => {
    setDeferBlockBehavior('manual');
    const element = host();
    const [block] = getDeferBlocks(element);
    await block.render('complete');

    expect(element.shadowRoot!.innerHTML).toBe('<b></b><!--defer-->');
  });
});
