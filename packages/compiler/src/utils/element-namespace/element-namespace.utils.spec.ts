import { describe, expect, it } from 'vitest';
import { getChildrenNamespace, getElementNamespace } from './element-namespace.utils';

describe('getElementNamespace', () => {
  it.each([
    ['an <svg>', 'svg', 'html', 'svg'],
    ['a <math>', 'math', 'html', 'mathml'],
    ['an element inside an <svg>', 'circle', 'svg', 'svg'],
    ['an HTML element', 'div', 'html', 'html']
  ] as const)('creates %s in its namespace', (_description, tagName, namespace, expected) => {
    expect(getElementNamespace(tagName, namespace)).toBe(expected);
  });
});

describe('getChildrenNamespace', () => {
  it('creates the children of a <foreignObject> as HTML elements', () => {
    expect(getChildrenNamespace('foreignObject', 'svg')).toBe('html');
  });

  it('creates the children of any other element in the namespace of the element', () => {
    expect(getChildrenNamespace('g', 'svg')).toBe('svg');
    expect(getChildrenNamespace('mi', 'mathml')).toBe('mathml');
  });
});
