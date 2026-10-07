import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Binds an input only while a condition holds: when it stops holding, the input goes back to its default.
 */
@WebComponent({
  selector: 'ex-conditional-reset',
  templateUrl: './conditional-reset.xd.component.html',
  styleUrl: './conditional-reset.css'
})
export class ConditionalResetComponent extends CustomElement {
  /**
   * Whether the level is bound.
   */
  public readonly linked = signal(true);

  /**
   * The level to bind.
   */
  public readonly level = signal(80);

  /**
   * Binds or unbinds the level.
   */
  public toggle(): void {
    this.linked.update(linked => !linked);
  }

  /**
   * Raises the level.
   */
  public raise(): void {
    this.level.update(level => level >= 100 ? 10 : level + 10);
  }
}
