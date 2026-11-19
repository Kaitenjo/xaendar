import { describe, expect, it } from 'vitest';
import { findTemplateMapping, resolveShimPosition, resolveTemplateSpan } from './mapping-resolver.utils';

const first = { start: 0, end: 5 };
const second = { start: 10, end: 15 };
const table = new Map([[2, [
  { columnStart: 0, columnEnd: 5, original: first },
  { columnStart: 10, columnEnd: 15, original: second }
]]]);

// `{ foo + bar }` (offsets 2-11) type-checked as `root.foo + root.bar;`
const expression = { start: 2, end: 11 };
const foo = { start: 2, end: 5 };
const plus = { start: 5, end: 8 };
const bar = { start: 8, end: 11 };
const fineTable = new Map([[1, [
  { columnStart: 2, columnEnd: 23, original: expression },
  { columnStart: 7, columnEnd: 10, original: foo },
  { columnStart: 10, columnEnd: 13, original: plus },
  { columnStart: 18, columnEnd: 21, original: bar }
]]]);

describe('resolveTemplateSpan', () => {
  it('returns undefined for a line without mappings', () => {
    expect(resolveTemplateSpan(table, { line: 0, character: 0 })).toBeUndefined();
  });

  it('returns the span of the mapping containing the position', () => {
    expect(resolveTemplateSpan(table, { line: 2, character: 12 })).toBe(second);
  });

  it('returns the span of the narrowest mapping containing the position', () => {
    expect(resolveTemplateSpan(fineTable, { line: 1, character: 19 })).toBe(bar);
    expect(resolveTemplateSpan(fineTable, { line: 1, character: 15 })).toBe(expression);
  });

  it('falls back to the closest mapping when the position is outside every range', () => {
    expect(resolveTemplateSpan(table, { line: 2, character: 7 })).toBe(first);
    expect(resolveTemplateSpan(table, { line: 2, character: 9 })).toBe(second);
  });
});

describe('findTemplateMapping', () => {
  it('returns the narrowest mapping containing the position', () => {
    expect(findTemplateMapping(fineTable, { line: 1, character: 8 })?.original).toBe(foo);
  });

  it('returns undefined when no mapping contains the position', () => {
    expect(findTemplateMapping(fineTable, { line: 1, character: 0 })).toBeUndefined();
    expect(findTemplateMapping(fineTable, { line: 5, character: 0 })).toBeUndefined();
  });
});

describe('resolveShimPosition', () => {
  it('converts an offset through the narrowest one to one mapping containing it', () => {
    expect(resolveShimPosition(fineTable, 9)).toEqual({ line: 1, character: 19 });
    expect(resolveShimPosition(fineTable, 3)).toEqual({ line: 1, character: 8 });
  });

  it('converts an offset at the end of a mapping, preferring a mapping containing it strictly', () => {
    expect(resolveShimPosition(fineTable, 11)).toEqual({ line: 1, character: 21 });
    // 5 ends `foo` and starts ` + `
    expect(resolveShimPosition(fineTable, 5)).toEqual({ line: 1, character: 10 });
  });

  it('prefers the narrowest mapping among those containing the offset strictly', () => {
    const nested = new Map([[0, [
      { columnStart: 0, columnEnd: 4, original: { start: 0, end: 4 } },
      { columnStart: 6, columnEnd: 8, original: { start: 1, end: 3 } }
    ]], [1, [
      { columnStart: 0, columnEnd: 4, original: { start: 0, end: 4 } },
      // Ends at the offset: it doesn't contain it strictly
      { columnStart: 10, columnEnd: 11, original: { start: 1, end: 2 } }
    ]]]);

    expect(resolveShimPosition(nested, 2)).toEqual({ line: 0, character: 7 });
  });

  it('ignores the mappings not copying the template one to one', () => {
    expect(resolveShimPosition(new Map([[0, [{ columnStart: 0, columnEnd: 10, original: { start: 0, end: 4 } }]]]), 2)).toBeUndefined();
  });

  it('returns undefined for an offset outside every mapping', () => {
    expect(resolveShimPosition(fineTable, 0)).toBeUndefined();
  });
});
