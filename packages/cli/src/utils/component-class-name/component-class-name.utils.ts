import { toPascalCase } from '@xaendar/common';

/**
 * Derives the name of the class of a component from its name, which is its selector: the name in PascalCase,
 * without the characters a custom element name accepts but a TypeScript identifier does not (such as a trailing `-`
 * or an emoji), followed by `Component`.
 *
 * @example
 * toComponentClassName('user-card') // → 'UserCardComponent'
 * toComponentClassName('my.el-x')   // → 'MyElXComponent'
 *
 * @param name - The name of the component, a valid custom element name.
 * @returns The name of the class.
 */
export function toComponentClassName(name: string): string {
  return `${toPascalCase(name).replace(/[^\p{ID_Continue}$\u200C\u200D]/gu, '')}Component`;
}
