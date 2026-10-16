import { type ASTNode, resolveTemplateSpan, type Span, TemplateError } from '@xaendar/compiler';
import { type Diagnostic, DiagnosticCategory, flattenDiagnosticMessageText } from 'typescript';
import type { TemplateAnalysis, TemplateAnalysisResult } from '../template-analysis/template-analysis';
import { findUnusedImports } from '../template-imports/template-imports';
import { getImportConflictDiagnostics } from '../utils/import-conflicts/import-conflicts.utils';
import { getEnclosingElementName, getErrorSpan, toTemplateSpan } from '../utils/template-span/template-span.utils';

/**
 * A problem found in a template, located in the template itself.
 */
export type TemplateDiagnostic = {
  /**
   * The span of the template the problem refers to.
   */
  readonly span: Span;
  /**
   * The description of the problem.
   */
  readonly message: string;
  /**
   * The severity of the problem.
   */
  readonly category: DiagnosticCategory;
  /**
   * The TypeScript error code, for the problems found by type-checking the template.
   */
  readonly code?: number;
  /**
   * Set for what the template doesn't need (an import it never uses): the editor shows it faded, not as a problem.
   */
  readonly unnecessary?: true;
};

/**
 * Collects the problems of a template: the error preventing it from being analyzed, reported on its span, or
 * the errors found while analyzing it (every node failing type-checking, every import that cannot be resolved),
 * reported on their spans, followed by the TypeScript diagnostics of its shim, mapped back onto the template.
 *
 * A TypeScript diagnostic falls on the narrowest part of the template it comes from: the exact characters of an
 * identifier or of a piece of an expression, or the whole binding otherwise. A diagnostic of a line of the shim not
 * mapped onto the template falls on the tag name of the element enclosing the closest mapped line before it.
 *
 * @param result - The analysis of the template.
 * @returns The problems found.
 */
export function getTemplateDiagnostics({ analysis, error, ast }: TemplateAnalysisResult): TemplateDiagnostic[] {
  if (error) {
    return [toTemplateDiagnostic(error, ast)];
  }

  const { languageService, shimPath, errors, bodyLineOffset } = analysis!;
  const shimDiagnostics = [...languageService.getSyntacticDiagnostics(shimPath), ...languageService.getSemanticDiagnostics(shimPath)];
  const conflicts = getImportConflictDiagnostics(languageService, shimPath, bodyLineOffset);
  if (conflicts?.length) {
    shimDiagnostics.push(...conflicts);
  }

  const diagnostics = [
    ...errors.map(templateError => toTemplateDiagnostic(templateError, ast)),
    ...shimDiagnostics
      .map(diagnostic => ({
        span: locateDiagnostic(analysis!, diagnostic),
        message: flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        category: diagnostic.category,
        code: diagnostic.code
      }))
  ];

  const unused = findUnusedImports(analysis!);
  if (unused) {
    for (let i = 0; i < unused.length; i++) {
      diagnostics.push({ span: unused[i].span, message: `'${unused[i].name}' is declared but never used.`, category: DiagnosticCategory.Suggestion, unnecessary: true });
    }
  }

  return diagnostics;
}

/**
 * Reports an error of the compiler on its span.
 *
 * @param error - The error.
 * @param ast - The top-level nodes of the template, when it could be parsed.
 * @returns The problem.
 */
function toTemplateDiagnostic(error: Error, ast: readonly ASTNode[] | undefined): TemplateDiagnostic {
  return {
    span: getErrorSpan(error, ast),
    message: error instanceof TemplateError ? error.detail : error.message,
    category: DiagnosticCategory.Error
  };
}

/**
 * Locates a TypeScript diagnostic of the shim of a template in the template.
 *
 * @param analysis - The analysis of the template.
 * @param diagnostic - The diagnostic.
 * @returns The span of the template the diagnostic is reported on.
 */
function locateDiagnostic({ typeCheck, bodyLineOffset, ast }: TemplateAnalysis, diagnostic: Diagnostic): Span {
  const { file, start = 0, length = 0 } = diagnostic;
  const located = file && toTemplateSpan(typeCheck, file, bodyLineOffset, start, length);
  if (located) {
    return located;
  }

  // The closest mapped line before the one of the diagnostic, the line itself included
  let line = file ? file.getLineAndCharacterOfPosition(start).line - bodyLineOffset : -1;
  let mapped: Span | undefined;
  while (line >= 0 && !mapped) {
    mapped = resolveTemplateSpan(typeCheck.mappingTable, { line, character: 0 });
    line--;
  }

  return (mapped && getEnclosingElementName(ast, mapped.start)) ?? { start: 0, end: 0 };
}
