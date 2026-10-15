// @vitest-environment happy-dom
import { ClassAccessorDecoratorValue } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { CustomElement, EventOptions } from '../../models';
import { Output } from '../../models/output/output';
import { Event } from '../event/event.decorator';

type Decorated<ReturnType> = { init(this: Element): Output<ReturnType> };

function decorate<ReturnType = unknown>(name: string | symbol = 'clicked', options?: Parameters<typeof Event>[0]): Decorated<ReturnType> {
  const context = { name } as unknown as ClassAccessorDecoratorContext<CustomElement, Output<unknown>>;
  const decorated = Event<ReturnType>(options)({} as ClassAccessorDecoratorValue<Output<ReturnType>>, context);
  return decorated as unknown as Decorated<ReturnType>;
}

function listen(element: Element): ReturnType<typeof vi.fn> {
  const listener = vi.fn();
  element.addEventListener('clicked', listener);
  return listener;
}

function setup<ReturnType = unknown>(name: string | symbol = 'clicked', options?: Parameters<typeof Event>[0]) {
  const decorated = decorate<ReturnType>(name, options);
  const element = document.createElement('div');
  const listener = listen(element);

  const output = decorated.init.call(element);

  return { output, emit: output.emit, listener };
}

function lastEvent(listener: ReturnType<typeof vi.fn>): CustomEvent {
  return listener.mock.calls.at(-1)![0];
}

describe('Event decorator', () => {
  it('throws for symbol names', () => {
    expect(() => setup(Symbol('clicked'))).toThrow('Symbol properties are not supported as event names');
  });

  it('creates an Output', () => {
    const { output } = setup();

    expect(output).toBeInstanceOf(Output);
  });

  it('creates a separate output for each instance, dispatching on its own element', () => {
    const decorated = decorate<number>();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const firstListener = listen(first);
    const secondListener = listen(second);

    const firstOutput = decorated.init.call(first);
    const secondOutput = decorated.init.call(second);
    expect(firstOutput).not.toBe(secondOutput);

    firstOutput.emit(1);
    expect(lastEvent(firstListener).detail).toBe(1);
    expect(secondListener).not.toHaveBeenCalled();

    secondOutput.emit(2);
    expect(lastEvent(secondListener).detail).toBe(2);
    expect(firstListener).toHaveBeenCalledTimes(1);
  });

  it('dispatches a CustomEvent named after the accessor with the value as detail', () => {
    const { emit, listener } = setup();
    emit({ id: 1 });

    const event = lastEvent(listener);
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.detail).toEqual({ id: 1 });
  });

  it('dispatches without detail when called with no arguments', () => {
    const { emit, listener } = setup<void>();
    emit();

    expect(lastEvent(listener).detail).toBeNull();
  });

  it('uses primitive values as detail', () => {
    const { emit, listener } = setup();
    emit(5);

    expect(lastEvent(listener).detail).toBe(5);
  });

  it('applies the default options', () => {
    const { emit, listener } = setup('clicked', { bubbles: true });
    emit('x');

    expect(lastEvent(listener).bubbles).toBe(true);
    expect(lastEvent(listener).cancelable).toBe(false);
  });

  it('overrides the default options with the ones passed alongside the value', () => {
    const { emit, listener } = setup('clicked', { bubbles: true });
    emit('x', new EventOptions({ bubbles: false, cancelable: true }));

    const event = lastEvent(listener);
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(true);
    expect(event.detail).toBe('x');
  });

  it.each(['bubbles', 'cancelable', 'composed'] as const)('takes an EventOptions instance for the options of the emission, with %s', key => {
    const { emit, listener } = setup('clicked', { bubbles: false });
    emit(new EventOptions({ [key]: true }));

    const event = lastEvent(listener);
    expect(event[key]).toBe(true);
    expect(event.detail).toBeNull();
  });

  it.each([
    ['without option keys', { foo: 'bar' }],
    ['with only option keys', { bubbles: true, cancelable: true, composed: true }],
    ['with option keys and other keys', { bubbles: true, value: 1 }],
    ['empty', {}]
  ])('takes a plain object %s for the detail', (_case, detail) => {
    const { emit, listener } = setup('clicked', { bubbles: false });
    emit(detail);

    const event = lastEvent(listener);
    expect(event.detail).toEqual(detail);
    expect([event.bubbles, event.cancelable, event.composed]).toEqual([false, false, false]);
  });
});
