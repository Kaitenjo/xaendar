// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeferBlockFixture } from '../../types/defer-testing/defer-block-fixture.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { RenderElementEvent } from '../../types/render-element-event.type';
import { HEADER } from '../../costants';
import type { _Context } from '../../types/context.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _declare, _read, _scope, _set, EMPTY_LAYOUT, ELEMENT_LAYOUT, clear, addChild } = await import('../context/context.util');
const { ClaimNodes } = await import('../claim-nodes/claim-nodes.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _renderElement } = await import('../render-element/render-element.util');
const { _renderLiteralText } = await import('../render-text/render-text.util');
const { getDeferBlocks, setDeferBlockBehavior } = await import('../defer-testing/defer-testing.util');
const { _defer } = await import('./defer.util');
const { effect, signal } = await import('../../signals');

type Context = _Context;

/**
 * The IntersectionObserver standing for the one of the browser, recording the elements it observes.
 */
class FakeIntersectionObserver {
  public static last: FakeIntersectionObserver;
  public readonly observed = new Array<Element>();

  constructor(private readonly _callback: (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void, public readonly options?: IntersectionObserverInit) {
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

/**
 * Waits for the triggers of the blocks rendered to be armed, once the code rendering them is done.
 */
const armed = () => Promise.resolve();

/**
 * Waits for the triggers to be armed, then for the timers and the promises settled meanwhile.
 */
const flush = async () => {
  await armed();
  await new Promise<void>(resolve => setTimeout(resolve));
};

const createRoot = (nodeStrategy?: NodeStrategy) => _scope(null, EMPTY_LAYOUT, nodeStrategy);

/**
 * A part rendering an element, with its listeners, through the strategy it receives.
 */
const part = (tagName: string, events?: RenderElementEvent[]) => vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = _scope(parentContext, ELEMENT_LAYOUT, nodeStrategy);
  _renderElement(parentNode, context, anchor as Comment | null, { tagName, events, slot: HEADER });
  return context;
});

/**
 * A part rendering a text alone.
 */
const textPart = (text: string) => (parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = _scope(parentContext, ELEMENT_LAYOUT, nodeStrategy);
  _renderLiteralText(parentNode, context, text, anchor as Comment | null, false, HEADER);
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
  vi.useRealTimers();
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

    it('renders the @placeholder until an interaction on it, then replaces it with the content, once', async () => {
      const element = parent();
      const clicked = vi.fn();
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: ['interaction'], content, placeholder: part('button', [{ name: 'click', handler: clicked }]) });
      expect(element.innerHTML).toBe('<button></button><!--defer-->');
      await armed();
      const button = element.querySelector('button')!;
      button.click();
      button.click();

      expect(clicked).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<b></b><!--defer-->');
      expect(content).toHaveBeenCalledOnce();
    });

    it('arms the triggers once the code rendering the block is done, firing none before', async () => {
      const element = parent();
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: ['interaction'], content, placeholder: part('button') });
      element.querySelector('button')!.click();
      await armed();

      expect(content).not.toHaveBeenCalled();
      element.querySelector('button')!.click();
      expect(content).toHaveBeenCalledOnce();
    });

    it('watches the elements of the @placeholder, and the ones of the blocks it holds, for visible', async () => {
      const element = parent();
      const placeholder = (parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
        const context = part('i')(parentNode, parentContext, anchor, nodeStrategy);
        addChild(context, part('u')(parentNode, context, anchor, nodeStrategy));
        // An element inside one of its elements is not watched
        part('s')(element.querySelector('i')!, context, null, nodeStrategy);
        return context;
      };

      _defer(element, createRoot(), null, { triggers: ['visible'], content: part('b'), placeholder });
      await armed();
      const observer = FakeIntersectionObserver.last;
      expect(observer.observed.map(({ localName }) => localName)).toEqual(['i', 'u']);
      observer.intersect();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('watches the elements of the blocks a @placeholder holds when it owns no node of its own', async () => {
      const element = parent();
      const placeholder = (parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
        const context = _scope(parentContext, EMPTY_LAYOUT, nodeStrategy);
        addChild(context, part('u')(parentNode, context, anchor, nodeStrategy));
        return context;
      };

      _defer(element, createRoot(), null, { triggers: ['visible'], content: part('b'), placeholder });
      await armed();

      expect(FakeIntersectionObserver.last.observed.map(({ localName }) => localName)).toEqual(['u']);
    });

    it('waits for the browser to be idle in place of visible, interaction and hover when the @placeholder renders no element', async () => {
      const element = parent();

      _defer(element, createRoot(), null, { triggers: ['visible', 'interaction', 'hover'], content: part('b'), placeholder: textPart('Wait') });
      expect(element.innerHTML).toBe('Wait<!--defer-->');
      await flush();

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('watches the element a trigger names, read once the code rendering the block is done, in place of the @placeholder', async () => {
      const element = parent();
      // The element ref of the trigger, declared in the scope holding the block as the compiled code does
      const root = _scope(null, { size: HEADER + 1, nodes: HEADER + 1, variables: ['more'] });
      const content = part('b');
      _declare(root, HEADER);

      _defer(element, root, null, { triggers: [{ kind: 'hover', target: () => _read(root, 0, HEADER) as Element }, { kind: 'visible', target: () => _read(root, 0, HEADER) as Element, options: { rootMargin: '10px' } }], content, placeholder: textPart('Wait') });
      const more = element.appendChild(document.createElement('button'));
      _set(root, 0, HEADER, more);
      await armed();

      expect(FakeIntersectionObserver.last.observed).toEqual([more]);
      expect(FakeIntersectionObserver.last.options).toEqual({ rootMargin: '10px' });
      more.dispatchEvent(new Event('mouseover'));
      expect(content).toHaveBeenCalledOnce();
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
      const ready = signal(false);
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: ['interaction'], when: () => ready(), content, placeholder: part('button') });
      await armed();
      element.querySelector('button')!.click();
      ready.set(true);
      await flush();

      expect(content).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('renders the content untracked, so that an effect firing a trigger does not track what it reads', async () => {
      const element = parent();
      const read = signal(0);
      const runs = vi.fn();
      const content = vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
        read();
        return part('b')(parentNode, parentContext, anchor, nodeStrategy);
      });
      _defer(element, createRoot(), null, { triggers: ['interaction'], content, placeholder: part('button') });
      await armed();

      effect(() => {
        runs();
        element.querySelector('button')?.click();
      });
      read.set(1);

      expect(content).toHaveBeenCalledOnce();
      expect(runs).toHaveBeenCalledOnce();
    });

    it('renders the @loading while the modules of the content load, then the content', async () => {
      const element = parent();
      let loaded!: () => void;

      _defer(element, createRoot(), null, { triggers: ['interaction'], load: () => new Promise<void>(resolve => loaded = resolve), content: part('b'), placeholder: part('button'), loading: part('progress') });
      await armed();
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
      await armed();
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

    it('renders the last block of its parent without anchor, each part replacing the previous one at the end of the parent', async () => {
      const element = parent('<p></p>');
      const root = createRoot();
      const block = vi.spyOn(CREATE_NODES, 'block');
      const content = part('b');
      let loaded!: () => void;

      _defer(element, root, null, { triggers: ['interaction'], load: () => new Promise<void>(resolve => loaded = resolve), content, placeholder: part('button'), loading: part('progress'), last: true });
      expect(block).toHaveBeenCalledExactlyOnceWith(root, element, null, 'defer', 'xd-d', true, undefined);
      expect(element.innerHTML).toBe('<p></p><button></button>');
      await armed();
      element.querySelector('button')!.click();
      expect(element.innerHTML).toBe('<p></p><progress></progress>');
      loaded();
      await flush();

      expect(element.innerHTML).toBe('<p></p><b></b>');
      expect(content.mock.calls[0][2]).toBeNull();
    });

    it('renders the @error of the last block of its parent at the end of the parent', async () => {
      const element = parent('<p></p>');

      _defer(element, createRoot(), null, { triggers: ['load'], load: () => Promise.reject(new Error('offline')), content: part('b'), error: part('s'), last: true });
      await flush();

      expect(element.innerHTML).toBe('<p></p><s></s>');
    });

    it('does nothing once its context is destroyed, before a trigger fires or while the modules load', async () => {
      const root = createRoot();
      const element = parent();
      const content = part('b');
      const ready = signal(false);
      let loaded!: () => void;
      let failed!: (error: Error) => void;
      _defer(element, root, null, { triggers: ['load'], content });
      _defer(element, root, null, { triggers: [], when: () => ready(), content });
      _defer(element, root, null, { triggers: ['interaction'], load: () => new Promise<void>(resolve => loaded = resolve), content, placeholder: part('button') });
      _defer(element, root, null, { triggers: ['interaction'], load: () => new Promise<void>((_resolve, reject) => failed = reject), content, placeholder: part('button') });
      await armed();
      const buttons = document.querySelectorAll('button');
      buttons[0].click();
      buttons[1].click();
      ready.set(true);

      clear(root);
      await flush();
      loaded();
      failed(new Error('offline'));
      await flush();

      expect(content).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('arms nothing once its context is destroyed before the code rendering it is done', async () => {
      const root = createRoot();
      const load = vi.fn(() => Promise.resolve());
      _defer(parent(), root, null, { triggers: ['load'], prefetch: ['load'], load, content: part('b') });

      clear(root);
      await flush();

      expect(load).not.toHaveBeenCalled();
    });
  });

  describe('prefetching the modules of the content', () => {
    it('loads them when a trigger following prefetch fires, without rendering the content, which loads them once', async () => {
      const element = parent();
      const load = vi.fn(() => Promise.resolve());
      const content = part('b');

      _defer(element, createRoot(), null, { triggers: ['interaction'], prefetch: ['load'], load, content, placeholder: part('button') });
      await flush();
      expect(load).toHaveBeenCalledOnce();
      expect(content).not.toHaveBeenCalled();
      element.querySelector('button')!.click();
      await flush();

      expect(load).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('loads them once the expression of the when following prefetch is truthy, before the content renders', async () => {
      const element = parent();
      const soon = signal(false);
      const load = vi.fn(() => Promise.resolve());

      _defer(element, createRoot(), null, { triggers: ['interaction'], prefetchWhen: () => soon(), load, content: part('b'), placeholder: part('button') });
      await flush();
      expect(load).not.toHaveBeenCalled();
      soon.set(true);
      await flush();

      expect(load).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<button></button><!--defer-->');
    });

    it('reports nothing when the prefetch fails, the trigger rendering the content showing the error', async () => {
      const element = parent();
      const failure = new Error('offline');
      const error = vi.fn((parentNode: HTMLElement, parentContext: Context, anchor: Node | null, nodeStrategy: NodeStrategy, _error: unknown) => part('s')(parentNode, parentContext, anchor, nodeStrategy));

      _defer(element, createRoot(), null, { triggers: ['interaction'], prefetch: ['load'], load: () => Promise.reject(failure), content: part('b'), placeholder: part('button'), error });
      await flush();
      expect(element.innerHTML).toBe('<button></button><!--defer-->');
      element.querySelector('button')!.click();
      await flush();

      expect(element.innerHTML).toBe('<s></s><!--defer-->');
      expect(error.mock.calls[0][4]).toBe(failure);
    });

    it('stops prefetching once the content renders', async () => {
      const element = parent();
      const soon = signal(false);
      const load = vi.fn(() => Promise.resolve());

      _defer(element, createRoot(), null, { triggers: ['load'], prefetchWhen: () => soon(), load, content: part('b') });
      await flush();
      await flush();
      soon.set(true);
      await flush();

      expect(load).toHaveBeenCalledOnce();
      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });
  });

  describe('the times of the @placeholder and of the @loading', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
    });

    it('keeps the @placeholder for its minimum, from when it is rendered', async () => {
      const element = parent();

      _defer(element, createRoot(), null, { triggers: ['interaction'], content: part('b'), placeholder: part('button'), placeholderMinimum: 500 });
      await armed();
      vi.advanceTimersByTime(200);
      element.querySelector('button')!.click();
      vi.advanceTimersByTime(299);
      expect(element.innerHTML).toBe('<button></button><!--defer-->');
      vi.advanceTimersByTime(1);

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('shows the @loading once the modules have loaded for its after, never when they load sooner', async () => {
      const element = parent();
      const other = parent();
      let loaded!: () => void;
      let loadedSoon!: () => void;

      _defer(element, createRoot(), null, { triggers: ['load'], load: () => new Promise<void>(resolve => loaded = resolve), content: part('b'), loading: part('progress'), loadingAfter: 100 });
      _defer(other, createRoot(), null, { triggers: ['load'], load: () => new Promise<void>(resolve => loadedSoon = resolve), content: part('b'), loading: part('progress'), loadingAfter: 100 });
      await armed();
      await vi.advanceTimersByTimeAsync(0);
      loadedSoon();
      await vi.advanceTimersByTimeAsync(99);
      expect(element.innerHTML).toBe('<!--defer-->');
      expect(other.innerHTML).toBe('<b></b><!--defer-->');
      await vi.advanceTimersByTimeAsync(1);
      expect(element.innerHTML).toBe('<progress></progress><!--defer-->');
      loaded();
      await vi.advanceTimersByTimeAsync(0);

      expect(element.innerHTML).toBe('<b></b><!--defer-->');
      expect(other.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('keeps the @loading for its minimum once shown, the @error too waiting for it', async () => {
      const element = parent();
      let failed!: (error: Error) => void;

      _defer(element, createRoot(), null, { triggers: ['load'], load: () => new Promise<void>((_resolve, reject) => failed = reject), content: part('b'), loading: part('progress'), loadingMinimum: 1000, error: part('s') });
      await armed();
      await vi.advanceTimersByTimeAsync(0);
      expect(element.innerHTML).toBe('<progress></progress><!--defer-->');
      failed(new Error('offline'));
      await vi.advanceTimersByTimeAsync(999);
      expect(element.innerHTML).toBe('<progress></progress><!--defer-->');
      await vi.advanceTimersByTimeAsync(1);

      expect(element.innerHTML).toBe('<s></s><!--defer-->');
    });

    it('shows the @loading once the @placeholder has been shown for its minimum', async () => {
      const element = parent();

      _defer(element, createRoot(), null, { triggers: ['load'], load: () => new Promise<void>(() => undefined), content: part('b'), placeholder: part('i'), placeholderMinimum: 300, loading: part('progress'), loadingAfter: 100 });
      await armed();
      await vi.advanceTimersByTimeAsync(299);
      expect(element.innerHTML).toBe('<i></i><!--defer-->');
      await vi.advanceTimersByTimeAsync(1);

      expect(element.innerHTML).toBe('<progress></progress><!--defer-->');
    });

    it('does nothing once its context is destroyed while it waits', async () => {
      const root = createRoot();
      const content = part('b');
      _defer(parent(), root, null, { triggers: ['load'], content, placeholder: part('i'), placeholderMinimum: 300 });
      await armed();
      await vi.advanceTimersByTimeAsync(0);

      clear(root);
      await vi.advanceTimersByTimeAsync(300);

      expect(content).not.toHaveBeenCalled();
    });
  });

  describe('in the tests', () => {
    afterEach(() => setDeferBlockBehavior('playthrough'));

    /**
     * Renders a block in the shadow root of a host, returning the host.
     */
    const host = (block: Parameters<typeof _defer>[3]) => {
      const element = document.body.appendChild(document.createElement('x-host'));
      const shadowRoot = element.attachShadow({ mode: 'open' });
      _defer(shadowRoot as unknown as HTMLElement, createRoot(), null, block);
      return element;
    };

    it('lets the tests drive the blocks by hand, arming no trigger, rendering each part and the content once its modules load', async () => {
      setDeferBlockBehavior('manual');
      const load = vi.fn(() => Promise.resolve());
      const failure = new Error('offline');
      const element = host({ triggers: ['load'], when: () => true, prefetch: ['load'], load, content: part('b'), placeholder: part('i'), loading: part('progress'), error: (parentNode, parentContext, anchor, nodeStrategy, error) => part(error === failure ? 's' : 'u')(parentNode, parentContext, anchor, nodeStrategy) });
      await flush();
      const [block] = getDeferBlocks(element);
      const { shadowRoot } = element;

      expect(load).not.toHaveBeenCalled();
      expect(block.state).toBe('placeholder');
      expect(shadowRoot!.innerHTML).toBe('<i></i><!--defer-->');
      await block.render('loading');
      expect(shadowRoot!.innerHTML).toBe('<progress></progress><!--defer-->');
      await block.render('error', failure);
      expect(shadowRoot!.innerHTML).toBe('<s></s><!--defer-->');
      expect(block.state).toBe('error');
      await block.render('placeholder');
      expect(shadowRoot!.innerHTML).toBe('<i></i><!--defer-->');
      await block.render('complete');

      expect(load).toHaveBeenCalledOnce();
      expect(block.state).toBe('complete');
      expect(shadowRoot!.innerHTML).toBe('<b></b><!--defer-->');
    });

    it('stops the triggers once the test renders a part, the expression of when about to fire included', async () => {
      setDeferBlockBehavior('playthrough');
      const content = part('b');
      const [block] = getDeferBlocks(host({ triggers: ['load'], when: () => true, content, placeholder: part('i') }));

      await block.render('placeholder');
      await flush();

      expect(content).not.toHaveBeenCalled();
      expect(block.state).toBe('placeholder');
    });

    it('rejects a part the block does not declare', async () => {
      setDeferBlockBehavior('manual');
      const [block] = getDeferBlocks(host({ triggers: ['load'], content: part('b') }));

      await expect(block.render('placeholder')).rejects.toThrow('The @defer declares no @placeholder to render');
      await expect(block.render('loading')).rejects.toThrow('The @defer declares no @loading to render');
      await expect(block.render('error')).rejects.toThrow('The @defer declares no @error to render');
      await block.render('complete');
      expect(block.state).toBe('complete');
    });

    it('lets the blocks play through, finding them in the order they render, until destroyed', async () => {
      setDeferBlockBehavior('playthrough');
      const element = document.body.appendChild(document.createElement('x-host'));
      const shadowRoot = element.attachShadow({ mode: 'open' });
      const root = createRoot();
      _defer(shadowRoot as unknown as HTMLElement, root, null, { triggers: ['load'], content: part('b') });
      _defer(shadowRoot as unknown as HTMLElement, root, null, { triggers: ['interaction'], content: part('u'), placeholder: part('i') });
      const blocks: DeferBlockFixture[] = getDeferBlocks(element);
      await flush();

      expect(blocks.map(({ state }) => state)).toEqual(['complete', 'placeholder']);
      clear(root);
      expect(getDeferBlocks(element)).toEqual([]);
      expect(getDeferBlocks(document.createElement('div'))).toEqual([]);
    });
  });

  describe('in a page rendered on the server', () => {
    it('adopts the @placeholder the server rendered, its listeners bound, and replaces it with the content once a trigger fires', async () => {
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
      await armed();
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

    it('adopts the @placeholder of the last block of its parent, which the server closes with no marker, and replaces it with the content at the end of the parent', async () => {
      const element = parent('<p></p><!--xd-d--><button>Load</button>');
      const button = element.querySelector('button')!;
      const strategy = new ClaimNodes('x-host');
      const context = createRoot(strategy);
      const placeholder = part('button');
      strategy.element(context, element, 'p');

      _defer(element, context, null, { triggers: ['interaction'], content: part('b'), placeholder, last: true });
      expect(placeholder.mock.calls[0][2]).toBeNull();
      expect(placeholder.mock.calls[0][3]).toBe(strategy);
      expect(element.querySelector('button')).toBe(button);
      expect(element.innerHTML).toBe('<p></p><button>Load</button>');
      await armed();
      button.click();

      expect(element.innerHTML).toBe('<p></p><b></b>');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
