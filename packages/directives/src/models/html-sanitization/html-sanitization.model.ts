import type { HtmlAttribute } from '../../types/html-attribute.type';
import type { HtmlSanitizeReport } from '../../types/html-sanitize-report.type';
import type { HtmlSanitizeResult } from '../../types/html-sanitize-result.type';
import type { HtmlSanitizerPolicy } from '../../types/html-sanitizer-policy.type';
import type { ImpliedEnd } from '../../types/implied-end.type';
import { isAllowedAttribute, isAllowedName } from '../../utils/html-name-policy/html-name-policy.utils';
import { isSafeAnimationTarget, isSafeUrlAttribute, isTrustedResource } from '../../utils/url-sanitizer/url-sanitizer.utils';
import { HtmlTokenizer } from '../html-tokenizer/html-tokenizer.model';

/**
 * The elements the HTML parser stops at when it looks for the `p` to close (its "button scope"), and the `a`.
 */
const BUTTON_SCOPE: ReadonlySet<string> = new Set(['applet', 'button', 'caption', 'html', 'marquee', 'object', 'table', 'td', 'template', 'th']);

/**
 * The elements the HTML parser stops at when it looks for the `li`, the `dd` or the `dt` to close: the "special" ones
 * but `address`, `div` and `p`.
 */
const LIST_ITEM_SCOPE: ReadonlySet<string> = new Set([
  'applet', 'area', 'article', 'aside', 'base', 'basefont', 'bgsound', 'blockquote', 'body', 'br', 'button', 'caption',
  'center', 'col', 'colgroup', 'dd', 'details', 'dir', 'dl', 'dt', 'embed', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe',
  'img', 'input', 'keygen', 'li', 'link', 'listing', 'main', 'marquee', 'menu', 'meta', 'nav', 'noembed', 'noframes',
  'noscript', 'object', 'ol', 'param', 'plaintext', 'pre', 'script', 'search', 'section', 'select', 'source', 'style',
  'summary', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul', 'wbr',
  'xmp'
]);

/**
 * The headings, each closing the heading it is in.
 */
const HEADINGS: ImpliedEnd = { closes: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']), scope: null };

/**
 * The `p` the elements of `CLOSING_P` close.
 */
const P_END: ImpliedEnd = { closes: new Set(['p']), scope: BUTTON_SCOPE };

/**
 * The elements whose start tag closes the `p` they are in.
 */
const CLOSING_P: ReadonlySet<string> = new Set([
  'address', 'article', 'aside', 'blockquote', 'center', 'dd', 'details', 'dialog', 'dir', 'div', 'dl', 'dt', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'listing',
  'main', 'menu', 'nav', 'ol', 'p', 'plaintext', 'pre', 'search', 'section', 'summary', 'table', 'ul', 'xmp'
]);

/**
 * The elements whose start tag closes other elements open, besides the `p`: the items of the lists, the rows and the
 * cells of the tables, the annotations of a `ruby`, the links and the headings.
 */
const IMPLIED_ENDS: ReadonlyMap<string, ImpliedEnd> = new Map([
  ['a', { closes: new Set(['a']), scope: BUTTON_SCOPE }],
  ['dd', { closes: new Set(['dd', 'dt']), scope: LIST_ITEM_SCOPE }],
  ['dt', { closes: new Set(['dd', 'dt']), scope: LIST_ITEM_SCOPE }],
  ['h1', HEADINGS],
  ['h2', HEADINGS],
  ['h3', HEADINGS],
  ['h4', HEADINGS],
  ['h5', HEADINGS],
  ['h6', HEADINGS],
  ['li', { closes: new Set(['li']), scope: LIST_ITEM_SCOPE }],
  ['rp', { closes: new Set(['rp', 'rt']), scope: new Set(['ruby']) }],
  ['rt', { closes: new Set(['rp', 'rt']), scope: new Set(['ruby']) }],
  ['tbody', { closes: new Set(['tbody', 'tfoot', 'thead']), scope: new Set(['table', 'template']) }],
  ['td', { closes: new Set(['td', 'th']), scope: new Set(['table', 'template', 'tr']) }],
  ['tfoot', { closes: new Set(['tbody', 'tfoot', 'thead']), scope: new Set(['table', 'template']) }],
  ['th', { closes: new Set(['td', 'th']), scope: new Set(['table', 'template', 'tr']) }],
  ['thead', { closes: new Set(['tbody', 'tfoot', 'thead']), scope: new Set(['table', 'template']) }],
  ['tr', { closes: new Set(['tr']), scope: new Set(['table', 'template']) }]
]);

/**
 * The elements without content nor end tag.
 */
const VOID_ELEMENTS: ReadonlySet<string> = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/**
 * The elements removed with their content when they are not allowed: the scripts, the styles, the templates, and the
 * elements whose content stands in for what the browser does not show (`noscript`, the fallback of an `iframe` or of an
 * `object`), which would otherwise appear as text.
 */
const DROPPED_ELEMENTS: ReadonlySet<string> = new Set(['iframe', 'noembed', 'noframes', 'noscript', 'object', 'plaintext', 'script', 'style', 'template']);

/**
 * A sanitization of an HTML: reads it token by token (see `HtmlTokenizer`) and writes again only the elements and the
 * attributes the policy keeps, the content of an element removed taking its place, but for the elements of
 * `DROPPED_ELEMENTS`, removed with their content. The comments, the doctypes and the processing instructions are always
 * removed.
 *
 * What it writes is well formed, so that the browser reads it as it is written, inside the element it fills, however the
 * input was written: the texts are encoded (`<` and `>`; the character references are kept, since they only ever decode
 * to text), the values of the attributes are between double quotes, encoded (`"`, `<` and `>`), each element is closed,
 * in order, and an end tag without its start tag is dropped (on the server, a `</div>` would close the element filled).
 * The elements the HTML parser closes on its own are closed where it would (an `li` before the next `li`, a `p` before a
 * `div`), and a non-void element closing itself (`<div />`) is written as an empty element. The texts of an element
 * holding raw text kept (`style`, if allowed) only encode `<`, which the parser of an SVG would read as a tag.
 *
 * Unlike the sanitizer of Angular, built on the parser of the browser, it needs no DOM: it gives the same HTML on the
 * server, where the page is rendered, and in the browser.
 */
export class HtmlSanitization {
  /**
   * What the sanitization keeps.
   */
  private readonly _policy: HtmlSanitizerPolicy;
  /**
   * The HTML written so far.
   */
  private _output = '';
  /**
   * The elements open, from the outermost.
   */
  private readonly _open = new Array<string>();
  /**
   * The element removed with its content being skipped, `null` outside of one.
   */
  private _dropped: string | null = null;
  /**
   * How many elements named as `_dropped` are open inside the one being skipped, itself included.
   */
  private _droppedDepth = 0;
  /**
   * The names of the elements removed, `null` while none was.
   */
  private _removedElements: Set<string> | null = null;
  /**
   * The attributes removed, as `element[attribute]`, `null` while none was.
   */
  private _removedAttributes: Set<string> | null = null;

  /**
   * Creates the sanitization of an HTML.
   *
   * @param policy - What the sanitization keeps.
   */
  constructor(policy: HtmlSanitizerPolicy) {
    this._policy = policy;
  }

  /**
   * Sanitizes an HTML. To be called once.
   *
   * @param html - The HTML to sanitize.
   * @returns The HTML sanitized, and what was removed from it.
   */
  public run(html: string): HtmlSanitizeResult {
    const tokenizer = new HtmlTokenizer(html);
    while (tokenizer.next()) {
      if (this._dropped !== null) {
        this._skip(tokenizer);
        continue;
      }

      switch (tokenizer.kind) {
        case 'text':
          this._output = `${this._output}${tokenizer.text.replace(/[<>]/g, character => character === '<' ? '&lt;' : '&gt;')}`;
          break;
        case 'raw-text':
          this._output = `${this._output}${tokenizer.text.replace(/</g, '&lt;')}`;
          break;
        case 'start-tag':
          this._writeStartTag(tokenizer);
          break;
        case 'end-tag':
          this._writeEndTag(tokenizer.name);
          break;
      }
    }

    this._closeFrom(0);
    return { html: this._output, report: this._createReport() };
  }

  /**
   * Skips a token inside an element removed with its content, counting the elements of its name opened and closed in it.
   *
   * @param tokenizer - The tokenizer, on the token to skip.
   */
  private _skip(tokenizer: HtmlTokenizer): void {
    if (tokenizer.kind === 'start-tag' && tokenizer.name === this._dropped) {
      this._droppedDepth++;
    } else if (tokenizer.kind === 'end-tag' && tokenizer.name === this._dropped && --this._droppedDepth === 0) {
      this._dropped = null;
    }
  }

  /**
   * Writes a start tag with the attributes kept, once the elements it closes are closed, or removes it.
   *
   * @param tokenizer - The tokenizer, on the start tag.
   */
  private _writeStartTag(tokenizer: HtmlTokenizer): void {
    const { name } = tokenizer;
    if (!isAllowedName(this._policy.elements, name)) {
      (this._removedElements ??= new Set()).add(name);
      if (DROPPED_ELEMENTS.has(name)) {
        this._dropped = name;
        this._droppedDepth = 1;
      }

      return;
    }

    if (CLOSING_P.has(name)) {
      this._closeImplied(P_END);
    }

    const impliedEnd = IMPLIED_ENDS.get(name);
    if (impliedEnd) {
      this._closeImplied(impliedEnd);
    }

    this._output = `${this._output}<${name}${this._writeAttributes(name, tokenizer.attributes)}>`;
    if (VOID_ELEMENTS.has(name)) {
      return;
    }

    tokenizer.selfClosing ? this._output = `${this._output}</${name}>` : this._open.push(name);
  }

  /**
   * Writes the attributes kept of a start tag: allowed, holding only URLs allowed, and never making an SVG animation
   * write an `href` (see `isSafeAnimationTarget`).
   *
   * @param element - The name of the element.
   * @param attributes - The attributes of the tag, `null` without attributes.
   * @returns The attributes, each after a space.
   */
  private _writeAttributes(element: string, attributes: readonly HtmlAttribute[] | null): string {
    let written = '';
    if (attributes === null) {
      return written;
    }

    for (let i = 0; i < attributes.length; i++) {
      const { name, value } = attributes[i];
      if (isAllowedAttribute(this._policy.attributes, element, name) && isSafeUrlAttribute(name, value, this._policy.urlSchemes) && isTrustedResource(element, name, value, this._policy.trustedOrigins) && isSafeAnimationTarget(element, name, value)) {
        written = `${written} ${name}="${value.replace(/["<>]/g, encodeAttributeCharacter)}"`;
      } else {
        (this._removedAttributes ??= new Set()).add(`${element}[${name}]`);
      }
    }

    return written;
  }

  /**
   * Closes the nearest element of a name open, with the elements open inside it: an end tag without its start tag is
   * dropped.
   *
   * @param name - The name of the end tag.
   */
  private _writeEndTag(name: string): void {
    const index = this._open.lastIndexOf(name);
    if (index !== -1) {
      this._closeFrom(index);
    }
  }

  /**
   * Closes the element a start tag closes, if open, as the HTML parser does.
   *
   * @param impliedEnd - The elements the start tag closes, and the ones the search stops at.
   */
  private _closeImplied({ closes, scope }: ImpliedEnd): void {
    for (let i = this._open.length - 1; i >= 0; i--) {
      const open = this._open[i];
      if (closes.has(open)) {
        this._closeFrom(i);
        return;
      }

      if (scope === null || scope.has(open)) {
        return;
      }
    }
  }

  /**
   * Closes the elements open from an index of `_open`, the innermost first.
   *
   * @param index - The index of the outermost element to close.
   */
  private _closeFrom(index: number): void {
    while (this._open.length > index) {
      this._output = `${this._output}</${this._open.pop()}>`;
    }
  }

  /**
   * Creates the report of what was removed.
   *
   * @returns The report, `undefined` when nothing was removed.
   */
  private _createReport(): HtmlSanitizeReport | undefined {
    if (this._removedElements === null && this._removedAttributes === null) {
      return undefined;
    }

    return {
      removedElements: this._removedElements === null ? [] : Array.from(this._removedElements),
      removedAttributes: this._removedAttributes === null ? [] : Array.from(this._removedAttributes)
    };
  }
}

/**
 * Encodes a character of the value of an attribute written between double quotes.
 *
 * @param character - `"`, `<` or `>`.
 * @returns Its character reference.
 */
function encodeAttributeCharacter(character: string): string {
  switch (character) {
    case '"':
      return '&quot;';
    case '<':
      return '&lt;';
    default:
      return '&gt;';
  }
}
