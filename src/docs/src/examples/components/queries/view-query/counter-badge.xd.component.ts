import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A badge counting how many times its parent called increment.
 */
@WebComponent({
  selector: 'ex-counter-badge',
  templateUrl: './counter-badge.xd.component.html',
  styleUrl: './counter-badge.css'
})
export class CounterBadgeComponent extends CustomElement {
  /**
   * The count.
   */
  public readonly count = signal(0);

  /**
   * Adds one to the count. Public, so that a parent holding the instance can call it.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }
}
