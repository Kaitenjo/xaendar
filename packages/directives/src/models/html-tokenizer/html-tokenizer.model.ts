import type { HtmlAttribute } from '../../types/html-attribute.type';
import type { HtmlTokenKind } from '../../types/html-token-kind.type';
import { isAsciiLetter, isWhitespace, toAsciiLowerCase } from '../../utils/html-syntax/html-syntax.utils';

/**
 * The elements whose content the HTML parser reads as text up to their end tag: `plaintext` up to the end of the input.
 */
const RAW_TEXT_ELEMENTS: ReadonlySet<string> = new Set(['iframe', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'textarea', 'title', 'xmp']);

/**
 * The elements among `RAW_TEXT_ELEMENTS` whose text the HTML parser decodes the character references of.
 */
const ESCAPABLE_RAW_TEXT_ELEMENTS: ReadonlySet<string> = new Set(['textarea', 'title']);

/**
 * Reads an HTML token by token, as the tokenizer of the HTML parser does: the texts, the start tags with their
 * attributes and the end tags. The comments, the doctypes, the processing instructions and the CDATA sections are
 * skipped, and so is a tag the input ends inside of.
 *
 * Each call to `next` reads a token into the fields of the tokenizer: what it reads is only ever written again by the
 * sanitizer, encoded, so a token read otherwise than by the browser can lose content, never let markup through.
 *
 * @example
 * ```ts
 * const tokenizer = new HtmlTokenizer('<b class="x">bold</b>');
 * while (tokenizer.next()) {
 *   console.log(tokenizer.kind, tokenizer.name, tokenizer.text);
 * }
 * ```
 */
export class HtmlTokenizer {
  /**
   * The kind of the token read last.
   */
  public kind: HtmlTokenKind = 'text';
  /**
   * The text read last, as it is written, its character references not decoded: a token `text` or `raw-text`.
   */
  public text = '';
  /**
   * The name of the tag read last, its ASCII letters lowercase: a token `start-tag` or `end-tag`.
   */
  public name = '';
  /**
   * The attributes of the start tag read last, in the order they are written, the first of each name only: `null`
   * without attributes.
   */
  public attributes: HtmlAttribute[] | null = null;
  /**
   * Whether the start tag read last ends with `/>`.
   */
  public selfClosing = false;
  /**
   * The HTML to read.
   */
  private readonly _html: string;
  /**
   * The position of the next character to read.
   */
  private _position = 0;
  /**
   * The element whose raw text comes next, after its start tag: `null` when the next token is not raw text.
   */
  private _rawTextElement: string | null = null;
  /**
   * The name of the attribute `_readAttribute` read last.
   */
  private _attributeName = '';
  /**
   * The value of the attribute `_readAttribute` read last.
   */
  private _attributeValue = '';

  /**
   * Creates the tokenizer of an HTML.
   *
   * @param html - The HTML to read.
   */
  constructor(html: string) {
    this._html = html;
  }

  /**
   * Reads the next token into the fields of the tokenizer.
   *
   * @returns `false` once the input is over, with no token read.
   */
  public next(): boolean {
    while (this._position < this._html.length) {
      if (this._rawTextElement !== null ? this._readRawText() : this._readToken()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Reads the token at the current position: a text up to the next `<`, or the markup starting there.
   *
   * @returns Whether a token was read: `false` for markup skipped.
   */
  private _readToken(): boolean {
    const start = this._position;
    const open = this._html.indexOf('<', start);
    if (open === start) {
      return this._readMarkup();
    }

    const end = open === -1 ? this._html.length : open;
    this._setText('text', this._html.slice(start, end), end);
    return true;
  }

  /**
   * Reads the markup at the current position, a `<`: a start tag, an end tag, or a comment, a doctype, a processing
   * instruction or a CDATA section, which are skipped. A `<` starting none of them is a text.
   *
   * @returns Whether a token was read.
   */
  private _readMarkup(): boolean {
    const html = this._html;
    const position = this._position;
    const next = html.charCodeAt(position + 1);
    if (isAsciiLetter(next)) {
      return this._readTag(position + 1, 'start-tag');
    }

    switch (next) {
      // `<!`
      case 33:
        this._position = html.startsWith('--', position + 2) ? findCommentEnd(html, position + 4) : findMarkupEnd(html, position + 2);
        return false;
      // `</`
      case 47:
        return this._readEndTag(position);
      // `<?`
      case 63:
        this._position = findMarkupEnd(html, position + 1);
        return false;
      default:
        this._setText('text', '<', position + 1);
        return true;
    }
  }

  /**
   * Reads the markup starting with `</` at a position: an end tag when a letter follows, the text `</` at the end of the
   * input, otherwise markup the HTML parser skips (`</>`, `</1>`).
   *
   * @param position - The position of the `<`.
   * @returns Whether a token was read.
   */
  private _readEndTag(position: number): boolean {
    const after = this._html.charCodeAt(position + 2);
    if (isAsciiLetter(after)) {
      return this._readTag(position + 2, 'end-tag');
    }

    if (position + 2 >= this._html.length) {
      this._setText('text', '</', position + 2);
      return true;
    }

    this._position = findMarkupEnd(this._html, position + 2);
    return false;
  }

  /**
   * Reads a tag from its name to its `>`, with its attributes: the ones of an end tag are read and dropped. A start tag
   * of an element holding raw text makes its content the next token.
   *
   * @param nameStart - The position of the first letter of the name.
   * @param kind - The kind of the tag.
   * @returns Whether the tag ends before the input, which otherwise drops it, as the HTML parser does.
   */
  private _readTag(nameStart: number, kind: 'start-tag' | 'end-tag'): boolean {
    const html = this._html;
    let position = nameStart;
    while (position < html.length && !isTagNameEnd(html.charCodeAt(position))) {
      position++;
    }

    const name = toAsciiLowerCase(html.slice(nameStart, position));
    let attributes: HtmlAttribute[] | null = null;
    let selfClosing = false;
    while (position < html.length) {
      const code = html.charCodeAt(position);
      if (isWhitespace(code)) {
        position++;
      } else if (code === 62) {
        // `>`
        this.kind = kind;
        this.name = name;
        this.attributes = kind === 'start-tag' ? attributes : null;
        this.selfClosing = selfClosing;
        this._position = position + 1;
        if (kind === 'start-tag' && RAW_TEXT_ELEMENTS.has(name)) {
          this._rawTextElement = name;
        }

        return true;
      } else if (code === 47) {
        // `/`: the tag closes itself only when `>` follows
        selfClosing = html.charCodeAt(position + 1) === 62;
        position++;
      } else {
        selfClosing = false;
        position = this._readAttribute(position);
        if (position === -1) {
          break;
        }

        attributes = addAttribute(attributes, this._attributeName, this._attributeValue);
      }
    }

    this._position = html.length;
    return false;
  }

  /**
   * Reads an attribute into `_attributeName` and `_attributeValue`: its name, then, after a `=`, its value, between
   * quotes or up to a white space or a `>`.
   *
   * @param nameStart - The position of the first character of the name, which can be `=`.
   * @returns The position after the attribute, `-1` when the input ends inside a quoted value or an unquoted one.
   */
  private _readAttribute(nameStart: number): number {
    const html = this._html;
    let position = nameStart + 1;
    while (position < html.length && !isAttributeNameEnd(html.charCodeAt(position))) {
      position++;
    }

    this._attributeName = toAsciiLowerCase(html.slice(nameStart, position));
    this._attributeValue = '';
    let after = skipWhitespace(html, position);
    // `=`
    if (html.charCodeAt(after) !== 61) {
      return after;
    }

    after = skipWhitespace(html, after + 1);
    const quote = html.charCodeAt(after);
    // `"` or `'`
    if (quote === 34 || quote === 39) {
      const close = html.indexOf(quote === 34 ? '"' : '\'', after + 1);
      if (close === -1) {
        return -1;
      }

      this._attributeValue = html.slice(after + 1, close);
      return close + 1;
    }

    let end = after;
    while (end < html.length && !isWhitespace(html.charCodeAt(end)) && html.charCodeAt(end) !== 62) {
      end++;
    }

    if (end === html.length) {
      return -1;
    }

    this._attributeValue = html.slice(after, end);
    return end;
  }

  /**
   * Reads the content of the element holding raw text whose start tag was read last, up to its end tag (`</script`
   * followed by a white space, `/` or `>`), or to the end of the input.
   *
   * @returns Whether the element has content: one without is no token.
   */
  private _readRawText(): boolean {
    const name = this._rawTextElement!;
    this._rawTextElement = null;
    const start = this._position;
    const end = name === 'plaintext' ? this._html.length : findRawTextEnd(this._html, start, name);
    if (end === start) {
      return false;
    }

    this._setText(ESCAPABLE_RAW_TEXT_ELEMENTS.has(name) ? 'text' : 'raw-text', this._html.slice(start, end), end);
    return true;
  }

  /**
   * Makes a text the token read last.
   *
   * @param kind - Whether the text is raw.
   * @param text - The text.
   * @param end - The position after the text.
   */
  private _setText(kind: 'text' | 'raw-text', text: string, end: number): void {
    this.kind = kind;
    this.text = text;
    this._position = end;
  }
}

/**
 * Tells whether a character ends the name of a tag: a white space, `/` or `>`.
 *
 * @param code - The code of the character.
 * @returns Whether it ends the name.
 */
function isTagNameEnd(code: number): boolean {
  return isWhitespace(code) || code === 47 || code === 62;
}

/**
 * Tells whether a character ends the name of an attribute: a white space, `/`, `>` or `=`.
 *
 * @param code - The code of the character.
 * @returns Whether it ends the name.
 */
function isAttributeNameEnd(code: number): boolean {
  return isTagNameEnd(code) || code === 61;
}

/**
 * Skips the white spaces from a position.
 *
 * @param html - The HTML.
 * @param position - The position to start from.
 * @returns The position of the first character that is not a white space, the length of the HTML at its end.
 */
function skipWhitespace(html: string, position: number): number {
  while (position < html.length && isWhitespace(html.charCodeAt(position))) {
    position++;
  }

  return position;
}

/**
 * Finds the end of markup the HTML parser skips up to the next `>`: a doctype, a processing instruction, a CDATA
 * section, or a bogus comment.
 *
 * @param html - The HTML.
 * @param from - The position to search from.
 * @returns The position after the `>`, the length of the HTML without one.
 */
function findMarkupEnd(html: string, from: number): number {
  const end = html.indexOf('>', from);
  return end === -1 ? html.length : end + 1;
}

/**
 * Finds the end of a comment: `-->` or `--!>`, or the `>` or `->` right after its `<!--`.
 *
 * @param html - The HTML.
 * @param from - The position after the `<!--`.
 * @returns The position after the end of the comment, the length of the HTML without one.
 */
function findCommentEnd(html: string, from: number): number {
  if (html.charCodeAt(from) === 62) {
    return from + 1;
  }

  if (html.startsWith('->', from)) {
    return from + 2;
  }

  const end = html.indexOf('-->', from);
  const bang = html.indexOf('--!>', from);
  if (bang !== -1 && (end === -1 || bang < end)) {
    return bang + 4;
  }

  return end === -1 ? html.length : end + 3;
}

/**
 * Finds the end tag of an element holding raw text: `</` and its name, in any case, followed by a white space, `/` or
 * `>`.
 *
 * @param html - The HTML.
 * @param from - The position after the start tag of the element.
 * @param name - The name of the element, lowercase.
 * @returns The position of the `<` of the end tag, the length of the HTML without one.
 */
function findRawTextEnd(html: string, from: number, name: string): number {
  let position = html.indexOf('</', from);
  while (position !== -1) {
    const after = position + 2 + name.length;
    if (toAsciiLowerCase(html.slice(position + 2, after)) === name && isTagNameEnd(html.charCodeAt(after))) {
      return position;
    }

    position = html.indexOf('</', position + 2);
  }

  return html.length;
}

/**
 * Adds an attribute to the ones of a tag, unless the tag already has one of the same name, which wins as in the HTML
 * parser.
 *
 * @param attributes - The attributes of the tag, `null` without attributes.
 * @param name - The name of the attribute.
 * @param value - The value of the attribute.
 * @returns The attributes of the tag.
 */
function addAttribute(attributes: HtmlAttribute[] | null, name: string, value: string): HtmlAttribute[] {
  if (attributes === null) {
    return [{ name, value }];
  }

  if (!attributes.some(attribute => attribute.name === name)) {
    attributes.push({ name, value });
  }

  return attributes;
}
