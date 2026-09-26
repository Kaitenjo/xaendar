import { describe, expect, it } from 'vitest';
import { INPUT_SIGNAL_INSTANCE_SYMBOL, isInputSignal } from './input-instance.symbol';

describe('isInputSignal', () => {
  it('returns true for an object flagged with the instance symbol', () => {
    expect(isInputSignal({ [INPUT_SIGNAL_INSTANCE_SYMBOL]: true })).toBeTruthy();
  });

  it('returns a falsy value for an unflagged object', () => {
    expect(isInputSignal({})).toBeFalsy();
  });

  it('returns a falsy value for null and undefined', () => {
    expect(isInputSignal(null)).toBeFalsy();
    expect(isInputSignal(undefined)).toBeFalsy();
  });
});
