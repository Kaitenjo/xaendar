// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RenderElementEvent } from '../../types/render-element-event.type';
import type { NodeStrategy } from '../../types/node-strategy.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context } = await import('../context/context.util');
const { ClaimNodes } = await import('../claim-nodes/claim-nodes.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _renderElement } = await import('../render-element/render-element.util');
const { _hydrate } = await import('./hydrate.util');
const { signal } = await import('../../signals');

type Context = InstanceType<typeof _Context>;

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

const createRoot = (nodeStrategy?: NodeStrategy) => new _Context({ createElement: (tag: string) => document.createElement(tag) } as never, nodeStrategy);

/**
 * A block rendering an element, with its listeners, through the strategy it receives.
 */
const block = (tagName: string, events: RenderElementEvent[] = []) => vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = new _Context(parentContext, nodeStrategy);
  _renderElement(parentNode, context, anchor as Comment | null, tagName, [], events, [], [], [], [], null);
  return context;
});

/**
 * A parent holding the HTML of the server.
 */
const parse = (html: string) => {
  const parent = document.body.appendChild(document.createElement('div'));
  parent.innerHTML = html;
  return parent;
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('_hydrate', () => {
  describe('in a page rendered in the browser', () => {
    it('renders the content at once, whatever its triggers', () => {
      const parent = document.createElement('div');
      const ready = signal(false);

      _hydrate(parent, createRoot(), null, { triggers: ['interaction'], when: () => ready(), content: block('b') });

      expect(parent.innerHTML).toBe('<b></b><!--hydrate-->');
    });

    it('renders the content once its modules are loaded, or logs the error when they fail to load', async () => {
      const parent = document.createElement('div');
      let loaded!: () => void;
      const error = new Error('offline');

      _hydrate(parent, createRoot(), null, { triggers: ['visible'], load: () => new Promise<void>(resolve => loaded = resolve), content: block('b') });
      _hydrate(document.createElement('div'), createRoot(), null, { triggers: ['idle'], load: () => Promise.reject(error), content: block('i') });
      expect(parent.innerHTML).toBe('<!--hydrate-->');
      loaded();
      await flush();

      expect(parent.innerHTML).toBe('<b></b><!--hydrate-->');
      expect(console.error).toHaveBeenCalledWith(error);
    });

    it('does nothing once its context is destroyed while its modules load', async () => {
      const root = createRoot();
      const content = block('b');
      let loaded!: () => void;
      let failed!: (error: Error) => void;
      _hydrate(document.createElement('div'), root, null, { triggers: ['load'], load: () => new Promise<void>(resolve => loaded = resolve), content });
      _hydrate(document.createElement('div'), root, null, { triggers: ['load'], load: () => new Promise<void>((_resolve, reject) => failed = reject), content });

      root.clear();
      loaded();
      failed(new Error('offline'));
      await flush();

      expect(content).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('removes the content with its context', () => {
      const parent = document.createElement('div');
      const root = createRoot();

      _hydrate(parent, root, null, { triggers: ['load'], content: block('b') });
      root.clear();

      expect(parent.innerHTML).toBe('');
    });
  });

  describe('in a page rendered on the server', () => {
    it('leaves the content inert, recording the events on it, until a trigger fires, then adopts its nodes and replays the events', async () => {
      const parent = parse('<p></p><!--xd-h--><button>x</button><!--/xd-h--><i></i>');
      const button = parent.querySelector('button')!;
      const clicks = new Array<Event>();
      const root = createRoot(new ClaimNodes('x-host'));
      _renderElement(parent, root, null, 'p', [], [], [], [], [], [], null);

      _hydrate(parent, root, null, { triggers: ['idle'], content: block('button', [{ name: 'click', handler: event => clicks.push(event) }]) });
      _renderElement(parent, root, null, 'i', [], [], [], [], [], [], null);
      button.click();
      expect(clicks).toHaveLength(0);
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(parent.querySelector('button')).toBe(button);
      expect(clicks).toHaveLength(1);
      expect(parent.innerHTML).toBe('<p></p><button>x</button><!--/xd-h--><i></i>');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('gets the nodes of the content as the component holding it does, once it adopted them', async () => {
      const parent = parse('<!--xd-h--><b></b><!--/xd-h-->');
      const root = createRoot(new ClaimNodes('x-host'));
      const content = block('b');

      _hydrate(parent, root, null, { triggers: ['load'], content });
      root.setNodeStrategy(CREATE_NODES);
      await flush();

      expect(content.mock.results[0].value.nodeStrategy).toBe(CREATE_NODES);
    });

    it('creates the content where the server rendered no block, with a warning', () => {
      const parent = parse('<i></i>');

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['interaction'], content: block('b') });

      expect(parent.innerHTML).toBe('<b></b><!--hydrate--><i></i>');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <i> where the browser renders <!--xd-h-->, which it creates');
    });

    it('hydrates at the first interaction, which is replayed with the next ones, loading the modules first', async () => {
      const host = document.body.appendChild(document.createElement('x-host'));
      const shadowRoot = host.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = '<!--xd-h--><button>x</button><!--/xd-h-->';
      const clicks = vi.fn();
      const load = vi.fn(() => Promise.resolve());

      _hydrate(shadowRoot as unknown as HTMLElement, createRoot(new ClaimNodes('x-host')), null, { triggers: ['interaction'], load, content: block('button', [{ name: 'click', handler: clicks }]) });
      shadowRoot.querySelector('button')!.click();
      shadowRoot.querySelector('button')!.click();
      expect(load).toHaveBeenCalledOnce();
      await flush();

      expect(clicks).toHaveBeenCalledTimes(2);
    });

    it('waits for the browser to be idle in place of visible and interaction when the server rendered no element, without warnings for what changed meanwhile', async () => {
      const parent = parse('<!--xd-h-->text<!--/xd-h-->');
      const content = block('b');

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['visible', 'interaction'], content });
      expect(content).not.toHaveBeenCalled();
      await flush();

      expect(parent.innerHTML).toBe('<b></b><!--/xd-h-->');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('adopts an empty content, keeping the triggers that watch no element, and creates what the browser renders without warnings', async () => {
      const parent = parse('<!--xd-h--><!--/xd-h-->');

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['interaction', 'load'], content: block('b') });
      await flush();

      expect(parent.innerHTML).toBe('<b></b><!--/xd-h-->');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('leaves the content as plain HTML with never: its events are not stopped, its modules not loaded, its nodes owned by the context', async () => {
      const parent = parse('<!--xd-h--><a href="#x">x</a><!--/xd-h--><i></i>');
      const link = parent.querySelector('a')!;
      const clicks = vi.fn((event: Event) => event.preventDefault());
      parent.addEventListener('click', clicks);
      const root = createRoot(new ClaimNodes('x-host'));
      const load = vi.fn(() => Promise.resolve());
      const content = block('a');

      _hydrate(parent, root, null, { triggers: ['never'], load, content });
      _renderElement(parent, root, null, 'i', [], [], [], [], [], [], null);
      link.click();
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(clicks).toHaveBeenCalledOnce();
      expect(load).not.toHaveBeenCalled();
      expect(content).not.toHaveBeenCalled();
      expect(parent.querySelector('a')).toBe(link);
      expect(console.warn).not.toHaveBeenCalled();

      root.clear();

      expect(parent.querySelector('a')).toBeNull();
    });

    it('renders the content in the browser with never, where the server rendered no block', () => {
      const parent = document.createElement('div');

      _hydrate(parent, createRoot(), null, { triggers: ['never'], content: block('b') });

      expect(parent.innerHTML).toBe('<b></b><!--hydrate-->');
    });

    it('records no event when only when triggers it, and hydrates once its expression is truthy', async () => {
      const parent = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const button = parent.querySelector('button')!;
      const ready = signal(false);
      const clicks = vi.fn();
      parent.addEventListener('click', clicks);

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: [], when: () => ready(), content: block('button') });
      button.click();
      expect(clicks).toHaveBeenCalledOnce();
      ready.set(true);
      await flush();
      ready.set(false);
      ready.set(true);
      await flush();

      expect(parent.querySelector('button')).toBe(button);
      expect(clicks).toHaveBeenCalledOnce();
    });

    it('logs the error and leaves the content inert, its events no longer recorded, when the modules fail to load', async () => {
      const parent = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const error = new Error('offline');
      const content = block('button');
      const clicks = vi.fn();
      parent.addEventListener('click', clicks);

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['load'], load: () => Promise.reject(error), content });
      await flush();
      await flush();
      parent.querySelector('button')!.click();

      expect(console.error).toHaveBeenCalledWith(error);
      expect(content).not.toHaveBeenCalled();
      expect(clicks).toHaveBeenCalledOnce();
      expect(parent.innerHTML).toBe('<button>x</button><!--/xd-h-->');
    });

    it('does nothing once its context is destroyed, removing the nodes of the server before the content adopts them, and only then', async () => {
      const waiting = parse('<!--xd-h--><button>x</button>a<!--/xd-h-->');
      const root = createRoot(new ClaimNodes('x-host'));
      const content = block('button');
      _hydrate(waiting, root, null, { triggers: ['idle'], content });
      root.clear();
      await flush();
      expect(waiting.innerHTML).toBe('');
      expect(content).not.toHaveBeenCalled();

      const hydrated = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const other = createRoot(new ClaimNodes('x-host'));
      _hydrate(hydrated, other, null, { triggers: ['load'], content: block('button') });
      await flush();
      other.clear();
      expect(hydrated.innerHTML).toBe('');
    });
  });
});
