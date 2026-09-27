import { describe, expect, it } from 'vitest';
import { signalTs } from './signal-ts';

describe('signalTs()', () => {
  it('imports and calls loadSignals from @xaendar/signals', () => {
    const result = signalTs();

    expect(result).toContain("import { loadSignals } from '@xaendar/signals';");
    expect(result).toContain('loadSignals();');
  });
});
