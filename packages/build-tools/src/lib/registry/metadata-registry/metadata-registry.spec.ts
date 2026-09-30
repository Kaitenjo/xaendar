import type { ComponentOrDirectiveMetadata } from '@xaendar/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMetadataForFile, clearMetadataRegistry, getMetadata, getSelectorKey, getSelectorOwner, registerMetadata, registerSelectors, releaseSelector } from './metadata-registry';

const FOO_PATH = '/src/foo/foo.xd.component.ts';
const BAR_PATH = '/src/bar/bar.xd.component.ts';
const IDLE_TTL_MS = 5 * 60_000;
const SWEEP_INTERVAL_MS = 60_000;

function createMetadata(className: string, selector: string, ownerFile: string): ComponentOrDirectiveMetadata {
  return {
    className,
    selector,
    typescriptNodes: { klass: { getSourceFile: () => ({ fileName: ownerFile }) } }
  } as unknown as ComponentOrDirectiveMetadata;
}

beforeEach(() => {
  vi.useFakeTimers();
  clearMetadataRegistry();
});

afterEach(() => {
  clearMetadataRegistry();
  vi.useRealTimers();
});

describe('registerMetadata() / getMetadata()', () => {
  it('retrieves the metadata by class name and owner file', () => {
    const metadata = createMetadata('FooComponent', 'x-foo', FOO_PATH);
    registerMetadata('FooComponent', metadata);

    expect(getMetadata('FooComponent', FOO_PATH)).toBe(metadata);
    expect(getMetadata('FooComponent', BAR_PATH)).toBeUndefined();
    expect(getMetadata('BarComponent')).toBeUndefined();
  });

  it('retrieves the metadata by class name alone only when a single file declares the class', () => {
    const foo = createMetadata('SharedComponent', 'x-foo', FOO_PATH);
    registerMetadata('SharedComponent', foo);

    expect(getMetadata('SharedComponent')).toBe(foo);

    const bar = createMetadata('SharedComponent', 'x-bar', BAR_PATH);
    registerMetadata('SharedComponent', bar);

    expect(getMetadata('SharedComponent')).toBeUndefined();
    expect(getMetadata('SharedComponent', FOO_PATH)).toBe(foo);
    expect(getMetadata('SharedComponent', BAR_PATH)).toBe(bar);
  });

  it('ignores metadata without an owner file', () => {
    registerMetadata('FooComponent', createMetadata('FooComponent', 'x-foo', ''));

    expect(getMetadata('FooComponent')).toBeUndefined();
  });

  it('does not register the selectors as metadata keys', () => {
    registerMetadata('FooComponent', createMetadata('FooComponent', 'x-foo', FOO_PATH));

    expect(getMetadata('x-foo')).toBeUndefined();
  });
});

describe('registerSelectors() / getSelectorOwner()', () => {
  it('registers each component as the owner of its selector', () => {
    registerSelectors(createMetadata('FooComponent', 'x-foo', FOO_PATH), FOO_PATH);
    registerSelectors(createMetadata('OtherFooComponent', 'y-foo', FOO_PATH), FOO_PATH);

    expect(getSelectorOwner('x-foo')).toEqual({ ownerFile: FOO_PATH, className: 'FooComponent' });
    expect(getSelectorOwner('y-foo')).toEqual({ ownerFile: FOO_PATH, className: 'OtherFooComponent' });
    expect(getSelectorOwner('x-bar')).toBeUndefined();
  });

  it('retrieves the metadata of the component owning a selector, even when the class name is shared', () => {
    const foo = createMetadata('SharedComponent', 'x-foo', FOO_PATH);
    const bar = createMetadata('SharedComponent', 'x-bar', BAR_PATH);
    registerMetadata('SharedComponent', foo);
    registerMetadata('SharedComponent', bar);
    registerSelectors(foo, FOO_PATH);
    registerSelectors(bar, BAR_PATH);

    expect(getMetadata('x-foo')).toBe(foo);
    expect(getMetadata('x-bar', FOO_PATH)).toBe(bar);
  });

  it('retrieves no metadata for an owned selector whose class metadata is not registered', () => {
    registerSelectors(createMetadata('FooComponent', 'x-foo', FOO_PATH), FOO_PATH);

    expect(getMetadata('x-foo')).toBeUndefined();
  });

  it('replaces the previous owner, which no longer releases the selector when its file is cleared', () => {
    registerSelectors(createMetadata('FooComponent', 'x-shared', FOO_PATH), FOO_PATH);
    registerSelectors(createMetadata('BarComponent', 'x-shared', BAR_PATH), BAR_PATH);

    clearMetadataForFile(FOO_PATH);

    expect(getSelectorOwner('x-shared')).toEqual({ ownerFile: BAR_PATH, className: 'BarComponent' });
  });
});

describe('getSelectorKey()', () => {
  it('keys a component selector as the custom element name', () => {
    expect(getSelectorKey({ ...createMetadata('FooComponent', 'x-foo', FOO_PATH), type: 'component' } as ComponentOrDirectiveMetadata)).toBe('x-foo');
  });

  it('keys a directive selector as it is applied in templates', () => {
    expect(getSelectorKey({ ...createMetadata('FooDirective', 'x-foo', FOO_PATH), type: 'directive' } as ComponentOrDirectiveMetadata)).toBe('@@x-foo');
  });
});

describe('registerSelectors() with directives', () => {
  it('keeps a directive and a component sharing a selector apart', () => {
    const component = { ...createMetadata('FooComponent', 'x-foo', FOO_PATH), type: 'component' } as ComponentOrDirectiveMetadata;
    const directive = { ...createMetadata('FooDirective', 'x-foo', BAR_PATH), type: 'directive' } as ComponentOrDirectiveMetadata;
    registerSelectors(component, FOO_PATH);
    registerSelectors(directive, BAR_PATH);

    expect(getSelectorOwner('x-foo')).toEqual({ ownerFile: FOO_PATH, className: 'FooComponent' });
    expect(getSelectorOwner('@@x-foo')).toEqual({ ownerFile: BAR_PATH, className: 'FooDirective' });
  });
});

describe('releaseSelector()', () => {
  it('releases a selector, keeping the selectors of the other components of its file', () => {
    registerSelectors(createMetadata('FooComponent', 'x-foo', FOO_PATH), FOO_PATH);
    registerSelectors(createMetadata('OtherFooComponent', 'y-foo', FOO_PATH), FOO_PATH);

    releaseSelector('x-foo');

    expect(getSelectorOwner('x-foo')).toBeUndefined();
    expect(getSelectorOwner('y-foo')).toEqual({ ownerFile: FOO_PATH, className: 'OtherFooComponent' });

    clearMetadataForFile(FOO_PATH);

    expect(getSelectorOwner('y-foo')).toBeUndefined();
  });

  it('releases the last selector of a file', () => {
    registerSelectors(createMetadata('FooComponent', 'x-foo', FOO_PATH), FOO_PATH);

    releaseSelector('x-foo');
    registerSelectors(createMetadata('BarComponent', 'x-foo', BAR_PATH), BAR_PATH);
    clearMetadataForFile(FOO_PATH);

    expect(getSelectorOwner('x-foo')).toEqual({ ownerFile: BAR_PATH, className: 'BarComponent' });
  });

  it('does nothing for a selector without an owner', () => {
    expect(() => releaseSelector('x-foo')).not.toThrow();
  });
});

describe('clearMetadataForFile()', () => {
  it('removes the metadata and the selectors registered from the file only', () => {
    const foo = createMetadata('SharedComponent', 'x-foo', FOO_PATH);
    const bar = createMetadata('SharedComponent', 'x-bar', BAR_PATH);
    const fooOnly = createMetadata('FooOnlyComponent', 'x-foo-only', FOO_PATH);
    for (const [metadata, ownerFile] of [[foo, FOO_PATH], [bar, BAR_PATH], [fooOnly, FOO_PATH]] as const) {
      registerMetadata(metadata.className, metadata);
      registerSelectors(metadata, ownerFile);
    }

    clearMetadataForFile(FOO_PATH);

    expect(getMetadata('SharedComponent', FOO_PATH)).toBeUndefined();
    expect(getMetadata('FooOnlyComponent')).toBeUndefined();
    expect(getSelectorOwner('x-foo')).toBeUndefined();
    expect(getSelectorOwner('x-foo-only')).toBeUndefined();
    expect(getMetadata('SharedComponent')).toBe(bar);
    expect(getMetadata('x-bar')).toBe(bar);
  });

  it('does nothing for a file without registrations', () => {
    expect(() => clearMetadataForFile(FOO_PATH)).not.toThrow();
  });
});

describe('clearMetadataRegistry()', () => {
  it('removes every metadata and selector, stopping the idle sweep', () => {
    const metadata = createMetadata('FooComponent', 'x-foo', FOO_PATH);
    registerMetadata('FooComponent', metadata);
    registerSelectors(metadata, FOO_PATH);
    expect(vi.getTimerCount()).toBe(1);

    clearMetadataRegistry();

    expect(getMetadata('FooComponent')).toBeUndefined();
    expect(getSelectorOwner('x-foo')).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('idle sweep', () => {
  it('starts a single sweep timer, however many registrations', () => {
    registerMetadata('FooComponent', createMetadata('FooComponent', '', FOO_PATH));
    registerMetadata('BarComponent', createMetadata('BarComponent', '', BAR_PATH));

    expect(vi.getTimerCount()).toBe(1);
  });

  it('reclaims idle metadata, keeping the selector ownerships', () => {
    const metadata = createMetadata('FooComponent', 'x-foo', FOO_PATH);
    registerMetadata('FooComponent', metadata);
    registerSelectors(metadata, FOO_PATH);

    vi.advanceTimersByTime(IDLE_TTL_MS + SWEEP_INTERVAL_MS);

    expect(getMetadata('FooComponent')).toBeUndefined();
    expect(getMetadata('x-foo')).toBeUndefined();
    expect(getSelectorOwner('x-foo')).toEqual({ ownerFile: FOO_PATH, className: 'FooComponent' });
  });

  it('keeps the metadata accessed within the idle TTL, and the other metadata of their file', () => {
    const accessed = createMetadata('AccessedComponent', '', FOO_PATH);
    const idle = createMetadata('IdleComponent', '', FOO_PATH);
    registerMetadata('AccessedComponent', accessed);
    registerMetadata('IdleComponent', idle);

    vi.advanceTimersByTime(IDLE_TTL_MS - SWEEP_INTERVAL_MS);
    getMetadata('AccessedComponent');
    vi.advanceTimersByTime(2 * SWEEP_INTERVAL_MS);

    expect(getMetadata('IdleComponent')).toBeUndefined();
    expect(getMetadata('AccessedComponent')).toBe(accessed);

    // The reverse index of the file still tracks the kept metadata
    clearMetadataForFile(FOO_PATH);

    expect(getMetadata('AccessedComponent')).toBeUndefined();
  });
});
