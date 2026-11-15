import type { HtmlSanitizeReport } from './html-sanitize-report.type';

/**
 * The result of a sanitization: the HTML kept, and what was removed from it.
 */
export interface HtmlSanitizeResult {
  /**
   * The HTML sanitized.
   */
  readonly html: string;
  /**
   * What was removed, `undefined` when nothing was. The comments, always removed, are not reported.
   */
  readonly report: HtmlSanitizeReport | undefined;
}
