import type { Declaration, SourceFile } from 'typescript';

/**
 * A declaration together with the file declaring it, needed to resolve
 * the imports it refers to.
 *
 * @template D - The kind of declaration.
 */
export type ResolvedDeclaration<D extends Declaration> = {
  /**
   * The file declaring the declaration.
   */
  readonly sourceFile: SourceFile;
  /**
   * The declaration.
   */
  readonly declaration: D;
}
