/**
 * An event of a component or of a directive of a compiled library, as its manifest describes it.
 */
export type LibraryManifestBinding = {
  /**
   * The name a template binds it with.
   */
  name: string;
  /**
   * Its type as the type-check of a template reads it, the modules of the package it references written relative to
   * its root (`import('./button/button.xd.component')`) and the other packages by their name.
   */
  type: string;
};
