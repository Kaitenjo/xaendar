import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _getComponentRuntime, CustomElement } = await import('@xaendar/core');
const { _createServerRuntime, _runOnServer } = await import('./server-runtime.util');

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

  it('reads the transfer state of the page, its own keys only', () => {
    const runtime = _createServerRuntime({ product: 42 });

    expect(runtime.getTransferState('product')).toBe(42);
    expect(runtime.getTransferState('toString')).toBeUndefined();
    expect(_createServerRuntime(undefined).getTransferState('product')).toBeUndefined();
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
