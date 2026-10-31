/**
 * The module an `@import` path leads to.
 */
export type ResolvedModule = {
  /**
   * The path of the file declaring the module, in posix format: a TypeScript source, or the declarations of a package.
   */
  readonly fileName: string;
  /**
   * Whether the module belongs to a package: the code generated for the template imports it by the path written in
   * the `@import`, as the application does, rather than by the path of its declarations.
   */
  readonly external: boolean;
};
