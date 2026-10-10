import { describe, expect, it } from 'vitest';
import { toNode, toWrapper, wrapNode } from './signal-node';

describe('wrapNode', () => {
  it('links a wrapper and its node in both directions, and returns the wrapper', () => {
    const node = { get: () => 1 } as unknown as Signal.State;
    const wrapper = () => 1;

    expect(wrapNode(wrapper, node)).toBe(wrapper);
    expect(toNode(wrapper)).toBe(node);
    expect(toWrapper(node)).toBe(wrapper);
  });
});

describe('toNode', () => {
  it.each([
    ['a function wrapping no node', () => 1],
    ['an object', {}],
    ['null', null],
    ['a primitive', 1]
  ])('returns %s as it is', (_name, value) => {
    expect(toNode(value)).toBe(value);
  });
});

describe('toWrapper', () => {
  it('returns a node no function wraps as it is', () => {
    const node = {};
    expect(toWrapper(node)).toBe(node);
  });
});
