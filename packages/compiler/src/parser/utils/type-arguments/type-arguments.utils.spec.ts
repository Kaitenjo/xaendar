import { describe, expect, it } from 'vitest';
import { parseTypeArguments } from './type-arguments.utils';

describe('parseTypeArguments', () => {
  it('splits the types at the commas, with their span in the template', () => {
    expect(parseTypeArguments('string, number', 10)).toEqual([
      { text: 'string', span: { start: 10, end: 16 } },
      { text: 'number', span: { start: 18, end: 24 } }
    ]);
  });

  it.each([
    ['generic types', 'Map<string, number>, Set<T>', ['Map<string, number>', 'Set<T>']],
    ['tuples and object types', '[string, number], { a: string, b: number }', ['[string, number]', '{ a: string, b: number }']],
    ['function types, their arrow included', '(a: string, b: number) => void, string', ['(a: string, b: number) => void', 'string']],
    ['literal types holding commas and brackets', '\'a, b\', "<", `c, ${string}`', ['\'a, b\'', '"<"', '`c, ${string}`']],
    ['literal types holding escaped quotes', String.raw`'a\', b', "c\", d"`, [String.raw`'a\', b'`, String.raw`"c\", d"`]],
    ['spaces and line breaks around the types', '\n  A ,\n  B\n', ['A', 'B']],
    ['a trailing comma', 'A, B,', ['A', 'B']]
  ])('keeps the commas inside a group out of the split: %s', (_description, text, expected) => {
    expect(parseTypeArguments(text, 0).map(({ text: type }) => type)).toEqual(expected);
  });

  it('throws for an empty type argument', () => {
    expect(() => parseTypeArguments('A,, B', 0)).toThrow('A type argument cannot be empty');
  });
});
