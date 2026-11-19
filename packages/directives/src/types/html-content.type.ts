import type { SafeHtml } from './safe-html.type';

/**
 * What the `html` input of `@@innerHtml` takes: an HTML to sanitize, an HTML trusted with `trustHtml`, rendered as it
 * is, or nothing (`null`, `undefined`), which empties the element.
 */
export type HtmlContent = string | SafeHtml | null | undefined;
