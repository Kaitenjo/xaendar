import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Selects a chip on click. The chips style themselves from their own stylesheet, reacting to the class and the
 * attributes the parent sets on them.
 */
@WebComponent({
  selector: 'ex-host-selectors',
  styleUrl: './host-selectors.css',
  templateUrl: './host-selectors.xd.component.html'
})
export class HostSelectorsComponent extends CustomElement {
  /**
   * The name of the selected chip.
   */
  public readonly selected = signal('signals');
}
