import { describe, expect, it } from 'vitest';
import { stylesCss } from './styles-css';

describe('stylesCss()', () => {
  it('resets margin and sets full height on html and body', () => {
    const result = stylesCss();

    expect(result).toContain('margin: 0;');
    expect(result).toContain('height: 100%;');
  });

  it('sets box-sizing to border-box for all elements', () => {
    const result = stylesCss();

    expect(result).toContain('box-sizing: border-box;');
  });
});
