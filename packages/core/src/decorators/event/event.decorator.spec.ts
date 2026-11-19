// @vitest-environment happy-dom
import { ClassAccessorDecoratorValue } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_EVENTS } from '../../costants';
import { EventOptions } from '../../models';
import { Output } from '../../models/output/output';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { Event } from '../event/event.decorator';

type Decorated<ReturnType> = { get(this: Element): Output<ReturnType> };

/**
 * The getter and the setter of an accessor, backed by a storage per instance, as the private field of a real accessor.
 */
function createTarget() {
  const storage = new WeakMap<object, unknown>();
  return {
    get(this: object) {
      return storage.get(this);
    },
    set: vi.fn(function (this: object, value: unknown) {
      storage.set(this, value);
    })
  };
}

function decorate<ReturnType = unknown>(name: string | symbol = 'clicked', options?: Parameters<typeof Event>[0], target = createTarget(), metadata: Partial<WebComponentMetadata> = {}): Decorated<ReturnType> {
  const decorator = Event<ReturnType>(options);
  const decorated = decorator(target as unknown as ClassAccessorDecoratorValue<Output<ReturnType>>, { name, metadata } as unknown as Parameters<typeof decorator>[1]);
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

  const output = decorated.get.call(element);

  return { output, dispatch: output.dispatch, listener };
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

  it('registers the name of the event in the metadata of the class', () => {
    const metadata: Partial<WebComponentMetadata> = {};
    decorate('clicked', undefined, createTarget(), metadata);
    decorate('closed', undefined, createTarget(), metadata);

    expect(metadata[INTERNAL_EVENTS]).toEqual(new Set(['clicked', 'closed']));
  });

  it('creates the output of an instance only when the accessor is first read, keeping it in its storage', () => {
    const target = createTarget();
    const decorated = decorate('clicked', undefined, target);
    const element = document.createElement('div');
    expect(target.set).not.toHaveBeenCalled();

    const output = decorated.get.call(element);
    decorated.get.call(element);

    expect(target.set).toHaveBeenCalledOnce();
    expect(target.get.call(element)).toBe(output);
  });

  it('creates a separate output for each instance, dispatching on its own element', () => {
    const decorated = decorate<number>();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const firstListener = listen(first);
    const secondListener = listen(second);

    const firstOutput = decorated.get.call(first);
    const secondOutput = decorated.get.call(second);
    expect(firstOutput).not.toBe(secondOutput);
    expect(decorated.get.call(first)).toBe(firstOutput);

    firstOutput.dispatch(1);
    expect(lastEvent(firstListener).detail).toBe(1);
    expect(secondListener).not.toHaveBeenCalled();

    secondOutput.dispatch(2);
    expect(lastEvent(secondListener).detail).toBe(2);
    expect(firstListener).toHaveBeenCalledTimes(1);
  });

  it('dispatches a CustomEvent named after the accessor with the value as detail', () => {
    const { dispatch, listener } = setup();
    dispatch({ id: 1 });

    const event = lastEvent(listener);
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.detail).toEqual({ id: 1 });
  });

  it('dispatches without detail when called with no arguments', () => {
    const { dispatch, listener } = setup<void>();
    dispatch();

    expect(lastEvent(listener).detail).toBeNull();
  });

  it('uses primitive values as detail', () => {
    const { dispatch, listener } = setup();
    dispatch(5);

    expect(lastEvent(listener).detail).toBe(5);
  });

  it('applies the default options', () => {
    const { dispatch, listener } = setup('clicked', { bubbles: true });
    dispatch('x');

    expect(lastEvent(listener).bubbles).toBe(true);
    expect(lastEvent(listener).cancelable).toBe(false);
  });

  it('overrides the default options with the ones passed alongside the value', () => {
    const { dispatch, listener } = setup('clicked', { bubbles: true });
    dispatch('x', new EventOptions({ bubbles: false, cancelable: true }));

    const event = lastEvent(listener);
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(true);
    expect(event.detail).toBe('x');
  });

  it.each(['bubbles', 'cancelable', 'composed'] as const)('takes an EventOptions instance for the options of the dispatch, with %s', key => {
    const { dispatch, listener } = setup('clicked', { bubbles: false });
    dispatch(new EventOptions({ [key]: true }));

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
    const { dispatch, listener } = setup('clicked', { bubbles: false });
    dispatch(detail);

    const event = lastEvent(listener);
    expect(event.detail).toEqual(detail);
    expect([event.bubbles, event.cancelable, event.composed]).toEqual([false, false, false]);
  });
});
