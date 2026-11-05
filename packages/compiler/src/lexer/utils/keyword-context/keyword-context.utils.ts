import { Lexer } from '../../lexer/lexer';
import type { KeywordContext } from '../../types/keyword-context.type';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';

/**
 * What ends right before an offset when a keyword is being written: a `@`, then the part of the keyword written so far.
 */
const KEYWORD_START = /@[a-z]*$/;

/**
 * The blocks that may follow the one of a `@defer`, by the token of their keyword.
 */
const DEFER_BLOCKS: ReadonlyMap<TokenType, KeywordContext['keywords'][number]> = new Map([
  [TokenType.PLACEHOLDER, 'placeholder'],
  [TokenType.LOADING, 'loading'],
  [TokenType.ERROR, 'error']
]);

/**
 * Tells whether the keyword of a block is being written at an offset of a template, and which keywords can be written
 * there, by lexing the template up to the `@` starting it: the template may not compile (e.g. while the user is
 * typing), as long as it can be lexed up to there. The `@@` of a directive starts no keyword.
 *
 * @example
 * getKeywordContext('<p>a</p>\n@', 10);                // { keywords: ['if', 'for', 'switch', 'hydrate', 'client', 'try', 'defer', 'render', 'let'], span: { start: 9, end: 10 } }
 * getKeywordContext('@if (a) {\n}\n@el', 15);          // { keywords: ['if', 'for', 'switch', 'hydrate', 'client', 'try', 'defer', 'render', 'let', 'else', 'else if'], span: { start: 12, end: 15 } }
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

  const { tokens, state, error } = new Lexer(before.slice(0, start)).tokenizeTolerant();
  if (error) {
    return undefined;
  }

  const span = { start, end: offset };
  let keywords: KeywordContext['keywords'][number][];
  switch (state) {
    // The content of the template
    case LexerState.TEXT:
      keywords = ['if', 'for', 'switch', 'hydrate', 'client', 'try', 'defer', 'render', 'let'];
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
    /*
      The `@default` of the `@switch` may be declared after the offset too: the template is read without the keyword
      being written, as far as it can be lexed
    */
    const template = new Lexer(`${before.slice(0, start)}${source.slice(offset)}`).tokenizeTolerant();
    return { keywords: declaresDefault(template.tokens, openBlock) ? ['case'] : ['case', 'default'], span };
  }

  switch (getClosedBlockKeyword(tokens)) {
    case TokenType.IF:
    case TokenType.ELSE_IF:
      keywords.push('else', 'else if');
      break;

    case TokenType.CLIENT:
      keywords.push('placeholder');
      return { keywords, span, clientPlaceholder: true };

    // A @try must be followed by its @catch
    case TokenType.TRY:
      return { keywords: ['catch'], span };
  }

  // The blocks following a @defer, each one written once
  const written = getDeferBlocks(tokens);
  if (written) {
    for (const [type, keyword] of DEFER_BLOCKS) {
      if (!written.has(type)) {
        keywords.push(keyword);
      }
    }
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
  const last = findLastNotBlank(tokens, tokens.length);
  return tokens[last]?.type === TokenType.BLOCK_CLOSE ? getBlockKeyword(tokens, findOpenBlock(tokens, last)) : undefined;
}

/**
 * Finds the blocks following the one of a `@defer` written so far, when the tokens end with a `@defer` block or with one
 * of the blocks following it, the blank text between them ignored.
 *
 * @param tokens - The tokens.
 * @returns The tokens of the keywords of the blocks following the `@defer`, `undefined` if the tokens don't end with one.
 */
function getDeferBlocks(tokens: readonly Token[]): Set<TokenType> | undefined {
  const written = new Set<TokenType>();
  for (let end = findLastNotBlank(tokens, tokens.length); tokens[end]?.type === TokenType.BLOCK_CLOSE;) {
    const open = findOpenBlock(tokens, end);
    const keyword = getBlockKeyword(tokens, open);
    if (keyword === TokenType.DEFER) {
      return written;
    }

    if (!DEFER_BLOCKS.has(keyword)) {
      return undefined;
    }

    written.add(keyword);
    end = findLastNotBlank(tokens, tokens[open - 1].type === TokenType.CONDITION ? open - 2 : open - 1);
  }

  return undefined;
}

/**
 * Finds the last token before an index that is not a blank text.
 *
 * @param tokens - The tokens.
 * @param end - The index, excluded.
 * @returns The index of the token, `-1` if there is none.
 */
function findLastNotBlank(tokens: readonly Token[], end: number): number {
  for (let i = end - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token.type !== TokenType.TEXT || token.parts[0].trim()) {
      return i;
    }
  }

  return -1;
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
