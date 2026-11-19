/**
 * The kind of the token `HtmlTokenizer` read last:
 * - `text`: a text, whose character references the browser decodes;
 * - `raw-text`: the content of an element the browser reads as raw text (`script`, `style`, `xmp`, `iframe`, `noembed`,
 *   `noframes`, `noscript`, `plaintext`), whose character references it does not decode;
 * - `start-tag`: a start tag, with its name, its attributes and whether it closes itself;
 * - `end-tag`: an end tag, with its name.
 */
export type HtmlTokenKind = 'text' | 'raw-text' | 'start-tag' | 'end-tag';
