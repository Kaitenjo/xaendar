import { describe, expect, it } from 'vitest';
import { resolveTemplateSpan } from './mapping-resolver.utils';

const first = { start: 0, end: 5 };
const second = { start: 10, end: 15 };
const table = new Map([[2, [
  { columnStart: 0, columnEnd: 5, original: first },
  { columnStart: 10, columnEnd: 15, original: second }
]]]);

describe('resolveTemplateSpan', () => {
  it('returns undefined for a line without mappings', () => {
    expect(resolveTemplateSpan(table, { line: 0, character: 0 })).toBeUndefined();
  });

  it('returns the span of the mapping containing the position', () => {
    expect(resolveTemplateSpan(table, { line: 2, character: 12 })).toBe(second);
  });

  it('falls back to the closest mapping when the position is outside every range', () => {
    expect(resolveTemplateSpan(table, { line: 2, character: 7 })).toBe(first);
    expect(resolveTemplateSpan(table, { line: 2, character: 9 })).toBe(second);
  });
});
