import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { signal } from '@xaendar/core/signals';

/**
 * A note that announces its closing with a cancelable event.
 */
@WebComponent({
  selector: 'ex-closable-note',
  templateUrl: './closable-note.xd.component.html',
  styleUrl: './closable-note.css'
})
export class ClosableNoteComponent extends CustomElement {
  /**
   * How the event is dispatched: with emit, or with dispatchEvent.
   */
  @Property('emit')
  public accessor mode!: InputSignal<string>;
  /**
   * Emitted before closing, with the mode as detail. Declared in both modes, so that templates can listen to it; it
   * has a detail because a template passes $event only to the events that carry one.
   */
  @Event({ cancelable: true })
  public accessor closing!: Output<string>;
  /**
   * Whether the note is open.
   */
  public readonly open = signal(true);
  /**
   * What happened on the last attempt to close.
   */
  public readonly status = signal('');

  /**
   * Announces the closing, then closes unless the event was canceled, when the note can tell.
   */
  public close(): void {
    if (this.mode() === 'emit') {
      this.closing.emit(this.mode());
      this.open.set(false);
      this.status.set('emit() returns nothing: closed anyway');
    } else {
      const allowed = this.dispatchEvent(new CustomEvent('closing', { cancelable: true, detail: this.mode() }));
      this.open.set(!allowed);
      this.status.set(allowed ? 'dispatchEvent() returned true: closed' : 'dispatchEvent() returned false: still open');
    }
  }

  /**
   * Opens the note again.
   */
  public reopen(): void {
    this.open.set(true);
    this.status.set('');
  }
}
