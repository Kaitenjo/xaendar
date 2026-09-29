/**
 * The component owning a custom element selector: a selector can be defined only once
 * in the Custom Elements registry, so it can belong to a single component.
 */
export type SelectorOwner = {
  /**
   * Absolute path, in posix format, of the file declaring the component.
   */
  ownerFile: string;
  /**
   * Class name of the component.
   */
  className: string;
};
