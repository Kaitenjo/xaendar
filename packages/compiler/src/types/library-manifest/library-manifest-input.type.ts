import type { LibraryManifestBinding } from './library-manifest-binding.type';

/**
 * An input of a component or of a directive of a compiled library, as its manifest describes it: `name` is the one a
 * template binds it with, its alias when it has one.
 */
export type LibraryManifestInput = LibraryManifestBinding & {
  /**
   * The name of the property of the class, when it differs from the name a template binds it with.
   */
  property?: string;
  /**
   * Whether a template must bind it.
   */
  required?: true;
  /**
   * Whether a host directive of the component exposes it.
   */
  exposed?: true;
};
