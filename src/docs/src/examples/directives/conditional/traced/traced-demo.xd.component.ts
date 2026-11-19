import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A directive applied by a condition, and a directive whose input is bound by a condition.
 */
@WebComponent({
  selector: 'ex-traced-demo',
  styleUrl: './traced-demo.css',
  templateUrl: './traced-demo.xd.component.html'
})
export class TracedDemoComponent extends CustomElement {
  /**
   * Whether the first paragraph has the directive.
   */
  public readonly applied = signal(true);
  /**
   * Whether the second paragraph is applied color or background color
   */
  public readonly background = signal(true);

  /**
   * Applies or removes the directive.
   */
  public toggleApplied(): void {
    this.applied.update(applied => !applied);
  }

  /**
   * Switches the color or background color of the second paragraph.
   */
  public toggleColorOrBackgroundColor(): void {
    this.background.update(warm => !warm);
  }
}
