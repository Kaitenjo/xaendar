import { describe, expect, it } from 'vitest';
import { parseDuration } from './durations.utils';

const span = { start: 3, end: 8 };

describe('parseDuration', () => {
  it.each([
    ['500ms', 500],
    ['2s', 2000],
    ['1.5s', 1500],
    ['200', 200]
  ])('reads %s as %d milliseconds', (text, expected) => {
    expect(parseDuration(text, span)).toBe(expected);
  });

  it.each(['', 'fast', '1 s', '-1s', '2m'])('rejects "%s", the error carrying its span', text => {
    expect(() => parseDuration(text, span)).toThrow(expect.objectContaining({
      message: `Expected a duration, such as 500ms or 1s, got "${text}"`,
      cause: span
    }));
  });
});
