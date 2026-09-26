import { describe, expect, it } from 'vitest';
import { catchErrorWithPrefix } from './catch-error-generation.utils';

const capture = (fn: () => void): unknown => {
  try {
    fn();
  } catch (err) {
    return err;
  }
};

describe('catchErrorWithPrefix', () => {
  it('throws a formatted string with the source excerpt when the cause is a span', () => {
    const error = new Error('boom', { cause: { start: 6, end: 11 } });
    expect(capture(() => catchErrorWithPrefix('Prefix', 'hello world', error))).toBe('[Prefix] boom\n----> world');
  });

  it('throws a prefixed Error preserving the stack when the cause is not a span', () => {
    const original = new Error('boom', { cause: 'not a span' });
    const thrown = capture(() => catchErrorWithPrefix('Prefix', 'hello', original)) as Error;

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).toBe('[Prefix] boom');
    expect(thrown.stack).toBe(original.stack);
  });

  it.each([
    ['there is no cause', new Error('boom')],
    ['the cause is an object without positions', new Error('boom', { cause: {} })]
  ])('throws a prefixed Error when %s', (_name, error) => {
    expect((capture(() => catchErrorWithPrefix('Prefix', 'hello', error)) as Error).message).toBe('[Prefix] boom');
  });

  it('wraps non-Error values', () => {
    const thrown = capture(() => catchErrorWithPrefix('Prefix', 'hello', 'oops')) as Error;
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).toBe('[Prefix] oops');
  });
});
