import { describe, expect, it } from 'vitest';
import { mainTs } from './main-ts';

describe('mainTs()', () => {
  it('imports and calls loadSignals from @xaendar/signals', () => {
    const result = mainTs();

    expect(result).toContain("import { loadSignals } from '@xaendar/signals';");
    expect(result).toContain('loadSignals();');
  });

  it('loads bootstrap.ts dynamically after the signals are loaded', () => {
    const result = mainTs();

    expect(result).toContain("await import('./bootstrap');");
    expect(result.indexOf('loadSignals();')).toBeLessThan(result.indexOf("await import('./bootstrap');"));
  });
});
