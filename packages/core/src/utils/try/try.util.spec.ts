// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { TryBlock } from '../../types/try-block.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { effect, signal } = await import('../../signals');
const { ClaimNodes } = await import('../claim-nodes/claim-nodes.util');
const { _Context } = await import('../context/context.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { trackNode } = await import('../track-node/track-node.util');
const { connectChild, runConnection } = await import('../try-scope/try-scope.util');
const { _try } = await import('./try.util');

/**
 * The type of a runtime context.
 */
type Context = InstanceType<typeof _Context>;

const createRoot = (nodeStrategy?: NodeStrategy) => new _Context({ createElement: (tag: string) => document.createElement(tag) } as never, nodeStrategy);

/**
 * Renders an element in a context of its own, as the generated code does.
 */
const renderElement = (parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy, tagName: string) => {
  const context = new _Context(parentContext, nodeStrategy);
  const element = nodeStrategy.element(context, parentNode, tagName);
  trackNode(element, parentNode, context);
  nodeStrategy.mount(element, parentNode, anchor);
  return context;
};

/**
 * A content rendering an element, then throwing what is given, if anything.
 */
const content = (tagName: string, ...thrown: [error?: unknown]) => vi.fn<TryBlock['content']>((parentNode, parentContext, anchor, nodeStrategy) => {
  const context = renderElement(parentNode, parentContext, anchor, nodeStrategy, tagName);
  if (thrown.length) {
    throw thrown[0];
  }

  return context;
});

/**
 * A @catch rendering an element.
 */
const fallback = (tagName: string) => vi.fn<TryBlock['catch']>((parentNode, parentContext, anchor, nodeStrategy) => renderElement(parentNode, parentContext, anchor, nodeStrategy, tagName));

/**
 * A parent holding the HTML of the server.
 */
const parse = (html: string) => {
  const parent = document.createElement('div');
  parent.innerHTML = html;
  return parent;
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('_try', () => {
  describe('in a page rendered in the browser', () => {
    it('renders the content before its anchor, leaving the @catch alone', () => {
      const parent = document.createElement('div');
      const root = createRoot();
      const render = content('b');
      const rescue = fallback('i');

      _try(parent, root, null, { content: render, catch: rescue });

      expect(parent.innerHTML).toBe('<b></b><!--try-->');
      expect(render.mock.calls[0][3]).toBe(CREATE_NODES);
      expect(rescue).not.toHaveBeenCalled();
      root.clear();
      expect(parent.innerHTML).toBe('');
    });

    it('renders the @catch with the error when the content throws, removing what the content rendered and stopping its effects', () => {
      const parent = document.createElement('div');
      const root = createRoot();
      const failure = new Error('broken');
      const count = signal(0);
      const reads = vi.fn();
      const rescue = fallback('i');

      _try(parent, root, null, {
        content: (parentNode, parentContext, anchor, nodeStrategy) => {
          const context = renderElement(parentNode, parentContext, anchor, nodeStrategy, 'b');
          // A nested scope, never registered in its parent, since the content throws before returning
          const nested = renderElement(parentNode, context, anchor, nodeStrategy, 'u');
          nested.addUnlistener(effect(() => reads(count())));
          throw failure;
        },
        catch: rescue
      });

      expect(parent.innerHTML).toBe('<i></i><!--try-->');
      expect(rescue.mock.calls[0][3]).toBe(CREATE_NODES);
      expect(rescue.mock.calls[0][4]).toBe(failure);

      count.set(1);
      expect(reads).toHaveBeenCalledOnce();
      root.clear();
      expect(parent.innerHTML).toBe('');
    });

    it('catches any value thrown, undefined included', () => {
      const parent = document.createElement('div');
      const rescue = fallback('i');

      _try(parent, createRoot(), null, { content: content('b', undefined), catch: rescue });
      _try(parent, createRoot(), null, { content: () => { throw 'text'; }, catch: rescue });

      expect(rescue.mock.calls.map(call => call[4])).toEqual([undefined, 'text']);
    });

    it('lets the error of the @catch through to what holds the block', () => {
      const failure = new Error('catch');

      expect(() => _try(document.createElement('div'), createRoot(), null, { content: content('b', new Error('content')), catch: () => { throw failure; } })).toThrow(failure);
    });

    it('catches the error of the connection of a component the content mounts, which the browser would report', () => {
      const parent = document.body.appendChild(document.createElement('div'));
      const failure = new Error('child');
      const rescue = fallback('i');
      customElements.define('x-failing-child', class extends HTMLElement {
        public connectedCallback(): void {
          runConnection(() => {
            throw failure;
          });
        }
      });

      _try(parent, createRoot(), null, {
        content: (parentNode, parentContext, anchor) => {
          const context = new _Context(parentContext);
          const element = document.createElement('x-failing-child');
          trackNode(element, parentNode, context);
          connectChild(() => parentNode.insertBefore(element, anchor));
          return context;
        },
        catch: rescue
      });

      expect(rescue.mock.calls[0][4]).toBe(failure);
      expect(parent.innerHTML).toBe('<i></i><!--try-->');
      parent.remove();
    });

    it('disposes the contexts the content created in creation order, so that a component is removed before its own contexts are disposed', () => {
      const parent = document.createElement('div');
      const order = new Array<string>();

      _try(parent, createRoot(), null, {
        content: (_parentNode, parentContext) => {
          const context = new _Context(parentContext);
          context.addUnlistener(() => order.push('content'));
          // The root context of the render of a component, which has no parent among the contexts of the content
          new _Context({} as never).addUnlistener(() => order.push('component'));
          throw new Error('broken');
        },
        catch: fallback('i')
      });

      expect(order).toEqual(['content', 'component']);
    });

    it('lets an inner @try catch first, and an outer one dispose what the inner one rendered when its @catch throws', () => {
      const parent = document.createElement('div');
      const outerRescue = fallback('s');

      _try(parent, createRoot(), null, {
        content: (parentNode, parentContext, anchor, nodeStrategy) => {
          const context = renderElement(parentNode, parentContext, anchor, nodeStrategy, 'b');
          _try(parentNode, context, anchor as Comment | null, { content: content('u', new Error('inner')), catch: () => { throw new Error('rethrown'); } });
          return context;
        },
        catch: outerRescue
      });

      expect(parent.innerHTML).toBe('<s></s><!--try-->');
      expect((outerRescue.mock.calls[0][4] as Error).message).toBe('rethrown');
    });
  });

  describe('in a page rendered on the server', () => {
    it('adopts the content the server rendered, and what follows the block', () => {
      const parent = parse('<!--xd-t:0--><b></b><!--/xd-t--><p></p>');
      const [b, p] = Array.from(parent.children);
      const strategy = new ClaimNodes('x-host');
      const context = createRoot(strategy);
      const render = content('b');

      _try(parent, context, null, { content: render, catch: fallback('i') });

      expect(render.mock.calls[0][3]).toBe(strategy);
      expect(parent.firstElementChild).toBe(b);
      expect(strategy.element(context, parent, 'p')).toBe(p);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('removes the rest of the content of the server when the browser throws, with a warning, and creates the @catch', () => {
      const parent = parse('<!--xd-t:0--><b></b><em></em><!--/xd-t--><p></p>');
      const p = parent.lastElementChild!;
      const strategy = new ClaimNodes('x-host');
      const context = createRoot(strategy);
      const rescue = fallback('i');

      _try(parent, context, null, { content: content('b', new Error('browser')), catch: rescue });

      expect(parent.innerHTML).toBe('<i></i><!--/xd-t--><p></p>');
      expect(rescue.mock.calls[0][3]).toBe(CREATE_NODES);
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <!--xd-t:0--> where the browser renders <!--xd-t:1-->, which it renders again');
      expect(strategy.element(context, parent, 'p')).toBe(p);
    });

    it('removes the @catch of the server without warnings, renders the content from scratch, and creates the @catch again when it throws', () => {
      const parent = parse('<!--xd-t:1--><i>server</i><!--/xd-t--><p></p>');
      const p = parent.lastElementChild!;
      const strategy = new ClaimNodes('x-host');
      const context = createRoot(strategy);
      const render = content('b');

      _try(parent, context, null, { content: render, catch: fallback('i') });

      expect(parent.innerHTML).toBe('<b></b><!--/xd-t--><p></p>');
      expect(render.mock.calls[0][3]).toBe(CREATE_NODES);

      const failing = parse('<!--xd-t:1--><i>server</i><!--/xd-t--><p></p>');
      const failingStrategy = new ClaimNodes('x-host');
      const rescue = fallback('i');
      _try(failing, createRoot(failingStrategy), null, { content: content('b', new Error('again')), catch: rescue });

      expect(failing.innerHTML).toBe('<i></i><!--/xd-t--><p></p>');
      expect(rescue.mock.calls[0][3]).toBe(CREATE_NODES);
      expect(console.warn).not.toHaveBeenCalled();
      expect(strategy.element(context, parent, 'p')).toBe(p);
    });
  });
});
