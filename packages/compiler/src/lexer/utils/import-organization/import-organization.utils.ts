import type { ImportInsertion } from '../../types/import-insertion/import-insertion.type';
import { TokenType } from '../../types/token-type.enum';
import type { ImportToken } from '../../types/tokens/import-token.type';
import { IMPORT_STATEMENT_END, lexImportHeader } from '../import-header/import-header.utils';

/**
 * An `@import` statement of the header of a template, read from its source.
 */
type ImportStatement = {
  /**
   * The offset the statement starts at, on its `@import` keyword.
   */
  readonly start: number;
  /**
   * The offset the statement ends at, after its `;` if it has one.
   */
  readonly end: number;
  /**
   * The path of the module, as written.
   */
  readonly path: string;
  /**
   * The specifiers between the braces as written (`A`, `A as B`), the empty ones left by a trailing comma excluded.
   */
  readonly specifiers: string[];
  /**
   * The quote of the path.
   */
  readonly quote: string;
  /**
   * The `;` closing the statement, empty if it has none.
   */
  readonly semicolon: string;
  /**
   * Whether the specifiers are written on several lines.
   */
  readonly multiline: boolean;
  /**
   * The comments written after the statement, as written with the whitespace before them: the ones up to the next
   * statement, or the ones on the line of the last statement. Empty when there are none.
   */
  comments: string;
};

/**
 * The comments written on a line after the last `@import` statement, with the spaces before them.
 */
const SAME_LINE_COMMENTS = /^(?:[ \t]*<!--[\s\S]*?-->)+/;

/**
 * What {@link organizeImports} does besides writing the statements in a regular form.
 */
export type ImportOrganizationOptions = {
  /**
   * The specifiers to remove, written as {@link toImportKey} writes them.
   */
  readonly unused?: ReadonlySet<string>;
  /**
   * Whether to merge the statements importing from the same module and sort the statements by path and the
   * specifiers by name, bare module names before relative paths, ignoring the case.
   */
  readonly sort?: boolean;
};

/**
 * Writes the key identifying a specifier of an `@import` statement, to tell {@link organizeImports} the ones to remove.
 *
 * @example
 * toImportKey('./a', 'B as C');  // './a|B as C'
 *
 * @param path - The path of the module, as written.
 * @param specifier - The specifier as written between the braces: `Name`, or `Name as Alias`.
 * @returns The key.
 */
export function toImportKey(path: string, specifier: string): string {
  return `${path}|${specifier}`;
}

/**
 * Computes how to organize the `@import` statements of a template: the unused specifiers are removed, together with the
 * statements left without any, and the statements are merged and sorted. Every statement is written again in a regular
 * form (`@import { A, B } from './a';`, on several lines if it was), with the quote and the `;` of the one it comes from.
 * The comments written after a statement follow it, as written: they move with it, and go with it when it is removed.
 *
 * The header of the template is lexed as far as it can be, so that it works while the rest of the template does not compile.
 *
 * @param source - The source of the template.
 * @param options - What to do besides writing the statements again.
 * @returns The span of the statements and the text to write there, `undefined` if there is nothing to change.
 */
export function organizeImports(source: string, { unused, sort = false }: ImportOrganizationOptions = {}): ImportInsertion | undefined {
  const statements = readStatements(source);
  if (!statements.length) {
    return undefined;
  }

  const first = statements[0];
  const headerEnd = getHeaderEnd(statements);
  const newline = source.includes('\r\n') ? '\r\n' : '\n';

  let organized = statements
    .map(statement => ({ ...statement, specifiers: unused ? statement.specifiers.filter(specifier => !unused.has(toImportKey(statement.path, specifier))) : statement.specifiers }))
    .filter(statement => statement.specifiers.length);

  if (sort) {
    organized = sortStatements(mergeStatements(organized));
  }

  const text = organized.map(statement => writeStatement(statement, newline)).join(newline);
  const original = source.slice(first.start, headerEnd);
  if (text === original) {
    return undefined;
  }

  // Nothing is left of the header: the spaces following it go too, so that the template doesn't start with them
  const end = text ? headerEnd : headerEnd + /^\s*/.exec(source.slice(headerEnd))![0].length;
  return { span: { start: first.start, end }, newText: text };
}

/**
 * Writes the `@import` statements of the header of a template again in a regular form (`@import { A, B } from './a';`, on
 * several lines if it was), with the quote and the `;` of each, without changing their order nor what they import. The
 * comments written between them, and on the line of the last one, are kept as written.
 *
 * @param source - The source of the template, with `\n` line breaks.
 * @returns The offsets the header starts and ends at, and the text writing it, `undefined` if the template has no statements.
 */
export function formatImportHeader(source: string): { start: number, end: number, text: string } | undefined {
  const statements = readStatements(source);
  if (!statements.length) {
    return undefined;
  }

  return { start: statements[0].start, end: getHeaderEnd(statements), text: statements.map(statement => writeStatement(statement, '\n')).join('\n') };
}

/**
 * Reads the `@import` statements of the header of a template.
 *
 * @param source - The source of the template.
 * @returns The statements, in the order they are written in, those that cannot be lexed excluded.
 */
function readStatements(source: string): ImportStatement[] {
  const header = lexImportHeader(source);
  const statements = new Array<ImportStatement>();

  // The tokens of the specifiers of a statement come right before the one of its path
  let tokens = new Array<ImportToken>();
  for (let i = 0; i < header.tokens.length; i++) {
    const token = header.tokens[i];
    switch (token.type) {
      case TokenType.IMPORT:
        tokens.push(token);
        break;

      case TokenType.IMPORT_PATH: {
        const braceEnd = tokens[tokens.length - 1].span.end;
        // The lexer only emits the path of a statement that has its braces and its quoted path, which the pattern matches
        const [text, quote, semicolon] = IMPORT_STATEMENT_END.exec(source.slice(braceEnd))!;
        const start = source.lastIndexOf('@import', tokens[0].span.start);
        const end = braceEnd + text.length;
        const specifiers = tokens.map(({ parts: [specifier] }) => specifier.trim()).filter(Boolean);
        statements.push({ start, end, path: token.parts[0], specifiers, quote, semicolon, multiline: source.slice(start, braceEnd).includes('\n'), comments: '' });
        tokens = [];
        break;
      }

      default:
        tokens = [];
    }
  }

  // Only whitespace and comments separate the statements: the comments follow the statement they are written after
  for (let i = 0; i < statements.length; i++) {
    const next = statements[i + 1];
    const after = next ? source.slice(statements[i].end, next.start) : SAME_LINE_COMMENTS.exec(source.slice(statements[i].end))?.[0] ?? '';
    statements[i].comments = /\S/.test(after) ? after.trimEnd() : '';
  }

  return statements;
}

/**
 * Returns the offset the header of a template ends at: after its last statement, and the comments on its line.
 *
 * @param statements - The statements of the header, at least one.
 * @returns The offset.
 */
function getHeaderEnd(statements: readonly ImportStatement[]): number {
  const last = statements[statements.length - 1];
  return last.end + last.comments.length;
}

/**
 * Merges the statements importing from the same module into the first of them, dropping the specifiers written twice.
 *
 * @param statements - The statements.
 * @returns The statements, one per module.
 */
function mergeStatements(statements: ImportStatement[]): ImportStatement[] {
  const merged = new Map<string, ImportStatement>();
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const existing = merged.get(statement.path);
    if (existing) {
      for (let j = 0; j < statement.specifiers.length; j++) {
        if (!existing.specifiers.includes(statement.specifiers[j])) {
          existing.specifiers.push(statement.specifiers[j]);
        }
      }

      // The comments of a statement merged into another one follow the one it is merged into
      existing.comments = `${existing.comments}${statement.comments}`;
    } else {
      merged.set(statement.path, { ...statement, specifiers: [...statement.specifiers] });
    }
  }

  return Array.from(merged.values());
}

/**
 * Sorts the statements by the path of their module, and their specifiers by name.
 *
 * @param statements - The statements.
 * @returns The sorted statements.
 */
function sortStatements(statements: ImportStatement[]): ImportStatement[] {
  return statements
    .map(statement => ({ ...statement, specifiers: [...statement.specifiers].sort(compareSpecifiers) }))
    .sort((first, second) => Number(first.path.startsWith('.')) - Number(second.path.startsWith('.')) || compareText(first.path, second.path));
}

/**
 * Compares two specifiers by the name they import, then by what is written.
 *
 * @param first - The first specifier.
 * @param second - The second specifier.
 * @returns A negative number if the first one comes first, a positive one if the second does.
 */
function compareSpecifiers(first: string, second: string): number {
  return compareText(first.split(' ')[0], second.split(' ')[0]) || compareText(first, second);
}

/**
 * Compares two texts ignoring the case.
 *
 * @param first - The first text.
 * @param second - The second text.
 * @returns A negative number if the first one comes first, a positive one if the second does.
 */
function compareText(first: string, second: string): number {
  const [lowerFirst, lowerSecond] = [first.toLowerCase(), second.toLowerCase()];
  return lowerFirst < lowerSecond ? -1 : lowerFirst > lowerSecond ? 1 : 0;
}

/**
 * Writes an `@import` statement, followed by the comments written after it.
 *
 * @param statement - The statement.
 * @param newline - The line break of the template.
 * @returns The text of the statement.
 */
function writeStatement({ path, specifiers, quote, semicolon, multiline, comments }: ImportStatement, newline: string): string {
  const names = multiline ? `{${newline}  ${specifiers.join(`,${newline}  `)}${newline}}` : `{ ${specifiers.join(', ')} }`;
  return `@import ${names} from ${quote}${path}${quote}${semicolon}${comments}`;
}
