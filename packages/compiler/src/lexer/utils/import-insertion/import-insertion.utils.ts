import type { ImportInsertion } from '../../types/import-insertion.type';
import { TokenType } from '../../types/token-type.enum';
import type { ImportToken } from '../../types/tokens/import-token.type';
import { IMPORT_STATEMENT_END, lexImportHeader } from '../import-header/import-header.utils';

/**
 * Computes how to import a symbol in a template: the symbol is added to the statement importing from the same module if
 * there is one, otherwise a new statement is written after the last one, or at the start of the template. The quotes and
 * the closing `;` follow the statement the change is written after.
 *
 * The header of the template is lexed as far as it can be, so that the change can be computed while the rest of the
 * template does not compile.
 *
 * @example
 * getImportInsertion('<p></p>', './a', 'A');                       // { span: { start: 0, end: 0 }, newText: '@import { A } from \'./a\';\n' }
 * getImportInsertion('@import { A } from \'./a\';\n', './a', 'B');  // { span: { start: 11, end: 11 }, newText: ', B' }
 *
 * @param source - The source of the template.
 * @param path - The path of the module, as it is written in the `@import`.
 * @param symbol - The name of the symbol to import.
 * @returns The span and the text to insert.
 */
export function getImportInsertion(source: string, path: string, symbol: string): ImportInsertion {
  const { tokens } = lexImportHeader(source);

  // The tokens of the specifiers of a statement come right before the one of its path
  let specifiers = new Array<ImportToken>();
  let last: { quote: string, semicolon: string, end: number } | undefined;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    switch (token.type) {
      case TokenType.IMPORT:
        specifiers.push(token);
        break;

      case TokenType.IMPORT_PATH: {
        const braceEnd = specifiers[specifiers.length - 1].span.end;
        // The lexer only emits the path of a statement that has its braces and its quoted path, which the pattern matches
        const [text, quote, semicolon] = IMPORT_STATEMENT_END.exec(source.slice(braceEnd))!;
        last = { quote, semicolon, end: braceEnd + text.length };
        // The symbol is added to a statement that imports the module, not to a lazy one
        if (token.parts[0] === path && !specifiers[0].lazy) {
          return addToStatement(source, specifiers, symbol);
        }

        specifiers = [];
        break;
      }

      default:
        specifiers = [];
    }
  }

  const { quote, semicolon } = last ?? { quote: '\'', semicolon: ';' };
  const statement = `@import { ${symbol} } from ${quote}${path}${quote}${semicolon}`;
  return last
    ? { span: { start: last.end, end: last.end }, newText: `\n${statement}` }
    : { span: { start: 0, end: 0 }, newText: `${statement}\n` };
}

/**
 * Computes how to add a symbol to the braces of an existing statement: after its last specifier, or between the
 * braces when it has none.
 *
 * @param source - The source of the template.
 * @param specifiers - The tokens of the specifiers of the statement.
 * @param symbol - The name of the symbol to import.
 * @returns The span and the text to insert.
 */
function addToStatement(source: string, specifiers: readonly ImportToken[], symbol: string): ImportInsertion {
  // A specifier ends at the comma or the brace closing it: the one left by a trailing comma is empty
  let lastNamed = specifiers.length - 1;
  while (lastNamed >= 0 && !specifiers[lastNamed].parts[0].trim()) {
    lastNamed--;
  }

  if (lastNamed < 0) {
    // The spaces between the braces are replaced, so that the symbol is surrounded by one on each side
    const start = source.indexOf('{', specifiers[0].span.start) + 1;
    return { span: { start, end: specifiers[specifiers.length - 1].span.end }, newText: ` ${symbol} ` };
  }

  const { start, end } = specifiers[lastNamed].span;
  const position = start + source.slice(start, end).trimEnd().length;
  return { span: { start: position, end: position }, newText: `, ${symbol}` };
}
