import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Elements rendered by one structural directive, and by two of them together.
 */
@WebComponent({
  selector: 'ex-parity',
  templateUrl: './parity.xd.component.html',
  styleUrl: './parity.css'
})
export class ParityComponent extends CustomElement {
  /**
   * The number checked by the directives.
   */
  public readonly value = signal(2);

  /**
   * Changes the number.
   *
   * @param delta - The change.
   */
  public change(delta: number): void {
    this.value.update(value => value + delta);
  }
}
