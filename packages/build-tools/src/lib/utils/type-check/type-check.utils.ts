import { Diagnostic, formatDiagnostics, FormatDiagnosticsHost, LanguageService, Program, SourceFile, sys } from 'typescript';

/**
 * Suffix of the type-check shims of the templates (see `createShim`), checked by the `transform` hook.
 */
const SHIM_FILE_SUFFIX = '.__typecheck__.ts';

/**
 * Host printing the diagnostics as `tsc` does, with paths relative to the directory Vite is started from.
 */
const FORMAT_HOST: FormatDiagnosticsHost = {
  getCanonicalFileName: fileName => fileName,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => sys.newLine
};

/**
 * Collects the type errors of the whole program, as `tsc --noEmit` does: the ones of the compiler
 * options and the syntactic and semantic ones of every file of the project. The shims of the templates
 * are left out, being checked by the `transform` hook.
 *
 * @param languageService - The language service holding the program.
 * @returns The diagnostics found.
 */
export function collectProjectDiagnostics(languageService: LanguageService): Diagnostic[] {
  const program = languageService.getProgram()!;
  const diagnostics = [...languageService.getCompilerOptionsDiagnostics()];

  const sourceFiles = program.getSourceFiles();
  for (let i = 0; i < sourceFiles.length; i++) {
    const sourceFile = sourceFiles[i];
    if (isProjectFile(program, sourceFile)) {
      diagnostics.push(...collectSourceFileDiagnostics(languageService, sourceFile.fileName));
    }
  }

  return diagnostics;
}

/**
 * Collects the syntactic and semantic type errors of a single file of the project.
 *
 * @param languageService - The language service holding the program.
 * @param fileName - The file to check.
 * @returns The diagnostics found, none when the file is not a file of the project in the program.
 */
export function collectFileDiagnostics(languageService: LanguageService, fileName: string): Diagnostic[] {
  const program = languageService.getProgram()!;
  const sourceFile = program.getSourceFile(fileName);
  return sourceFile && isProjectFile(program, sourceFile) ? collectSourceFileDiagnostics(languageService, fileName) : [];
}

/**
 * Formats diagnostics as `tsc` prints them (`file(line,col): error TSxxxx: message`).
 *
 * @param diagnostics - The diagnostics to format.
 * @returns The formatted diagnostics.
 */
export function formatTypeDiagnostics(diagnostics: readonly Diagnostic[]): string {
  return formatDiagnostics(diagnostics, FORMAT_HOST);
}

/**
 * Tells whether a file of the program belongs to the project: neither a template shim, nor a file of an
 * external library or a default library.
 *
 * @param program - The program holding the file.
 * @param sourceFile - The file.
 * @returns Whether the file must be checked.
 */
function isProjectFile(program: Program, sourceFile: SourceFile): boolean {
  return !sourceFile.fileName.endsWith(SHIM_FILE_SUFFIX) && !program.isSourceFileFromExternalLibrary(sourceFile) && !program.isSourceFileDefaultLibrary(sourceFile);
}

/**
 * Collects the syntactic and semantic diagnostics of a file of the program.
 *
 * @param languageService - The language service holding the program.
 * @param fileName - The file.
 * @returns The diagnostics found.
 */
function collectSourceFileDiagnostics(languageService: LanguageService, fileName: string): Diagnostic[] {
  return [...languageService.getSyntacticDiagnostics(fileName), ...languageService.getSemanticDiagnostics(fileName)];
}
