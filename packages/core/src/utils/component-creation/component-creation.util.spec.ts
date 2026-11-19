// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { _ComponentRuntime } from '../../types/component-runtime.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('../../signals');
const { input } = await import('../../signals/input/input');
const { CustomElement } = await import('../../models/custom-element/custom-element');
const { _scope, EMPTY_LAYOUT } = await import('../context/context.util');
const { _defineRender } = await import('../render-registry/render-registry.util');
const { _getComponentRuntime, _setComponentRuntime } = await import('../component-runtime/component-runtime.util');
const { createComponent } = await import('./component-creation.util');

/**
 * Waits for the effects scheduled by a signal change to run.
 */
const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * Component declaring an input, registered as `@WebComponent` does, with an empty render function.
 */
class Greeting extends CustomElement {
  public readonly name = input<string>('');
}
Object.defineProperty(Greeting, Symbol.for('Symbol.metadata'), { value: { selector: 'x-standalone-greeting', aliasToAttribute: { name: 'name' } } });
_defineRender(Greeting, () => _scope(null, EMPTY_LAYOUT));
customElements.define('x-standalone-greeting', Greeting);

afterEach(() => {
  document.body.replaceChildren();
});

describe('createComponent()', () => {
  it('creates a component owned by nothing, binding its inputs until it is destroyed', async () => {
    const name = signal('Ada');
    const ref = createComponent(Greeting, { target: document.body, properties: [{ name: () => name() }] });

    expect(ref.element).toBeInstanceOf(Greeting);
    expect(ref.element.parentNode).toBe(document.body);
    expect(ref.element.name()).toBe('Ada');

    name.set('Grace');
    await flush();
    expect(ref.element.name()).toBe('Grace');

    ref.destroy();
    expect(ref.element.isConnected).toBe(false);
    name.set('Linus');
    await flush();
    expect(ref.element.name()).toBe('Grace');
  });

  it('creates the component through the runtime of the components, which the server replaces, with no owner', () => {
    const element = new Greeting();
    const runtime = { ..._getComponentRuntime(), createComponent: vi.fn(() => ({ element, destroy: vi.fn() })) } as unknown as _ComponentRuntime;
    const previous = _setComponentRuntime(runtime);
    const options = { target: document.body };

    try {
      expect(createComponent(Greeting, options).element).toBe(element);
      expect(runtime.createComponent).toHaveBeenCalledExactlyOnceWith(null, Greeting, options);
    } finally {
      _setComponentRuntime(previous);
    }
  });
});
