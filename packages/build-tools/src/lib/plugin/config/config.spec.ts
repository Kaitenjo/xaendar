import { describe, expect, it } from 'vitest';
import { createConfigHook } from './config';

/**
 * Runs the hook as Vite does, without the parameters it does not read.
 */
const run = (hook: ReturnType<typeof createConfigHook>) => (hook as unknown as () => unknown)();

/**
 * A library of the workspace, resolved.
 */
const LIBRARY = { name: '@acme/ui', root: '/ws/libraries/ui', entry: '/ws/libraries/ui/src/public-api.ts', ssr: false, customElements: [] };

describe('createConfigHook()', () => {
  it('sets the application type to custom when the plugin renders on the server', () => {
    expect(run(createConfigHook({ ssr: { entry: 'entry-server.ts' } }))).toEqual({ appType: 'custom' });
  });

  it('leads the names of the libraries of the workspace to their sources', () => {
    const config = run(createConfigHook({ libraries: [LIBRARY] })) as { resolve: { alias: Array<{ find: RegExp, replacement: string }> } };

    expect(config.resolve.alias.map(({ find, replacement }) => [find.source, replacement])).toEqual([
      ['^@acme\\/ui$', '/ws/libraries/ui/src/public-api.ts'],
      ['^@acme\\/ui\\/(.*)$', '/ws/libraries/ui/src/$1']
    ]);
    expect(run(createConfigHook({ ssr: { entry: 'entry-server.ts' }, libraries: [LIBRARY] }))).toMatchObject({ appType: 'custom', resolve: { alias: expect.any(Array) } });
  });

  it('leaves the configuration alone otherwise', () => {
    expect(run(createConfigHook({}))).toBeUndefined();
    expect(run(createConfigHook({ libraries: [] }))).toBeUndefined();
  });
});
