/**
 * The values a member decorated with `@HostProperty` may give, by the name the decorator binds, a signal or a function
 * returning them included:
 * - `class` and `style`, the strings: `string | null | undefined`;
 * - `style.--name`, a custom property, and `style.name`, a property without unit: `string | number | null | undefined`;
 * - `style.name.unit`, a property with a unit: `number | null | undefined`;
 * - any other name, an attribute or a class: any value.
 *
 * @template Name - The name the decorator binds.
 */
export type HostPropertyValue<Name extends string> =
  Name extends 'class' | 'style' ? string | null | undefined
  : Name extends `style.--${string}` ? string | number | null | undefined
  : Name extends `style.${string}.${string}` ? number | null | undefined
  : Name extends `style.${string}` ? string | number | null | undefined
  : unknown;
