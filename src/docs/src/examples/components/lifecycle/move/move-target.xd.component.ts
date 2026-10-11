import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * An element with a counter and a text field, logging its hooks.
 */
@WebComponent({
  selector: 'ex-move-target',
  templateUrl: './move-target.xd.component.html',
  styleUrl: './move-target.css'
})
export class MoveTargetComponent extends CustomElement {
  /**
   * The hooks run so far.
   */
  public readonly log = signal<Array<{ id: number; text: string }>>([]);
  /**
   * A counter: a signal of the instance, which survives the moves.
   */
  public readonly clicks = signal(0);
  /**
   * The identifier of the next line of the log.
   */
  private _nextId = 0;

  /**
   * Logs the connection: hooks run at every connection.
   */
  public onInit(): void {
    this._write('onInit');
  }

  /**
   * Logs the end of the render.
   */
  public afterRender(): void {
    this._write('afterRender');
  }

  /**
   * Counts a click.
   */
  public count(): void {
    this.clicks.update(clicks => clicks + 1);
  }

  /**
   * Appends a line to the log.
   *
   * @param text - The line.
   */
  private _write(text: string): void {
    this.log.update(lines => [...lines, { id: this._nextId++, text }]);
  }

  /**
   * Logs the disconnection.
   */
  public onDestroy(): void {
    this._write('onDestroy');
  }
}
