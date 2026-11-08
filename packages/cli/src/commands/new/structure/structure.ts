import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PackageJson } from 'type-fest';
import { bootstrapTs } from '../templates/bootstrap-ts/bootstrap-ts';
import { indexHtml } from '../templates/index-html/index-html';
import { mainTs } from '../templates/main-ts/main-ts';
import { packageJson } from '../templates/package-json/package-json';
import { tsconfigJson } from '../templates/tsconfig-json/tsconfig-json';
import { viteConfigTs } from '../templates/vite-config-ts/vite-config-ts';
import { xaendarJson } from '../templates/xaendar-json/xaendar-json';
import { styles } from '../templates/styles/styles';
import type { ProjectContext } from '../types/project-context.type';
import { addLibraryPaths, addLibraryToConfig, LIBRARIES_FOLDER } from '../../../utils/library/library.utils';
import { buildLibraryStructure } from '../../generate/library/library-structure/library-structure';
import { workspaceRootHtml } from '../../generate/library/templates/workspace-root-html/workspace-root-html';
import type { Entry } from '../../../types/entry.type';

/**
 * Reads the current Xaendar version from the CLI's own `package.json`.
 * Used to pin the generated project's dependencies to the same version.
 *
 * @returns The version.
 */
export function readCliVersion(): string {
  try {
    const cliPackageJson: PackageJson = JSON.parse(readFileSync(findCliPackageJsonPath(), 'utf8'));

    /*
      This should never happen since the CLI's own package.json must have a version field
      If it doesn't, something went wrong during the last publish process
    */
    if (!cliPackageJson.version) {
      throw 'Unable to determine Xaendar CLI version.';
    }
    return cliPackageJson.version;
  } catch (error) {
    console.error('Error reading Xaendar CLI version:', error);
    process.exit(1);
  }
}

/**
 * Locates the CLI's own `package.json` by walking up from the running
 * module's directory until one is found.
 *
 * The distance to it varies by how the CLI is running: bundled for
 * publishing (`dist/index.js`, one level below the package root) or
 * executed directly from source via `tsx` (nested several levels below
 * `packages/cli/`, e.g. under `src/commands/new/structure/`). No other
 * `package.json` exists in between in either case, so the first one found
 * walking up is always the CLI's.
 */
function findCliPackageJsonPath(): string {
  let dir = import.meta.dirname;

  while (true) {
    const candidate = resolve(dir, 'package.json');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = resolve(dir, '..');
    if (parent === dir) {
      throw new Error('Unable to locate the CLI package.json.');
    }
    
    dir = parent;
  }
}

/**
 * Builds the complete list of resolved entries (files and directories)
 * that make up a new Xaendar project.
 *
 * All template functions are called here with the appropriate arguments
 * so that the scaffolder receives plain strings and never has to know
 * which parameters each file needs.
 *
 * The rendering of the project is handed to the templates depending on it, and adds its own files: a project rendering
 * its pages on the server also gets its server, `server.ts`, and the module rendering a page, `src/entry-server.ts`.
 *
 * The project of a new workspace (`xd generate library`) also gets its library, in `libraries/<folder>`: `xaendar.json`
 * declares it in its `libs`, `tsconfig.json` leads the name of its package to its sources, and the root component
 * renders its example component.
 *
 * @param context - The project context collected from the `new` command options.
 * @returns An ordered array of {@link Entry} values ready to be
 *   written to disk by the scaffolder.
 */
export function buildStructure(context: ProjectContext): Entry[] {
  const version = readCliVersion();
  const { name, style, rendering, library } = context;
  const componentName = `${name}-root`;

  let xaendar = xaendarJson(name, style, rendering);
  let tsconfig = tsconfigJson(rendering);
  if (library) {
    xaendar = addLibraryToConfig(xaendar, library);
    tsconfig = addLibraryPaths(tsconfig, library);
  }

  const entries: Entry[] = [
    {
      type: 'file',
      name: 'package.json',
      content: packageJson(name, version, style, rendering),
    },
    {
      type: 'file',
      name: 'xaendar.json',
      content: xaendar,
    },
    {
      type: 'file',
      name: 'vite.config.ts',
      content: viteConfigTs(rendering),
    },
    {
      type: 'file',
      name: 'tsconfig.json',
      content: tsconfig,
    }
  ];
  
  const sources: Entry[] = [
    {
      type: 'file',
      name: 'index.html',
      content: indexHtml(componentName, style, rendering),
    },
    {
      type: 'file',
      name: 'main.ts',
      content: mainTs(),
    },
    {
      type: 'file',
      name: 'bootstrap.ts',
      content: bootstrapTs(componentName),
    },
    {
      type: 'generateComponent',
      name: componentName,
    },
    {
      type: 'file',
      name: `styles.${style}`,
      content: styles(style)
    }
  ];

  const rootFiles = rendering.rootFiles?.(componentName);
  if (rootFiles?.length) {
    for (let i = 0; i < rootFiles.length; i++) {
      entries.push(rootFiles[i]);
    }
  }

  const sourceFiles = rendering.sourceFiles?.(componentName);
  if (sourceFiles?.length) {
    for (let i = 0; i < sourceFiles.length; i++) {
      sources.push(sourceFiles[i]);
    }
  }

  entries.push({ type: 'directory', name: 'src', children: sources });
  if (library) {
    // Written after the root component is generated, its template renders the example component of the library
    sources.push({ type: 'file', name: `${componentName}/${componentName}.xd.component.html`, content: workspaceRootHtml(componentName, library) });
    entries.push({
      type: 'directory',
      name: LIBRARIES_FOLDER,
      children: [{ type: 'directory', name: library.folder, children: buildLibraryStructure(library, version) }]
    });
  }

  return entries;
}
