import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Describes a temperature with a chain of conditions.
 */
@WebComponent({
  selector: 'ex-if-else-chain',
  templateUrl: './if-else-chain.xd.component.html',
  styleUrl: './if-else-chain.css'
})
export class IfElseChainComponent extends CustomElement {
  /**
   * The temperature, in degrees.
   */
  public readonly degrees = signal(18);

  /**
   * Reads the slider.
   *
   * @param event - The input event of the slider.
   */
  public setDegrees(event: Event): void {
    this.degrees.set(Number((event.target as HTMLInputElement).value));
  }
}
