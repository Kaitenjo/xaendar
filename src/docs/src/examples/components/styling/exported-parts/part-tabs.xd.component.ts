import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Tabs exposing each tab as a part, and the selected one with one more part.
 */
@WebComponent({
  selector: 'ex-part-tabs',
  styleUrl: './part-tabs.css',
  templateUrl: './part-tabs.xd.component.html'
})
export class PartTabsComponent extends CustomElement {
  /**
   * The names of the tabs.
   */
  public readonly tabs = ['Overview', 'Pricing', 'Reviews'];

  /**
   * The index of the selected tab.
   */
  public readonly selected = signal(0);
}
