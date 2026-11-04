/**
 * The component owning a custom element selector, or the directive owning a directive selector:
 * a selector can be defined only once at runtime, so it can belong to a single component or directive.
 */
export type SelectorOwner = {
  /**
   * Absolute path, in posix format, of the file declaring the component or directive.
   */
  ownerFile: string;
  /**
   * Class name of the component or directive.
   */
  className: string;
};
