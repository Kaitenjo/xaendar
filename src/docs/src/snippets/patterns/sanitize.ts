// HTML coming from users, or from any source you do not control, must be sanitized before it is rendered.
// With a library such as DOMPurify:
import DOMPurify from 'dompurify';

/**
 * The comment, safe to render as HTML.
 */
public readonly html = computed(() => this._computeHtml());

/**
 * Computes the value of `html`.
 *
 * @returns The comment, without scripts, event handlers and other dangerous markup.
 */
private _computeHtml(): string {
  return DOMPurify.sanitize(this.comment());
}
