import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * Binds the same level to three meters: through a method, a computed signal and the signal itself.
 */
@WebComponent({
  selector: 'ex-method-in-attribute',
  templateUrl: './method-in-attribute.xd.component.html',
  styleUrl: './method-in-attribute.css'
})
export class MethodInAttributeComponent extends CustomElement {
  /**
   * The level, from 0 to 10.
   */
  public readonly level = signal(3);
  /**
   * The level as a percentage, computed.
   */
  public readonly percent = computed(() => this._computePercent());

  /**
   * The level as a percentage, from a method.
   *
   * @returns The percentage.
   */
  public percentOf(): number {
    return this.level() * 10;
  }

  /**
   * Raises the level, then starts again.
   */
  public raise(): void {
    this.level.update(level => level >= 10 ? 0 : level + 1);
  }

  /**
   * Computes the value of `percent`.
   *
   * @returns The level as a percentage.
   */
  private _computePercent(): number {
    return this.level() * 10;
  }
}
