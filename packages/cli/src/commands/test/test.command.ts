import { Command } from 'commander';
import type { Plugin } from 'vite';
import { startVitest } from 'vitest/node';
import type { CacheKeyIdGeneratorContext, VitestPluginContext } from 'vitest/node';
import { createPlugins } from '../../utils/plugins';

/**
 * Id of the virtual module installing the global `Signal` before any spec.
 */
const SIGNALS_SETUP_ID = 'virtual:xaendar-signals-setup';

/**
 * The modules whose compiled code depends on other files: the components, compiled with their template, their
 * stylesheet and the components their template imports, and the virtual modules of the templates and the stylesheets.
 */
const NOT_CACHEABLE_RE = /\.xd\.component\.ts(\?|$)|virtual:xaendar-/;

/**
 * Creates the plugin running the specs as the browser runs the application:
 * - it provides the virtual module that installs the global `Signal`, which the project does not carry as a file:
 *   its `main.ts` does it, and the specs do not run it;
 * - it keeps the modules compiled by the Xaendar plugin out of the file system cache of Vitest, which keys a
 *   module by its own content only: a changed template would leave its component compiled with the old one.
 *
 * @returns The plugin.
 */
function createTestPlugin(): Plugin & { configureVitest(context: VitestPluginContext): void } {
  const resolvedId = `\0${SIGNALS_SETUP_ID}`;

  return {
    name: 'xaendar:test',
    resolveId(id) {
      // Vitest resolves the setup files against the root of the project before asking the plugins
      return id.endsWith(SIGNALS_SETUP_ID) ? resolvedId : undefined;
    },
    load(id) {
      return id === resolvedId ? 'import { loadSignals } from \'@xaendar/signals\';\n\nloadSignals();' : undefined;
    },
    configureVitest(context) {
      context.defineCacheKeyGenerator(({ id }: CacheKeyIdGeneratorContext) => NOT_CACHEABLE_RE.test(id) ? false : undefined);
    }
  };
}

/**
 * Creates and returns the `test` command (alias `t`).
 *
 * Runs Vitest with the plugins of the project, the ones `start` and `build` use, so that the specs
 * import components as the browser does: in a DOM environment, with the global `Signal` installed
 * by `loadSignals()` before any spec.
 *
 * @param runVitest - The function starting Vitest. Vitest does not let its specs mock its own modules,
 *   so the specs of this command pass their own.
 * @returns The configured `test` {@link Command} instance ready to be
 *   added to the root program.
 */
export function testCommand(runVitest: typeof startVitest = startVitest): Command {
  return new Command('test')
    .alias('t')
    .description('Run the tests of the project')
    .action(async () => {
      const plugins = [createTestPlugin(), ...createPlugins()];
      const vitest = await runVitest([], { environment: 'happy-dom', setupFiles: [SIGNALS_SETUP_ID] }, { plugins });

      // Vitest keeps running only in watch mode: a single run exits, with the outcome of the tests
      if (!vitest.shouldKeepServer()) {
        await vitest.exit();
      }
    });
}
