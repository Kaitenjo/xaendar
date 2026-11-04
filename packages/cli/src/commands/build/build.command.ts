import { Command } from 'commander';
import { buildProject } from '../../utils/build-project/build-project.utils';

/**
 * Creates and returns the `build` command (alias `b`), building the project (see {@link buildProject}).
 *
 * @returns The configured `build` {@link Command} instance ready to be added to the root program.
 */
export function buildCommand(): Command {
  return new Command('build')
    .alias('b')
    .description('Build the project')
    .option('--static-report', 'Tell what keeps each interactive component in the bundle of the browser')
    .action(async (options: { staticReport?: boolean }) => await buildProject(options.staticReport));
}
