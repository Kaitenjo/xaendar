import { CSS_UNITS, parseStyleDeclarations, styleValue, toCssPropertyName } from '@xaendar/internals';
import type { ElementStyles } from '../../types/element-styles.type';

/**
 * Matches the name of a style property and its unit, if any, as `style.name` does in a template: `width` and `px` in
 * `width.px`, `backgroundColor` in `backgroundColor`, `-webkit-line-clamp` in `-webkit-line-clamp`.
 */
const STYLE_KEY_RE = /^(-?[a-zA-Z][a-zA-Z-]*)(?:\.([a-z]+|%))?$/;

/**
 * Gives the `style` string of the properties `@@style` binds (see `ElementStyles`): one declaration per property set,
 * its value followed by its unit, if any. A property whose name or value holds a `;` outside parentheses and quotes,
 * which would end the declaration and write other properties, is left out, as the browser leaves out an invalid value.
 *
 * @param styles - The properties.
 * @returns The string, `undefined` for `null` and `undefined`, which give no property.
 * @throws If a name is not a style property, in kebab-case or in camelCase, followed by a unit of CSS if any, nor a
 *   custom property.
 */
export function toStyleString(styles: ElementStyles): string | undefined {
  if (!styles) {
    return undefined;
  }

  const keys = Object.keys(styles);
  const declarations = new Array<string>();
  for (let i = 0; i < keys.length; i++) {
    const value = styles[keys[i]];
    if (value !== null && value !== undefined && value !== '') {
      const declaration = toDeclaration(keys[i], value);
      if (declaration) {
        declarations.push(declaration);
      }
    }
  }

  return declarations.join('; ');
}

/**
 * Gives the declaration of a style property.
 *
 * @param key - The name of the property, followed by its unit, if any.
 * @param value - The value, not empty.
 * @returns The declaration, `undefined` when the name or the value would end it and write other properties.
 * @throws If the key is not a style property, followed by a unit of CSS if any, nor a custom property.
 */
function toDeclaration(key: string, value: string | number): string | undefined {
  let name = key;
  let written = `${value}`;
  // A custom property is set as it is written, without unit
  if (!key.startsWith('--')) {
    const match = STYLE_KEY_RE.exec(key);
    if (!match) {
      throw new Error(`@@style: "${key}" names no style property: write it in kebab-case or in camelCase, followed by its unit if any, e.g. 'width.px', or a custom property, e.g. '--accent'`);
    }

    const [, property, unit] = match;
    if (unit && !CSS_UNITS.has(unit)) {
      throw new Error(`@@style: "${key}" sets ${property} in "${unit}", which is not a unit of CSS: write one of them, e.g. px, rem, %, vh`);
    }

    name = toCssPropertyName(property);
    written = unit ? `${written}${unit}` : written;
  }

  const declaration = `${name}: ${written}`;
  const parsed = parseStyleDeclarations(declaration);
  return parsed?.length === 2 && parsed[0] === name && styleValue(parsed[1]) === styleValue(written.trim()) ? declaration : undefined;
}
