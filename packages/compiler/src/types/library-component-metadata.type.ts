import type { ComponentMetadata } from './component-metadata.type';
import type { LibraryPackage } from './library-package.type';

/**
 * Metadata of a component of a compiled library, read from the manifest of its package: the declarations of the package
 * keep no decorator, and its templates are compiled already.
 */
export type LibraryComponentMetadata = Omit<ComponentMetadata, 'styleUrl' | 'templateUrl' | 'typescriptNodes' | 'importPath'> & {
  /**
   * The package declaring the component.
   */
  library: LibraryPackage;
  /**
   * The path the generated code imports the module of the component with, the one of the `exports` of its package
   * leading to it (`@acme/ui/card/card.xd.component`).
   */
  importPath: string;
};
