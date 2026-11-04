import { describe, expect, it } from 'vitest';
import { styles } from './styles';

describe('styles()', () => {
  it.each([['css'], ['scss'], ['less']] as const)('resets margin and sets full height on html and body, in the %s syntax', style => {
    const result = styles(style);

    expect(result).toContain('margin: 0;');
    expect(result).toContain('height: 100%;');
  });

  it('sets box-sizing to border-box for all elements', () => {
    const result = styles('css');

    expect(result).toContain('box-sizing: border-box;');
  });

  it('uses the indented syntax, without braces and semicolons, for sass', () => {
    const result = styles('sass');

    expect(result).toBe('html, body\n  margin: 0\n  height: 100%\n\n*\n  box-sizing: border-box\n');
  });
});
