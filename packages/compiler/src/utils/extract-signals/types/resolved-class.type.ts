import type { ClassDeclaration, SourceFile } from 'typescript';

/**
 * A class declaration together with the file declaring it, needed to resolve
 * the imports its heritage clause and member types refer to.
 */
export type ResolvedClass = {
  /**
   * The file declaring the class.
   */
  readonly sourceFile: SourceFile;
  /**
   * The class declaration.
   */
  readonly declaration: ClassDeclaration;
}
