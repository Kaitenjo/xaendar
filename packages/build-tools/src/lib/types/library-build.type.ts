import type { BuildLibraryOptions } from './build-library-options.type';
import type { WorkspaceLibrary } from './workspace-library.type';

/**
 * A library `buildLibrary` compiles: its options resolved, with the builds of the libraries of the workspace it depends
 * on.
 */
export type LibraryBuild = WorkspaceLibrary & Pick<BuildLibraryOptions, 'dependencies'>;
