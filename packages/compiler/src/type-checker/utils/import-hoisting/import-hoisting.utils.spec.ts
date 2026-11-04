import { describe, expect, it } from 'vitest';
import type { Line } from '../../types/line.type';
import { hoistImportTypes } from './import-hoisting.utils';

const span = { start: 0, end: 1 };

describe('hoistImportTypes', () => {
  it('returns the lines as they are when they reference no module', () => {
    const lines: Line[] = [{ text: 'function typeCheck() {' }, { text: '}' }];

    expect(hoistImportTypes(lines)).toBe(lines);
  });

  it('imports each module once, before the lines, and references it through its namespace', () => {
    const lines: Line[] = [
      { text: 'function typeCheck() {' },
      { text: '  x satisfies ReturnType<import(\'/src/a\').A[\'p\']>;' },
      { text: '  y satisfies (import(\'/src/a\').A[\'e\'] extends import(\'@xaendar/core\').Output<infer Value> ? Value : never);' },
      { text: '}' }
    ];

    expect(hoistImportTypes(lines).map(({ text }) => text)).toEqual([
      'import type * as __module0 from \'/src/a\';',
      'import type * as __module1 from \'@xaendar/core\';',
      'function typeCheck() {',
      '  x satisfies ReturnType<__module0.A[\'p\']>;',
      '  y satisfies (__module0.A[\'e\'] extends __module1.Output<infer Value> ? Value : never);',
      '}'
    ]);
  });

  it('moves the mappings with the text they map, shortening the ones spanning a replaced import() type', () => {
    const text = 'f(a) satisfies import(\'/src/a\').A; g(b)';
    const lines: Line[] = [{
      text,
      mappings: [
        { columnStart: 2, columnEnd: 3, original: span },
        { columnStart: 15, columnEnd: 33, original: span },
        { columnStart: 37, columnEnd: 38, original: span }
      ]
    }];

    const [, hoisted] = hoistImportTypes(lines);

    expect(hoisted.text).toBe('f(a) satisfies __module0.A; g(b)');
    expect(hoisted.mappings!.map(({ columnStart, columnEnd }) => hoisted.text.slice(columnStart, columnEnd))).toEqual(['a', '__module0.A', 'b']);
  });

  it('keeps a line without mappings without them', () => {
    const [, hoisted] = hoistImportTypes([{ text: 'import(\'/src/a\').A;' }]);

    expect(hoisted).toEqual({ text: '__module0.A;' });
  });
});
