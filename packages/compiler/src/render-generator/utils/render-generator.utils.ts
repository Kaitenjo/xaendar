/**
 * Resolves references to component properties inside expressions.
 * A bare identifier that is NOT a JS keyword is prefixed with `this`.
 *
 * Examples:
 *   "items"          →  "this.items"
 *   "x > 0"          →  "this.x > 0"
 */
export function resolveExpression(expression: string): string {
  return expression.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, match => match === 'this' ? match : `this.${match}`);
}

/**
 * Parses a "let X of Y" for-expression and transforms it into
 * a "const X of this.Y" iteration variable declaration.
 */
export function resolveForExpression(expression: string): string {
  const match = expression.match(/^let\s+(\w+)\s+of\s+(\w+)$/);

  if (!match) {
    throw new Error(`String "${expression}" does not match the structure "let X of Y"`);
  }

  const [, X, Y] = match;
  return `const ${X} of this.${Y}`;
}

/**
 * Indents each line of a code block by two spaces.
 */
export function indent(...lines: string[]): string[] {
  return lines.map(line => `  ${line}`);
}
