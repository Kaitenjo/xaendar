import { describe, expect, it } from 'vitest';
import { INPUT_SIGNAL_INSTANCE_SYMBOL, isInputSignal } from './input-instance.symbol';

describe('isInputSignal', () => {
  it('returns true for a function flagged with the instance symbol', () => {
    expect(isInputSignal(Object.assign(() => undefined, { [INPUT_SIGNAL_INSTANCE_SYMBOL]: true }))).toBe(true);
  });

  it('returns false for an unflagged function', () => {
    expect(isInputSignal(() => undefined)).toBe(false);
  });

  it('returns false for a non-function value, even if flagged', () => {
    expect(isInputSignal({ [INPUT_SIGNAL_INSTANCE_SYMBOL]: true })).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isInputSignal(null)).toBe(false);
    expect(isInputSignal(undefined)).toBe(false);
  });
});
