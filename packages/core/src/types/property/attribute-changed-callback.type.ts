/**
 * The `attributeChangedCallback` the browser calls on a custom element for the attributes it observes.
 *
 * @param name - The name of the attribute.
 * @param oldValue - Its previous text, `null` when it was absent.
 * @param newValue - Its text, `null` once removed.
 */
export type AttributeChangedCallback = (this: Element, name: string, oldValue: string | null, newValue: string | null) => void;
