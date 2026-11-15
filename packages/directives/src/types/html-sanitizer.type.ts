/**
 * A sanitizer taking the place of the one of `@@innerHtml` (its `sanitizer` input): a function returning the HTML to
 * render from the one bound, as `DOMPurify.sanitize` does. What it returns is rendered as it is.
 *
 * @param html - The HTML bound to the directive.
 * @returns The HTML to render.
 */
export type HtmlSanitizer = (html: string) => string;
