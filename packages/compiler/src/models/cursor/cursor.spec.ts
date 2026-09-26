import { describe, expect, it } from 'vitest';
import { Cursor } from './cursor';

describe('Cursor', () => {
  it('returns line 1 col 1 for position 0 on a single-line input', () => {
    const cursor = new Cursor('hello world');
    expect(cursor.getPositionFromCharacterIndex(0)).toBe('[Ln 1, Col 1]');
  });

  it('computes the column for a position within the first line', () => {
    const cursor = new Cursor('hello world');
    expect(cursor.getPositionFromCharacterIndex(6)).toBe('[Ln 1, Col 7]');
  });

  it('computes the line and column for a position on a later line', () => {
    const cursor = new Cursor('foo\nbar\nbaz');
    expect(cursor.getPositionFromCharacterIndex(4)).toBe('[Ln 2, Col 1]');
    expect(cursor.getPositionFromCharacterIndex(6)).toBe('[Ln 2, Col 3]');
    expect(cursor.getPositionFromCharacterIndex(8)).toBe('[Ln 3, Col 1]');
  });

  it('treats a position exactly at a line-break offset as the end of the previous line', () => {
    const cursor = new Cursor('foo\nbar');
    expect(cursor.getPositionFromCharacterIndex(3)).toBe('[Ln 1, Col 4]');
  });

  it('resolves the last character of a multi-line input', () => {
    const cursor = new Cursor('a\nbb\nccc');
    expect(cursor.getPositionFromCharacterIndex(7)).toBe('[Ln 3, Col 3]');
  });

  it('handles an empty input', () => {
    const cursor = new Cursor('');
    expect(cursor.getPositionFromCharacterIndex(0)).toBe('[Ln 1, Col 1]');
  });

  it('handles consecutive line breaks', () => {
    const cursor = new Cursor('a\n\nb');
    expect(cursor.getPositionFromCharacterIndex(2)).toBe('[Ln 2, Col 1]');
    expect(cursor.getPositionFromCharacterIndex(3)).toBe('[Ln 3, Col 1]');
  });
});
