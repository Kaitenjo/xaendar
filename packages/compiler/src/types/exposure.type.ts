/**
 * A property or an event of a host directive exposed on its component: the name in the directive and the name it is exposed with.
 */
export type Exposure = {
  /**
   * The name of the property (or its alias, when the directive declares one) or of the event in the directive.
   */
  name: string,
  /**
   * The name it is exposed with on the component.
   */
  alias: string
};
