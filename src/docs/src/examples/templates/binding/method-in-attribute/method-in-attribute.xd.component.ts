import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { level, readPercent } from './level.store';

/**
 * Binds the same level to three meters: through a method reading the signal, a method calling a function
 * that reads it, and a computed signal.
 */
@WebComponent({
  selector: 'ex-method-in-attribute',
  templateUrl: './method-in-attribute.xd.component.html',
  styleUrl: './method-in-attribute.css'
})
export class MethodInAttributeComponent extends CustomElement {
  /**
   * The shared level, from 0 to 10.
   */
  public readonly level = level;
  /**
   * The level as a percentage, computed.
   */
  public readonly percent = computed(() => this._computePercent());

  /**
   * The level as a percentage, read by the method itself: the compiler sees the signal.
   *
   * @returns The percentage.
   */
  public percentOf(): number {
    return this.level() * 10;
  }

  /**
   * The level as a percentage, read through a function of the store: the compiler does not follow it.
   *
   * @returns The percentage.
   */
  public percentFromHelper(): number {
    return readPercent();
  }

  /**
   * Raises the level, then starts again.
   */
  public raise(): void {
    level.update(value => value >= 10 ? 0 : value + 1);
  }

  /**
   * Computes the value of `percent`.
   *
   * @returns The level as a percentage.
   */
  private _computePercent(): number {
    return readPercent();
  }
}
