import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

vi.mock('../../utils/static-components/static-components.utils', () => ({
  describeStaticComponents: vi.fn(() => 'the report'),
  findStaticComponents: vi.fn()
}));

import type { PluginContext } from 'rolldown';
import { CLIENT_STRATEGY, SERVER_STRATEGY } from '../../costants/plugin-strategies';
import type { StaticComponents } from '../../types/static-components.type';
import { describeStaticComponents, findStaticComponents } from '../../utils/static-components/static-components.utils';
import { clearMetadataRegistry, getLibrarySelectorOwner } from '../../registry/metadata-registry/metadata-registry';
import { createBuildStartHook } from './build-start';

const STATIC_COMPONENTS = { statics: [] } as unknown as StaticComponents;

/**
 * Builds a plugin state for a test to assert on.
 */
function createState(overrides: Partial<XaendarPluginState>): XaendarPluginState {
  return {
    isBuild: true,
    ssr: { entry: 'src/entry-server', staticComponents: true },
    staticReport: true,
    logInfo: vi.fn(),
    strategies: { client: CLIENT_STRATEGY, server: SERVER_STRATEGY },
    ...overrides
  } as XaendarPluginState;
}

/**
 * Runs the hook in an environment.
 */
async function run(state: XaendarPluginState, consumer: 'client' | 'server' = 'client'): Promise<void> {
  const context = { environment: { config: { consumer } } } as unknown as PluginContext;
  await (createBuildStartHook(state) as unknown as (this: PluginContext) => Promise<void>).call(context);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findStaticComponents).mockResolvedValue(STATIC_COMPONENTS);
});

describe('createBuildStartHook()', () => {
  it('finds the static components of a build rendering on the server, and reports them from the browser', async () => {
    const state = createState({});

    await run(state);

    expect(state.staticComponents).toBe(STATIC_COMPONENTS);
    expect(describeStaticComponents).toHaveBeenCalledWith(STATIC_COMPONENTS, true);
    expect(state.logInfo).toHaveBeenCalledWith('the report');
  });

  it('reports nothing from the server, which finds them too', async () => {
    const state = createState({});

    await run(state, 'server');

    expect(state.staticComponents).toBe(STATIC_COMPONENTS);
    expect(state.logInfo).not.toHaveBeenCalled();
  });

  it('does nothing in the dev server', async () => {
    const state = createState({ isBuild: false });

    await run(state);

    expect(findStaticComponents).not.toHaveBeenCalled();
    expect(state.logInfo).not.toHaveBeenCalled();
  });

  it('searches nothing without ssr.staticComponents, telling from the browser that a report asked for is empty', async () => {
    const off = createState({ ssr: { entry: 'src/entry-server' } });
    const browserOnly = createState({ ssr: undefined });
    const unasked = createState({ ssr: undefined, staticReport: false });

    await run(off);
    await run(off, 'server');
    await run(browserOnly);
    await run(unasked);

    expect(findStaticComponents).not.toHaveBeenCalled();
    expect(off.staticComponents).toBeUndefined();
    expect(off.logInfo).toHaveBeenCalledOnce();
    expect(off.logInfo).toHaveBeenCalledWith('Xaendar: the static components are not searched, so there is nothing to report: set ssr.staticComponents to search them');
    expect(browserOnly.logInfo).toHaveBeenCalledOnce();
    expect(unasked.logInfo).not.toHaveBeenCalled();
  });
});

describe('createBuildStartHook() with compiled libraries', () => {
  it('registers the selectors of the compiled libraries the project depends on, in the dev server too', async () => {
    const library = { manifest: { name: '@acme/ui', selectors: ['ui-card'] } };
    await run(createState({ isBuild: false, packageLibraries: [library as never] }));

    expect(getLibrarySelectorOwner('ui-card')).toBe('@acme/ui');
    clearMetadataRegistry();
  });
});
