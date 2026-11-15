import { describe, expect, it } from 'vitest';
import { createAttributePolicy, createNamePolicy, isAllowedAttribute, isAllowedName } from './html-name-policy.utils';

/**
 * The names allowed by default in these specs.
 */
const defaults: ReadonlySet<string> = new Set(['a', 'b']);

describe('createNamePolicy', () => {
  it('keeps the default names and prefixes without options', () => {
    const policy = createNamePolicy(defaults, ['aria-'], undefined, []);

    expect(policy).toEqual({ allowed: defaults, allowedPrefixes: ['aria-'], removed: null, removedPrefixes: null });
    expect(policy.allowed).toBe(defaults);
  });

  it('adds the names and the prefixes allowed, lowercase, without changing the default ones', () => {
    const policy = createNamePolicy(defaults, ['aria-'], ['Style', 'DATA-*'], undefined);

    expect(policy.allowed).toEqual(new Set(['a', 'b', 'style']));
    expect(policy.allowedPrefixes).toEqual(['aria-', 'data-']);
    expect(defaults).toEqual(new Set(['a', 'b']));
    expect(createNamePolicy(defaults, null, ['x-*'], undefined).allowedPrefixes).toEqual(['x-']);
  });

  it('collects the names and the prefixes removed, lowercase', () => {
    const policy = createNamePolicy(defaults, null, undefined, ['A', 'b', 'aria-*', 'X-*']);

    expect(policy.removed).toEqual(new Set(['a', 'b']));
    expect(policy.removedPrefixes).toEqual(['aria-', 'x-']);
  });
});

describe('isAllowedName', () => {
  it('allows the names allowed, by name or by prefix', () => {
    const policy = createNamePolicy(defaults, ['aria-'], ['data-*'], undefined);

    expect(['a', 'aria-label', 'data-id', 'data-x.y:z_1'].every(name => isAllowedName(policy, name))).toBe(true);
    expect(['c', 'data-"x', 'data-x y', 'arialabel'].some(name => isAllowedName(policy, name))).toBe(false);
  });

  it('refuses the names removed, by name or by prefix, although allowed', () => {
    const policy = createNamePolicy(defaults, ['aria-'], ['data-*'], ['a', 'aria-hidden', 'data-secret*']);

    expect(['a', 'aria-hidden', 'data-secret-key'].some(name => isAllowedName(policy, name))).toBe(false);
    expect(['b', 'aria-label', 'data-id'].every(name => isAllowedName(policy, name))).toBe(true);
  });
});

describe('createAttributePolicy', () => {
  it('has no attributes of an element only without element[attribute] in the options', () => {
    const policy = createAttributePolicy(defaults, ['aria-'], ['style'], undefined);

    expect(policy.global.allowed).toEqual(new Set(['a', 'b', 'style']));
    expect(policy.scoped).toBeNull();
    expect(createAttributePolicy(defaults, null, undefined, undefined).scoped).toBeNull();
  });

  it('separates the attributes of an element only, as element[attribute, lowercase', () => {
    const policy = createAttributePolicy(defaults, null, ['Span[Style]', 'img[data-*]', 'title'], ['a[target]']);

    expect(policy.global.allowed).toEqual(new Set(['a', 'b', 'title']));
    expect(policy.scoped).toEqual({ allowed: new Set(['span[style']), allowedPrefixes: ['img[data-'], removed: new Set(['a[target']), removedPrefixes: null });
    expect(createAttributePolicy(defaults, null, undefined, ['a[target]']).scoped?.removed).toEqual(new Set(['a[target']));
  });
});

describe('isAllowedAttribute', () => {
  it('allows an attribute listed for an element on that element only', () => {
    const policy = createAttributePolicy(defaults, ['aria-'], ['span[style]', 'img[data-*]'], undefined);

    expect(isAllowedAttribute(policy, 'span', 'style')).toBe(true);
    expect(isAllowedAttribute(policy, 'div', 'style')).toBe(false);
    expect(isAllowedAttribute(policy, 'img', 'data-id')).toBe(true);
    expect(isAllowedAttribute(policy, 'img', 'data-"x')).toBe(false);
    expect(isAllowedAttribute(policy, 'p', 'data-id')).toBe(false);
    expect(isAllowedAttribute(policy, 'p', 'aria-label')).toBe(true);
  });

  it('removes an attribute listed for an element from that element only, and a global one from every element', () => {
    const policy = createAttributePolicy(defaults, null, ['span[style]', 'target'], ['a[target]', 'b', 'span[x-*]']);

    expect(isAllowedAttribute(policy, 'a', 'target')).toBe(false);
    expect(isAllowedAttribute(policy, 'area', 'target')).toBe(true);
    expect(isAllowedAttribute(policy, 'span', 'b')).toBe(false);
    expect(isAllowedAttribute(policy, 'span', 'style')).toBe(true);
  });

  it('allows the attributes of every element as isAllowedName does, without attributes of an element only', () => {
    const policy = createAttributePolicy(defaults, null, ['style'], ['b']);

    expect(isAllowedAttribute(policy, 'div', 'style')).toBe(true);
    expect(isAllowedAttribute(policy, 'div', 'b')).toBe(false);
  });
});
