import { type Diagnostic, DiagnosticCategory, type Identifier, isImportDeclaration, isNamespaceImport, isVariableStatement, type LanguageService } from 'typescript';

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

  const check = (name: Identifier): void => {
    // The modules the types of the bindings are read through are imported under names starting with `__`
    if (!name.text.startsWith('__') && checker.getPropertyOfType(rootType, name.text)) {
      diagnostics ??= new Array<Diagnostic>();
      diagnostics.push({
        file: shimFile,
        start: name.getStart(shimFile),
        length: name.getWidth(shimFile),
        category: DiagnosticCategory.Error,
        code: IMPORT_MEMBER_CONFLICT_CODE,
        messageText: `'${name.text}' is also a member of ${checker.typeToString(rootType)}: import it under another name (… as name), or rename the member.`
      });
    }
  };

  for (let i = 0; i < shimFile.statements.length; i++) {
    const statement = shimFile.statements[i];
    const namedBindings = isImportDeclaration(statement) && shimFile.getLineAndCharacterOfPosition(statement.getStart(shimFile)).line >= bodyLineOffset ? statement.importClause?.namedBindings : undefined;
    if (namedBindings && isNamespaceImport(namedBindings)) {
      check(namedBindings.name);
    } else if (namedBindings) {
      for (let j = 0; j < namedBindings.elements.length; j++) {
        check(namedBindings.elements[j].name);
      }
    }
  }

  return diagnostics;
}
