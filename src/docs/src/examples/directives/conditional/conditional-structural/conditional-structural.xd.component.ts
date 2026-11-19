import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A structural directive always applied, and another one applied by a condition.
 */
@WebComponent({
  selector: 'ex-conditional-structural',
  styleUrl: './conditional-structural.css',
  templateUrl: './conditional-structural.xd.component.html'
})
export class ConditionalStructuralComponent extends CustomElement {
  /**
   * The number checked by the directives.
   */
  public readonly value = signal(-2);
  /**
   * Whether the number must also be positive.
   */
  public readonly onlyPositive = signal(false);

  /**
   * Changes the number.
   *
   * @param delta - The change.
   */
  public change(delta: number): void {
    this.value.update(value => value + delta);
  }

  /**
   * Adds or removes the second directive.
   */
  public toggle(): void {
    this.onlyPositive.update(only => !only);
  }
}
