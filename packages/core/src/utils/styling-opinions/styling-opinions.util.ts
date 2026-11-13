import { parseStyleDeclarations } from '@xaendar/common';
import type { StylingAttribute } from '../../types/styling/styling-attribute.type';
import type { StylingOpinions } from '../../types/styling/styling-opinions.type';

/**
 * The ASCII whitespace separating the classes of a `class` string.
 */
const CLASS_SEPARATOR = /[\t\n\f\r ]+/;

/**
 * Gives the opinions of the string of an attribute: the classes it lists, present, or the declarations it holds, as
 * `parseStyleDeclarations` reads them. `null` and `undefined` have no opinion, any other value is converted to a string.
 *
 * @param attribute - The attribute.
 * @param value - The value of the string.
 * @returns The opinions, `null` for none.
 */
export function stringOpinions(attribute: StylingAttribute, value: unknown): StylingOpinions | null {
  if (value === null || value === undefined) {
    return null;
  }

  const opinions = attribute === 'class' ? classOpinions(String(value)) : parseStyleDeclarations(String(value));
  return opinions ? toExactLength(opinions) : null;
}

/**
 * Gives the opinion of a key bound one by one on its value:
 * - a class is present for a truthy value and absent for `false`, `0`, `''` and the other falsy values;
 * - a property takes a string or a number, followed by its unit, if any, while `''` has no opinion;
 * - `null` and `undefined` have no opinion on either.
 *
 * @param attribute - The attribute.
 * @param value - The value.
 * @param unit - The unit of the property, empty for none.
 * @returns The opinion, `undefined` for none.
 */
export function keyOpinion(attribute: StylingAttribute, value: unknown, unit: string): string | boolean | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (attribute === 'class') {
    return !!value;
  }

  return value === '' ? undefined : `${value}${unit}`;
}

/**
 * Gives a list of opinions kept by a source at the exact length: a list grown past its first two items reserves room
 * for many more items, which a source keeping it would hold as long as it lives.
 *
 * @param opinions - The list, built by pushing its items.
 * @returns The list, copied when it was grown.
 */
export function toExactLength(opinions: StylingOpinions): StylingOpinions {
  return opinions.length > 2 ? opinions.slice() : opinions;
}

/**
 * Gives the opinions of the classes a `class` string lists: each one present, once.
 *
 * @param text - The string.
 * @returns The opinions, `null` for none.
 */
function classOpinions(text: string): Array<string | boolean> | null {
  const tokens = text.split(CLASS_SEPARATOR);
  let opinions: Array<string | boolean> | null = null;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token && !hasKey(opinions, token)) {
      opinions ? opinions.push(token, true) : opinions = [token, true];
    }
  }

  return opinions;
}

/**
 * Tells whether a list of opinions has one on a key.
 *
 * @param opinions - The opinions.
 * @param key - The key.
 * @returns `true` when it has one.
 */
function hasKey(opinions: StylingOpinions | null, key: string): boolean {
  if (opinions) {
    for (let i = 0; i < opinions.length; i += 2) {
      if (opinions[i] === key) {
        return true;
      }
    }
  }

  return false;
}
