/**
 * A property or an event of a host directive exposed on its component: either its name, which the component exposes it
 * with, or an object also giving the name it is exposed with.
 */
export type HostDirectiveMember = string | {
  /**
   * The name of the property (or its alias, when the directive declares one) or of the event in the directive.
   */
  name: string,
  /**
   * The name it is exposed with on the component.
   */
  alias: string
};
