import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _getComponentRuntime, CustomElement } = await import('@xaendar/core');
const { _createServerRuntime, _renderInTree, _runOnServer } = await import('./server-runtime.util');

class ProbeElement extends CustomElement { }
customElements.define('runtime-probe', ProbeElement);

describe('_createServerRuntime', () => {
  it('creates a runtime whose effects do not run and whose components are constructed without being rendered', () => {
    const fn = vi.fn();
    const runtime = _createServerRuntime(undefined);

    const stop = runtime.effect(fn);
    const ref = runtime.createComponent(() => undefined as never, ProbeElement, { target: undefined as never });

    expect(fn).not.toHaveBeenCalled();
    expect(stop()).toBeUndefined();
    expect(ref.element).toBeInstanceOf(ProbeElement);
    expect(ref.destroy()).toBeUndefined();
  });

  it('registers no handler with onLeave', () => {
    const runtime = _createServerRuntime(undefined);
    const element = {} as Element;

    expect(runtime.onLeave(element, vi.fn())).toBeUndefined();
    expect(Object.getOwnPropertySymbols(element)).toEqual([]);
  });

  it('reads the transfer state of the page, its own keys only', () => {
    const runtime = _createServerRuntime({ product: 42 });

    expect(runtime.getTransferState('product')).toBe(42);
    expect(runtime.getTransferState('toString')).toBeUndefined();
    expect(_createServerRuntime(undefined).getTransferState('product')).toBeUndefined();
  });

  it('holds the nonce of the response and the inline styles of the page around its root', () => {
    expect(_createServerRuntime(undefined, 'n')).toMatchObject({ nonce: 'n', styles: { blocks: null } });
    expect(_createServerRuntime(undefined).nonce).toBeUndefined();
  });
});

describe('_renderInTree', () => {
  it('renders with the inline styles of the tree, putting the ones around back, also when the rendering throws', () => {
    const runtime = _createServerRuntime(undefined);
    const page = runtime.styles;
    const tree = { blocks: null };

    const seen = _runOnServer(runtime, () => _renderInTree(tree, () => runtime.styles));
    _runOnServer(runtime, () => expect(() => _renderInTree(tree, () => {
      throw new Error('render failed');
    })).toThrow('render failed'));

    expect(seen).toBe(tree);
    expect(runtime.styles).toBe(page);
  });

  it('only renders outside of a page, without styles', () => {
    const browser = _getComponentRuntime();

    expect(_renderInTree(undefined, () => 'html')).toBe('html');
    expect(browser).not.toHaveProperty('styles');
  });
});

describe('_runOnServer', () => {
  it('runs the code with the runtime of the page', () => {
    const runtime = _createServerRuntime({ product: 42 });

    expect(_runOnServer(runtime, () => _getComponentRuntime())).toBe(runtime);
  });

  it('returns what the code returns and puts the previous runtime back, also when the code throws', () => {
    const browser = _getComponentRuntime();
    const runtime = _createServerRuntime(undefined);

    expect(_runOnServer(runtime, () => 'html')).toBe('html');
    expect(() => _runOnServer(runtime, () => {
      throw new Error('render failed');
    })).toThrow('render failed');
    expect(_getComponentRuntime()).toBe(browser);
  });
});
