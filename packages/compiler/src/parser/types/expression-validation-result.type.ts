import ts from 'typescript';
import { ExpressionDiagnostic } from './nodes/expression-diangnostic.type';

/**
 * The result returned by {@link validateExpression}.
 */
export interface ExpressionValidationResult {
  /**
   * The parsed AST node representing the root of the expression.
   * `undefined` when parsing fails or when one or more diagnostics are emitted —
   * callers must check `diagnostics` before using this value.
   */
  node: ts.Expression | undefined;
  /**
   * Diagnostics produced during parsing and AST validation.
   * An empty array means the expression is syntactically valid and belongs
   * to the permitted subset.
   */
  diagnostics: ExpressionDiagnostic[];
}