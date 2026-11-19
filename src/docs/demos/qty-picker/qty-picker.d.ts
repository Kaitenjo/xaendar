/**
 * `<ex-qty-picker>` as the applications that embed it see it: a plain element whose `value` property sets the
 * quantity shown. The host listens to its `changed` event to read the quantity the user asked for, and assigns it
 * back.
 */
export type QtyPicker = HTMLElement & {
  /**
   * The input of the quantity: reading it returns the signal of the component.
   */
  get value(): () => number;
  /**
   * Sets the quantity shown by the element.
   */
  set value(value: number);
};

/**
 * Defines `<ex-qty-picker>`, with the Xaendar runtime bundled in this package.
 *
 * @returns A promise resolved once the element is defined and can be created.
 */
export declare function defineQtyPicker(): Promise<void>;
