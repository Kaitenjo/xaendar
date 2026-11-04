import { describe, expect, it } from 'vitest';
import { INTERNAL_HOST_EVENTS } from '../../costants';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { HostEvent } from './host-event.decorator';

/**
 * Applies `@HostEvent(name, options)` to a method, as the decorators of a class do, storing the listener in `metadata`.
 */
function decorate(name: string, options?: AddEventListenerOptions, metadata: DecoratorMetadataObject = {}, isStatic = false): WebComponentMetadata {
  const context = { kind: 'method', name: 'handle', static: isStatic, metadata, access: { get: (owner: Record<string, unknown>) => owner['handle'] } };
  (HostEvent(name, options) as unknown as (value: unknown, context: unknown) => void)(() => undefined, context);

  return metadata as WebComponentMetadata;
}

describe('HostEvent decorator', () => {
  it('stores a listener with its options, reading the decorated method', () => {
    const handle = () => undefined;
    const [listener] = decorate('keydown', { passive: true })[INTERNAL_HOST_EVENTS]!;

    expect(listener).toEqual({ name: 'keydown', options: { passive: true }, read: expect.any(Function) });
    expect(listener.read({ handle } as never)).toBe(handle);
  });

  it('adds the listeners of a class to the ones of its parent, leaving the parent untouched', () => {
    const parent = decorate('click');
    const child = decorate('focus', undefined, Object.create(parent));

    expect(parent[INTERNAL_HOST_EVENTS]!.map(({ name }) => name)).toEqual(['click']);
    expect(child[INTERNAL_HOST_EVENTS]!.map(({ name }) => name)).toEqual(['click', 'focus']);
  });

  it('throws for an empty name', () => {
    expect(() => HostEvent('')).toThrow('@HostEvent() names no event');
  });

  it('throws for a static method', () => {
    expect(() => decorate('click', undefined, {}, true)).toThrow('@HostEvent(\'click\') cannot decorate the static method handle');
  });
});
