import { getLanguageService } from '@xaendar/language-core';
import type { HookHandler, Plugin } from 'vite';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import { reportTemplateDiagnostics } from '../../utils/template-type-check/template-type-check.utils';
import { collectProjectDiagnostics, formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';

/**
 * Vite plugin `buildEnd` hook: in a build, type-checks the templates the `transform` hook left to it, all on one
 * program, reporting their diagnostics as the hook does and failing the build on the components whose templates have
 * errors; then type-checks the whole program as `tsc --noEmit` does, and fails the build when it finds errors. Vite
 * only strips the types. A build that already failed is not checked, nor the build of the server, since the one of the
 * browser checks the same program.
 *
 * @param state - The shared plugin state (project compiler options/file names, logger).
 * @returns The `buildEnd` hook handler.
 */
export function createBuildEndHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['buildEnd']>> {
  return function buildEnd(this, error) {
    if (!state.strategies[this.environment.config.consumer].typeCheck) {
      return;
    }

    // Taken by the environment checking them, also when the build failed, so that no later build checks them
    const pending = state.pendingTypeChecks;
    state.pendingTypeChecks = undefined;
    if (!state.isBuild || error) {
      return;
    }

    const languageService = getLanguageService(state.compilerOptions, state.projectFileNames);
    if (pending?.length) {
      const failed = new Array<string>();
      for (let i = 0; i < pending.length; i++) {
        if (reportTemplateDiagnostics(this, state, languageService, pending[i])) {
          failed.push(pending[i].componentPath);
        }
      }

      if (failed.length) {
        this.error(`Failed to compile ${failed.length === 1 ? 'component' : 'components'} - ${failed.join(', ')}`);
      }
    }

    const diagnostics = collectProjectDiagnostics(languageService);
    if (diagnostics.length) {
      state.logError('', `[TypeChecker] Type check failed\n${formatTypeDiagnostics(diagnostics)}`);
      this.error(`Type check failed - ${diagnostics.length} error(s)`);
    }
  };
}
