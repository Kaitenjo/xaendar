import type { ClassDeclaration, CompilerOptions } from 'typescript';

/**
 * State shared by every step of a single {@link extractSignalMembers} call.
 */
export type ResolutionContext = {
  /**
   * Compiler options driving how the modules declaring the base classes are resolved.
   */
  readonly compilerOptions: CompilerOptions;
  /**
   * Files read to resolve the inheritance chain.
   */
  readonly dependencies: Set<string>;
  /**
   * Classes already walked, to stop on circular inheritance.
   */
  readonly visitedClasses: Set<ClassDeclaration>;
}
