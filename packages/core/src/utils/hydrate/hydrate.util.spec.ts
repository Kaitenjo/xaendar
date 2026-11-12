// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _EVENT_CONTRACT_KEY } from '../../costants';
import type { RenderElementEvent } from '../../types/render-element-event.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { HEADER } from '../../costants';
import type { _Context } from '../../types/context.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _scope, ELEMENT_LAYOUT, clear, getNodeStrategy, setNodeStrategy } = await import('../context/context.util');
const { ClaimNodes } = await import('../claim-nodes/claim-nodes.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _renderElement } = await import('../render-element/render-element.util');
const { _hydrate } = await import('./hydrate.util');
const { signal } = await import('../../signals');

type Context = _Context;

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

const createRoot = (nodeStrategy?: NodeStrategy) => _scope(null, ELEMENT_LAYOUT, nodeStrategy);

/**
 * A block rendering an element, with its listeners, through the strategy it receives.
 */
const block = (tagName: string, events?: RenderElementEvent[]) => vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = _scope(parentContext, ELEMENT_LAYOUT, nodeStrategy);
  _renderElement(parentNode, context, anchor as Comment | null, { tagName, events, slot: HEADER });
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
      const element = document.createElement('div');
      const content = block('b');
      let loaded!: () => void;
      let failed!: (error: Error) => void;
      _hydrate(element, root, null, { triggers: ['load'], load: () => new Promise<void>(resolve => loaded = resolve), content });
      _hydrate(element, root, null, { triggers: ['load'], load: () => new Promise<void>((_resolve, reject) => failed = reject), content });

      clear(root);
      loaded();
      failed(new Error('offline'));
      await flush();

      expect(content).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('removes the content with its context', () => {
      const parent = document.createElement('div');
      const root = createRoot();

      _hydrate(parent, root, null, { triggers: ['load'], content: block('b'), slot: HEADER });
      clear(root);

      expect(parent.innerHTML).toBe('');
    });

    it('renders the last block of its parent without anchor, appending the content', () => {
      const parent = document.createElement('div');
      parent.appendChild(document.createElement('i'));
      const root = createRoot();
      const nodeBlock = vi.spyOn(CREATE_NODES, 'block');
      const content = block('b');

      _hydrate(parent, root, null, { triggers: ['interaction'], content, last: true });

      expect(nodeBlock).toHaveBeenCalledExactlyOnceWith(root, parent, null, 'hydrate', 'xd-h', true, undefined);
      expect(parent.innerHTML).toBe('<i></i><b></b>');
      expect(content.mock.calls[0][2]).toBeNull();
    });
  });

  describe('in a page rendered on the server', () => {
    it('adopts the content of the last block of its parent, which the server closes with no marker, once a trigger fires', async () => {
      const parent = parse('<p></p><!--xd-h--><button>x</button>');
      const button = parent.querySelector('button')!;
      const clicks = vi.fn();
      const root = createRoot(new ClaimNodes('x-host'));
      const content = block('button', [{ name: 'click', handler: clicks }]);
      _renderElement(parent, root, null, { tagName: 'p' });

      _hydrate(parent, root, null, { triggers: ['interaction'], content, last: true });
      expect(parent.innerHTML).toBe('<p></p><button>x</button>');
      button.click();
      await flush();

      expect(content.mock.calls[0][2]).toBeNull();
      expect(parent.querySelector('button')).toBe(button);
      expect(clicks).toHaveBeenCalledOnce();
      expect(parent.innerHTML).toBe('<p></p><button>x</button>');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('creates the content of the last block of its parent at the end of the parent when the server rendered it empty', async () => {
      const parent = parse('<p></p><!--xd-h-->');
      const root = createRoot(new ClaimNodes('x-host'));
      _renderElement(parent, root, null, { tagName: 'p' });

      _hydrate(parent, root, null, { triggers: ['load'], content: block('b'), last: true });
      await flush();

      expect(parent.innerHTML).toBe('<p></p><b></b>');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('leaves the content inert, recording the events on it, until a trigger fires, then adopts its nodes and replays the events', async () => {
      const parent = parse('<p></p><!--xd-h--><button>x</button><!--/xd-h--><i></i>');
      const button = parent.querySelector('button')!;
      const clicks = new Array<Event>();
      const root = createRoot(new ClaimNodes('x-host'));
      _renderElement(parent, root, null, { tagName: 'p' });

      _hydrate(parent, root, null, { triggers: ['idle'], content: block('button', [{ name: 'click', handler: (_context, event) => clicks.push(event) }]) });
      _renderElement(parent, root, null, { tagName: 'i' });
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
      setNodeStrategy(root, CREATE_NODES);
      await flush();

      expect(getNodeStrategy(content.mock.results[0].value as _Context)).toBe(CREATE_NODES);
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

    it('hydrates for an interaction the event contract recorded before the runtime was there, replaying it', async () => {
      const parent = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const button = parent.querySelector('button')!;
      const clicks = vi.fn();
      const stop = vi.fn();
      window[_EVENT_CONTRACT_KEY] = { events: [{ event: new MouseEvent('click', { bubbles: true }), target: button, path: [button, parent, document.body, document, window] }], stops: [stop] };
      const content = block('button', [{ name: 'click', handler: clicks }]);

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['interaction'], content });
      expect(stop).toHaveBeenCalledOnce();
      expect(content).not.toHaveBeenCalled();
      await flush();

      expect(content).toHaveBeenCalledOnce();
      expect(clicks).toHaveBeenCalledOnce();
    });

    it('hydrates when the pointer moves over the content', async () => {
      const parent = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const overs = vi.fn();
      const content = block('button', [{ name: 'mouseover', handler: overs }]);

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['hover'], content });
      expect(content).not.toHaveBeenCalled();
      parent.querySelector('button')!.dispatchEvent(new Event('mouseover', { bubbles: true }));
      await flush();
      overs.mockClear();
      parent.querySelector('button')!.dispatchEvent(new Event('mouseover', { bubbles: true }));

      expect(content).toHaveBeenCalledOnce();
      expect(overs).toHaveBeenCalledOnce();
    });

    it('loads the modules once a trigger following prefetch fires, the trigger hydrating the content waiting for the same load', async () => {
      const parent = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const load = vi.fn(() => Promise.resolve());
      const content = block('button');
      const soon = signal(false);

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['interaction'], prefetch: ['load'], prefetchWhen: () => soon(), load, content });
      await flush();
      expect(load).toHaveBeenCalledOnce();
      expect(content).not.toHaveBeenCalled();
      soon.set(true);
      parent.querySelector('button')!.click();
      await flush();

      expect(load).toHaveBeenCalledOnce();
      expect(content).toHaveBeenCalledOnce();
    });

    it('prefetches at the first interaction with prefetch interaction, the expression of the when following prefetch too', async () => {
      const parent = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const other = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const load = vi.fn(() => Promise.resolve());
      const otherLoad = vi.fn(() => Promise.resolve());
      const soon = signal(false);

      const content = block('button');

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: [{ kind: 'timer', delay: 100000 }], prefetch: ['interaction'], load, content });
      _hydrate(other, createRoot(new ClaimNodes('x-host')), null, { triggers: [{ kind: 'timer', delay: 100000 }], prefetchWhen: () => soon(), load: otherLoad, content });
      parent.querySelector('button')!.click();
      soon.set(true);
      await flush();

      expect(load).toHaveBeenCalledOnce();
      expect(otherLoad).toHaveBeenCalledOnce();
      expect(content).not.toHaveBeenCalled();
    });

    it('reports nothing when the prefetch fails, the trigger hydrating the content logging the error', async () => {
      const parent = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const failure = new Error('offline');

      _hydrate(parent, createRoot(new ClaimNodes('x-host')), null, { triggers: ['interaction'], prefetch: ['load'], load: () => Promise.reject(failure), content: block('button') });
      await flush();
      expect(console.error).not.toHaveBeenCalled();
      parent.querySelector('button')!.click();
      await flush();

      expect(console.error).toHaveBeenCalledWith(failure);
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

      _hydrate(parent, root, null, { triggers: ['never'], load, content, slot: HEADER, track: true });
      _renderElement(parent, root, null, { tagName: 'i' });
      link.click();
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(clicks).toHaveBeenCalledOnce();
      expect(load).not.toHaveBeenCalled();
      expect(content).not.toHaveBeenCalled();
      expect(parent.querySelector('a')).toBe(link);
      expect(console.warn).not.toHaveBeenCalled();

      clear(root);

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
      _hydrate(waiting, root, null, { triggers: ['idle'], content, slot: HEADER, track: true });
      clear(root);
      await flush();
      expect(waiting.innerHTML).toBe('');
      expect(content).not.toHaveBeenCalled();

      const hydrated = parse('<!--xd-h--><button>x</button><!--/xd-h-->');
      const other = createRoot(new ClaimNodes('x-host'));
      _hydrate(hydrated, other, null, { triggers: ['load'], content: block('button'), slot: HEADER, track: true });
      await flush();
      clear(other);
      expect(hydrated.innerHTML).toBe('');
    });
  });
});
