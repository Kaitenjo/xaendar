import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Buttons with tooltips, one of them with a bound text.
 */
@WebComponent({
  selector: 'ex-tooltip-demo',
  styleUrl: './tooltip-demo.css',
  templateUrl: './tooltip-demo.xd.component.html'
})
export class TooltipDemoComponent extends CustomElement {
  /**
   * How many times the file was saved.
   */
  public readonly saves = signal(0);

  /**
   * Saves the file.
   */
  public save(): void {
    this.saves.update(saves => saves + 1);
  }
}
