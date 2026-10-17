import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Focuses, clears and reads a field through the template variable naming it, from buttons written before the field.
 */
@WebComponent({
  selector: 'ex-search-field',
  styleUrl: './search-field.css',
  templateUrl: './search-field.xd.component.html'
})
export class SearchFieldComponent extends CustomElement {
  /**
   * The text being searched.
   */
  public readonly text = signal('');

  /**
   * Searches the text of the field.
   *
   * @param value - The value of the field.
   */
  public search(value: string): void {
    this.text.set(value);
  }

  /**
   * Empties the field and gives it the focus back.
   *
   * @param field - The field, passed by its template variable.
   */
  public clear(field: HTMLInputElement): void {
    field.value = '';
    field.focus();
    this.text.set('');
  }
}
