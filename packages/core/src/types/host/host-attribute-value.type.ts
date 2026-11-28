/**
 * The values a member decorated with `@HostAttribute` may give, by the name the decorator binds, a signal or a function
 * returning them included:
 * - `class`, `style` and `part`, the strings: `string | null | undefined`;
 * - `style.--name`, a custom property, and `style.name`, a property without unit: `string | number | null | undefined`;
 * - `style.name.unit`, a property with a unit: `number | null | undefined`;
 * - any other name, an attribute, a class or a part: any value.
 *
 * @template Name - The name the decorator binds.
 */
export type HostAttributeValue<Name extends string> =
  Name extends 'class' | 'style' | 'part' ? string | null | undefined
  : Name extends `style.--${string}` ? string | number | null | undefined
  : Name extends `style.${string}.${string}` ? number | null | undefined
  : Name extends `style.${string}` ? string | number | null | undefined
  : unknown;
