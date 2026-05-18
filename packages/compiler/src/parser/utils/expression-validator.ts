import ts, { Diagnostic } from 'typescript';
import { ExpressionValidationResult } from '../types/expression-validation-result.type';
import { ExpressionDiagnostic } from '../types/nodes/expression-diangnostic.type';

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
 * - Assignments (`=`, `+=`, `&&=`, etc.) — use `@const` for local bindings
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
 * reports no diagnostics.
 *
 * @param source - The raw expression string extracted from the template.
 * @returns A {@link ExpressionValidationResult} containing the parsed AST node
 *   (when valid) and any diagnostics produced during validation.
 *
 * @example
 * const result = validateExpression('user.hasRole("admin") && isVerified');
 * if (result.diagnostics.length === 0) {
 *   // result.node is safe to use
 * }
 *
 * @example
 * const result = validateExpression('await user.load()');
 * // result.diagnostics[0].message →
 * //   "'await' is not allowed inside template expressions."
 */
export function validateExpression(source: string): ExpressionValidationResult {
  const prefix = 'const x = ';
  const sourceFile = ts.createSourceFile('expression.ts', `${prefix}${source}`, ts.ScriptTarget.ESNext, true);

  const statement = sourceFile.statements[0] as ts.VariableStatement;
  const expression = statement.declarationList.declarations[0]!.initializer!;

  const diagnostics = new Array<ExpressionDiagnostic>;
  visitNode(expression, prefix.length, diagnostics);

  if (diagnostics.length) {
    throw new Error(diagnostics.reduce((acc, d) => `${acc}${d.message}\n`, ''));
  }

  return {
    node: expression,
  };
}

/**
 * Recursively visits an AST node and appends a diagnostic for every node
 * kind that is not part of the permitted expression subset.
 *
 * Recursion stops at the first disallowed node to avoid producing a cascade
 * of redundant diagnostics for its children.
 *
 * @param node - The AST node to inspect.
 * @param offset - Number of characters to subtract from raw node positions
 *   to obtain offsets relative to the original expression string.
 * @param diagnostics - Accumulator for diagnostics found during the walk.
 */
function visitNode(node: ts.Node, offset: number, diagnostics: ExpressionDiagnostic[]): void {
  if (!isAllowedNode(node)) {
    throw new Error(buildDisallowedMessage(node));
  }

  ts.forEachChild(node, child => visitNode(child, offset, diagnostics));

  if (diagnostics.length) {
    throw new Error(diagnostics[0]!.message);
  }
}

/**
 * Returns `true` if the given AST node kind is permitted inside a
 * Xaendar template expression.
 *
 * Assignment operators nested inside a `BinaryExpression` are handled
 * separately in {@link buildDisallowedMessage} since TypeScript does not
 * distinguish them at the node-kind level.
 */
function isAllowedNode(node: ts.Node): boolean {
  switch (node.kind) {
    // ---- Literals ----
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.BigIntLiteral:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.UndefinedKeyword:

    // ---- Identifiers ----
    case ts.SyntaxKind.Identifier:

    // ---- Member access ----
    // user.name
    case ts.SyntaxKind.PropertyAccessExpression:
    // user['name'], items[0]
    case ts.SyntaxKind.ElementAccessExpression:

    // ---- Call expressions ----
    // user.getFullName(), user.hasRole('admin')
    case ts.SyntaxKind.CallExpression:

    // ---- Binary expressions ----
    // Covers arithmetic, comparison, logical, bitwise, nullish coalescing,
    // and instanceof. Assignment operators are rejected in visitNode via
    // buildDisallowedMessage before recursing into children.
    case ts.SyntaxKind.BinaryExpression:

    // ---- Operator tokens — visited as children of BinaryExpression ----
    // Comparison
    case ts.SyntaxKind.EqualsEqualsToken:            // ==
    case ts.SyntaxKind.EqualsEqualsEqualsToken:       // ===
    case ts.SyntaxKind.ExclamationEqualsToken:        // !=
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:  // !==
    case ts.SyntaxKind.LessThanToken:                 // 
    case ts.SyntaxKind.LessThanEqualsToken:           // <=
    case ts.SyntaxKind.GreaterThanToken:              // >
    case ts.SyntaxKind.GreaterThanEqualsToken:        // >=

    // Arithmetic
    case ts.SyntaxKind.PlusToken:                     // +
    case ts.SyntaxKind.MinusToken:                    // -
    case ts.SyntaxKind.AsteriskToken:                 // *
    case ts.SyntaxKind.SlashToken:                    // /
    case ts.SyntaxKind.PercentToken:                  // %
    case ts.SyntaxKind.AsteriskAsteriskToken:         // **

    // Logical
    case ts.SyntaxKind.AmpersandAmpersandToken:       // &&
    case ts.SyntaxKind.BarBarToken:                   // ||
    case ts.SyntaxKind.QuestionQuestionToken:         // ??

    // Bitwise
    case ts.SyntaxKind.AmpersandToken:                // &
    case ts.SyntaxKind.BarToken:                      // |
    case ts.SyntaxKind.CaretToken:                    // ^
    case ts.SyntaxKind.LessThanLessThanToken:         // 
    case ts.SyntaxKind.GreaterThanGreaterThanToken:   // >>
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken: // >>>
    
    // instanceof / in
    case ts.SyntaxKind.InstanceOfKeyword:             // instanceof
    case ts.SyntaxKind.InKeyword:                     // in

    // ---- Unary expressions ----
    // !isAdmin, ~flags, +n, -n, typeof x, void 0
    case ts.SyntaxKind.PrefixUnaryExpression:
    case ts.SyntaxKind.PostfixUnaryExpression:
    // typeof is represented as a dedicated node kind in some TS versions
    case ts.SyntaxKind.TypeOfExpression:
    case ts.SyntaxKind.VoidExpression:

    // ---- Conditional (ternary) ----
    // isAdmin ? 'yes' : 'no'
    case ts.SyntaxKind.ConditionalExpression:

    // ---- Parenthesised expressions ----
    case ts.SyntaxKind.ParenthesizedExpression:

    // ---- Template literals ----
    // `Hello ${user.name}`
    case ts.SyntaxKind.TemplateExpression:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.TemplateHead:
    case ts.SyntaxKind.TemplateMiddle:
    case ts.SyntaxKind.TemplateTail:
    case ts.SyntaxKind.TemplateSpan:

    // ---- Arrays ----
    // [1, 2, 3], [...items]
    case ts.SyntaxKind.ArrayLiteralExpression:

    // ---- Objects ----
    // { key: value }, { ...defaults, name }
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PropertyAssignment:
    case ts.SyntaxKind.ShorthandPropertyAssignment:
    // { ...obj } inside an object literal
    case ts.SyntaxKind.SpreadAssignment:

    // ---- Spread ----
    // foo(...args), [...items]
    case ts.SyntaxKind.SpreadElement:

    // ---- Internal structural nodes ----
    // Visited during recursion but carry no semantic meaning of their own.
    case ts.SyntaxKind.SyntaxList:
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
 * Provides specific messages for the most common mistakes (assignments, `await`,
 * `new`, functions) and falls back to a generic message for anything else.
 */
function buildDisallowedMessage(node: ts.Node): string {
  switch (node.kind) {
    case ts.SyntaxKind.AwaitExpression:
      return "'await' is not allowed inside template expressions.";

    case ts.SyntaxKind.YieldExpression:
      return "'yield' is not allowed inside template expressions.";

    case ts.SyntaxKind.NewExpression:
      return "'new' is not allowed inside template expressions.";

    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.FunctionExpression:
      return 'Function expressions are not allowed inside template expressions.';

    case ts.SyntaxKind.TaggedTemplateExpression:
      return 'Tagged template expressions are not allowed inside template expressions.';

    case ts.SyntaxKind.BinaryExpression: {
      const bin = node as ts.BinaryExpression;
      return isAssignmentOperator(bin.operatorToken.kind)
        ? 'Assignments are not allowed inside template expressions. Use @const to declare local template variables instead.'
        : `'${ts.SyntaxKind[node.kind]}' is not allowed inside template expressions.`;
    }

    default:
      return `'${ts.SyntaxKind[node.kind]}' is not allowed inside template expressions.`;
  }
}

/**
 * Returns `true` if the given {@link ts.SyntaxKind} is an assignment operator.
 *
 * Covers simple assignment (`=`) as well as all compound assignment operators
 * (`+=`, `-=`, `&&=`, `||=`, `??=`, etc.) as defined by the TypeScript
 * `FirstAssignment`–`LastAssignment` range.
 */
function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
}