// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import { effect } from '../../signals/effect/effect';
import { _createComponent } from '../create-component/create-component.util';
import { _ComponentRuntime, _getComponentRuntime, _setComponentRuntime } from './component-runtime.util';

class ProbeElement extends CustomElement { }
customElements.define('runtime-probe', ProbeElement);

class ProbeDirective extends CustomDirective { }

/**
 * A runtime whose effects and components are spies, returning the given disposer and reference.
 */
function createRuntime(): _ComponentRuntime & { stop: () => void } {
  const stop = vi.fn();
  return {
    stop,
    effect: vi.fn(() => stop),
    createComponent: vi.fn(() => ({ element: new ProbeElement(), destroy: vi.fn() })) as unknown as _ComponentRuntime['createComponent']
  };
}

describe('component runtime', () => {
  let previous: _ComponentRuntime | undefined;

  afterEach(() => {
    if (previous) {
      _setComponentRuntime(previous);
      previous = undefined;
    }
  });

  it('is the one of the browser by default', () => {
    const runtime = _getComponentRuntime();

    expect(runtime.effect).toBe(effect);
    expect(runtime.createComponent).toBe(_createComponent);
  });

  it('returns the runtime it replaces', () => {
    const browser = _getComponentRuntime();
    const runtime = createRuntime();

    previous = _setComponentRuntime(runtime);

    expect(previous).toBe(browser);
    expect(_getComponentRuntime()).toBe(runtime);
  });

  it('creates the effects and the components of a component through the runtime in use', () => {
    const runtime = createRuntime();
    previous = _setComponentRuntime(runtime);
    const element = new ProbeElement();
    const fn = vi.fn();
    const target = document.createElement('div');

    const dispose = element.effect(fn);
    const created = element.createComponent(ProbeElement, { target });
    dispose();

    expect(fn).not.toHaveBeenCalled();
    expect(runtime.effect).toHaveBeenCalledWith(fn, undefined);
    expect(runtime.stop).toHaveBeenCalledTimes(1);
    expect(runtime.createComponent).toHaveBeenCalledWith(expect.any(Function), ProbeElement, { target });
    expect(created.element).toBeInstanceOf(ProbeElement);
  });

  it('creates the effects and the components of a custom directive through the runtime in use', () => {
    const runtime = createRuntime();
    previous = _setComponentRuntime(runtime);
    const directive = new ProbeDirective();
    const fn = vi.fn();
    const target = document.createElement('div');

    directive.effect(fn);
    directive.createComponent(ProbeElement, { target });

    expect(fn).not.toHaveBeenCalled();
    expect(runtime.effect).toHaveBeenCalledWith(fn, undefined);
    expect(runtime.createComponent).toHaveBeenCalledWith(expect.any(Function), ProbeElement, { target });
  });
});
