import type { LibraryComponentMetadata } from './library-component-metadata.type';
import type { LibraryDirectiveMetadata } from './library-directive-metadata.type';
import type { LibraryManifest } from './library-manifest/library-manifest.type';
import type { PackageJson } from './package-json.type';

/**
 * A compiled library installed in a project: a package whose `package.json` points to a manifest (see `xd build`).
 */
export type PackageLibrary = {
  /**
   * The absolute path of the root of the package, with forward slashes.
   */
  readonly root: string;
  /**
   * The `package.json` of the package.
   */
  readonly packageJson: PackageJson;
  /**
   * The manifest of the package.
   */
  readonly manifest: LibraryManifest;
  /**
   * The paths of the `exports` of the package (`.`, `./card/card.xd.component`), keyed by the normalized path of the
   * declaration file each one leads TypeScript to.
   */
  readonly subpaths: ReadonlyMap<string, string>;
  /**
   * The metadata read from the manifest so far, by the key of their declaration: each one is read once.
   */
  readonly metadatas: Map<string, LibraryComponentMetadata | LibraryDirectiveMetadata>;
};
