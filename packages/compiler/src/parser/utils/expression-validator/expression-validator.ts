import { Node, ScriptTarget, SyntaxKind, VariableStatement, createSourceFile, forEachChild } from 'typescript';
import { ExpressionValidationResult } from '../../types/expression-validation-result.type';

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
 * @param source - The raw expression string extracted from the template.
 * @returns A {@link ExpressionValidationResult} containing the parsed AST node.
 * @throws A message describing the first disallowed construct found.
 *
 * @example
 * const { node } = validateExpression('user.hasRole("admin") && isVerified');
 *
 * @example
 * validateExpression('await user.load()');
 * // throws "'await' is not allowed inside template expressions."
 */
export function validateExpression(source: string): ExpressionValidationResult {
  const prefix = 'const x = ';
  const sourceFile = createSourceFile('expression.ts', `${prefix}${source}`, ScriptTarget.ESNext, true);

  const statement = sourceFile.statements[0] as VariableStatement;
  const expression = statement.declarationList.declarations[0].initializer!;

  visitNode(expression);

  return {
    node: expression,
  };
}

/**
 * Recursively visits an AST node, throwing as soon as a node kind outside
 * the permitted expression subset is found.
 *
 * @param node - The AST node to inspect.
 */
function visitNode(node: Node): void {
  if (!isAllowedNode(node)) {
    throw buildDisallowedMessage(node);
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