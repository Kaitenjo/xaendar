import type { XaendarLibraryOptions } from './xaendar-library-options.type';

/**
 * A library of the workspace, its options resolved: its folder and its entry as absolute paths with forward slashes,
 * and the defaults of the options it leaves out.
 */
export type WorkspaceLibrary = Required<XaendarLibraryOptions>;
