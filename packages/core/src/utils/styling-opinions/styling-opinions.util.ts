import { parseStyleDeclarations } from '@xaendar/common';
import type { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
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

  return (attribute === 'class' ? classOpinions(String(value)) : parseStyleDeclarations(String(value))) ?? null;
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
 * Gives the opinions of the string of a binding of the template: its static string, parsed by the compiler, or the value
 * of its expression.
 *
 * @param styling - The binding.
 * @param values - The values of its expressions (see `_setExpressionStyling`): the value of the only one, or the values
 *   of all of them, the string first; `undefined` before the first run.
 * @returns The opinions, `null` for none.
 */
export function templateString({ name, statics, string, values: expressions }: _RenderStyling, values: unknown): StylingOpinions | null {
  if (statics) {
    return statics;
  }

  if (!string) {
    return null;
  }

  return stringOpinions(name, expressions ? (values as unknown[] | undefined)?.[0] : values);
}

/**
 * Gives the opinions of the keys a binding of the template binds one by one, by the values of their expressions.
 *
 * @param styling - The binding.
 * @param values - The values of its expressions (see {@link templateString}).
 * @returns The opinions, `null` for none.
 */
export function templateKeys({ name, string, keys, units }: _RenderStyling, values: unknown): StylingOpinions | null {
  if (!keys) {
    return null;
  }

  const single = !string && keys.length === 1;
  const offset = string ? 1 : 0;
  let opinions: Array<string | boolean> | null = null;
  for (let i = 0; i < keys.length; i++) {
    const value = single ? values : (values as unknown[] | undefined)?.[offset + i];
    const opinion = keyOpinion(name, value, units?.[i] ?? '');
    if (opinion !== undefined) {
      opinions ? opinions.push(keys[i], opinion) : opinions = [keys[i], opinion];
    }
  }

  return opinions;
}

/**
 * Gives the opinions of the string of a run of host attributes, by the values its members gave: the one of the last host
 * attribute of the whole attribute (`@HostAttribute('class')`), if any.
 *
 * @param run - The run.
 * @param values - The values (see `HostStylingRun.values`).
 * @returns The opinions, `null` for none.
 */
export function hostString({ attribute, bindings }: HostStylingRun, values: unknown): StylingOpinions | null {
  let opinions: StylingOpinions | null = null;
  for (let i = 0; i < bindings.length; i++) {
    if (!bindings[i].name) {
      opinions = stringOpinions(attribute, runValue(values, bindings.length, i));
    }
  }

  return opinions;
}

/**
 * Gives the opinions of the keys a run of host attributes binds one by one (`@HostAttribute('class.on')`), by the values
 * its members gave.
 *
 * @param run - The run.
 * @param values - The values (see `HostStylingRun.values`).
 * @returns The opinions, `null` for none.
 */
export function hostKeys({ attribute, bindings }: HostStylingRun, values: unknown): StylingOpinions | null {
  let opinions: Array<string | boolean> | null = null;
  for (let i = 0; i < bindings.length; i++) {
    const { name, unit } = bindings[i];
    const opinion = name ? keyOpinion(attribute, runValue(values, bindings.length, i), unit ?? '') : undefined;
    if (opinion !== undefined) {
      opinions ? opinions.push(name, opinion) : opinions = [name, opinion];
    }
  }

  return opinions;
}

/**
 * Gives the value of a host attribute among the values of a run, which keeps a single value as it is (see
 * `HostStylingRun.values` and `HostAttributeRun.values`).
 *
 * @param values - The values of the run, `undefined` before it runs.
 * @param count - The number of its host attributes.
 * @param index - The index of the host attribute.
 * @returns The value.
 */
export function runValue(values: unknown, count: number, index: number): unknown {
  return count === 1 ? values : (values as unknown[] | undefined)?.[index];
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
