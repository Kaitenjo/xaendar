/**
 * The inline styles of the elements of a tree rendered on the server, a declarative shadow root or the page around its
 * root, moved into the `<style>` of the tree (see `_SERVER_STYLE_ATTRIBUTE` of `@xaendar/core`), which a
 * `Content-Security-Policy` allows by its nonce, while it blocks the `style` attributes of the HTML.
 */
export type ServerStyles = {
  /**
   * The index of the rule of each block of declarations, in the order the rules are written: the elements with the same
   * declarations share a rule. `null` while no element has an inline style.
   */
  blocks: Map<string, number> | null;
};
