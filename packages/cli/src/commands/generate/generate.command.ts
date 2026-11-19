import { Command } from 'commander';
import { dirname, resolve } from 'node:path';
import { STYLES } from '../../utils/style/style';
import { addLibraryExport, findProjectLibrary } from '../../utils/library/library.utils';
import { readProject } from '../../utils/xaendar-config/xaendar-config.utils';
import type { ResolvedLibrary } from '../../types/resolved-library.type';
import { generateComponent } from './component/component.command';
import { generateLibrary } from './library/library.command';

/**
 * Creates and returns the `generate` command (alias `g`) with all its
 * sub-commands registered.
 *
 * @returns The configured `generate` {@link Command} instance ready to be
 *   added to the root program.
 */
export function generateCommand(): Command {
  return new Command('generate')
    .alias('g')
    .description('Generate Xaendar building blocks')
    .addCommand(
      new Command('component')
        .alias('c')
        .argument('<name>', 'Name of the component, used as its selector')
        .option('-p, --path <path>', 'Custom path for the generated component (default: current directory, or the sources of the library)')
        .option('-f, --force', 'Force generation deleting current component if already exists')
        .option('-l, --library <library>', 'Library of the workspace the component belongs to, by the name of its package or of its folder: its entry exports it (default: the library holding the path)')
        .description('Generate a new component (creates <name>/ folder with .ts, .html, .spec.ts and the stylesheet in the format set in xaendar.json)')
        .action((name: string, options: { path?: string, force?: boolean, library?: string }) => generateWorkspaceComponent(name, options))
    )
    .addCommand(
      new Command('library')
        .alias('l')
        .argument('<name>', 'Name of the package of the library (@acme/ui), its folder being the name without the scope')
        .option('-p, --path <path>', 'Custom path for the generated workspace (default: current directory)')
        .option('-s, --style <style>', `Stylesheet format of the components (${STYLES.join(', ')})`)
        .option('--ssr', 'Render the pages of the project on the server, and compile the library for the server too')
        .description('Create a workspace developing a library: the project testing it, and the library in libraries/<folder>')
        .action(async (name: string, options: { path?: string, style?: string, ssr?: boolean }) => await generateLibrary(name, options))
    );
}

/**
 * Generates a component, in a library of the workspace when one is named or holds the path: in the sources of the
 * library by default, and exported by its entry.
 *
 * @param name - The name of the component.
 * @param options - The path of the component, whether to replace an existing one, and the library it belongs to.
 */
function generateWorkspaceComponent(name: string, options: { path?: string, force?: boolean, library?: string }): void {
  const cwd = process.cwd();
  const project = readProject(cwd);
  let path = options.path ? resolve(options.path) : cwd;
  let library: ResolvedLibrary | undefined;
  if (options.library === undefined) {
    library = project && findProjectLibrary(project, path);
  } else {
    if (!project) {
      console.error(`✖  No workspace holds ${cwd}: create one with xd generate library ${options.library}.`);
      process.exit(1);
    }

    library = findProjectLibrary(project, cwd, options.library)!;
    // Outside of the folder of the library, the component goes beside its entry
    if (!options.path && findProjectLibrary(project, cwd)?.name !== library.name) {
      path = dirname(library.entry);
    }
  }

  generateComponent(name, path, !!options.force);
  if (library) {
    addLibraryExport(library.entry, resolve(path, name, `${name}.xd.component.ts`));
  }
}
