import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A structural directive always applied, and another one applied by a condition.
 */
@WebComponent({
  selector: 'ex-conditional-structural',
  templateUrl: './conditional-structural.xd.component.html',
  styleUrl: './conditional-structural.css'
})
export class ConditionalStructuralComponent extends CustomElement {
  /**
   * The number checked by the directives.
   */
  public readonly n = signal(-2);
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
    this.n.update(n => n + delta);
  }

  /**
   * Adds or removes the second directive.
   */
  public toggle(): void {
    this.onlyPositive.update(only => !only);
  }
}
