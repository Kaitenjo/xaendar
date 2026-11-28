import { CustomElement, Query, WebComponent } from '@xaendar/core';
import type { QuerySignal } from '@xaendar/core/signals';
import { computed } from '@xaendar/core/signals';
import { NoteComponent } from './note.xd.component';
import { TagComponent } from './tag.xd.component';

/**
 * Renders two components listing the same base stylesheet, and tells whether they adopted the same object.
 */
@WebComponent({
  selector: 'ex-shared-stylesheets',
  styleUrl: './shared-stylesheets.css',
  templateUrl: './shared-stylesheets.xd.component.html'
})
export class SharedStylesheetsComponent extends CustomElement {
  /**
   * The note.
   */
  @Query(NoteComponent)
  public accessor note!: QuerySignal<NoteComponent | null>;
  /**
   * The tag.
   */
  @Query(TagComponent)
  public accessor tag!: QuerySignal<TagComponent | null>;
  /**
   * What the two shadow roots adopted.
   */
  public readonly report = computed(() => this._computeReport());

  /**
   * Computes the value of `report`.
   *
   * @returns The number of stylesheets of each one, and whether their first one is the same object.
   */
  private _computeReport(): string {
    const note = this.note()?.shadowRoot?.adoptedStyleSheets;
    const tag = this.tag()?.shadowRoot?.adoptedStyleSheets;
    if (!note || !tag) {
      return '';
    }

    return `note: ${note.length} stylesheets, tag: ${tag.length}; same base.css object: ${note[0] === tag[0]}`;
  }
}
