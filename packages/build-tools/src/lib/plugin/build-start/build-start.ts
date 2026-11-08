import type { HookHandler, Plugin } from 'vite';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import { registerPackageLibraries } from '../../utils/package-libraries/package-libraries.utils';
import { describeStaticComponents, findStaticComponents } from '../../utils/static-components/static-components.utils';

/**
 * Vite plugin `buildStart` hook: registers the selectors of the compiled libraries the project depends on, which its
 * components and directives cannot declare again (see `registerPackageLibraries`). In the build of a project rendering on
 * the server with `ssr.staticComponents`, finds the static components, which the hooks compiling the modules read, and
 * reports them once, from the environment of the browser. Without the option, a report asked for tells that there is
 * none. The dev server keeps every component in the browser, so that a change reaches only the modules it touches.
 *
 * @param state - The shared plugin state, whose `staticComponents` are set.
 * @returns The `buildStart` hook handler.
 * @throws If two compiled libraries define the same selector.
 */
export function createBuildStartHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['buildStart']>> {
  return async function buildStart(this) {
    if (state.packageLibraries) {
      registerPackageLibraries(state.packageLibraries);
    }

    if (!state.isBuild) {
      return;
    }

    const browser = !state.strategies[this.environment.config.consumer].server;
    if (state.ssr?.staticComponents) {
      state.staticComponents = await findStaticComponents(state);
      if (browser) {
        state.logInfo(describeStaticComponents(state.staticComponents, state.staticReport));
      }
    } else if (state.staticReport && browser) {
      state.logInfo('Xaendar: the static components are not searched, so there is nothing to report: set ssr.staticComponents to search them');
    }
  };
}
