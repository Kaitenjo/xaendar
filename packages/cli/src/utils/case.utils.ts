/**
 * Converts a `kebab-case`, `snake_case`, or `camelCase` string to
 * `PascalCase`.
 *
 * @param str - The input string to convert.
 * @returns The PascalCase representation of `str`.
 *
 * @example
 * toPascalCase('my-button') // → 'MyButton'
 * toPascalCase('my_button') // → 'MyButton'
 * toPascalCase('myButton')  // → 'MyButton'
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

/**
 * Converts a `camelCase`, `PascalCase`, or `snake_case` string to
 * `kebab-case`.
 *
 * @param str - The input string to convert.
 * @returns The kebab-case representation of `str`.
 *
 * @example
 * toKebabCase('MyButton')  // → 'my-button'
 * toKebabCase('myButton')  // → 'my-button'
 * toKebabCase('my_button') // → 'my-button'
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}
