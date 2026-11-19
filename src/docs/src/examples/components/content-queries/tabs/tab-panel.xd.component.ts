import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A panel of a tab group: its content is shown only while the group marks it as active.
 */
@WebComponent({
  selector: 'ex-tab-panel',
  templateUrl: './tab-panel.xd.component.html'
})
export class TabPanelComponent extends CustomElement {
  /**
   * The label of the tab.
   */
  @Property('Tab')
  public accessor label!: InputSignal<string>;
  /**
   * Whether the panel is shown. Set by the tab group, which holds the instance.
   */
  public readonly active = signal(false);
}
