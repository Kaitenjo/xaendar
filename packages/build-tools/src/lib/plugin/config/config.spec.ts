import { describe, expect, it } from 'vitest';
import { createConfigHook } from './config';

/**
 * Runs the hook as Vite does, without the parameters it does not read.
 */
const run = (hook: ReturnType<typeof createConfigHook>) => (hook as unknown as () => unknown)();

describe('createConfigHook()', () => {
  it('sets the application type to custom when the plugin renders on the server', () => {
    expect(run(createConfigHook({ ssr: { entry: 'entry-server.ts' } }))).toEqual({ appType: 'custom' });
  });

  it('leaves the configuration alone otherwise', () => {
    expect(run(createConfigHook({}))).toBeUndefined();
  });
});
