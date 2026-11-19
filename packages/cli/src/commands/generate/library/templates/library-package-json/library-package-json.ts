import type { WorkspaceLibrary } from '../../../../../types/workspace-library.type';

/**
 * Generates the content of the `package.json` of a library: the name of its package, the version it starts from, and
 * `@xaendar/core` among the peer dependencies at the version of the CLI, since the application installing the library
 * provides the single copy of it the components share.
 *
 * @param library - The library.
 * @param version - The version of the Xaendar packages, read from the `package.json` of the CLI.
 * @returns The formatted JSON string.
 */
export function libraryPackageJson({ name }: WorkspaceLibrary, version: string): string {
  return `${JSON.stringify({
    name,
    version: '0.0.0',
    type: 'module',
    peerDependencies: {
      '@xaendar/core': `^${version}`
    }
  }, null, 2)}\n`;
}
