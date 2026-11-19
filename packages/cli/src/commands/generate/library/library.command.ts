import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { checkAndCreateProjectDirectory, createFiles, resolveStyle } from '../../../utils/scaffold/scaffold.utils';
import { toWorkspaceLibrary } from '../../../utils/library/library.utils';
import { readProject } from '../../../utils/xaendar-config/xaendar-config.utils';
import { CLIENT_RENDERING, SERVER_RENDERING } from '../../new/rendering/rendering';
import { buildStructure } from '../../new/structure/structure';

/**
 * Creates a workspace developing a library, in a new folder named after the library (`@acme/ui` → `ui`): the project
 * at its root, which tests the library and imports it from its sources by the name of its package, and the library, in
 * `libraries/<folder>`, declared in the `libs` of the `xaendar.json` of the workspace. Then installs the dependencies.
 *
 * The stylesheet format is asked on the terminal when `style` is not given. With `ssr`, the project renders its pages on
 * the server, and the library is compiled for the server too.
 *
 * Exits the process with code `1` when the name is not valid, when the folder is inside a workspace already, which
 * `xd add library` adds libraries to, or when the folder exists and is not empty.
 *
 * @param name - The name of the package of the library.
 * @param options - Where to create the workspace (the working directory by default), the stylesheet format, and whether
 *   the project and the library render on the server.
 * @returns A promise resolving once the workspace is created and its dependencies installed.
 */
export async function generateLibrary(name: string, options: { path?: string, style?: string, ssr?: boolean }): Promise<void> {
  const library = toWorkspaceLibrary(name, !!options.ssr);
  const directory = resolve(options.path || process.cwd(), library.folder);
  const workspace = readProject(dirname(directory));
  if (workspace?.config.libs) {
    console.error(`✖  ${workspace.configPath} declares a workspace already: add the library to it with xd add library ${name}.`);
    process.exit(1);
  }

  const style = await resolveStyle(options.style);
  checkAndCreateProjectDirectory(directory);
  createFiles(buildStructure({ name: library.folder, style, rendering: options.ssr ? SERVER_RENDERING : CLIENT_RENDERING, library }), directory, style);
  execSync('npm i', { stdio: 'inherit', cwd: directory });
}
