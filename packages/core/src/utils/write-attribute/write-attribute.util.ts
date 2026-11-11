import { updateAttribute } from '../class-toggle/class-toggle.util';

/**
 * The enumerated attributes whose keywords include `false` (lowercase), which a boolean writes as `"true"` or `"false"`
 * instead of adding or removing them: `contenteditable="false"`, `draggable="false"`, `spellcheck="false"` and
 * `writingsuggestions="false"` turn the feature off, where removing the attribute would leave the default of the element.
 */
const ENUMERATED_ATTRIBUTES: ReadonlySet<string> = new Set(['contenteditable', 'draggable', 'spellcheck', 'writingsuggestions']);

/**
 * Converts the value of a binding to the text of the attribute it writes, the same wherever the binding is written: in a
 * template, by `@HostProperty`, and by the server rendering either one.
 * - `null` and `undefined` remove the attribute;
 * - a boolean on an `aria-*` attribute or on an enumerated one whose keywords include `false` (`draggable`,
 *   `spellcheck`, `contenteditable`, `writingsuggestions`) is written as `"true"` or `"false"`: `aria-expanded="false"`
 *   is a state, not the absence of one;
 * - a boolean on any other attribute adds it empty (`true`) or removes it (`false`), as a boolean attribute such as
 *   `disabled` or `hidden` counts by its presence;
 * - any other value is written with `String(value)`.
 *
 * @param name - The name of the attribute.
 * @param value - The value of the binding.
 * @returns The text of the attribute, `null` to remove it.
 */
export function _attributeValue(name: string, value: unknown): string | null {
  switch (value) {
    case null:
    case undefined:
      return null;

    case true:
    case false:
      return writesBoolean(name) ? String(value) : value ? '' : null;

    default:
      return String(value);
  }
}

/**
 * Writes an attribute of an element from the value of a binding (see {@link _attributeValue}), only when it differs from
 * the one the element holds, as an element adopted from the HTML of the server does. Writing `class` keeps the classes
 * toggled by class bindings (see `updateAttribute`).
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @param value - The value of the binding.
 */
export function writeAttribute(element: Element, name: string, value: unknown): void {
  updateAttribute(element, name, _attributeValue(name, value));
}

/**
 * Tells whether an attribute writes a boolean as its text: an `aria-*` attribute, or an enumerated one whose keywords
 * include `false`. The name is compared in lowercase, as HTML compares the names of the attributes.
 *
 * @param name - The name of the attribute.
 * @returns `true` when a boolean is written as `"true"` or `"false"`.
 */
function writesBoolean(name: string): boolean {
  const lowerCase = name.toLowerCase();
  return lowerCase.startsWith('aria-') || ENUMERATED_ATTRIBUTES.has(lowerCase);
}
