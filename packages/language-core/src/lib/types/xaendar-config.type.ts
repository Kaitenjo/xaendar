/**
 * What the language service reads from `xaendar.json`.
 */
export type XaendarConfig = {
  /**
   * The patterns of the tag names of the custom elements of other libraries.
   */
  readonly customElements?: readonly string[];
  /**
   * The rendering on the server, which only the CLI reads: its presence tells the project renders on the server.
   */
  readonly ssr?: unknown;
};
