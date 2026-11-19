import { describe, expect, it } from 'vitest';
import { minifyCss } from './minify-css.utils';

describe('minifyCss()', () => {
  it('strips whitespace and shortens values', () => {
    expect(minifyCss('.a {\n  color: #ff0000;\n  margin: 0px;\n}\n', 'a.css')).toBe('.a{color:red;margin:0}');
  });

  it('throws on invalid CSS', () => {
    expect(() => minifyCss('.a { color: red; } }', 'a.css')).toThrow();
  });
});
