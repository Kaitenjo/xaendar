import { findPackageLibraries } from '@xaendar/compiler';
import type { HookHandler, Plugin, UserConfig } from 'vite';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import { getPackageLibrariesConfig } from '../../utils/package-libraries/package-libraries.utils';
import { getLibraryAliases } from '../../utils/workspace-libraries/workspace-libraries.utils';

/**
 * Vite plugin `config` hook: when the plugin renders on the server, sets the application type of Vite to `custom`, so
 * that the dev server serves no `index.html` of its own and the page is rendered by the middleware of the plugin. When
 * the project belongs to a workspace, its libraries are imported from their sources: their names lead to their
 * entries (see `getLibraryAliases`). The compiled libraries the project depends on, found from the directory Vite is
 * launched from, share the packages of Xaendar with it, and are optimized when the dev server starts (see
 * `getPackageLibrariesConfig`).
 *
 * @param state - The shared plugin state, with the rendering on the server and the libraries of the workspace, whose
 *   `packageLibraries` are set.
 * @returns The `config` hook handler.
 */
export function createConfigHook(state: Pick<XaendarPluginState, 'ssr' | 'libraries' | 'packageLibraries'>): NonNullable<HookHandler<Plugin['config']>> {
  return function config() {
    state.packageLibraries = findPackageLibraries(process.cwd());
    let config: UserConfig | undefined;
    if (state.ssr) {
      config = { appType: 'custom' };
    }

    if (state.libraries?.length) {
      config = Object.assign({}, config, { resolve: { alias: getLibraryAliases(state.libraries) } });
    }

    if (state.packageLibraries) {
      const { resolve, optimizeDeps } = getPackageLibrariesConfig(state.packageLibraries);
      config = Object.assign({}, config, { resolve: Object.assign({}, config?.resolve, resolve), optimizeDeps });
    }

    return config;
  };
}
