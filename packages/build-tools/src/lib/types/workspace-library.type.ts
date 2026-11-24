import type { XaendarLibraryOptions } from './xaendar-library-options.type';

/**
 * A library of the workspace, its options resolved: its folder and its entry as absolute paths with forward slashes,
 * and the defaults of the options it leaves out. `strictEvents` and `security` stay unset when the library does not
 * declare them: the options of the project apply.
 */
export type WorkspaceLibrary = Required<Omit<XaendarLibraryOptions, 'strictEvents' | 'security'>> & Pick<XaendarLibraryOptions, 'strictEvents' | 'security'>;
