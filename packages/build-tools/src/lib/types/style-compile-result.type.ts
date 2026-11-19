/**
 * Result produced by compiling a stylesheet entry.
 *
 * The generated CSS is emitted alongside the list of files that must be
 * watched for future rebuilds when a component is recompiled.
 */
export type StyleCompileResult = {
  /**
   * The compiled CSS payload, without comments and normalized for later emission.
   */
  cssText: string | undefined;
  /**
   * Every file path that should be watched as a dependent input for the component.
   */
  dependencyPaths: string[];
};
