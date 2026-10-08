import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * What a directive finds in onInit: its inputs are bound, the children of the element are not rendered yet.
 */
@WebComponent({
  selector: 'ex-directive-timing',
  templateUrl: './directive-timing.xd.component.html',
  styleUrl: './directive-timing.css'
})
export class DirectiveTimingComponent extends CustomElement {
  /**
   * The label bound to the directive.
   */
  public readonly label = signal('first');

  /**
   * The lines reported by the directive.
   */
  public readonly lines = signal(new Array<{ id: number; text: string }>());

  /**
   * The id of the next line.
   */
  private nextId = 0;

  /**
   * Logs a line reported by the directive.
   *
   * @param event - The report event.
   */
  public log(event: CustomEvent<string>): void {
    const line = { id: this.nextId++, text: event.detail };
    this.lines.update(lines => [...lines, line]);
  }

  /**
   * Changes the label.
   */
  public rename(): void {
    this.label.update(label => (label === 'first' ? 'second' : 'first'));
  }
}
