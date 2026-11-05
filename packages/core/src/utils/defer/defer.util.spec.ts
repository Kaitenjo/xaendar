// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { RenderElementEvent } from '../../types/render-element-event.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context } = await import('../context/context.util');
const { ClaimNodes } = await import('../claim-nodes/claim-nodes.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _renderElement } = await import('../render-element/render-element.util');
const { _renderLiteralText } = await import('../render-text/render-text.util');
const { _defer } = await import('./defer.util');
const { effect, signal } = await import('../../signals');

type Context = InstanceType<typeof _Context>;

/**
 * The IntersectionObserver standing for the one of the browser, recording the elements it observes.
 */
class FakeIntersectionObserver {
  public static last: FakeIntersectionObserver;
  public readonly observed = new Array<Element>();

  constructor(private readonly _callback: (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void) {
    FakeIntersectionObserver.last = this;
  }

  public observe(element: Element): void {
    this.observed.push(element);
  }

  public disconnect(): void {
    // Nothing to stop
  }

  public intersect(): void {
    this._callback([{ isIntersecting: true }]);
  }
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

const createRoot = (nodeStrategy?: NodeStrategy) => new _Context({ createElement: (tag: string) => document.createElement(tag) } as never, nodeStrategy);

/**
 * A part rendering an element, with its listeners, through the strategy it receives.
 */
const part = (tagName: string, events: RenderElementEvent[] = []) => vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = new _Context(parentContext, nodeStrategy);
  _renderElement(parentNode, context, anchor as Comment | null, tagName, [], events, [], [], [], [], null);
  return context;
});

/**
 * A part rendering a text alone.
 */
const textPart = (text: string) => (parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = new _Context(parentContext, nodeStrategy);
  _renderLiteralText(parentNode, context, text, anchor as Comment | null);
  return context;
};

/**
 * A parent in the document, holding the HTML of the server, if any.
 */
const parent = (html = '') => {
  const element = document.body.appendChild(document.createElement('div'));
  element.innerHTML = html;
  return element;
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('_defer', () => {
  describe('in a page rendered in the browser', () => {
    it('renders nothing but its anchor without a @placeholder, then the content once load fires', async () => {
      const element = parent();
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: ['load'], content });
      expect(element.innerHTML).toBe('<!--defer-->');
      await flush();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
      expect(content.mock.calls[0][3]).toBe(CREATE_NODES);
    });

    it('renders the @placeholder until an interaction on it, then replaces it with the content, once', () => {
      const element = parent();
      const clicked = vi.fn();
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: ['interaction'], content, placeholder: part('button', [{ name: 'click', handler: clicked }]) });
      expect(element.innerHTML).toBe('<button></button><!--defer-->');
      const button = element.querySelector('button')!;
      button.click();
      button.click();

      expect(clicked).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<b></b><!--defer-->');
      expect(content).toHaveBeenCalledOnce();
    });

    it('watches the elements of the @placeholder, and the ones of the blocks it holds, for visible', () => {
      const element = parent();
      const placeholder = (parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
        const context = part('i')(parentNode, parentContext, anchor, nodeStrategy);
        context.addChild(part('u')(parentNode, context, anchor, nodeStrategy));
        // An element inside one of its elements is not watched
        part('s')(element.querySelector('i')!, context, null, nodeStrategy);
        return context;
      };

      _defer(element, createRoot(), null, { triggers: ['visible'], content: part('b'), placeholder });
      const observer = FakeIntersectionObserver.last;
      expect(observer.observed.map(({ localName }) => localName)).toEqual(['i', 'u']);
      observer.intersect();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('waits for the browser to be idle in place of visible and interaction when the @placeholder renders no element', async () => {
      const element = parent();

      _defer(element, createRoot(), null, { triggers: ['visible', 'interaction'], content: part('b'), placeholder: textPart('Wait') });
      expect(element.innerHTML).toBe('Wait<!--defer-->');
      await flush();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('renders the content once the expression of when is truthy, and keeps it when it is not anymore', async () => {
      const element = parent();
      const ready = signal(false);
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: [], when: () => ready(), content });
      await flush();
      expect(element.innerHTML).toBe('<!--defer-->');
      ready.set(true);
      await flush();
      expect(element.innerHTML).toBe('<b></b><!--defer-->');
      ready.set(false);
      await flush();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
      expect(content).toHaveBeenCalledOnce();
    });

    it('renders the content once when several triggers fire, the expression of when after an interaction', async () => {
      const element = parent();
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: ['interaction'], when: () => true, content, placeholder: part('button') });
      element.querySelector('button')!.click();
      await flush();

      expect(content).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('renders the content untracked, so that an effect firing a trigger does not track what it reads', () => {
      const element = parent();
      const read = signal(0);
      const runs = vi.fn();
      const content = vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
        read();
        return part('b')(parentNode, parentContext, anchor, nodeStrategy);
      });
      _defer(element, createRoot(), null, { triggers: ['interaction'], content, placeholder: part('button') });

      effect(() => {
        runs();
        element.querySelector('button')?.click();
      });
      read.set(1);

      expect(runs).toHaveBeenCalledOnce();
    });

    it('renders the @loading while the modules of the content load, then the content', async () => {
      const element = parent();
      let loaded!: () => void;

      _defer(element, createRoot(), null, { triggers: ['interaction'], load: () => new Promise<void>(resolve => loaded = resolve), content: part('b'), placeholder: part('button'), loading: part('progress') });
      element.querySelector('button')!.click();
      expect(element.innerHTML).toBe('<progress></progress><!--defer-->');
      loaded();
      await flush();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('keeps the @placeholder while the modules load without a @loading', async () => {
      const element = parent();
      let loaded!: () => void;

      _defer(element, createRoot(), null, { triggers: ['interaction'], load: () => new Promise<void>(resolve => loaded = resolve), content: part('b'), placeholder: part('button') });
      element.querySelector('button')!.click();
      expect(element.innerHTML).toBe('<button></button><!--defer-->');
      loaded();
      await flush();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('renders the @error with the error when the modules fail to load', async () => {
      const element = parent();
      const failure = new Error('offline');
      const error = vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy, _error: unknown) => part('s')(parentNode, parentContext, anchor, nodeStrategy));

      _defer(element, createRoot(), null, { triggers: ['load'], load: () => Promise.reject(failure), content: part('b'), loading: part('progress'), error });
      await flush();

      expect(element.innerHTML).toBe('<s></s><!--defer-->');
      expect(error.mock.calls[0][4]).toBe(failure);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('logs the error and renders the @placeholder again without an @error, or nothing without a @placeholder', async () => {
      const element = parent();
      const other = parent();
      const failure = new Error('offline');

      _defer(element, createRoot(), null, { triggers: ['load'], load: () => Promise.reject(failure), content: part('b'), placeholder: part('i'), loading: part('progress') });
      _defer(other, createRoot(), null, { triggers: ['load'], load: () => Promise.reject(failure), content: part('b'), loading: part('progress') });
      await flush();

      expect(element.innerHTML).toBe('<i></i><!--defer-->');
      expect(other.innerHTML).toBe('<!--defer-->');
      expect(console.error).toHaveBeenCalledWith(failure);
    });

    it('does nothing once its context is destroyed, before a trigger fires or while the modules load', async () => {
      const root = createRoot();
      const content = part('b');
      const ready = signal(false);
      let loaded!: () => void;
      let failed!: (error: Error) => void;
      _defer(parent(), root, null, { triggers: ['load'], content });
      _defer(parent(), root, null, { triggers: [], when: () => ready(), content });
      _defer(parent(), root, null, { triggers: ['interaction'], load: () => new Promise<void>(resolve => loaded = resolve), content, placeholder: part('button') });
      _defer(parent(), root, null, { triggers: ['interaction'], load: () => new Promise<void>((_resolve, reject) => failed = reject), content, placeholder: part('button') });
      const buttons = document.querySelectorAll('button');
      buttons[0].click();
      buttons[1].click();
      ready.set(true);

      root.clear();
      await flush();
      loaded();
      failed(new Error('offline'));
      await flush();

      expect(content).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('in a page rendered on the server', () => {
    it('adopts the @placeholder the server rendered, its listeners bound, and replaces it with the content once a trigger fires', () => {
      const element = parent('<!--xd-d--><button>Load</button><!--/xd-d--><p></p>');
      const button = element.querySelector('button')!;
      const clicked = vi.fn();
      const strategy = new ClaimNodes('x-host');
      const context = createRoot(strategy);
      const placeholder = part('button', [{ name: 'click', handler: clicked }]);

      _defer(element, context, null, { triggers: ['interaction'], content: part('b'), placeholder });
      expect(placeholder.mock.calls[0][3]).toBe(strategy);
      expect(element.querySelector('button')).toBe(button);
      expect(strategy.element(context, element, 'p')).toBe(element.querySelector('p'));
      button.click();

      expect(clicked).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<b></b><!--/xd-d--><p></p>');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('removes what the server rendered in the block without a @placeholder, with a warning', () => {
      const element = parent('<!--xd-d--><i></i><!--/xd-d-->');

      _defer(element, createRoot(new ClaimNodes('x-host')), null, { triggers: ['idle'], content: part('b') });

      expect(element.innerHTML).toBe('<!--/xd-d-->');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <i> the browser does not render, which it removes along with what follows it');
    });
  });
});
