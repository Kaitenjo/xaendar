import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A panel loaded on demand: its file name keeps it out of the components registered at startup.
 */
@WebComponent({
  selector: 'ex-lazy-panel',
  templateUrl: './lazy-panel.xd.component.html',
  styleUrl: './lazy-loading.css'
})
export class LazyPanelComponent extends CustomElement {
  /**
   * A number bound by the parent.
   */
  @Property(0)
  public accessor count!: InputSignal<number>;
  /**
   * A label bound by the parent.
   */
  @Property('default')
  public accessor label!: InputSignal<string>;
}
