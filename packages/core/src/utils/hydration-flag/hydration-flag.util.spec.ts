import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Evaluates the module again, with the identifier the bundler replaces defined as given.
 */
async function hydrationWith(value: unknown): Promise<boolean> {
  vi.stubGlobal('__XAENDAR_HYDRATION__', value);
  vi.resetModules();
  return (await import('./hydration-flag.util')).HYDRATION;
}

describe('HYDRATION', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('is on where nothing defines it, as in the tests', async () => {
    expect((await import('./hydration-flag.util')).HYDRATION).toBe(true);
    expect(await hydrationWith(undefined)).toBe(true);
  });

  it('follows the value the plugin defines', async () => {
    expect(await hydrationWith(false)).toBe(false);
    expect(await hydrationWith(true)).toBe(true);
  });
});
