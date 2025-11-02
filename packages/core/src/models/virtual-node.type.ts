/**
 * Represents a virtual DOM node.
 * Used to check differences between renders.
 */
export type VirtualNode = {
  /**
   * The HTML tag of the virtual node.
   */
  tag: string
  /**
   * The properties/attributes of the virtual node.
   */
  props: Record<string, string>
  /**
   * The children of the virtual node, which can be other virtual nodes or strings.
   */
  children: Array<VirtualNode | string>
};