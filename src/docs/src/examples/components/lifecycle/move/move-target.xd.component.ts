import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * An element with a counter, a text field and two effects: one created in a field, one in onInit.
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
   * The identifier of the next line of the log.
   */
  private nextId = 0;

  /**
   * A counter: a signal of the instance, which survives the moves.
   */
  public readonly clicks = signal(0);

  /**
   * The last count seen by the effect created in a field.
   */
  public readonly seenByField = signal(0);

  /**
   * The last count seen by the effect created in onInit.
   */
  public readonly seenByOnInit = signal(0);

  /**
   * An effect created with the instance: it is disposed at the first disconnection, and never created again.
   */
  private readonly fieldEffect = this.effect(() => this.seenByField.set(this.clicks()));

  /**
   * Logs the connection, and creates the effect again: hooks run at every connection.
   */
  public onInit(): void {
    this.write('onInit');
    this.effect(() => this.seenByOnInit.set(this.clicks()));
  }

  /**
   * Logs the end of the render.
   */
  public afterRender(): void {
    this.write('afterRender');
  }

  /**
   * Logs the disconnection.
   */
  public onDestroy(): void {
    this.write('onDestroy');
  }

  /**
   * Appends a line to the log.
   *
   * @param text - The line.
   */
  private write(text: string): void {
    this.log.update(lines => [...lines, { id: this.nextId++, text }]);
  }

  /**
   * Counts a click.
   */
  public count(): void {
    this.clicks.update(clicks => clicks + 1);
  }
}
