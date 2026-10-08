import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Cancels the closing event of two notes: only the note that dispatches the event itself can tell.
 */
@WebComponent({
  selector: 'ex-cancelable',
  templateUrl: './cancelable.xd.component.html',
  styleUrl: './cancelable.css'
})
export class CancelableComponent extends CustomElement {
  /**
   * Whether the notes must stay open.
   */
  public readonly keepOpen = signal(true);

  /**
   * Toggles keepOpen.
   */
  public toggleKeepOpen(): void {
    this.keepOpen.update(keep => !keep);
  }

  /**
   * Cancels the closing of a note while keepOpen holds.
   *
   * @param event - The closing event.
   */
  public onClosing(event: CustomEvent<string>): void {
    if (this.keepOpen()) {
      event.preventDefault();
    }
  }
}
