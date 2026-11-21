import { isIdentifierPart, isIdentifierStart, ScriptTarget, SyntaxKind, tokenToString } from 'typescript';
import type { Span } from '../../../types/span.type';

/**
 * The names the generated code uses for itself, which a template cannot declare: the component the type-check reads
 * its members from, and the event of an event binding. The names starting with `__` or `$$` are reserved too.
 */
const RESERVED_NAMES: ReadonlySet<string> = new Set(['root', '$event']);

/**
 * The reserved words of JavaScript, which no identifier can be: `break` to `with`, `null`, `true`, `this`, `enum`…
 */
const RESERVED_WORDS: ReadonlySet<string> = new Set(Array.from({ length: SyntaxKind.LastReservedWord - SyntaxKind.FirstReservedWord + 1 }, (_value, index) => tokenToString(SyntaxKind.FirstReservedWord + index)!));

/**
 * Checks whether `name` is a valid JavaScript identifier: a name made of identifier characters, written without
 * escapes, that is not a reserved word (`if`, `class`, `null`, `this`…). Contextual keywords (`of`, `as`, `type`) and
 * the words reserved only in strict mode (`let`, `static`) are identifiers, as the TypeScript parser reads them.
 *
 * N.B. Deliberate, for speed: the name is scanned, not parsed. Parsing it as an expression statement gives the same
 * answer, at more than ten times the cost. Do not parse it.
 *
 * @param name - The string to validate.
 * @returns `true` if `name` is a valid JS identifier, `false` otherwise.
 */
export function isValidIdentifier(name: string): boolean {
  if (!name.length || RESERVED_WORDS.has(name)) {
    return false;
  }

  for (let i = 0; i < name.length; i++) {
    const codePoint = name.codePointAt(i)!;
    if (!(i ? isIdentifierPart(codePoint, ScriptTarget.ESNext) : isIdentifierStart(codePoint, ScriptTarget.ESNext))) {
      return false;
    }

    // A code point beyond the basic plane takes two characters
    if (codePoint > 0xFFFF) {
      i++;
    }
  }

  return true;
}

/**
 * Ensures a name a template declares, e.g. the one of an element ref, can name it: it is an identifier, and not
 * one the generated code uses for itself (`root`, `$event` and the names starting with `__` or `$$`).
 *
 * @param name - The name.
 * @param span - The span of the name, which the error points to.
 * @param kind - What the name names, used in the error messages, e.g. `element ref`.
 * @throws If the name is not an identifier, or is reserved.
 */
export function assertDeclaredName(name: string, span: Span, kind: string): void {
  if (!isValidIdentifier(name)) {
    const article = /^[aeiou]/i.test(kind) ? 'an' : 'a';
    throw new Error(`'${name}' is not a valid name for ${article} ${kind}: it must be an identifier.`, { cause: span });
  }

  if (RESERVED_NAMES.has(name) || name.startsWith('__') || name.startsWith('$$')) {
    throw new Error(`'${name}' is reserved in templates: give the ${kind} another name.`, { cause: span });
  }
}
