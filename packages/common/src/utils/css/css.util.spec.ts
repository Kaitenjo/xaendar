import { describe, expect, it } from 'vitest';
import { CSS_UNITS, parseStyleDeclarations, splitClasses, styleValue, stylePriority, toCssPropertyName } from './css.util';

describe('CSS_UNITS', () => {
  it('holds the units of CSS in lowercase, and %', () => {
    expect(['px', 'rem', 'em', '%', 'vh', 'vw', 'deg', 'ms', 'fr', 'dvh', 'cqi'].every(unit => CSS_UNITS.has(unit))).toBe(true);
    expect(CSS_UNITS.has('foo')).toBe(false);
  });
});

describe('toCssPropertyName()', () => {
  it('converts camelCase to kebab-case', () => {
    expect(toCssPropertyName('fontSize')).toBe('font-size');
    expect(toCssPropertyName('WebkitTransform')).toBe('-webkit-transform');
    expect(toCssPropertyName('width')).toBe('width');
  });

  it('keeps a custom property as written', () => {
    expect(toCssPropertyName('--mainColor')).toBe('--mainColor');
  });
});

describe('splitClasses()', () => {
  it('splits the classes on ASCII whitespace, each once', () => {
    expect(splitClasses(' a\tb\n a  c ')).toEqual(['a', 'b', 'c']);
  });

  it('returns undefined when there is no class', () => {
    expect(splitClasses('  ')).toBeUndefined();
    expect(splitClasses('')).toBeUndefined();
  });
});

describe('parseStyleDeclarations()', () => {
  it('parses the declarations into names and values', () => {
    expect(parseStyleDeclarations('display: flex; gap:4px;')).toEqual(['display', 'flex', 'gap', '4px']);
  });

  it('keeps the ; and the : inside parentheses and quotes', () => {
    expect(parseStyleDeclarations('background: url(a;b.png); content: "x;y: z"; --v: var(--w, a:b)')).toEqual([
      'background', 'url(a;b.png)',
      'content', '"x;y: z"',
      '--v', 'var(--w, a:b)'
    ]);
    expect(parseStyleDeclarations('content: \'a\\\';b\'; color: red')).toEqual(['content', '\'a\\\';b\'', 'color', 'red']);
  });

  it('normalizes !important, and lowercases the names of the properties that are not custom', () => {
    expect(parseStyleDeclarations('COLOR: red!IMPORTANT; --Accent: blue ! important; Font-Size: 2px')).toEqual([
      'color', 'red !important',
      '--Accent', 'blue !important',
      'font-size', '2px'
    ]);
  });

  it('leaves out the declarations without name or value, and keeps the last value of a property', () => {
    expect(parseStyleDeclarations('color; : red; width: ; top: !important; color: red; margin: 0; color: blue')).toEqual(['margin', '0', 'color', 'blue']);
  });

  it('closes a declaration left open by a parenthesis at the end of the text', () => {
    expect(parseStyleDeclarations('a: b; background: url(x;y')).toEqual(['a', 'b', 'background', 'url(x;y']);
    expect(parseStyleDeclarations('a: b) c; d: e')).toEqual(['a', 'b) c', 'd', 'e']);
  });

  it('returns undefined when there is no declaration', () => {
    expect(parseStyleDeclarations('')).toBeUndefined();
    expect(parseStyleDeclarations(' ; ')).toBeUndefined();
  });
});

describe('stylePriority() and styleValue()', () => {
  it('split a value ending with !important', () => {
    expect(stylePriority('red !important')).toBe('important');
    expect(styleValue('red !important')).toBe('red');
    expect(stylePriority('red')).toBe('');
    expect(styleValue('red')).toBe('red');
  });
});
