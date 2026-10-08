import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Edits a title in place, focusing the field as soon as it appears.
 */
@WebComponent({
  selector: 'ex-auto-focus',
  templateUrl: './auto-focus.xd.component.html',
  styleUrl: './auto-focus.css'
})
export class AutoFocusComponent extends CustomElement {
  /**
   * The field, rendered only while editing.
   */
  @Query<HTMLInputElement>('input')
  public accessor field!: QuerySignal<HTMLInputElement | null>;

  /**
   * Whether the title is being edited.
   */
  public readonly editing = signal(false);

  /**
   * The title.
   */
  public readonly heading = signal('Release notes');

  /**
   * Focuses the field whenever the query finds one: the query follows the @if.
   */
  public onInit(): void {
    this.effect(() => {
      const field = this.field();
      field?.focus();
      field?.select();
    });
  }

  /**
   * Starts editing.
   */
  public edit(): void {
    this.editing.set(true);
  }

  /**
   * Saves the title on Enter, or gives up on Escape.
   *
   * @param event - The keydown event of the field.
   */
  public onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.heading.set((event.target as HTMLInputElement).value);
      this.editing.set(false);
    } else if (event.key === 'Escape') {
      this.editing.set(false);
    }
  }
}
