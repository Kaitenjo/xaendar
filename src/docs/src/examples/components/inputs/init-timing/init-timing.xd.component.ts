import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';
import { log } from './init-timing.log';

/**
 * Mounts a card bound to a name, and shows when the card sees the bound value.
 */
@WebComponent({
  selector: 'ex-init-timing',
  templateUrl: './init-timing.xd.component.html',
  styleUrl: './init-timing.css'
})
export class InitTimingComponent extends CustomElement {
  /**
   * Whether the card is in the page.
   */
  public readonly mounted = signal(false);

  /**
   * The name bound to the card.
   */
  public readonly name = signal('Ada');

  /**
   * What the card logged. Typed, so that the template compiler knows it is a signal.
   */
  public readonly log: Signal<Array<{ id: number; text: string }>> = log;

  /**
   * Adds or removes the card.
   */
  public toggle(): void {
    this.mounted.update(mounted => !mounted);
  }

  /**
   * Changes the bound name.
   */
  public rename(): void {
    this.name.update(name => name === 'Ada' ? 'Grace' : 'Ada');
  }

  /**
   * Clears the log.
   */
  public clear(): void {
    this.log.set([]);
  }
}
