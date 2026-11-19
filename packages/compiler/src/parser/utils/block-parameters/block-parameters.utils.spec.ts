import { describe, expect, it } from 'vitest';
import { parseBlockParameters } from './block-parameters.utils';

describe('parseBlockParameters', () => {
  it('reads the durations of the parameters, in milliseconds', () => {
    expect(parseBlockParameters('after 100ms, minimum 1s', 10, '@loading', ['after', 'minimum'])).toEqual({ after: 100, minimum: 1000 });
    expect(parseBlockParameters(' minimum 500 ', 10, '@placeholder', ['minimum'])).toEqual({ minimum: 500 });
  });

  it.each([
    ['after 100ms', { start: 10, end: 21 }],
    ['minimum', { start: 10, end: 17 }],
    ['', { start: 10, end: 10 }]
  ])('rejects the parameter "%s" a block does not accept, the error carrying its span', (source, span) => {
    expect(() => parseBlockParameters(source, 10, '@placeholder', ['minimum'])).toThrow(expect.objectContaining({
      message: `Unknown parameter "${source}" of @placeholder: use minimum followed by a duration, such as minimum 500ms`,
      cause: span
    }));
  });

  it('rejects a parameter declared twice', () => {
    expect(() => parseBlockParameters('minimum 1s, minimum 2s', 10, '@loading', ['after', 'minimum'])).toThrow(expect.objectContaining({
      message: 'The parameter "minimum" of @loading is declared twice',
      cause: { start: 22, end: 32 }
    }));
  });

  it('rejects a value that is not a duration, the error carrying its span', () => {
    expect(() => parseBlockParameters('after soon', 10, '@loading', ['after', 'minimum'])).toThrow(expect.objectContaining({
      message: 'Expected a duration, such as 500ms or 1s, got "soon"',
      cause: { start: 16, end: 20 }
    }));
  });
});
