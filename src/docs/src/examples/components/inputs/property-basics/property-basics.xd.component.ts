import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Binds signals to the inputs of two progress meters: the second one keeps the default of the inputs it does not bind.
 */
@WebComponent({
  selector: 'ex-property-basics',
  templateUrl: './property-basics.xd.component.html',
  styleUrl: './property-basics.css'
})
export class PropertyBasicsComponent extends CustomElement {
  /**
   * How many tasks are done.
   */
  public readonly done = signal(3);

  /**
   * How many tasks there are.
   */
  public readonly total = signal(8);

  /**
   * Whether the meters show their figures.
   */
  public readonly showValue = signal(true);

  /**
   * Changes the number of tasks done, within the total.
   *
   * @param delta - The change.
   */
  public step(delta: number): void {
    this.done.update(done => Math.min(this.total(), Math.max(0, done + delta)));
  }

  /**
   * Shows or hides the figures.
   */
  public toggleValue(): void {
    this.showValue.update(show => !show);
  }
}
