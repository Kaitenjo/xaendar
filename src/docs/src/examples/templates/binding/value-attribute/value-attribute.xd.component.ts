import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Resets two fields from the same signal: one binds the value attribute, the other sets the value property.
 */
@WebComponent({
  selector: 'ex-value-attribute',
  templateUrl: './value-attribute.xd.component.html',
  styleUrl: './value-attribute.css'
})
export class ValueAttributeComponent extends CustomElement {
  /**
   * The text of the fields.
   */
  public readonly text = signal('Edit me');
  /**
   * The second field.
   */
  @Query<HTMLInputElement>('.by-property')
  public accessor field!: QuerySignal<HTMLInputElement | null>;

  /**
   * Keeps the value property of the second field in sync with the signal.
   */
  public onInit(): void {
    this.effect(() => {
      const field = this.field();
      if (field) {
        field.value = this.text();
      }
    });
  }

  /**
   * Stores what the user types.
   *
   * @param event - The input event of a field.
   */
  public onInput(event: Event): void {
    this.text.set((event.target as HTMLInputElement).value);
  }

  /**
   * Resets the text.
   */
  public reset(): void {
    this.text.set('');
  }
}
