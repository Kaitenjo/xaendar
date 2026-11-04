import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _let } = await import('./let.util');
const { signal } = await import('../../signals');

describe('_let', () => {
  it('computes the value when it is read, and the new one once a signal it reads changes', () => {
    const price = signal(2);
    const compute = vi.fn(() => price() * 3);
    const total = _let(compute);

    expect(compute).not.toHaveBeenCalled();
    expect(total()).toBe(6);

    price.set(5);
    expect(total()).toBe(15);
  });
});
