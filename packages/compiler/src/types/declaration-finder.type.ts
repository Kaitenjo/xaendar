import type { Declaration, Statement } from 'typescript';

/**
 * Finds the declarations of one kind (classes, variables) among the statements of a file,
 * letting the same import and re-export resolution look for any of them.
 *
 * @template D - The kind of declaration.
 */
export type DeclarationFinder<D extends Declaration> = {
  /**
   * Finds the declaration `statement` binds to `localName` in the scope of its file.
   *
   * @param statement - A top-level statement of the file.
   * @param localName - The local name of the declaration.
   * @returns The declaration, or `undefined` if `statement` doesn't declare it.
   */
  readonly local: (statement: Statement, localName: string) => D | undefined;
  /**
   * Finds the declaration `statement` exports as `exportedName`.
   *
   * @param statement - A top-level statement of the file.
   * @param exportedName - The exported name, `'default'` for the default export.
   * @returns The declaration, or `undefined` if `statement` doesn't export it.
   */
  readonly exported: (statement: Statement, exportedName: string) => D | undefined;
}
