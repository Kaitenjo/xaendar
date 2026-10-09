import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { log } from './hook-order.log';

/**
 * Adds and removes a parent with a child, both logging their lifecycle.
 */
@WebComponent({
  selector: 'ex-hook-order',
  templateUrl: './hook-order.xd.component.html',
  styleUrl: './hook-order.css'
})
export class HookOrderComponent extends CustomElement {
  /**
   * Whether the parent is in the page.
   */
  public readonly shown = signal(false);
  /**
   * The label passed down to the child.
   */
  public readonly label = signal('Ada');
  /**
   * What the parent and the child logged.
   */
  public readonly log = log;

  /**
   * Adds or removes the parent.
   */
  public toggle(): void {
    this.shown.update(shown => !shown);
  }

  /**
   * Changes the label.
   */
  public rename(): void {
    this.label.update(label => label === 'Ada' ? 'Grace' : 'Ada');
  }

  /**
   * Clears the log.
   */
  public clear(): void {
    this.log.set([]);
  }
}
