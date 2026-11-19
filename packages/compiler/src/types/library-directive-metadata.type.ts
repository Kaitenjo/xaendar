import type { DirectiveMetadata } from './directive-metadata.type';
import type { LibraryComponentMetadata } from './library-component-metadata.type';

/**
 * Metadata of a directive of a compiled library, read from the manifest of its package.
 */
export type LibraryDirectiveMetadata = Omit<DirectiveMetadata, 'typescriptNodes' | 'importPath'> & Pick<LibraryComponentMetadata, 'library' | 'importPath'>;
