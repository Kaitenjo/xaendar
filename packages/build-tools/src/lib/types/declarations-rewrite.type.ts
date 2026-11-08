import type { Program } from 'typescript';

/**
 * What the rewriting of the paths of the declarations of a library reads and collects (see `emitLibraryDeclarations`).
 */
export type DeclarationsRewrite = {
  /**
   * The program of the library.
   */
  readonly program: Program;
  /**
   * The folder of the entry of the library.
   */
  readonly base: string;
  /**
   * The declaration files of the library the declarations import (`legacy.d.ts`), by absolute path: TypeScript does not
   * emit them, so the build writes them beside the emitted ones.
   */
  readonly declarationFiles: Set<string>;
};
