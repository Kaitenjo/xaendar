/**
 * Reads the attributes of an element (see `describeUnsafeElementAttribute`): the element itself, or the attributes the
 * template writes for it.
 */
export interface AttributeReader {
  /**
   * Reads the value of an attribute.
   *
   * @param name - The name of the attribute.
   * @returns The value, `null` or `undefined` for an attribute the element does not have.
   */
  getAttribute(name: string): string | null | undefined;
}
