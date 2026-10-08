import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Projects panels into a tab group, which builds its tabs from them.
 */
@WebComponent({
  selector: 'ex-tabs',
  templateUrl: './tabs.xd.component.html',
  styleUrl: './tabs.css'
})
export class TabsComponent extends CustomElement {
  /**
   * The panels added with the button.
   */
  public readonly extra = signal(new Array<number>());

  /**
   * Adds a panel.
   */
  public addPanel(): void {
    this.extra.update(extra => [...extra, extra.length + 1]);
  }
}
