// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('@xaendar/core/signals');
const { ComponentFieldTarget } = await import('./component-field-target.model');

type Bridge = ConstructorParameters<typeof ComponentFieldTarget>[0];

/**
 * A bridge of a component, with the members the target reads.
 */
function bridgeOf(internals: Partial<ElementInternals> | null, source: (() => unknown) | null): Bridge {
  const errors = signal([{ name: 'valueMissing', message: 'Required' }]);
  return { internals, source, errors: errors.asReadonly(), setCustomErrors: vi.fn() } as unknown as Bridge;
}

describe('ComponentFieldTarget', () => {
  it('takes the form, the value and the errors of the component from its bridge, and gives it the custom ones', () => {
    const form = document.createElement('form');
    const states = new Set<string>();
    const bridge = bridgeOf({ form, states } as unknown as ElementInternals, () => 3);
    const target = new ComponentFieldTarget(bridge);

    expect(target.form).toBe(form);
    expect(target.value()).toBe(3);
    expect(target.ownErrors()).toEqual([{ name: 'valueMissing', message: 'Required' }]);

    target.setCustomErrors([{ name: 'noSundays', message: 'Sunday' }]);
    expect(bridge.setCustomErrors).toHaveBeenCalledWith([{ name: 'noSundays', message: 'Sunday' }]);

    target.writeState('touched', true);
    expect([...states]).toEqual(['touched']);
    target.writeState('touched', false);
    expect([...states]).toEqual([]);
    expect(() => { target.edited(); target.reset(); }).not.toThrow();
  });

  it('has no form, value nor states where the DOM has no ElementInternals or the component gave no value', () => {
    const target = new ComponentFieldTarget(bridgeOf(null, null));

    expect(target.form).toBeNull();
    expect(target.value()).toBeUndefined();
    expect(() => target.writeState('touched', true)).not.toThrow();
  });
});
