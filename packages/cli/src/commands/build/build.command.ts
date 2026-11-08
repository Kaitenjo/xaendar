import { Command } from 'commander';
import { buildLibraries } from '../../utils/build-libraries/build-libraries.utils';
import { buildProject } from '../../utils/build-project/build-project.utils';
import { readProject } from '../../utils/xaendar-config/xaendar-config.utils';

/**
 * Creates and returns the `build` command (alias `b`), building the project (see {@link buildProject}), or, in a
 * workspace (`libs` in its `xaendar.json`), its libraries (see {@link buildLibraries}).
 *
 * @returns The configured `build` {@link Command} instance ready to be added to the root program.
 */
export function buildCommand(): Command {
  return new Command('build')
    .alias('b')
    .description('Build the project, or the libraries of a workspace')
    .argument('[library]', 'In a workspace, the library to build, by the name of its package or of its folder (default: every library)')
    .option('--static-report', 'Tell what keeps each interactive component in the bundle of the browser')
    .action(async (library: string | undefined, options: { staticReport?: boolean }) => await build(library, options.staticReport));
}

/**
 * Builds the libraries of the workspace holding the working directory, or else the project in the working directory.
 *
 * Exits the process with code `1` when a library is named outside of a workspace.
 *
 * @param library - The library to build, if any.
 * @param staticReport - Whether the build of a project tells what keeps each interactive component in the bundle.
 * @returns A promise resolving once the build ends.
 */
async function build(library: string | undefined, staticReport: boolean | undefined): Promise<void> {
  const project = readProject(process.cwd());
  if (project?.config.libs) {
    await buildLibraries(project, library);
  } else if (library === undefined) {
    await buildProject(staticReport);
  } else {
    console.error(`✖  No workspace holds ${process.cwd()}: xd build ${library} builds a library of a workspace.`);
    process.exit(1);
  }
}
