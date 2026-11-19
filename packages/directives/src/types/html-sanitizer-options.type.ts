/**
 * What the sanitizer of `@@innerHtml` and `sanitizeHtml` keeps besides, or in place of, what it keeps by default.
 *
 * The names are matched without regard to case. A name ending with `*` matches every name starting with what precedes
 * it, made only of letters, digits, `-`, `_`, `.` and `:` (`data-*`, `x-*`). What `remove…` lists wins over what
 * `allow…` lists.
 */
export interface HtmlSanitizerOptions {
  /**
   * The elements kept besides the default ones (the text-level and block elements, the lists, the tables and the media,
   * as Angular keeps them). An element can run code once kept: `script`, `iframe`, `object`, `embed`, `form`, a custom
   * element already defined, or an SVG `animate`/`set` that rewrites the `href` of another element.
   */
  readonly allowElements?: readonly string[];
  /**
   * The attributes kept besides the default ones (the presentational attributes of HTML, `class`, `title`, `lang`, the
   * URLs and `aria-*`): on every element kept, or on an element only when written `element[attribute]` (`span[style]`,
   * `img[data-*]`). An attribute can run code once kept: never list `on*`, and `style` lets any CSS through.
   */
  readonly allowAttributes?: readonly string[];
  /**
   * The elements removed among the ones kept: their tags are dropped and their content is kept, sanitized.
   */
  readonly removeElements?: readonly string[];
  /**
   * The attributes removed among the ones kept: from every element, or from an element only when written
   * `element[attribute]` (`a[target]`).
   */
  readonly removeAttributes?: readonly string[];
  /**
   * The schemes the URLs of the attributes (`href`, `src`, `srcset`, `action`, `poster`, …) may have, in place of the
   * default ones: `http`, `https`, `mailto`, `tel`, `ftp` and `sms`. A relative URL is always kept, and so is a `data:`
   * URL of an image, an audio or a video in base64; an attribute holding a URL of another scheme is removed.
   */
  readonly urlSchemes?: readonly string[];
}
