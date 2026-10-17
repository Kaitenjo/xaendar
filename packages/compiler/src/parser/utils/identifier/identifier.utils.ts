import { createSourceFile, isExpressionStatement, isIdentifier, ScriptTarget } from 'typescript';
import type { Span } from '../../../types/span.type';

/**
 * The names the generated code uses for itself, which a template cannot declare: the component the type-check reads
 * its members from, and the event of an event binding. The names starting with `__` or `$$` are reserved too.
 */
const RESERVED_NAMES: ReadonlySet<string> = new Set(['root', '$event']);

/**
 * Checks whether `name` is a valid JavaScript identifier by delegating to
 * the TypeScript parser.
 *
 * A string is considered valid when the TS parser produces a single
 * `ExpressionStatement` whose expression is an `Identifier` with the
 * same text.
 *
 * @param name - The string to validate.
 * @returns `true` if `name` is a valid JS identifier, `false` otherwise.
 */
export function isValidIdentifier(name: string): boolean {
  if (!name.length) {
    return false;
  }

  const sourceFile = createSourceFile('__id.ts', name, ScriptTarget.ESNext, false);
  const statement = sourceFile.statements[0];
  return !!statement && isExpressionStatement(statement) && isIdentifier(statement.expression) && statement.expression.text === name;
}

/**
 * Ensures a name a template declares, e.g. the one of a template variable, can name it: it is an identifier, and not
 * one the generated code uses for itself (`root`, `$event` and the names starting with `__` or `$$`).
 *
 * @param name - The name.
 * @param span - The span of the name, which the error points to.
 * @param kind - What the name names, used in the error messages, e.g. `template variable`.
 * @throws If the name is not an identifier, or is reserved.
 */
export function assertDeclaredName(name: string, span: Span, kind: string): void {
  if (!isValidIdentifier(name)) {
    throw new Error(`'${name}' is not a valid name for a ${kind}: it must be an identifier.`, { cause: span });
  }

  if (RESERVED_NAMES.has(name) || name.startsWith('__') || name.startsWith('$$')) {
    throw new Error(`'${name}' is reserved in templates: give the ${kind} another name.`, { cause: span });
  }
}
