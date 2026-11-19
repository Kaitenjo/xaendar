import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Edits a title in place, focusing the field as soon as it appears.
 */
@WebComponent({
  selector: 'ex-auto-focus',
  styleUrl: './auto-focus.css',
  templateUrl: './auto-focus.xd.component.html'
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
   * Saves the title on Enter.
   *
   * @param event - The keydown event of the field.
   */
  public onKeydownEnter(event: KeyboardEvent): void {
    this.heading.set((event.target as HTMLInputElement).value);
  }

  /**
   * Gives up on Escape.
   */
  public onKeydownEscape(): void {
    this.editing.set(false);
  }
}
