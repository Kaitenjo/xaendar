import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `post.xd.component.ts`, shown by the page directives/inner-html.
 */
export const INNER_HTML_OPTIONS: SourceFile = {
  name: 'post.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, WebComponent } from '@xaendar/core';
import { type HtmlSanitizer, type HtmlSanitizerOptions, trustHtml } from '@xaendar/directives';
import DOMPurify from 'dompurify';

@WebComponent({
  selector: 'app-post',
  templateUrl: './post.xd.component.html'
})
export class PostComponent extends CustomElement {
  /**
   * Keeps the figures and the data attributes of the images, and removes the links opening a new window.
   */
  public readonly withMedia: HtmlSanitizerOptions = {
    allowElements: ['figure', 'figcaption'],
    allowAttributes: ['img[data-*]'],
    removeAttributes: ['a[target]']
  };
  /**
   * Sanitizes with DOMPurify: what it returns is rendered as it is.
   */
  public readonly purify: HtmlSanitizer = html => DOMPurify.sanitize(html);
  /**
   * An icon the application builds, rendered without sanitizing it.
   */
  public readonly icon = trustHtml('<svg viewBox="0 0 16 16"><path d="M8 0 16 16H0z" /></svg>');
}`
};

/**
 * The snippet `render-preview.ts`, shown by the page directives/inner-html.
 */
export const SANITIZE_HTML: SourceFile = {
  name: 'render-preview.ts',
  lang: 'ts',
  code: `import { sanitizeHtml } from '@xaendar/directives';

// The same sanitizer, outside of a template: no DOM needed, so it runs on the server too
const safe = sanitizeHtml('<img src="x.png" onerror="alert(1)"><b>Hi</b>');
// '<img src="x.png"><b>Hi</b>'`
};
