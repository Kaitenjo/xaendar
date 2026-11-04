import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _ssrItemMarker, _ssrItems } = await import('./ssr-items.util');

describe('_ssrItems', () => {
  it('iterates the items of an array', () => {
    const items = ['a', 'b'];

    expect(_ssrItems(items)).toBe(items);
  });

  it('iterates 0, 1, …, n - 1 for a number n', () => {
    expect(_ssrItems(3)).toEqual([0, 1, 2]);
    expect(_ssrItems(0)).toEqual([]);
  });
});

describe('_ssrItemMarker', () => {
  it('writes the key of a number and of a string apart, so that 1 and \'1\' stay distinct', () => {
    expect(_ssrItemMarker(1)).toBe('<!--xd-item:n1-->');
    expect(_ssrItemMarker('1')).toBe('<!--xd-item:s1-->');
  });

  it('encodes a string as a URI component, so that no key ends the comment early', () => {
    expect(_ssrItemMarker('a b-->c')).toBe('<!--xd-item:sa%20b--%3Ec-->');
  });
});
