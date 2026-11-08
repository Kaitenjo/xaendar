import { type Diagnostic, DiagnosticCategory, type Identifier, isImportDeclaration, isNamespaceImport, isVariableStatement, type LanguageService, type SourceFile, type Type, type TypeChecker } from 'typescript';

/**
 * The code of the diagnostic reporting a symbol a template imports under the name of a member of its component.
 */
export const IMPORT_MEMBER_CONFLICT_CODE = 90001;

/**
 * Finds the symbols a template imports under the name of a member of its component (inherited ones and the ones of
 * the DOM included): an expression reading the name would be ambiguous, so it is an error. The symbols are read from
 * the import declarations the type-check code writes for them (see `typeCheckImport`), the members from the type of
 * `root`, the component the shim declares (see `createShim`).
 *
 * The problems are TypeScript diagnostics of the shim, on the local name of the import declaration, which is mapped
 * onto the one of the `@import`: they are reported like the other diagnostics of the shim.
 *
 * @param languageService - The language service the shim belongs to.
 * @param shimPath - The path of the shim.
 * @param bodyLineOffset - The line of the shim the type-check code starts at: the import declarations before it are the ones of the shim itself.
 * @returns A diagnostic for each symbol named like a member, `undefined` if there is none.
 */
export function getImportConflictDiagnostics(languageService: LanguageService, shimPath: string, bodyLineOffset: number): Diagnostic[] | undefined {
  const program = languageService.getProgram()!;
  const shimFile = program.getSourceFile(shimPath)!;
  const checker = program.getTypeChecker();
  // The shim declares `root` as the components using the template
  const root = shimFile.statements.find(isVariableStatement)!.declarationList.declarations[0];
  const rootType = checker.getTypeAtLocation(root);
  let diagnostics: Diagnostic[] | undefined;

  for (let i = 0; i < shimFile.statements.length; i++) {
    const statement = shimFile.statements[i];
    const namedBindings = isImportDeclaration(statement) && shimFile.getLineAndCharacterOfPosition(statement.getStart(shimFile)).line >= bodyLineOffset ? statement.importClause?.namedBindings : undefined;
    if (namedBindings && isNamespaceImport(namedBindings)) {
      diagnostics = checkConflict(diagnostics, namedBindings.name, checker, rootType, shimFile);
    } else if (namedBindings) {
      for (let j = 0; j < namedBindings.elements.length; j++) {
        diagnostics = checkConflict(diagnostics, namedBindings.elements[j].name, checker, rootType, shimFile);
      }
    }
  }

  return diagnostics;
}

/**
 * Reports a symbol a template imports named like a member of the components using it, unless it is one of the modules
 * the types of the bindings are read through, imported under names starting with `__`.
 *
 * @param diagnostics - The diagnostics reported so far, `undefined` if there is none.
 * @param name - The name the symbol is imported under.
 * @param checker - The type checker of the shim.
 * @param rootType - The type of the components using the template.
 * @param shimFile - The shim.
 * @returns The diagnostics, `undefined` if there is none.
 */
function checkConflict(diagnostics: Diagnostic[] | undefined, name: Identifier, checker: TypeChecker, rootType: Type, shimFile: SourceFile): Diagnostic[] | undefined {
  if (name.text.startsWith('__') || !checker.getPropertyOfType(rootType, name.text)) {
    return diagnostics;
  }

  diagnostics ??= new Array<Diagnostic>();
  diagnostics.push({
    file: shimFile,
    start: name.getStart(shimFile),
    length: name.getWidth(shimFile),
    category: DiagnosticCategory.Error,
    code: IMPORT_MEMBER_CONFLICT_CODE,
    messageText: `'${name.text}' is also a member of ${checker.typeToString(rootType)}: import it under another name (… as name), or rename the member.`
  });
  return diagnostics;
}
