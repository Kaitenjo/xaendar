import { describe, expect, it } from 'vitest';
import { INTERNAL_HOST_PROPERTIES } from '../../costants';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { Signal } from '../../signals/types/signal.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { HostProperty } from './host-property.decorator';

/**
 * Applies `@HostProperty(name)` to a member, as the decorators of a class do, storing the binding in `metadata`.
 */
function decorate(name: string, metadata: DecoratorMetadataObject = {}, member = 'value', isStatic = false): WebComponentMetadata {
  const context = { kind: 'field', name: member, static: isStatic, metadata, access: { get: (owner: Record<string, unknown>) => owner[member] } };
  (HostProperty(name) as unknown as (value: undefined, context: unknown) => void)(undefined, context);

  return metadata as WebComponentMetadata;
}

describe('HostProperty decorator', () => {
  it('stores an attribute binding, reading the decorated member', () => {
    const [binding] = decorate('aria-label')[INTERNAL_HOST_PROPERTIES]!;

    expect(binding).toEqual({ name: 'aria-label', kind: 'attribute', read: expect.any(Function) });
    expect(binding.read({ value: 'Close' } as never)).toBe('Close');
  });

  it('stores a class binding for a name starting with class.', () => {
    expect(decorate('class.is-active')[INTERNAL_HOST_PROPERTIES]).toEqual([{ name: 'is-active', kind: 'class', read: expect.any(Function) }]);
  });

  it('stores a style binding for a name starting with style., in kebab-case or camelCase, with its unit, or a custom property', () => {
    expect(decorate('style.width.px')[INTERNAL_HOST_PROPERTIES]).toEqual([{ name: 'width', kind: 'style', unit: 'px', read: expect.any(Function) }]);
    expect(decorate('style.backgroundColor')[INTERNAL_HOST_PROPERTIES]).toEqual([{ name: 'background-color', kind: 'style', read: expect.any(Function) }]);
    expect(decorate('style.--accent')[INTERNAL_HOST_PROPERTIES]).toEqual([{ name: '--accent', kind: 'style', read: expect.any(Function) }]);
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
    expect(() => HostProperty('style.')).toThrow('@HostProperty(\'style.\') names no style property');
    expect(() => HostProperty('style.width.px.em')).toThrow('@HostProperty(\'style.width.px.em\') names no style property');
  });

  it('throws for a static member', () => {
    expect(() => decorate('role', {}, 'role', true)).toThrow('@HostProperty(\'role\') cannot decorate the static member role');
  });

  it('stores the strings of class and style, without name', () => {
    expect(decorate('class')[INTERNAL_HOST_PROPERTIES]).toEqual([{ name: '', kind: 'class', read: expect.any(Function) }]);
    expect(decorate('style')[INTERNAL_HOST_PROPERTIES]).toEqual([{ name: '', kind: 'style', read: expect.any(Function) }]);
  });

  it('throws for a unit CSS does not have', () => {
    expect(() => HostProperty('style.width.foo')).toThrow('@HostProperty(\'style.width.foo\') sets width in "foo", which is not a unit of CSS');
  });

  it('throws when the class binds the same class, property or string twice', () => {
    const metadata = decorate('class.on', {}, 'first');
    expect(() => decorate('class.on', metadata, 'second')).toThrow('@HostProperty(\'class.on\') on second binds the class on, which another member binds already');
    decorate('style.width.px', metadata, 'width');
    expect(() => decorate('style.width', metadata, 'other')).toThrow('binds the style property width, which another member binds already');
    decorate('style', metadata, 'layout');
    expect(() => decorate('style', metadata, 'again')).toThrow('binds the string of style, which another member binds already');
    expect(() => decorate('role', decorate('role', {}, 'one'), 'two')).not.toThrow();
  });
});

describe('types of @HostProperty', () => {
  /**
   * The context TypeScript passes the decorator of a field of a directive holding a value of a type: calling a decorator
   * with it checks it as TypeScript checks a decorator applied to the field. Never called.
   */
  const contextOf = <Value>() => undefined as unknown as ClassFieldDecoratorContext<CustomDirective, Value> & { metadata: WebComponentMetadata };

  it('types the member by the name: strings for class and style, numbers for a property with a unit', () => {
    const check = () => {
      HostProperty('class')(undefined, contextOf<string | null>());
      HostProperty('style')(undefined, contextOf<Signal<string | undefined>>());
      HostProperty('style.width.px')(undefined, contextOf<number>());
      HostProperty('style.color')(undefined, contextOf<string | number | null>());
      HostProperty('style.--size')(undefined, contextOf<number>());
      HostProperty('class.on')(undefined, contextOf<{ any: true }>());
      HostProperty('aria-hidden')(undefined, contextOf<boolean>());
      // @ts-expect-error the string of class is a string
      HostProperty('class')(undefined, contextOf<number>());
      // @ts-expect-error a property with a unit takes a number
      HostProperty('style.width.px')(undefined, contextOf<string>());
      // @ts-expect-error a property takes a string or a number
      HostProperty('style.color')(undefined, contextOf<boolean>());
    };

    expect(check).toBeTypeOf('function');
  });
});
