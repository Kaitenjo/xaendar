import { Lexer } from '../../lexer/lexer';
import type { KeywordContext } from '../../types/keyword-context/keyword-context.type';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';

/**
 * What ends right before an offset when a keyword is being written: a `@`, then the part of the keyword written so far.
 */
const KEYWORD_START = /@[a-z]*$/;

/**
 * Tells whether the keyword of a block is being written at an offset of a template, and which keywords can be written
 * there, by lexing the template up to the `@` starting it: the template may not compile (e.g. while the user is
 * typing), as long as it can be lexed up to there. The `@@` of a directive starts no keyword.
 *
 * @example
 * getKeywordContext('<p>a</p>\n@', 10);                // { keywords: ['if', 'for', 'switch'], span: { start: 9, end: 10 } }
 * getKeywordContext('@if (a) {\n}\n@el', 15);          // { keywords: ['if', 'for', 'switch', 'else', 'else if'], span: { start: 12, end: 15 } }
 * getKeywordContext('@switch (a) {\n  @', 16);         // { keywords: ['case', 'default'], span: { start: 15, end: 16 } }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The keyword being written, `undefined` if the offset is not on the keyword of a block.
 */
export function getKeywordContext(source: string, offset: number): KeywordContext | undefined {
  const before = source.slice(0, offset);
  const match = KEYWORD_START.exec(before);
  if (!match) {
    return undefined;
  }

  const start = offset - match[0].length;
  if (before[start - 1] === '@') {
    return undefined;
  }

  const lexer = new Lexer(before.slice(0, start));
  try {
    lexer.tokenize();
  } catch {
    return undefined;
  }

  const span = { start, end: offset };
  const { state, tokens } = lexer;
  let keywords: KeywordContext['keywords'][number][];
  switch (state) {
    // The content of the template
    case LexerState.TEXT:
      keywords = ['if', 'for', 'switch'];
      break;

    // The bindings of a tag, of a conditional binding or of a directive
    case LexerState.TAG_BODY:
    case LexerState.CONDITIONAL_BINDING_BODY:
    case LexerState.DIRECTIVE_BODY:
      keywords = ['if', 'switch'];
      break;

    default:
      return undefined;
  }

  const openBlock = findOpenBlock(tokens, tokens.length);
  if (openBlock !== -1 && getBlockKeyword(tokens, openBlock) === TokenType.SWITCH) {
    // The `@default` of the `@switch` may be declared after the offset too: the template is read without the keyword being written
    const template = new Lexer(`${before.slice(0, start)}${source.slice(offset)}`);
    try {
      template.tokenize();
    } catch {
      // The tokens before the error are read
    }

    return { keywords: declaresDefault(template.tokens, openBlock) ? ['case'] : ['case', 'default'], span };
  }

  const closedBlockKeyword = getClosedBlockKeyword(tokens);
  if (closedBlockKeyword === TokenType.IF || closedBlockKeyword === TokenType.ELSE_IF) {
    keywords.push('else', 'else if');
  }

  // The `@import` statements come before anything else: the text between them only holds their `;`
  if (state === LexerState.TEXT && tokens.every(token => token.type === TokenType.IMPORT || token.type === TokenType.IMPORT_PATH || (token.type === TokenType.TEXT && /^[\s;]*$/.test(token.parts[0])))) {
    keywords.push('import');
  }

  return { keywords, span };
}

/**
 * Finds the innermost block open before a token.
 *
 * @param tokens - The tokens.
 * @param end - The index of the token, excluded.
 * @returns The index of the BLOCK_OPEN token opening the block, `-1` if no block is open.
 */
function findOpenBlock(tokens: readonly Token[], end: number): number {
  let depth = 0;
  for (let i = end - 1; i >= 0; i--) {
    switch (tokens[i].type) {
      case TokenType.BLOCK_CLOSE:
        depth++;
        break;

      case TokenType.BLOCK_OPEN:
        if (!depth) {
          return i;
        }

        depth--;
        break;
    }
  }

  return -1;
}

/**
 * Finds the keyword of the block the tokens end with, the blank text after it ignored.
 *
 * @param tokens - The tokens.
 * @returns The type of the token of the keyword, `undefined` if the tokens don't end with a block.
 */
function getClosedBlockKeyword(tokens: readonly Token[]): TokenType | undefined {
  const last = tokens.findLastIndex(token => token.type !== TokenType.TEXT || !!token.parts[0].trim());
  return tokens[last]?.type === TokenType.BLOCK_CLOSE ? getBlockKeyword(tokens, findOpenBlock(tokens, last)) : undefined;
}

/**
 * Tells whether a block declares a `@default` branch among its direct children.
 *
 * @param tokens - The tokens.
 * @param openBlock - The index of the BLOCK_OPEN token opening the block.
 * @returns `true` if a DEFAULT token is declared in the block, outside of its nested blocks.
 */
function declaresDefault(tokens: readonly Token[], openBlock: number): boolean {
  let depth = 0;
  for (let i = openBlock + 1; i < tokens.length; i++) {
    switch (tokens[i].type) {
      case TokenType.BLOCK_OPEN:
        depth++;
        break;

      case TokenType.BLOCK_CLOSE:
        if (!depth) {
          return false;
        }

        depth--;
        break;

      case TokenType.DEFAULT:
        if (!depth) {
          return true;
        }
        break;
    }
  }

  return false;
}

/**
 * Finds the keyword of the block a token opens: the token before it, or before its condition.
 *
 * @param tokens - The tokens.
 * @param index - The index of the BLOCK_OPEN token.
 * @returns The type of the token of the keyword.
 */
function getBlockKeyword(tokens: readonly Token[], index: number): TokenType {
  const previous = tokens[index - 1];
  return (previous.type === TokenType.CONDITION ? tokens[index - 2] : previous).type;
}
