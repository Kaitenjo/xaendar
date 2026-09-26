import { describe, expect, it } from 'vitest';
import { assertPrivateContext, INPUT_SIGNAL_SET_SYMBOL } from './input-set.symbol';

describe('assertPrivateContext', () => {
  it('does not throw for the internal symbol', () => {
    expect(() => assertPrivateContext(INPUT_SIGNAL_SET_SYMBOL)).not.toThrow();
  });

  it('throws for any other symbol', () => {
    expect(() => assertPrivateContext(Symbol('other'))).toThrow('Invalid symbol for InputSignal set method');
  });
});
