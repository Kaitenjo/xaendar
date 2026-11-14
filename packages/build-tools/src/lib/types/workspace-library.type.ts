import type { XaendarLibraryOptions } from './xaendar-library-options.type';

/**
 * A library of the workspace, its options resolved: its folder and its entry as absolute paths with forward slashes,
 * and the defaults of the options it leaves out. `strictEvents` stays unset when the library does not declare it: the
 * option of the project applies.
 */
export type WorkspaceLibrary = Required<Omit<XaendarLibraryOptions, 'strictEvents'>> & Pick<XaendarLibraryOptions, 'strictEvents'>;
