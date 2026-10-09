import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Adds and removes a child that emits an event at each step of its lifecycle, and logs the ones that arrive.
 */
@WebComponent({
  selector: 'ex-emit-on-mount',
  templateUrl: './emit-on-mount.xd.component.html',
  styleUrl: './emit-on-mount.css'
})
export class EmitOnMountComponent extends CustomElement {
  /**
   * Whether the child is in the page.
   */
  public readonly shown = signal(false);
  /**
   * The events received.
   */
  public readonly received = signal<Array<{ id: number; text: string }>>([]);
  /**
   * The identifier of the next line of the log.
   */
  private _nextId = 0;

  /**
   * Adds or removes the child.
   */
  public toggle(): void {
    this.shown.update(shown => !shown);
  }

  /**
   * Logs an event of the child.
   *
   * @param event - The event: its detail names the step that emitted it.
   */
  public onStage(event: CustomEvent<string>): void {
    this.received.update(lines => [...lines, { id: this._nextId++, text: `received: ${event.detail}` }]);
  }

  /**
   * Clears the log.
   */
  public clear(): void {
    this.received.set([]);
  }
}
