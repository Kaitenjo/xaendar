// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { BaseWebComponent } from '../directives/base-web-component';
import type { Output } from '../types/event/output.type';
import { Event } from './event.decorator';

type Emit = (valueOrOptions?: unknown, options?: unknown) => void;

function setup(name: string | symbol = 'clicked', options?: Parameters<typeof Event>[0]) {
  const initializers = new Array<(this: unknown) => void>();
  const context = {
    name,
    addInitializer: (fn: (this: unknown) => void) => initializers.push(fn)
  } as unknown as ClassAccessorDecoratorContext<BaseWebComponent, Output<unknown>>;

  const element = document.createElement('div');
  const listener = vi.fn();
  element.addEventListener('clicked', listener);

  const decorated = (Event(options) as unknown as (value: unknown, context: unknown) => { get(): Output<unknown> })(undefined, context);
  initializers.forEach(fn => fn.call(element));

  const emit = decorated.get().emit as unknown as Emit;
  return { emit: (...args: Parameters<Emit>) => emit.call(element, ...args), listener };
}

function lastEvent(listener: ReturnType<typeof vi.fn>): CustomEvent {
  return listener.mock.calls.at(-1)![0];
}

describe('Event decorator', () => {
  it('throws for symbol names', () => {
    expect(() => setup(Symbol('clicked'))).toThrow('Symbol properties are not supported as event names');
  });

  it('dispatches a CustomEvent named after the accessor with the value as detail', () => {
    const { emit, listener } = setup();
    emit({ id: 1 });

    const event = lastEvent(listener);
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.detail).toEqual({ id: 1 });
  });

  it('dispatches without detail when called with no arguments', () => {
    const { emit, listener } = setup();
    emit();

    expect(lastEvent(listener).detail).toBeNull();
  });

  it('uses primitive values as detail', () => {
    const { emit, listener } = setup();
    emit(5);

    expect(lastEvent(listener).detail).toBe(5);
  });

  it('treats objects without event option keys as detail', () => {
    const { emit, listener } = setup();
    emit({ foo: 'bar' });

    expect(lastEvent(listener).detail).toEqual({ foo: 'bar' });
  });

  it('applies the default options', () => {
    const { emit, listener } = setup('clicked', { bubbles: true });
    emit('x');

    expect(lastEvent(listener).bubbles).toBe(true);
    expect(lastEvent(listener).cancelable).toBe(false);
  });

  it('overrides the default options with the ones passed alongside the value', () => {
    const { emit, listener } = setup('clicked', { bubbles: true });
    emit('x', { bubbles: false, cancelable: true });

    const event = lastEvent(listener);
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(true);
    expect(event.detail).toBe('x');
  });

  it.each(['bubbles', 'cancelable', 'composed'] as const)('recognises an options-only emission with %s', key => {
    const { emit, listener } = setup('clicked', { bubbles: false });
    emit({ [key]: true });

    const event = lastEvent(listener);
    expect(event[key]).toBe(true);
    expect(event.detail).toBeNull();
  });
});
