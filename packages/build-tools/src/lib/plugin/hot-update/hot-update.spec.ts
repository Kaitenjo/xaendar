import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../registry/base-class-registry/base-class-registry', () => ({
  findComponentPathsForBaseClassDependency: vi.fn()
}));

import type { EnvironmentModuleNode, HookHandler, HotUpdateOptions, Plugin } from 'vite';
import { findComponentPathsForBaseClassDependency } from '../../registry/base-class-registry/base-class-registry';
import { createHotUpdateHook } from './hot-update';

/**
 * `this` context the `hotUpdate` hook is invoked with.
 */
type HotUpdateContext = ThisParameterType<NonNullable<HookHandler<Plugin['hotUpdate']>>>;

/**
 * Path of the base class file whose change triggers the hot update.
 */
const BASE_PATH = '/src/base.ts';

/**
 * Module wrapping the changed base class file itself.
 */
const baseModule = { id: BASE_PATH } as EnvironmentModuleNode;

/**
 * Module of a component depending on the base class file.
 */
const fooModule = { id: '/src/foo.xd.component.ts' } as EnvironmentModuleNode;

/**
 * Module of another component depending on the base class file.
 */
const barModule = { id: '/src/bar.xd.component.ts' } as EnvironmentModuleNode;

/**
 * Builds a mocked `hotUpdate` hook context wired to a `moduleGraph.getModulesByFile` stub.
 *
 * @param modulesByFile - Modules returned by `getModulesByFile`, keyed by file path.
 * @returns The mocked hook context.
 */
function createContext(modulesByFile: Record<string, EnvironmentModuleNode[]>): HotUpdateContext {
  return {
    environment: {
      moduleGraph: {
        getModulesByFile: vi.fn((file: string) => modulesByFile[file] ? new Set(modulesByFile[file]) : undefined),
        invalidateModule: vi.fn()
      }
    }
  } as unknown as HotUpdateContext;
}

/**
 * Builds the `hotUpdate` hook options for a change to `BASE_PATH`.
 *
 * @param modules - The modules already part of the update, defaults to `[baseModule]`.
 * @returns The mocked hook options.
 */
function createOptions(modules: EnvironmentModuleNode[] = [baseModule]): HotUpdateOptions {
  return { type: 'update', file: BASE_PATH, timestamp: 42, modules } as unknown as HotUpdateOptions;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createHotUpdateHook()', () => {
  it('leaves the update untouched when no component inherits from the changed file', async () => {
    const hook = createHotUpdateHook();
    const ctx = createContext({});

    vi.mocked(findComponentPathsForBaseClassDependency).mockReturnValue(undefined);
    expect(await hook.call(ctx, createOptions())).toBeUndefined();

    vi.mocked(findComponentPathsForBaseClassDependency).mockReturnValue(new Set());
    expect(await hook.call(ctx, createOptions())).toBeUndefined();

    expect(findComponentPathsForBaseClassDependency).toHaveBeenCalledWith(BASE_PATH);
    expect(ctx.environment.moduleGraph.invalidateModule).not.toHaveBeenCalled();
  });

  it('hard-invalidates the dependent components and adds them to the updated modules', async () => {
    vi.mocked(findComponentPathsForBaseClassDependency).mockReturnValue(new Set(['/src/foo.xd.component.ts', '/src/bar.xd.component.ts', '/src/unloaded.xd.component.ts']));
    const hook = createHotUpdateHook();
    const ctx = createContext({
      '/src/foo.xd.component.ts': [fooModule],
      '/src/bar.xd.component.ts': [barModule]
    });

    // bar is already part of the update, and must not be duplicated
    const result = await hook.call(ctx, createOptions([baseModule, barModule]));

    expect(result).toEqual([baseModule, barModule, fooModule]);
    expect(ctx.environment.moduleGraph.invalidateModule).toHaveBeenCalledTimes(2);
    expect(ctx.environment.moduleGraph.invalidateModule).toHaveBeenCalledWith(fooModule, new Set(), 42, true);
    expect(ctx.environment.moduleGraph.invalidateModule).toHaveBeenCalledWith(barModule, new Set(), 42, true);
  });

  it('updates the dependent components even when the changed file is not part of the module graph', async () => {
    vi.mocked(findComponentPathsForBaseClassDependency).mockReturnValue(new Set(['/src/foo.xd.component.ts']));
    const hook = createHotUpdateHook();

    const result = await hook.call(createContext({ '/src/foo.xd.component.ts': [fooModule] }), createOptions([]));

    expect(result).toEqual([fooModule]);
  });
});
