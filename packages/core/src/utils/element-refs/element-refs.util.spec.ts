// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { _getElementRef, _setElementRef } from './element-refs.util';

describe('element refs', () => {
  it('gives the name of the ref naming an element', () => {
    const element = document.createElement('input');
    _setElementRef(element, 'field');

    expect(_getElementRef(element)).toBe('field');
  });

  it('gives nothing for an element no ref names', () => {
    expect(_getElementRef(document.createElement('input'))).toBeUndefined();
  });
});
