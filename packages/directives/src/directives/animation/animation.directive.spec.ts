// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

/**
 * The function each element registered with `onLeave`, which the runtime calls when it is about to remove it.
 */
const handlers = new Map<Element, (element: Element) => Promise<void> | void>();

vi.mock('@xaendar/core', async importOriginal => Object.assign({}, await importOriginal<object>(), {
  onLeave: (element: Element, handler: (element: Element) => Promise<void> | void) => handlers.set(element, handler)
}));

vi.mock('../../utils/element-animation/element-animation.utils', () => ({
  enterElement: vi.fn(),
  leaveElement: vi.fn(() => Promise.resolve())
}));

// The namespace keeps the type of the symbol, which destructuring widens
const core = await import('@xaendar/core');
const { _resolveDirective, _setInput, CustomDirective } = core;
const { enterElement, leaveElement } = await import('../../utils/element-animation/element-animation.utils');
const { AnimationDirective } = await import('./animation.directive');

/**
 * Creates the directive applied to a new element, with the inputs given, as a template binds them.
 */
function apply(inputs: Record<string, unknown>): { directive: InstanceType<typeof AnimationDirective>, element: HTMLElement } {
  const element = document.createElement('li');
  const directive = new AnimationDirective();
  directive[core._SET_DIRECTIVE_ELEMENT] = element;
  for (const name in inputs) {
    setInput(directive, name, inputs[name]);
  }

  return { directive, element };
}

/**
 * Sets an input of the directive, as a template binding a literal does.
 */
function setInput(directive: InstanceType<typeof AnimationDirective>, name: string, value: unknown): void {
  _setInput(undefined as never, directive, { name, value } as never);
}

afterEach(() => {
  handlers.clear();
  vi.clearAllMocks();
});

describe('AnimationDirective', () => {
  it('is the custom directive of the selector animation', () => {
    expect(_resolveDirective('animation', CustomDirective)).toBe(AnimationDirective);
  });

  it('starts the entry of the element with the animation of enter as it starts', () => {
    const slideIn = vi.fn();
    const { directive, element } = apply({ enter: 'fade-in' });
    const other = apply({ enter: slideIn, ignoreReducedMotion: true });

    directive.onInit();
    other.directive.onInit();

    expect(vi.mocked(enterElement).mock.calls).toEqual([[element, 'fade-in', false], [other.element, slideIn, true]]);
  });

  it('registers the exit of the element, reading the animation of leave when the element leaves', async () => {
    const { directive, element } = apply({ leave: 'fade-out' });
    directive.onInit();
    setInput(directive, 'leave', 'slide-out');
    setInput(directive, 'ignoreReducedMotion', true);

    const leaving = handlers.get(element)!(element);

    expect(leaving).toBeInstanceOf(Promise);
    expect(leaveElement).toHaveBeenCalledExactlyOnceWith(element, 'slide-out', true);
    await leaving;
  });

  it('registers no exit without an animation of leave as it starts', () => {
    const { directive, element } = apply({ enter: 'fade-in' });

    directive.onInit();

    expect(handlers.has(element)).toBe(false);
    expect(enterElement).toHaveBeenCalledExactlyOnceWith(element, 'fade-in', false);
  });
});
