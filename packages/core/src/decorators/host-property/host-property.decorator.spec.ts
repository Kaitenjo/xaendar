import { describe, expect, it } from 'vitest';
import { INTERNAL_HOST_PROPERTIES } from '../../costants';
import type { HostMetadata } from '../../types/host/host-metadata.type';
import { HostProperty } from './host-property.decorator';

/**
 * Applies `@HostProperty(name)` to a member, as the decorators of a class do, storing the binding in `metadata`.
 */
function decorate(name: string, metadata: DecoratorMetadataObject = {}, member = 'value', isStatic = false): HostMetadata {
  const context = { kind: 'field', name: member, static: isStatic, metadata, access: { get: (owner: Record<string, unknown>) => owner[member] } };
  (HostProperty(name) as unknown as (value: undefined, context: unknown) => void)(undefined, context);

  return metadata as HostMetadata;
}

describe('HostProperty decorator', () => {
  it('stores an attribute binding, reading the decorated member', () => {
    const [binding] = decorate('aria-label')[INTERNAL_HOST_PROPERTIES]!;

    expect(binding).toEqual({ name: 'aria-label', isClass: false, read: expect.any(Function) });
    expect(binding.read({ value: 'Close' } as never)).toBe('Close');
  });

  it('stores a class binding for a name starting with class.', () => {
    expect(decorate('class.is-active')[INTERNAL_HOST_PROPERTIES]).toEqual([{ name: 'is-active', isClass: true, read: expect.any(Function) }]);
  });

  it('adds the bindings of a class to the ones of its parent, leaving the parent untouched', () => {
    const parent = decorate('role');
    decorate('title', parent, 'label');
    const child = decorate('class.on', Object.create(parent));

    expect(parent[INTERNAL_HOST_PROPERTIES]!.map(({ name }) => name)).toEqual(['role', 'title']);
    expect(child[INTERNAL_HOST_PROPERTIES]!.map(({ name }) => name)).toEqual(['role', 'title', 'on']);
  });

  it('throws for a name naming no attribute or no class', () => {
    expect(() => HostProperty('')).toThrow('@HostProperty(\'\') names no attribute');
    expect(() => HostProperty('class.')).toThrow('@HostProperty(\'class.\') names no class');
  });

  it('throws for a static member', () => {
    expect(() => decorate('role', {}, 'role', true)).toThrow('@HostProperty(\'role\') cannot decorate the static member role');
  });
});
