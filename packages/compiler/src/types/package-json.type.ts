/**
 * The fields of the `package.json` of a package that the tools read to find the compiled libraries.
 */
export type PackageJson = {
  /**
   * The name of the package.
   */
  readonly name?: string;
  /**
   * The version of the package.
   */
  readonly version?: string;
  /**
   * The paths of the package an application imports, each with its conditions (`types`, `default`).
   */
  readonly exports?: Readonly<Record<string, unknown>>;
  /**
   * The packages it needs to run.
   */
  readonly dependencies?: Readonly<Record<string, string>>;
  /**
   * The packages it needs to be developed.
   */
  readonly devDependencies?: Readonly<Record<string, string>>;
  /**
   * The packages the application installs for it.
   */
  readonly peerDependencies?: Readonly<Record<string, string>>;
  /**
   * The packages it uses when they are installed.
   */
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  /**
   * What Xaendar reads of a compiled library: the path of its manifest, relative to the root of the package.
   */
  readonly xaendar?: { readonly manifest?: string };
};
