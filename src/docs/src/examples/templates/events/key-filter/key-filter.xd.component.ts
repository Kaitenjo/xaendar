import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A field listening to key events: Enter, Ctrl+S and Cmd+S save the note, Shift+Enter pins it, Escape clears it.
 */
@WebComponent({
  selector: 'ex-key-filter',
  styleUrl: './key-filter.css',
  templateUrl: './key-filter.xd.component.html'
})
export class KeyFilterComponent extends CustomElement {
  /**
   * The calls received, latest first.
   */
  public readonly calls = signal<Array<{ id: number; text: string }>>([]);
  /**
   * The identifier of the next line.
   */
  private _nextId = 0;

  /**
   * Called for Enter, Ctrl+S and Cmd+S, by a single listener: the three key events make the same call.
   *
   * @param note - The text of the field.
   * @param event - The keydown event, whose default action, the dialog saving the page for Ctrl+S, is prevented.
   */
  public save(note: string, event: KeyboardEvent): void {
    event.preventDefault();
    this._record(`save("${note}") on ${event.ctrlKey ? 'Ctrl+' : event.metaKey ? 'Cmd+' : ''}${event.key}`);
  }

  /**
   * Called for Shift+Enter only: plain Enter calls `save`, since the modifiers of a key event must match exactly.
   *
   * @param note - The text of the field.
   */
  public pin(note: string): void {
    this._record(`pin("${note}")`);
  }

  /**
   * Called when Escape is released.
   *
   * @param field - The field to clear.
   */
  public clear(field: HTMLInputElement): void {
    field.value = '';
    this._record('clear()');
  }

  /**
   * Adds a line to the log, keeping the last five.
   *
   * @param text - The line.
   */
  private _record(text: string): void {
    this.calls.update(lines => [{ id: this._nextId++, text }, ...lines].slice(0, 5));
  }
}
