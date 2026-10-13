import { slice } from '@xaendar/common';
import { LanguageVariant, Node, ScriptTarget, SourceFile, SyntaxKind, VariableStatement, createScanner, createSourceFile, forEachChild } from 'typescript';
import type { Span } from '../../../types/span.type';
import { ExpressionValidationResult } from '../../types/expression-validation-result.type';

/**
 * Text the expression is prefixed with to be parsed as the initializer of a declaration.
 */
const EXPRESSION_PREFIX = 'const x = ';

/**
 * Offset to add to a position in the source file of an expression to get its offset in the template,
 * for the expressions validated together with their offset (see {@link validateExpression}).
 */
const templateOffsets = new WeakMap<SourceFile, number>();

/**
 * Validates that a string contains a single expression belonging to the
 * permitted subset of JavaScript supported inside Xaendar template expressions.
 *
 * ## Permitted constructs
 *
 * - **Literals** — strings, numbers, bigints, booleans, `null`, `undefined`
 * - **Identifiers** — resolved at runtime against the active scope chain
 * - **Member access** — `user.name`, `user.address.city`, `items[0]`
 * - **Call expressions** — `user.getFullName()`, `user.hasRole('admin')`
 * - **Binary expressions** — arithmetic (`+`, `-`, `*`, `/`, `%`, `**`),
 *   comparison (`===`, `!==`, `<`, `>`, `<=`, `>=`),
 *   logical (`&&`, `||`, `??`),
 *   bitwise (`&`, `|`, `^`, `<<`, `>>`, `>>>`)
 * - **Unary expressions** — `!`, `~`, `+`, `-`, `typeof`, `void`
 * - **Conditional (ternary)** — `isAdmin ? 'yes' : 'no'`
 * - **Parenthesised expressions** — `(user.age > 18)`
 * - **Template literals** — `` `Hello ${user.name}` ``
 * - **Array literals** — `[1, 2, 3]`, `[...items]`
 * - **Object literals** — `{ key: value }`, `{ ...defaults, name }`
 * - **Spread** — `foo(...args)`, `[...items]`, `{ ...obj }`
 * - **`typeof` / `instanceof`** — `typeof user.role`, `user instanceof AdminUser`
 *
 * ## Prohibited constructs
 *
 * - Assignments (`=`, `+=`, `&&=`, etc.)
 * - `await` and `yield`
 * - `new` expressions
 * - Function and arrow function expressions
 * - Tagged template expressions
 *
 * ## Scope resolution
 *
 * This function performs **syntactic** validation only. Identifier resolution
 * (scope chain walk → `ctx.` prefix injection) is the responsibility of the
 * caller and must be performed on the returned `node` after this function
 * returns without throwing.
 *
 * ## Template positions
 *
 * When `templateOffset` is given, the offset of the expression in the template is recorded, so that
 * {@link getTemplateSpan} can tell where any node of the expression is in the template, and an error
 * carries the span of the offending part of the expression as its `cause`.
 *
 * @param source - The raw expression string extracted from the template.
 * @param templateOffset - The offset of `source` in the template, if known.
 * @returns A {@link ExpressionValidationResult} containing the parsed AST node.
 * @throws An `Error` describing the first disallowed construct found.
 *
 * @example
 * const { node } = validateExpression('user.hasRole("admin") && isVerified');
 *
 * @example
 * validateExpression('await user.load()');
 * // throws "'await' is not allowed inside template expressions."
 */
export function validateExpression(source: string, templateOffset?: number): ExpressionValidationResult {
  const sourceFile = createSourceFile('expression.ts', `${EXPRESSION_PREFIX}${source}`, ScriptTarget.ESNext, true);
  if (templateOffset !== undefined) {
    templateOffsets.set(sourceFile, templateOffset - EXPRESSION_PREFIX.length);
  }

  const statement = sourceFile.statements[0] as VariableStatement;
  const expression = statement.declarationList.declarations[0].initializer!;

  /*
    The parser stops at the end of the first expression: anything following it but whitespace and comments
    means the source holds more than one expression (e.g. `a b`, `a; b`, `a, b`, the latter parsed as a second declaration).
    An incomplete expression (e.g. `a.`) is still a single one, recovered by the parser.
  */
  const scanner = createScanner(ScriptTarget.ESNext, true, LanguageVariant.Standard, sourceFile.text, undefined, expression.end);
  if (scanner.scan() !== SyntaxKind.EndOfFileToken) {
    const rest = slice(sourceFile.text, expression.end);
    throw new Error(`'${source.trim()}' must be a single expression, got '${rest.trim()}' after '${expression.getText()}'.`, {
      cause: toTemplateSpan(sourceFile, expression.end + rest.length - rest.trimStart().length, sourceFile.text.trimEnd().length)
    });
  }

  visitNode(expression);

  return {
    node: expression,
  };
}

/**
 * Returns the span in the template of a node of an expression validated together with its offset (see {@link validateExpression}).
 *
 * @param node - A node of the expression: the expression itself, or any of its descendants.
 * @returns The span of the node in the template, or `undefined` if the offset of the expression is not known.
 */
export function getTemplateSpan(node: Node): Span | undefined {
  const sourceFile = node.getSourceFile();
  return toTemplateSpan(sourceFile, node.getStart(sourceFile), node.getEnd());
}

/**
 * Converts a range of the source file of an expression into a span of the template.
 *
 * @param sourceFile - The source file of the expression.
 * @param start - The start of the range in the source file.
 * @param end - The end of the range in the source file.
 * @returns The span in the template, or `undefined` if the offset of the expression is not known.
 */
function toTemplateSpan(sourceFile: SourceFile, start: number, end: number): Span | undefined {
  const offset = templateOffsets.get(sourceFile);
  return offset === undefined ? undefined : { start: offset + start, end: offset + end };
}

/**
 * Recursively visits an AST node, throwing as soon as a node kind outside
 * the permitted expression subset is found.
 *
 * @param node - The AST node to inspect.
 * @throws An `Error` describing the disallowed node, carrying its span in the template as `cause` when known.
 */
function visitNode(node: Node): void {
  if (!isAllowedNode(node)) {
    throw new Error(buildDisallowedMessage(node), { cause: getTemplateSpan(node) });
  }

  forEachChild(node, visitNode);
}

/**
 * Returns `true` if the given AST node kind is permitted inside a
 * Xaendar template expression.
 *
 * Assignment operators (`=`, `+=`, ...) are rejected because their operator
 * tokens, visited as children of a `BinaryExpression`, are not in the allowed set.
 */
function isAllowedNode(node: Node): boolean {
  switch (node.kind) {
    // ---- Literals ----
    case SyntaxKind.StringLiteral:
    case SyntaxKind.NumericLiteral:
    case SyntaxKind.BigIntLiteral:
    case SyntaxKind.TrueKeyword:
    case SyntaxKind.FalseKeyword:
    case SyntaxKind.NullKeyword:
    case SyntaxKind.UndefinedKeyword:

    // ---- Identifiers ----
    case SyntaxKind.Identifier:

    // ---- Member access ----
    // user.name
    case SyntaxKind.PropertyAccessExpression:
    // user['name'], items[0]
    case SyntaxKind.ElementAccessExpression:

    // ---- Call expressions ----
    // user.getFullName(), user.hasRole('admin')
    case SyntaxKind.CallExpression:

    // ---- Binary expressions ----
    // Covers arithmetic, comparison, logical, bitwise, nullish coalescing,
    // and instanceof. Assignment operators are rejected in visitNode via
    // buildDisallowedMessage before recursing into children.
    case SyntaxKind.BinaryExpression:

    // ---- Operator tokens — visited as children of BinaryExpression ----
    // Comparison
    case SyntaxKind.EqualsEqualsToken:             // ==
    case SyntaxKind.EqualsEqualsEqualsToken:       // ===
    case SyntaxKind.ExclamationEqualsToken:        // !=
    case SyntaxKind.ExclamationEqualsEqualsToken:  // !==
    case SyntaxKind.LessThanToken:                 // 
    case SyntaxKind.LessThanEqualsToken:           // <=
    case SyntaxKind.GreaterThanToken:              // >
    case SyntaxKind.GreaterThanEqualsToken:        // >=

    // Arithmetic
    case SyntaxKind.PlusToken:                     // +
    case SyntaxKind.MinusToken:                    // -
    case SyntaxKind.AsteriskToken:                 // *
    case SyntaxKind.SlashToken:                    // /
    case SyntaxKind.PercentToken:                  // %
    case SyntaxKind.AsteriskAsteriskToken:         // **

    // Logical
    case SyntaxKind.AmpersandAmpersandToken:       // &&
    case SyntaxKind.BarBarToken:                   // ||
    case SyntaxKind.QuestionQuestionToken:         // ??
    case SyntaxKind.QuestionDotToken:              // ?.
    case SyntaxKind.QuestionToken:                 // ?
    case SyntaxKind.ColonToken:                    // :

    // Bitwise
    case SyntaxKind.AmpersandToken:                // &
    case SyntaxKind.BarToken:                      // |
    case SyntaxKind.CaretToken:                    // ^
    case SyntaxKind.LessThanLessThanToken:         // 
    case SyntaxKind.GreaterThanGreaterThanToken:   // >>
    case SyntaxKind.GreaterThanGreaterThanGreaterThanToken: // >>>
    
    // instanceof / in
    case SyntaxKind.InstanceOfKeyword:             // instanceof
    case SyntaxKind.InKeyword:                     // in

    // ---- Unary expressions ----
    // !isAdmin, ~flags, +n, -n, typeof x, void 0
    case SyntaxKind.PrefixUnaryExpression:
    case SyntaxKind.PostfixUnaryExpression:
    // typeof is represented as a dedicated node kind in some TS versions
    case SyntaxKind.TypeOfExpression:
    case SyntaxKind.VoidExpression:

    // ---- Conditional (ternary) ----
    // isAdmin ? 'yes' : 'no'
    case SyntaxKind.ConditionalExpression:

    // ---- Parenthesised expressions ----
    case SyntaxKind.ParenthesizedExpression:

    // ---- Template literals ----
    // `Hello ${user.name}`
    case SyntaxKind.TemplateExpression:
    case SyntaxKind.NoSubstitutionTemplateLiteral:
    case SyntaxKind.TemplateHead:
    case SyntaxKind.TemplateMiddle:
    case SyntaxKind.TemplateTail:
    case SyntaxKind.TemplateSpan:

    // ---- Arrays ----
    // [1, 2, 3], [...items]
    case SyntaxKind.ArrayLiteralExpression:

    // ---- Objects ----
    // { key: value }, { ...defaults, name }
    case SyntaxKind.ObjectLiteralExpression:
    case SyntaxKind.PropertyAssignment:
    case SyntaxKind.ShorthandPropertyAssignment:
    // { ...obj } inside an object literal
    case SyntaxKind.SpreadAssignment:

    // ---- Spread ----
    // foo(...args), [...items]
    case SyntaxKind.SpreadElement:

    case SyntaxKind.TaggedTemplateExpression:
      
    // ---- Internal structural nodes ----
    // Visited during recursion but carry no semantic meaning of their own.
    case SyntaxKind.SyntaxList:
      return true;

    // ---- Disallowed by default ----
    default:
      return false;
  }
}

/**
 * Builds a human-readable diagnostic message for a node that is not permitted
 * inside a Xaendar template expression.
 *
 * Provides specific messages for the most common mistakes (`await`, `yield`,
 * `new`, functions) and falls back to a generic message for anything else.
 */
function buildDisallowedMessage(node: Node): string {
  switch (node.kind) {
    case SyntaxKind.AwaitExpression:
      return "'await' is not allowed inside template expressions.";

    case SyntaxKind.YieldExpression:
      return "'yield' is not allowed inside template expressions.";

    case SyntaxKind.NewExpression:
      return "'new' is not allowed inside template expressions.";

    case SyntaxKind.ArrowFunction:
    case SyntaxKind.FunctionExpression:
      return 'Function expressions are not allowed inside template expressions.';

    default:
      return `'${SyntaxKind[node.kind]}' is not allowed inside template expressions.`;
  }
}