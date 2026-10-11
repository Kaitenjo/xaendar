import { Command } from 'commander';
import { startVitest } from 'vitest/node';
import { PLUGINS } from '../../utils/plugins';

/**
 * Creates and returns the `test` command (alias `t`).
 *
 * Runs Vitest with the plugins of the project, the ones `start` and `build` use, so that the specs
 * import components as the browser does: in a DOM environment, with the global `Signal` installed
 * by `signals.ts` before any spec.
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
      const vitest = await runVitest([], { environment: 'happy-dom', setupFiles: ['./signals.ts'] }, { plugins: PLUGINS });

      // Vitest keeps running only in watch mode: a single run exits, with the outcome of the tests
      if (!vitest.shouldKeepServer()) {
        await vitest.exit();
      }
    });
}
