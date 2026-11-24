import { describe, expect, it } from 'vitest';
import { getElementSelector } from './element-selector.utils';

describe('getElementSelector', () => {
  it('returns the is attribute of a customized built-in element', () => {
    expect(getElementSelector({ tagName: 'button', is: 'copy-button' })).toBe('copy-button');
  });

  it('returns the tag name of any other element', () => {
    expect(getElementSelector({ tagName: 'my-card' })).toBe('my-card');
    expect(getElementSelector({ tagName: 'div' })).toBe('div');
  });
});
