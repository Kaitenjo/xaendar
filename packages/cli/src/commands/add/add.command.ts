import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createFiles } from '../../utils/scaffold/scaffold.utils';
import { addLibraryPaths, addLibraryToConfig, getLibraryPaths, LIBRARIES_FOLDER, toWorkspaceLibrary } from '../../utils/library/library.utils';
import { readProjectStyle } from '../../utils/style/style';
import { readProject } from '../../utils/xaendar-config/xaendar-config.utils';
import { buildLibraryStructure } from '../generate/library/library-structure/library-structure';
import { readCliVersion } from '../new/structure/structure';

/**
 * Creates and returns the `add` command (alias `a`), adding building blocks to a project.
 *
 * @returns The configured `add` {@link Command} instance ready to be added to the root program.
 */
export function addCommand(): Command {
  return new Command('add')
    .alias('a')
    .description('Add Xaendar building blocks to the project')
    .addCommand(
      new Command('library')
        .alias('l')
        .argument('<name>', 'Name of the package of the library (@acme/ui), its folder being the name without the scope')
        .option('--ssr', 'Compile the library for the server too')
        .description('Add a library to the workspace, in libraries/<folder>, declared in the libs of its xaendar.json')
        .action((name: string, options: { ssr?: boolean }) => addLibrary(name, options))
    );
}

/**
 * Adds a library to the workspace holding the working directory: its folder, `libraries/<folder>`, with its sources and
 * its example component, its entry in the `libs` of `xaendar.json`, and the `paths` of `tsconfig.json` leading the name of
 * its package to its sources. A project without `libs` becomes a workspace, testing the library.
 *
 * Exits the process with code `1`, writing nothing, when no `xaendar.json` holds the working directory, when the name is
 * not valid or the workspace has a library of that name or folder already, or when `tsconfig.json` cannot be read as
 * plain JSON.
 *
 * @param name - The name of the package of the library.
 * @param options - Whether the library renders on the server.
 */
function addLibrary(name: string, options: { ssr?: boolean }): void {
  const project = readProject(process.cwd());
  if (!project) {
    console.error('✖  No xaendar.json found: run xd add library inside a project, or create a workspace with xd generate library.');
    process.exit(1);
  }

  const library = toWorkspaceLibrary(name, !!options.ssr);
  const root = resolve(project.dir, LIBRARIES_FOLDER, library.folder);
  if (project.config.libs?.[name] || existsSync(root)) {
    console.error(`✖  The workspace has a library "${name}" already, or a folder ${root}.`);
    process.exit(1);
  }

  const tsconfigPath = resolve(project.dir, 'tsconfig.json');
  let tsconfig: string;
  try {
    tsconfig = addLibraryPaths(readFileSync(tsconfigPath, 'utf-8'), library);
  } catch {
    console.error(`✖  Cannot add the paths of "${name}" to ${tsconfigPath}, which cannot be read as plain JSON: add them to its compilerOptions.paths by hand, then run the command again.\n${JSON.stringify(getLibraryPaths(library), null, 2)}`);
    process.exit(1);
  }

  const config = addLibraryToConfig(readFileSync(project.configPath, 'utf-8'), library);
  mkdirSync(root, { recursive: true });
  createFiles(buildLibraryStructure(library, readCliVersion()), root, readProjectStyle(project.dir));
  writeFileSync(project.configPath, config, 'utf-8');
  writeFileSync(tsconfigPath, tsconfig, 'utf-8');
  console.log(`✔  Library "${name}" added in ${root}`);
}
