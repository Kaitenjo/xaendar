/**
 * What a token list reads and writes its attribute through.
 */
export type AttributeOwner = {
  /**
   * Reads an attribute.
   */
  getAttribute(name: string): string | null;
  /**
   * Writes an attribute.
   */
  setAttribute(name: string, value: string): void;
};
