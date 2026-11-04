/**
 * A name an input or an event of a host directive is exposed with on its component.
 */
export type Exposure = {
  /**
   * The name of the input or of the event in the directive.
   */
  name: string,
  /**
   * The name it is exposed with on the component.
   */
  alias: string
};
