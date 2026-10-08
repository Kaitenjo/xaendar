import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import { renderMarkdown } from './markdown';

/**
 * A Markdown editor with a live preview.
 */
@WebComponent({
  selector: 'ex-markdown-preview',
  templateUrl: './markdown-preview.xd.component.html',
  styleUrl: './markdown-preview.css'
})
export class MarkdownPreviewComponent extends CustomElement {
  /**
   * The Markdown source.
   */
  public readonly source = signal('# Release notes\n\nSignals are **faster** and *smaller*.\n\n- New `untracked` helper\n- Fewer re-renders\n\nTry <b>raw HTML</b>: it is escaped.');

  /**
   * The HTML of the preview.
   */
  public readonly html = computed(() => renderMarkdown(this.source()));

  /**
   * Whether the generated HTML is shown as text.
   */
  public readonly showSource = signal(false);

  /**
   * Stores the source typed.
   *
   * @param event - The input event of the textarea.
   */
  public edit(event: Event): void {
    this.source.set((event.target as HTMLTextAreaElement).value);
  }

  /**
   * Shows or hides the generated HTML.
   */
  public toggleSource(): void {
    this.showSource.update(shown => !shown);
  }
}
