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
export declare function toPascalCase(str: string): string;
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
export declare function toKebabCase(str: string): string;
