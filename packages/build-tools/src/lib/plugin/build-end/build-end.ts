import { getLanguageService } from '@xaendar/language-core';
import type { HookHandler, Plugin } from 'vite';
import type { XaendarPluginState } from '../../types/plugin.types';
import { isServerRendering } from '../../utils/server-rendering/server-rendering.utils';
import { collectProjectDiagnostics, formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';

/**
 * Vite plugin `buildEnd` hook: in a build, type-checks the whole program as `tsc --noEmit` does, and fails
 * the build when it finds errors. Vite only strips the types, and the `transform` hook checks the templates
 * alone. A build that already failed is not checked, nor the build of the server, since the one of the browser
 * checks the same program.
 *
 * @param state - The shared plugin state (project compiler options/file names, logger).
 * @returns The `buildEnd` hook handler.
 */
export function createBuildEndHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['buildEnd']>> {
  return function buildEnd(this, error) {
    if (!state.isBuild || error || isServerRendering(state, this)) {
      return;
    }

    const diagnostics = collectProjectDiagnostics(getLanguageService(state.compilerOptions, state.projectFileNames));
    if (diagnostics.length) {
      state.logError('', `[TypeChecker] Type check failed\n${formatTypeDiagnostics(diagnostics)}`);
      this.error(`Type check failed - ${diagnostics.length} error(s)`);
    }
  };
}
