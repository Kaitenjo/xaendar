import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A computed signal that throws caches the error: every read throws it again,
 * until a dependency changes and the evaluation succeeds.
 */
@WebComponent({
  selector: 'ex-computed-errors',
  templateUrl: './errors.xd.component.html',
  styleUrl: './errors.css'
})
export class ComputedErrorsComponent extends CustomElement {
  /**
   * Text typed by the reader, expected to be JSON.
   */
  public readonly source = signal('{ "name": "Ada" }');

  /**
   * Throws when `source` is not valid JSON.
   */
  public readonly parsed = computed<unknown>(() => JSON.parse(this.source()));

  /**
   * Reads `parsed`, turning its error into a value the template can show.
   */
  public readonly result = computed(() => {
    try {
      return `✓ ${JSON.stringify(this.parsed())}`;
    } catch (error) {
      return `✗ ${(error as Error).message}`;
    }
  });

  /**
   * Updates the source as the reader types.
   *
   * @param event - The `input` event of the field.
   */
  public onInput(event: Event): void {
    this.source.set((event.target as HTMLTextAreaElement).value);
  }
}
