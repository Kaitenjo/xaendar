import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _getComponentRuntime, CustomElement } = await import('@xaendar/core');
const { _runOnServer } = await import('./server-runtime.util');

class ProbeElement extends CustomElement { }
customElements.define('runtime-probe', ProbeElement);

describe('_runOnServer', () => {
  it('runs the code with effects that do not run and components that are constructed without being rendered', () => {
    const fn = vi.fn();

    const { stop, ref } = _runOnServer(() => {
      const runtime = _getComponentRuntime();
      return { stop: runtime.effect(fn), ref: runtime.createComponent(() => undefined as never, ProbeElement, { target: undefined as never }) };
    });

    expect(fn).not.toHaveBeenCalled();
    expect(stop()).toBeUndefined();
    expect(ref.element).toBeInstanceOf(ProbeElement);
    expect(ref.destroy()).toBeUndefined();
  });

  it('returns what the code returns and puts the previous runtime back, also when the code throws', () => {
    const browser = _getComponentRuntime();

    expect(_runOnServer(() => 'html')).toBe('html');
    expect(() => _runOnServer(() => {
      throw new Error('render failed');
    })).toThrow('render failed');
    expect(_getComponentRuntime()).toBe(browser);
  });
});
