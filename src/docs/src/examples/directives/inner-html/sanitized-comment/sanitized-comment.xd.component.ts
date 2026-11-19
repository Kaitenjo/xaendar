import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { HtmlSanitizeReport } from '@xaendar/directives';

/**
 * A comment written in HTML, rendered sanitized, with what the sanitizer removed from it.
 */
@WebComponent({
  selector: 'ex-sanitized-comment',
  styleUrl: './sanitized-comment.css',
  templateUrl: './sanitized-comment.xd.component.html'
})
export class SanitizedCommentComponent extends CustomElement {
  /**
   * The HTML of the comment, as the user wrote it.
   */
  public readonly source = signal('<p>Great <b>release</b>, see <a href="https://example.com">the notes</a>.</p>\n<img src="missing.png" onerror="alert(\'hacked\')">\n<a href="javascript:alert(1)">Click me</a>\n<script>alert(2)</script>');
  /**
   * What the sanitizer removed the last time it removed something.
   */
  public readonly removed = signal<HtmlSanitizeReport | null>(null);

  /**
   * Stores the HTML typed, forgetting what was removed from the previous one.
   *
   * @param event - The input event of the textarea.
   */
  public edit(event: Event): void {
    this.removed.set(null);
    this.source.set((event.target as HTMLTextAreaElement).value);
  }

  /**
   * Keeps what the sanitizer removed.
   *
   * @param removed - The detail of the `sanitized` event of `@@innerHtml`.
   */
  public report(removed: HtmlSanitizeReport): void {
    this.removed.set(removed);
  }
}
