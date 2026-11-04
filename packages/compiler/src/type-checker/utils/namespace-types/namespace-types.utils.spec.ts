import { describe, expect, it } from 'vitest';
import { getElementType, getEventMap } from './namespace-types.utils';

describe('getEventMap', () => {
  it.each([
    ['html', 'HTMLElementEventMap'],
    ['svg', 'SVGElementEventMap'],
    ['mathml', 'MathMLElementEventMap']
  ] as const)('types the events of the %s namespace through %s', (namespace, eventMap) => {
    expect(getEventMap(namespace)).toBe(eventMap);
  });
});

describe('getElementType', () => {
  it.each([
    ['html', 'input', '(HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement)'],
    ['svg', 'circle', '(SVGElementTagNameMap extends { \'circle\': infer Type } ? Type : SVGElement)'],
    ['mathml', 'mi', '(MathMLElementTagNameMap extends { \'mi\': infer Type } ? Type : MathMLElement)']
  ] as const)('types an element of the %s namespace through the tag name map of the namespace', (namespace, tagName, type) => {
    expect(getElementType(namespace, tagName)).toBe(type);
  });
});
