/**
 * `<ex-qty-picker>` as the applications that embed it see it: a plain element with one extra method. The host
 * never sets a property on it, and listens to its `changed` event to read the quantity back.
 */
export type QtyPicker = HTMLElement & {
  /**
   * Sets the quantity shown by the element.
   *
   * @param value - The new quantity.
   */
  setValue(value: number): void;
};

/**
 * Defines `<ex-qty-picker>`, with the Xaendar runtime bundled in this package.
 *
 * @returns A promise resolved once the element is defined and can be created.
 */
export declare function defineQtyPicker(): Promise<void>;
