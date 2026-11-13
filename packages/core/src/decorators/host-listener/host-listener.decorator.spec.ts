import type { Function, MethodDecorator } from '@xaendar/types';
import { describe, expect, it } from 'vitest';
import { INTERNAL_HOST_LISTENERS } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { HostListener } from './host-listener.decorator';

/**
 * Applies `@HostListener(name, options)` to a method, as the decorators of a class do, storing the listener in
 * `metadata`.
 */
function decorate(name: string, options?: AddEventListenerOptions, metadata: DecoratorMetadataObject = {}, isStatic = false): WebComponentMetadata {
  const context = { kind: 'method', name: 'handle', static: isStatic, metadata, access: { get: (owner: Record<string, unknown>) => owner['handle'] } };
  (HostListener(name, options) as unknown as (value: unknown, context: unknown) => void)(() => undefined, context);

  return metadata as WebComponentMetadata;
}

describe('HostListener decorator', () => {
  it('stores a listener of the host element with its options, reading the decorated method', () => {
    const handle = () => undefined;
    const [listener] = decorate('keydown', { passive: true })[INTERNAL_HOST_LISTENERS]!;

    expect(listener).toEqual({ name: 'keydown', options: { passive: true }, read: expect.any(Function) });
    expect(listener.read({ handle } as never)).toBe(handle);
  });

  it('stores a listener of the window or of the document for a name prefixed by window: or document:', () => {
    expect(decorate('window:resize')[INTERNAL_HOST_LISTENERS]).toEqual([{ name: 'resize', target: 'window', options: undefined, read: expect.any(Function) }]);
    expect(decorate('document:keydown')[INTERNAL_HOST_LISTENERS]).toEqual([{ name: 'keydown', target: 'document', options: undefined, read: expect.any(Function) }]);
    expect(decorate('visualViewport:resize')[INTERNAL_HOST_LISTENERS]).toEqual([{ name: 'resize', target: 'visualViewport', options: undefined, read: expect.any(Function) }]);
    expect(decorate('htmx:load')[INTERNAL_HOST_LISTENERS]).toEqual([{ name: 'htmx:load', options: undefined, read: expect.any(Function) }]);
  });

  it('adds the listeners of a class to the ones of its parent, leaving the parent untouched', () => {
    const parent = decorate('click');
    const child = decorate('focus', undefined, Object.create(parent));

    expect(parent[INTERNAL_HOST_LISTENERS]!.map(({ name }) => name)).toEqual(['click']);
    expect(child[INTERNAL_HOST_LISTENERS]!.map(({ name }) => name)).toEqual(['click', 'focus']);
  });

  it.each(['', 'window:', 'document:', 'visualViewport:'])('throws for %j, which names no event', name => {
    expect(() => HostListener(name)).toThrow(`@HostListener('${name}') names no event`);
  });

  it('throws for a static method', () => {
    expect(() => decorate('click', undefined, {}, true)).toThrow('@HostListener(\'click\') cannot decorate the static method handle');
  });
});

describe('types of @HostListener', () => {
  /**
   * The decorator of a method of a directive: assigning a decorator to it checks it as TypeScript checks a decorator
   * applied to the method.
   */
  type DecoratorOf<Method extends Function> = Function<Parameters<MethodDecorator<CustomDirective, Method, WebComponentMetadata>>, void>;

  it('types the event by its name, through the event maps of the element, of the window and of the document', () => {
    const check = () => {
      const click: DecoratorOf<(event: MouseEvent) => void> = HostListener('click');
      const anyClick: DecoratorOf<(event: Event) => void> = HostListener('click');
      const nothing: DecoratorOf<() => void> = HostListener('click');
      const keydown: DecoratorOf<(event: KeyboardEvent) => Promise<void>> = HostListener('keydown');
      const resize: DecoratorOf<(event: UIEvent) => void> = HostListener('window:resize');
      const storage: DecoratorOf<(event: StorageEvent) => void> = HostListener('window:storage');
      const keyup: DecoratorOf<(event: KeyboardEvent) => void> = HostListener('document:keyup');
      const changed: DecoratorOf<(event: CustomEvent<number>) => void> = HostListener('changed');
      // @ts-expect-error a click is not a keyboard event
      const wrongClick: DecoratorOf<(event: KeyboardEvent) => void> = HostListener('click');
      // @ts-expect-error a resize of the window is not a storage event
      const wrongResize: DecoratorOf<(event: StorageEvent) => void> = HostListener('window:resize');
      // @ts-expect-error a keydown of the document is not a pointer event
      const wrongKeydown: DecoratorOf<(event: PointerEvent) => void> = HostListener('document:keydown');
      // @ts-expect-error the method receives an event
      const wrongValue: DecoratorOf<(value: number) => void> = HostListener('click');
      return [click, anyClick, nothing, keydown, resize, storage, keyup, changed, wrongClick, wrongResize, wrongKeydown, wrongValue];
    };

    expect(check).toBeTypeOf('function');
  });
});
