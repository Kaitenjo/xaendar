import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `dev-mode.ts`, shown by the API reference of signals and the page signals/advanced.
 */
export const DEV_MODE: SourceFile = {
  name: 'dev-mode.ts',
  lang: 'ts',
  code: `import { loadSignals } from '@xaendar/signals';

// Logs the errors thrown inside computed signals, watchers and the watched/unwatched callbacks,
// and warns about invalid state transitions of the reactive graph.
loadSignals({ devMode: import.meta.env.DEV });`
};
