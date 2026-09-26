import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { computed } = await import('./computed');

describe('computed', () => {
  it('returns the seed value when called', () => {
    expect(computed(5)()).toBe(5);
  });

  it('exposes get()', () => {
    expect(computed('x').get()).toBe('x');
  });

  it('forwards the options to the underlying signal', () => {
    const equals = vi.fn(() => true);
    const value = computed(1, { equals });
    expect(value()).toBe(1);
  });
});
